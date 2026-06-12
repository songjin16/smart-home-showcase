import { createWorker } from 'tesseract.js';

const textDecoder = new TextDecoder('ascii');
let ocrWorkerPromise = null;

function readAscii(view, start, length) {
  return textDecoder.decode(new Uint8Array(view.buffer, start, length));
}

function getUint16(view, offset, littleEndian) {
  return view.getUint16(offset, littleEndian);
}

function getUint32(view, offset, littleEndian) {
  return view.getUint32(offset, littleEndian);
}

function readRational(view, offset, littleEndian) {
  const numerator = getUint32(view, offset, littleEndian);
  const denominator = getUint32(view, offset + 4, littleEndian);
  return denominator === 0 ? 0 : numerator / denominator;
}

function readValueOffset(view, tiffStart, entryOffset, littleEndian) {
  return tiffStart + getUint32(view, entryOffset + 8, littleEndian);
}

function findTag(view, tiffStart, ifdOffset, tag, littleEndian) {
  const entryCount = getUint16(view, ifdOffset, littleEndian);

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (getUint16(view, entryOffset, littleEndian) === tag) {
      return entryOffset;
    }
  }

  return null;
}

function readGpsCoordinate(view, tiffStart, gpsIfdOffset, refTag, valueTag, littleEndian) {
  const refEntry = findTag(view, tiffStart, gpsIfdOffset, refTag, littleEndian);
  const valueEntry = findTag(view, tiffStart, gpsIfdOffset, valueTag, littleEndian);

  if (!refEntry || !valueEntry) return null;

  const ref = readAscii(view, refEntry + 8, 1);
  const valueOffset = readValueOffset(view, tiffStart, valueEntry, littleEndian);
  const degrees = readRational(view, valueOffset, littleEndian);
  const minutes = readRational(view, valueOffset + 8, littleEndian);
  const seconds = readRational(view, valueOffset + 16, littleEndian);
  const coordinate = degrees + minutes / 60 + seconds / 3600;

  return ref === 'S' || ref === 'W' ? -coordinate : coordinate;
}

function parseGpsFromExif(view, exifStart, exifLength) {
  if (readAscii(view, exifStart, 6) !== 'Exif\0\0') return null;

  const tiffStart = exifStart + 6;
  const byteOrder = readAscii(view, tiffStart, 2);
  const littleEndian = byteOrder === 'II';
  if (!littleEndian && byteOrder !== 'MM') return null;

  const firstIfdOffset = tiffStart + getUint32(view, tiffStart + 4, littleEndian);
  const gpsEntry = findTag(view, tiffStart, firstIfdOffset, 0x8825, littleEndian);
  if (!gpsEntry) return null;

  const gpsIfdOffset = readValueOffset(view, tiffStart, gpsEntry, littleEndian);
  if (gpsIfdOffset < exifStart || gpsIfdOffset > exifStart + exifLength) return null;

  const latitude = readGpsCoordinate(view, tiffStart, gpsIfdOffset, 0x0001, 0x0002, littleEndian);
  const longitude = readGpsCoordinate(view, tiffStart, gpsIfdOffset, 0x0003, 0x0004, littleEndian);

  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  return [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))];
}

export function readGpsPosition(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;

    const marker = view.getUint8(offset + 1);
    const size = view.getUint16(offset + 2);
    if (marker === 0xe1) {
      return parseGpsFromExif(view, offset + 4, size - 2);
    }

    offset += 2 + size;
  }

  return null;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker('chi_sim').catch((error) => {
      ocrWorkerPromise = null;
      throw error;
    });
  }

  return ocrWorkerPromise;
}

function textHasWatermarkFields(text) {
  return /(时间|天气|地[点训址]|地址|拍摄人|小区|郑州市?)/.test(text.replace(/\s+/g, ''));
}

function makeLowerLeftWatermarkCrop(bitmap) {
  const cropWidth = Math.round(bitmap.width * 0.58);
  const cropHeight = Math.round(bitmap.height * 0.2);
  const sourceTop = bitmap.height - cropHeight;
  const scale = Math.min(2.4, 1600 / cropWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cropWidth * scale);
  canvas.height = Math.round(cropHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.drawImage(bitmap, 0, sourceTop, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function enhanceWatermarkCrop(sourceCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(sourceCanvas, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    const gray = red * 0.299 + green * 0.587 + blue * 0.114;
    const brightText = gray > 170 ? 255 : Math.max(0, Math.round((gray - 72) * 1.35));

    imageData.data[index] = brightText;
    imageData.data[index + 1] = brightText;
    imageData.data[index + 2] = brightText;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function withOcrImages(file, callback) {
  const bitmap = await createImageBitmap(file);
  const crop = makeLowerLeftWatermarkCrop(bitmap);
  const enhancedCrop = crop ? enhanceWatermarkCrop(crop) : null;

  try {
    return await callback([enhancedCrop, crop].filter(Boolean), bitmap);
  } finally {
    bitmap.close();
  }
}

async function detectTextWithBrowser(image) {
  if (!('TextDetector' in window)) {
    return { text: '', supported: false };
  }

  const detector = new window.TextDetector();
  const results = await detector.detect(image);

  return {
    text: results.map((item) => item.rawValue).filter(Boolean).join('\n').trim(),
    supported: true,
  };
}

async function recognizeWithTesseract(image) {
  const worker = await getOcrWorker();
  const result = await worker.recognize(image);
  return result.data.text.trim();
}

export async function tryDetectWatermarkText(file) {
  try {
    return await withOcrImages(file, async (crops, bitmap) => {
      for (const crop of crops) {
        try {
          const browserCropResult = await detectTextWithBrowser(crop);
          if (textHasWatermarkFields(browserCropResult.text)) {
            return { ...browserCropResult, error: '' };
          }
        } catch {
          // Fall through to the browser OCR worker when built-in text detection fails.
        }

        const cropText = await recognizeWithTesseract(crop);
        if (textHasWatermarkFields(cropText)) {
          return {
            text: cropText,
            supported: true,
            error: '',
          };
        }
      }

      try {
        const browserFullResult = await detectTextWithBrowser(bitmap);
        if (browserFullResult.text) {
          return { ...browserFullResult, error: '' };
        }
      } catch {
        // Fall through to Tesseract for full-image OCR.
      }

      return {
        text: await recognizeWithTesseract(file),
        supported: true,
        error: '',
      };
    });
  } catch {
    return {
      text: '',
      supported: false,
      error: '图片文字识别失败，请手动填写小区名称。',
    };
  }
}

export async function terminateWatermarkTextDetection() {
  const workerPromise = ocrWorkerPromise;
  ocrWorkerPromise = null;
  if (!workerPromise) return;

  const worker = await workerPromise.catch(() => null);
  await worker?.terminate();
}

export function guessCommunityName(text, existingCases) {
  const compactText = text.replace(/\s+/g, '');
  const matchedCase = existingCases.find((item) => compactText.includes(item.name));
  if (matchedCase) return matchedCase.name;

  const locationLines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ''))
    .filter(Boolean);
  const patterns = [
    /小区[:：;；]?(.+)/,
    /地[点训址][:：;；]?(.+)/,
    /地址[:：;；]?(.+)/,
    /郑州市?[·•"“”'‘]?(.+)/,
  ];
  const locationText = locationLines
    .flatMap((line) => patterns.map((pattern) => line.match(pattern)?.[1]).filter(Boolean))
    .map((value) =>
      value
        .replace(/^[^·•]*[·•]/, '')
        .replace(/^郑州市?/, '')
        .replace(/^[·•"'“”‘’]/, '')
        .replace(/(今日水印|相机|防伪|拍摄人|时间|天气).*$/, '')
        .replace(/^[^一-龥]+/, '')
        .replace(/[^一-龥A-Za-z0-9]+$/, ''),
    )
    .find((value) => value.length >= 2);

  return locationText?.slice(0, 18) ?? '';
}

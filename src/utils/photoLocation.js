const textDecoder = new TextDecoder('ascii');

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

export async function tryDetectWatermarkText(file) {
  if (!('TextDetector' in window)) {
    return { text: '', supported: false };
  }

  const detector = new window.TextDetector();
  const bitmap = await createImageBitmap(file);
  const results = await detector.detect(bitmap);
  bitmap.close();

  return {
    text: results.map((item) => item.rawValue).filter(Boolean).join('\n'),
    supported: true,
  };
}

export function guessCommunityName(text, existingCases) {
  const compactText = text.replace(/\s+/g, '');
  const matchedCase = existingCases.find((item) => compactText.includes(item.name));
  if (matchedCase) return matchedCase.name;

  const patterns = [/小区[:：]?([^，。,。\n]+)/, /地点[:：]?([^，。,。\n]+)/, /地址[:：]?([^，。,。\n]+)/];
  const match = patterns.map((pattern) => compactText.match(pattern)).find(Boolean);
  return match?.[1]?.slice(0, 18) ?? '';
}

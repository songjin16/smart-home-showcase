import { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { fileToDataUrl, guessCommunityName, readGpsPosition, tryDetectWatermarkText } from '../utils/photoLocation.js';

const ZHENGZHOU_CENTER = [113.625368, 34.746599];

function makeFallbackPosition(index) {
  const offset = index * 0.006;
  return [Number((ZHENGZHOU_CENTER[0] + offset).toFixed(6)), Number((ZHENGZHOU_CENTER[1] + offset).toFixed(6))];
}

export default function PhotoUploadPanel({ cases, uploadCount, onSave }) {
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('reading');
    setMessage('正在读取照片信息...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const position = readGpsPosition(arrayBuffer);
      const imageUrl = await fileToDataUrl(file);

      let detectedText = '';
      let ocrSupported = false;
      try {
        const ocrResult = await tryDetectWatermarkText(file);
        detectedText = ocrResult.text;
        ocrSupported = ocrResult.supported;
      } catch {
        detectedText = '';
      }

      const guessedName = guessCommunityName(detectedText, cases);
      const fallbackPosition = makeFallbackPosition(uploadCount + 1);

      setDraft({
        fileName: file.name,
        imageUrl,
        detectedText,
        ocrSupported,
        name: guessedName,
        city: '郑州 待确认',
        position: position ?? fallbackPosition,
        hasGps: Boolean(position),
      });
      setStatus('ready');
      setMessage(
        position
          ? '已读取到照片位置信息，请确认小区名称后保存。'
          : '这张照片没有读到 GPS，已临时放在郑州地图上，请确认小区名称和位置。',
      );
    } catch {
      setStatus('error');
      setMessage('照片读取失败，请换一张原图再试。');
    } finally {
      event.target.value = '';
    }
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updatePosition = (index, value) => {
    const numberValue = Number(value);
    setDraft((current) => {
      const nextPosition = [...current.position];
      nextPosition[index] = Number.isFinite(numberValue) ? numberValue : '';
      return { ...current, position: nextPosition };
    });
  };

  const saveDraft = () => {
    if (!draft?.name?.trim()) {
      setMessage('请先填写小区名称，再保存到地图。');
      return;
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      city: draft.city.trim() || '郑州 待确认',
    });
    setDraft(null);
    setStatus('idle');
    setMessage('已保存到地图，后续同名小区会自动合并照片。');
  };

  return (
    <section className="photo-upload-panel">
      <div>
        <p className="eyebrow">项目照片归档</p>
        <h2>上传项目照片</h2>
        <p>优先读取照片 GPS，并尝试识别图片文字；识别不准时可以手动改小区名称。</p>
      </div>

      <label className="upload-dropzone">
        <ImagePlus size={22} />
        <span>选择照片</span>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      {message ? <p className={`upload-message ${status === 'error' ? 'error' : ''}`}>{message}</p> : null}

      {draft ? (
        <div className="photo-draft">
          <img src={draft.imageUrl} alt="待归档照片预览" />
          <div className="photo-draft-form">
            <label>
              小区名称
              <input value={draft.name} placeholder="例如：建业天筑" onChange={(event) => updateDraft('name', event.target.value)} />
            </label>
            <label>
              城市/区域
              <input value={draft.city} onChange={(event) => updateDraft('city', event.target.value)} />
            </label>
            <div className="position-grid">
              <label>
                经度
                <input value={draft.position[0]} onChange={(event) => updatePosition(0, event.target.value)} />
              </label>
              <label>
                纬度
                <input value={draft.position[1]} onChange={(event) => updatePosition(1, event.target.value)} />
              </label>
            </div>
            <label>
              识别到的水印文字
              <textarea
                value={draft.detectedText || (draft.ocrSupported ? '' : '当前浏览器不支持内置文字识别，请手动填写小区名称。')}
                onChange={(event) => updateDraft('detectedText', event.target.value)}
              />
            </label>
            <button className="primary-action full" onClick={saveDraft}>
              保存到地图
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

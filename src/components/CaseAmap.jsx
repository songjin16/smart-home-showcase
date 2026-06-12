import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;
const ZHENGZHOU_CENTER = [113.625368, 34.746599];
const ZHENGZHOU_VIEW_BOUNDS = {
  minLng: 113.35,
  maxLng: 113.95,
  minLat: 34.5,
  maxLat: 34.95,
};

function isZhengzhouArea(position) {
  const [lng, lat] = position ?? [];
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= ZHENGZHOU_VIEW_BOUNDS.minLng &&
    lng <= ZHENGZHOU_VIEW_BOUNDS.maxLng &&
    lat >= ZHENGZHOU_VIEW_BOUNDS.minLat &&
    lat <= ZHENGZHOU_VIEW_BOUNDS.maxLat
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function makeMarkerContent(item, isActive) {
  const photoCount = item.photos?.length ?? 0;
  const markerImage = item.photos?.[0]?.thumbUrl ?? item.photos?.[0]?.imageUrl ?? item.cover;

  if (photoCount > 0 && markerImage) {
    return `
      <button class="amap-photo-marker${isActive ? ' active' : ''}" type="button" aria-label="查看${escapeHtml(item.name)}，${photoCount}张照片">
        <img src="${escapeHtml(markerImage)}" alt="" loading="lazy">
        <strong>${photoCount}</strong>
      </button>
    `;
  }

  return `
    <button class="amap-case-marker${isActive ? ' active' : ''}" type="button" aria-label="查看${escapeHtml(item.name)}">
      <span class="amap-case-dot"></span>
      <span>${escapeHtml(item.name)}</span>
    </button>
  `;
}

export default function CaseAmap({ cases, activeId, onSelectCase }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const activeIdRef = useRef(activeId);
  const onSelectCaseRef = useRef(onSelectCase);
  const [status, setStatus] = useState('idle');

  const hasConfig = Boolean(AMAP_KEY && AMAP_SECURITY_CODE && !AMAP_KEY.includes('你的高德Key'));
  activeIdRef.current = activeId;
  onSelectCaseRef.current = onSelectCase;

  useEffect(() => {
    if (!hasConfig) {
      setStatus('missing-config');
      return undefined;
    }

    let isCancelled = false;
    setStatus('loading');
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_CODE,
    };

    AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
    })
      .then((AMap) => {
        if (isCancelled || !containerRef.current) return;

        const usePageScrollOnMap = window.matchMedia('(max-width: 720px)').matches;
        const map = new AMap.Map(containerRef.current, {
          center: ZHENGZHOU_CENTER,
          zoom: 11,
          resizeEnable: true,
          viewMode: '2D',
          dragEnable: !usePageScrollOnMap,
          zoomEnable: !usePageScrollOnMap,
          doubleClickZoom: !usePageScrollOnMap,
          scrollWheel: !usePageScrollOnMap,
        });

        const markers = new Map();
        cases.forEach((item) => {
          if (!item.position) return;

          const marker = new AMap.Marker({
            position: item.position,
            title: item.name,
            anchor: 'bottom-center',
            content: makeMarkerContent(item, item.id === activeIdRef.current),
            zIndex: item.id === activeIdRef.current ? 120 : 80,
          });

          marker.on('click', () => onSelectCaseRef.current(item.id));
          marker.setMap(map);
          markers.set(item.id, marker);
        });

        if (markers.size > 0) {
          const primaryMarkers = cases
            .filter((item) => item.position && isZhengzhouArea(item.position))
            .map((item) => markers.get(item.id))
            .filter(Boolean);
          const markersToFit = primaryMarkers.length >= 10 ? primaryMarkers : [...markers.values()];
          map.setFitView(markersToFit, false, [80, 80, 80, 80], 11);
        }

        mapRef.current = map;
        markersRef.current = markers;
        requestAnimationFrame(() => map.resize());
        setStatus('ready');
      })
      .catch(() => {
        if (!isCancelled) setStatus('error');
      });

    return () => {
      isCancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [cases, hasConfig]);

  useEffect(() => {
    markersRef.current.forEach((itemMarker, itemId) => {
      const item = cases.find((caseItem) => caseItem.id === itemId);
      if (item) itemMarker.setContent(makeMarkerContent(item, itemId === activeId));
      if (typeof itemMarker.setzIndex === 'function') {
        itemMarker.setzIndex(itemId === activeId ? 120 : 80);
      }
    });
  }, [activeId, cases]);

  if (status === 'missing-config') {
    return (
      <div className="amap-state">
        <h2>需要配置高德地图 Key</h2>
        <p>请在项目根目录的 .env.local 中填写 VITE_AMAP_KEY 和 VITE_AMAP_SECURITY_CODE，然后重启开发服务。</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="amap-state">
        <h2>地图加载失败</h2>
        <p>请检查高德 Key、安全密钥、域名白名单和网络连接是否正确。</p>
      </div>
    );
  }

  return (
    <div className="amap-shell">
      <div ref={containerRef} className="amap-container" aria-label="高德服务地图" />
      {status === 'loading' ? <div className="amap-loading">地图加载中...</div> : null}
    </div>
  );
}

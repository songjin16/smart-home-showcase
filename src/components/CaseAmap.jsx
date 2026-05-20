import { useEffect, useMemo, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;
const ZHENGZHOU_CENTER = [113.625368, 34.746599];

function makeMarkerContent(item, isActive) {
  return `
    <button class="amap-case-marker${isActive ? ' active' : ''}" type="button" aria-label="查看${item.name}">
      <span class="amap-case-dot"></span>
      <span>${item.name}</span>
    </button>
  `;
}

export default function CaseAmap({ cases, activeId, onSelectCase }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const activeIdRef = useRef(activeId);
  const [status, setStatus] = useState('idle');

  const activeCase = useMemo(() => cases.find((item) => item.id === activeId) ?? cases[0], [activeId, cases]);
  const hasConfig = Boolean(AMAP_KEY && AMAP_SECURITY_CODE && !AMAP_KEY.includes('你的高德Key'));
  activeIdRef.current = activeId;

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

        const map = new AMap.Map(containerRef.current, {
          center: ZHENGZHOU_CENTER,
          zoom: 11,
          resizeEnable: true,
          viewMode: '2D',
        });

        const markers = new Map();
        cases.forEach((item) => {
          if (!item.position) return;

          const marker = new AMap.Marker({
            position: item.position,
            title: item.name,
            anchor: 'bottom-center',
            content: makeMarkerContent(item, item.id === activeIdRef.current),
          });

          marker.on('click', () => onSelectCase(item.id));
          marker.setMap(map);
          markers.set(item.id, marker);
        });

        if (markers.size > 0) {
          map.setFitView([...markers.values()], false, [80, 80, 80, 80], 11);
        }

        mapRef.current = map;
        markersRef.current = markers;
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
  }, [cases, hasConfig, onSelectCase]);

  useEffect(() => {
    const marker = markersRef.current.get(activeId);
    markersRef.current.forEach((itemMarker, itemId) => {
      const item = cases.find((caseItem) => caseItem.id === itemId);
      if (item) itemMarker.setContent(makeMarkerContent(item, itemId === activeId));
    });

    if (mapRef.current && marker && activeCase?.position) {
      mapRef.current.setZoomAndCenter(11, activeCase.position);
    }
  }, [activeCase, activeId, cases]);

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
      <div ref={containerRef} className="amap-container" aria-label="高德案例地图" />
      {status === 'loading' ? <div className="amap-loading">地图加载中...</div> : null}
    </div>
  );
}

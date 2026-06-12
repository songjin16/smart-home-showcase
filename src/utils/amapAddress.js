import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;

function hasAmapConfig() {
  return Boolean(AMAP_KEY && AMAP_SECURITY_CODE && !AMAP_KEY.includes('你的高德Key'));
}

function loadAmapGeocoder() {
  if (!hasAmapConfig()) return Promise.resolve(null);

  window._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_CODE,
  };

  return AMapLoader.load({
    key: AMAP_KEY,
    version: '2.0',
    plugins: ['AMap.Geocoder'],
  });
}

function convertGpsPosition(AMap, position) {
  return new Promise((resolve) => {
    AMap.convertFrom(position, 'gps', (status, result) => {
      const convertedPosition = result?.locations?.[0];
      if (status !== 'complete' || !convertedPosition) {
        resolve(position);
        return;
      }

      resolve([convertedPosition.lng, convertedPosition.lat]);
    });
  });
}

function reverseGeocode(AMap, position) {
  return new Promise((resolve) => {
    const geocoder = new AMap.Geocoder({
      extensions: 'base',
    });

    geocoder.getAddress(position, (status, result) => {
      if (status !== 'complete' || !result?.regeocode?.addressComponent) {
        resolve(null);
        return;
      }

      resolve(result.regeocode.addressComponent);
    });
  });
}

function formatAdministrativeArea(component) {
  const city = Array.isArray(component.city) ? component.province : component.city || component.province;
  return [city, component.district].filter(Boolean).join(' ');
}

export async function lookupAdministrativeArea(position) {
  try {
    const AMap = await loadAmapGeocoder();
    if (!AMap || !position) return null;

    const convertedPosition = await convertGpsPosition(AMap, position);
    const addressComponent = await reverseGeocode(AMap, convertedPosition);
    const administrativeArea = addressComponent ? formatAdministrativeArea(addressComponent) : '';

    return administrativeArea
      ? {
          city: administrativeArea,
          position: convertedPosition,
        }
      : null;
  } catch {
    return null;
  }
}

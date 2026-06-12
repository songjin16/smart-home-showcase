import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createWorker } from 'tesseract.js';
import { readGpsPosition } from '../src/utils/photoLocation.js';

const PROJECT_ROOT = process.cwd();
const PHOTO_INDEX_PATH = path.join(PROJECT_ROOT, 'public/jobsite-photos/jobsite-photo-index.json');
const OCR_CACHE_PATH = path.join(PROJECT_ROOT, 'public/jobsite-photos/ocr-cache.json');
const REVERSE_GEOCODE_CACHE_PATH = path.join(PROJECT_ROOT, 'public/jobsite-photos/reverse-geocode-cache.json');
const AMAP_GEOCODE_CACHE_PATH = path.join(PROJECT_ROOT, 'public/jobsite-photos/amap-geocode-cache.json');
const CLUSTER_REPORT_PATH = path.join(PROJECT_ROOT, 'public/jobsite-photos/jobsite-case-clusters.json');
const GENERATED_CASES_PATH = path.join(PROJECT_ROOT, 'src/data/jobsiteGeneratedCases.js');
const CLUSTER_DISTANCE_METERS = 250;
const OCR_SAMPLES_PER_CLUSTER = 2;
const ZHENGZHOU_CITY = '郑州 待确认';
const REVERSE_GEOCODE_DELAY_MS = 1100;
const AMAP_WEB_SERVICE_KEY = readEnvValue('AMAP_WEB_SERVICE_KEY');

function readEnvValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (!existsSync(envPath)) return '';
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(`${name}=`));
  return line?.split('=').slice(1).join('=').trim() ?? '';
}

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function getImageSize(filePath) {
  const result = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const width = Number(result.stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(result.stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  return width && height ? { width, height } : null;
}

function distanceMeters(a, b) {
  const radius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function readPhotoPosition(photo) {
  try {
    const buffer = readFileSync(photo.originalPath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    return readGpsPosition(arrayBuffer);
  } catch {
    return null;
  }
}

function clusterPhotos(photos) {
  const clusters = [];

  photos.forEach((photo) => {
    let nearest = null;
    let nearestDistance = Infinity;

    clusters.forEach((cluster) => {
      const distance = distanceMeters(photo.position, cluster.center);
      if (distance < nearestDistance) {
        nearest = cluster;
        nearestDistance = distance;
      }
    });

    if (nearest && nearestDistance <= CLUSTER_DISTANCE_METERS) {
      nearest.photos.push(photo);
      nearest.center = [
        nearest.photos.reduce((sum, item) => sum + item.position[0], 0) / nearest.photos.length,
        nearest.photos.reduce((sum, item) => sum + item.position[1], 0) / nearest.photos.length,
      ];
      nearest.radiusMeters = Math.max(nearest.radiusMeters, nearestDistance);
      return;
    }

    clusters.push({
      center: photo.position.slice(),
      radiusMeters: 0,
      photos: [photo],
    });
  });

  return clusters
    .map((cluster, index) => ({
      ...cluster,
      rawIndex: index + 1,
      photos: cluster.photos.sort((a, b) => (a.shotAt || '').localeCompare(b.shotAt || '')),
    }))
    .sort((a, b) => b.photos.length - a.photos.length);
}

function cleanLocation(value) {
  return value
    .replace(/^郑州市?[：:，,、.。]*/, '')
    .replace(/^(河南省)?郑州市?/, '')
    .replace(/(今日水印|拍摄.*$|拍报.*$|防伪|天气|时间|项目|电话|服务中心|专业智能|智能家居服务|服务).*$/, '')
    .replace(/[A-Za-z0-9_]+$/g, '')
    .replace(/[上阮信量免移局委今颁]+$/g, '')
    .replace(/[^\u4e00-\u9fa5A-Za-z0-9·（）() -]/g, '')
    .replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '')
    .replace(/[ ：:，,、.。-]+$/g, '')
    .trim()
    .slice(0, 24);
}

function isUsableLocationName(value) {
  const chineseChars = value.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const asciiChars = value.match(/[A-Za-z0-9]/g)?.length ?? 0;
  const asciiLetters = value.match(/[A-Za-z]/g)?.length ?? 0;
  const suspicious = /(NSS|SS|SR|AN|Li|TD|报信|拍报|拍摄|防伪|天气|时间|电话|服务|专业智能|智能家居服务|全屋智能体验馆|颁今|委人|其一|局肥|上上)/i.test(value);
  const genericArea = /^(郑东新区|金水区|中原区|二七区|管城回族区|惠济区|高新区|经开区|航空港区)$/.test(value);
  const commonProjectSuffix = /(府|湾|城|园|苑|里|院|郡|境|馆|广场|中心|公寓|小区|公园|华府|江湾|名家|大楼|大厦|世家|天筑)$/.test(value);

  if (chineseChars < 2) return false;
  if (asciiLetters > 0) return false;
  if (asciiChars > 0 && !/[0-9]+号院/.test(value)) return false;
  if (genericArea) return false;
  if (suspicious) return false;
  if (!commonProjectSuffix) return false;
  if (value.length > 16 && !/(广场|中心|公寓|小区|公园|大楼|大厦|体验馆)$/.test(value)) return false;
  return true;
}

function extractLocationName(text) {
  const compact = text.replace(/\s+/g, '').replace(/地[，,.。]?点/g, '地点');
  const patterns = [
    /地点[：:，,、.。]?(.{2,42}?)(?:今日水印|拍摄人|防伪|天气|时间|$)/,
    /地址[：:，,、.。]?(.{2,42}?)(?:今日水印|拍摄人|防伪|天气|时间|$)/,
    /小区[：:，,、.。]?(.{2,32}?)(?:今日水印|拍摄人|防伪|天气|时间|$)/,
    /郑州市?[：:，,、.。]?(.{2,32}?)(?:今日水印|拍摄人|防伪|天气|时间|$)/,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    const cleaned = match?.[1] ? cleanLocation(match[1]) : '';
    if (isUsableLocationName(cleaned)) return cleaned;
  }

  return '';
}

function fallbackCaseName(cluster) {
  const [lng, lat] = cluster.center;
  return `GPS位置 ${lng.toFixed(4)},${lat.toFixed(4)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeReverseGeocodeKey(position) {
  return position.map((value) => value.toFixed(5)).join(',');
}

function formatAddressPart(value) {
  return Array.isArray(value) ? value[0] : value || '';
}

function makeNameFromReverseAddress(result, fallbackName) {
  const address = result?.address ?? {};
  const road = formatAddressPart(address.road);
  const neighbourhood = formatAddressPart(address.neighbourhood || address.quarter || address.residential);
  const village = formatAddressPart(address.village || address.town || address.suburb);
  const district = formatAddressPart(address.city || address.county || address.district);
  const city = formatAddressPart(address.municipality || address.state_district || address.state);
  const primary = [road, neighbourhood, village].filter(Boolean).slice(0, 2).join(' · ');
  const secondary = [district, city].filter(Boolean).slice(0, 2).join(' · ');

  if (primary) return primary;
  if (secondary) return secondary;
  return result?.display_name?.split(',').slice(0, 2).join(' · ').trim() || fallbackName;
}

function makeAreaCoordinateName(city, cluster) {
  const [lng, lat] = cluster.center;
  const area = city && city !== ZHENGZHOU_CITY ? city : '郑州 区域待确认';
  return `${area} ${lng.toFixed(4)},${lat.toFixed(4)}`;
}

function cleanPoiName(value) {
  return String(value ?? '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/[^\u4e00-\u9fa5A-Za-z0-9·（）() -]/g, '')
    .trim()
    .slice(0, 24);
}

function isLikelyResidentialName(value) {
  const cleaned = cleanPoiName(value);
  if (!cleaned || cleaned.length < 2) return false;
  if (/(公交|地铁|停车场|学校|幼儿园|医院|药房|银行|公司|酒店|餐|店|超市|便利|公园|景区|政府|派出所|办事处|加油站|收费站|出口|入口|道路|路口)/.test(cleaned)) {
    return false;
  }
  return /(府|湾|城|园|苑|里|院|郡|境|馆|广场|中心|公寓|小区|家园|花园|社区|名邸|官邸|雅居|公馆|华庭|天筑|世家)$/.test(cleaned);
}

function makeCityFromReverseAddress(result) {
  const address = result?.address ?? {};
  const district = formatAddressPart(address.city || address.county || address.district);
  const city = formatAddressPart(address.municipality || address.state_district || address.state);
  return [city, district].filter(Boolean).slice(0, 2).join(' ') || ZHENGZHOU_CITY;
}

async function reverseGeocodeCluster(cluster, cache) {
  const key = makeReverseGeocodeKey(cluster.center);
  if (cache[key]) return cache[key];

  const [lng, lat] = cluster.center;
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('accept-language', 'zh-CN');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'smart-home-showcase-local-photo-organizer/1.0',
      },
    });
    cache[key] = response.ok
      ? await response.json()
      : {
          error: `reverse-geocode-http-${response.status}`,
        };
  } catch (error) {
    cache[key] = {
      error: error.message,
    };
  }

  await sleep(REVERSE_GEOCODE_DELAY_MS);
  return cache[key];
}

async function fetchAmapJson(url, cache, key) {
  if (cache[key]) return cache[key];
  try {
    const response = await fetch(url);
    cache[key] = response.ok ? await response.json() : { status: '0', info: `http-${response.status}` };
  } catch (error) {
    cache[key] = { status: '0', info: error.message };
  }
  await sleep(220);
  return cache[key];
}

async function lookupAmapLocation(cluster, cache) {
  if (!AMAP_WEB_SERVICE_KEY) return null;

  const [lng, lat] = cluster.center;
  const key = makeReverseGeocodeKey(cluster.center);
  if (cache[key]) return cache[key];

  const convertUrl = new URL('https://restapi.amap.com/v3/assistant/coordinate/convert');
  convertUrl.searchParams.set('key', AMAP_WEB_SERVICE_KEY);
  convertUrl.searchParams.set('locations', `${lng},${lat}`);
  convertUrl.searchParams.set('coordsys', 'gps');
  const converted = await fetchAmapJson(convertUrl, cache, `${key}:convert`);
  const amapPosition = converted?.status === '1' && converted.locations ? converted.locations.split(';')[0] : `${lng},${lat}`;

  const regeoUrl = new URL('https://restapi.amap.com/v3/geocode/regeo');
  regeoUrl.searchParams.set('key', AMAP_WEB_SERVICE_KEY);
  regeoUrl.searchParams.set('location', amapPosition);
  regeoUrl.searchParams.set('extensions', 'all');
  regeoUrl.searchParams.set('radius', '1000');
  regeoUrl.searchParams.set('roadlevel', '0');
  const regeo = await fetchAmapJson(regeoUrl, cache, `${key}:regeo`);
  const component = regeo?.regeocode?.addressComponent ?? {};
  const pois = Array.isArray(regeo?.regeocode?.pois) ? regeo.regeocode.pois : [];
  const residentialPoi = pois
    .map((poi) => ({
      name: cleanPoiName(poi.name),
      distance: Number(poi.distance) || Infinity,
      type: poi.type ?? '',
    }))
    .filter((poi) => isLikelyResidentialName(poi.name))
    .sort((a, b) => a.distance - b.distance || a.name.length - b.name.length)[0];

  const city = [component.city || component.province, component.district].filter(Boolean).join(' ') || '';
  cache[key] = {
    amapPosition,
    city,
    poiName: residentialPoi?.name ?? '',
    poiDistanceMeters: Number.isFinite(residentialPoi?.distance) ? residentialPoi.distance : null,
    formattedAddress: regeo?.regeocode?.formatted_address ?? '',
  };
  return cache[key];
}

async function recognizeWatermark(worker, photo, cache) {
  if (cache[photo.id]) {
    cache[photo.id] = {
      ...cache[photo.id],
      locationName: extractLocationName(cache[photo.id].text ?? ''),
    };
    return cache[photo.id];
  }

  const size = getImageSize(photo.originalPath);
  if (!size) {
    cache[photo.id] = { text: '', locationName: '', error: 'cannot-read-size' };
    return cache[photo.id];
  }

  const rectangle = {
    left: 0,
    top: Math.round(size.height * 0.72),
    width: Math.round(size.width * 0.72),
    height: Math.round(size.height * 0.25),
  };

  try {
    const result = await worker.recognize(photo.originalPath, { rectangle });
    const text = result.data.text.trim();
    cache[photo.id] = {
      text,
      locationName: extractLocationName(text),
      rectangle,
    };
  } catch (error) {
    cache[photo.id] = { text: '', locationName: '', error: error.message };
  }

  return cache[photo.id];
}

function makePhotoRecord(photo, caseName, city) {
  return {
    id: photo.id,
    name: caseName,
    city,
    position: photo.position,
    imageUrl: `/jobsite-photos/${photo.image}`,
    thumbUrl: `/jobsite-photos/${photo.thumb}`,
    fileName: photo.fileName,
    shotAt: photo.shotAt,
    detectedText: '',
    hasGps: true,
  };
}

function makeCase(cluster, index, ocrMatches, reverseAddress, amapLocation) {
  const coverPhoto = cluster.photos[0];
  const firstDate = cluster.photos.find((photo) => photo.shotAt)?.shotAt?.slice(0, 10) ?? '未知日期';
  const lastDate = [...cluster.photos].reverse().find((photo) => photo.shotAt)?.shotAt?.slice(0, 10) ?? firstDate;
  const locationCounts = ocrMatches.reduce((counts, item) => {
    if (item.locationName) counts[item.locationName] = (counts[item.locationName] ?? 0) + 1;
    return counts;
  }, {});
  const [rawBestLocation, bestCount = 0] =
    Object.entries(locationCounts).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0] ?? [];
  const bestLocation = rawBestLocation && isUsableLocationName(cleanLocation(rawBestLocation)) ? cleanLocation(rawBestLocation) : '';
  const reverseName = makeNameFromReverseAddress(reverseAddress, fallbackCaseName(cluster));
  const city = amapLocation?.city || makeCityFromReverseAddress(reverseAddress);
  const areaCoordinateName = makeAreaCoordinateName(city, cluster);
  const poiName = amapLocation?.poiName ?? '';
  const gpsName = poiName || reverseName || areaCoordinateName;
  const caseName = bestLocation || gpsName || areaCoordinateName;
  const nameSource = bestLocation ? 'ocr' : poiName ? 'nearby-poi' : reverseName ? 'reverse-geocode' : 'gps-area';
  const photoRecords = cluster.photos.map((photo) => makePhotoRecord(photo, caseName, city));
  const dateRange = firstDate === lastDate ? firstDate : `${firstDate} 至 ${lastDate}`;

  return {
    id: `jobsite-${String(index + 1).padStart(3, '0')}`,
    name: caseName,
    city,
    homeType: '工地照片归档',
    area: `${cluster.photos.length} 张照片`,
    rooms: `拍摄日期：${dateRange}`,
    position: cluster.center.map((value) => Number(value.toFixed(6))),
    cover: `/jobsite-photos/${coverPhoto.image}`,
    images: cluster.photos.slice(0, 8).map((photo) => `/jobsite-photos/${photo.image}`),
    sceneImages: {},
    intro: `自动按照片 GPS 归并的工地记录，共 ${cluster.photos.length} 张现场照片。${bestLocation ? `水印识别地点：${bestLocation}。` : `GPS 位置：${gpsName}。`}`,
    scenes: ['现场照片', 'GPS 自动归并', '待人工复核'],
    highlights: [
      `照片数量：${cluster.photos.length} 张`,
      `拍摄时间：${dateRange}`,
      bestLocation ? `水印识别：${bestLocation}` : `GPS 位置：${gpsName}`,
    ],
    benefits: ['按地图快速查找项目', '保留现场照片和拍摄时间', '后续可人工改名归并'],
    devices: [],
    photos: photoRecords,
    isUploaded: true,
    source: {
      type: 'jobsite-gps-cluster',
      clusterDistanceMeters: CLUSTER_DISTANCE_METERS,
      photoCount: cluster.photos.length,
      firstDate,
      lastDate,
      ocrName: bestLocation || '',
      ocrMatchCount: bestCount,
      nameSource,
      poiName: amapLocation?.poiName ?? '',
      poiDistanceMeters: amapLocation?.poiDistanceMeters ?? null,
      areaName: city,
      originalGpsPosition: cluster.center.map((value) => Number(value.toFixed(6))),
      amapPosition: amapLocation?.amapPosition ?? '',
      reverseName,
      reverseDisplayName: reverseAddress?.display_name ?? '',
      radiusMeters: Math.round(cluster.radiusMeters),
    },
  };
}

function writeGeneratedCases(cases, metadata) {
  const content = [
    '// Auto-generated by scripts/build-jobsite-generated-cases.mjs.',
    '// Do not edit by hand; update the source photos or OCR cache, then rerun the script.',
    '',
    `export const jobsiteCaseMetadata = ${JSON.stringify(metadata, null, 2)};`,
    '',
    `export const jobsiteGeneratedCases = ${JSON.stringify(cases, null, 2)};`,
    '',
  ].join('\n');

  writeFileSync(GENERATED_CASES_PATH, content);
}

const index = readJson(PHOTO_INDEX_PATH, null);
if (!index?.photos?.length) {
  throw new Error('Missing public/jobsite-photos/jobsite-photo-index.json. Run scripts/build-jobsite-photo-library.mjs first.');
}

const ocrCache = readJson(OCR_CACHE_PATH, {});
const reverseGeocodeCache = readJson(REVERSE_GEOCODE_CACHE_PATH, {});
const amapGeocodeCache = readJson(AMAP_GEOCODE_CACHE_PATH, {});
const positionedPhotos = [];
const noGpsPhotos = [];

for (const photo of index.photos) {
  const position = readPhotoPosition(photo);
  if (position) {
    positionedPhotos.push({ ...photo, position });
  } else {
    noGpsPhotos.push(photo);
  }
}

const clusters = clusterPhotos(positionedPhotos);
const worker = await createWorker('chi_sim');

const cases = [];
const clusterReport = [];
for (let index = 0; index < clusters.length; index += 1) {
  const cluster = clusters[index];
  const ocrSamples = cluster.photos.slice(0, OCR_SAMPLES_PER_CLUSTER);
  const ocrMatches = [];

  for (const photo of ocrSamples) {
    ocrMatches.push(await recognizeWatermark(worker, photo, ocrCache));
  }

  const reverseAddress = await reverseGeocodeCluster(cluster, reverseGeocodeCache);
  const amapLocation = await lookupAmapLocation(cluster, amapGeocodeCache);
  const caseItem = makeCase(cluster, index, ocrMatches, reverseAddress, amapLocation);
  cases.push(caseItem);
  clusterReport.push({
    id: caseItem.id,
    name: caseItem.name,
    center: caseItem.position,
    photoCount: cluster.photos.length,
    firstDate: caseItem.source.firstDate,
    lastDate: caseItem.source.lastDate,
    ocrSamples: ocrSamples.map((photo, sampleIndex) => ({
      photoId: photo.id,
      fileName: photo.fileName,
      locationName: ocrMatches[sampleIndex]?.locationName ?? '',
      text: ocrMatches[sampleIndex]?.text ?? '',
    })),
    reverseName: caseItem.source.reverseName,
    reverseDisplayName: caseItem.source.reverseDisplayName,
    nameSource: caseItem.source.nameSource,
    poiName: caseItem.source.poiName,
    areaName: caseItem.source.areaName,
  });

  if ((index + 1) % 25 === 0) {
    console.log(`named ${index + 1}/${clusters.length} clusters`);
    writeFileSync(OCR_CACHE_PATH, `${JSON.stringify(ocrCache, null, 2)}\n`);
    writeFileSync(REVERSE_GEOCODE_CACHE_PATH, `${JSON.stringify(reverseGeocodeCache, null, 2)}\n`);
    writeFileSync(AMAP_GEOCODE_CACHE_PATH, `${JSON.stringify(amapGeocodeCache, null, 2)}\n`);
  }
}

await worker.terminate();
writeFileSync(OCR_CACHE_PATH, `${JSON.stringify(ocrCache, null, 2)}\n`);
writeFileSync(REVERSE_GEOCODE_CACHE_PATH, `${JSON.stringify(reverseGeocodeCache, null, 2)}\n`);
writeFileSync(AMAP_GEOCODE_CACHE_PATH, `${JSON.stringify(amapGeocodeCache, null, 2)}\n`);

const metadata = {
  generatedAt: new Date().toISOString(),
  totalPhotos: index.photos.length,
  gpsPhotos: positionedPhotos.length,
  noGpsPhotos: noGpsPhotos.length,
  clusterCount: clusters.length,
  clusterDistanceMeters: CLUSTER_DISTANCE_METERS,
  ocrSamplesPerCluster: OCR_SAMPLES_PER_CLUSTER,
};

writeGeneratedCases(cases, metadata);
mkdirSync(path.dirname(CLUSTER_REPORT_PATH), { recursive: true });
writeFileSync(
  CLUSTER_REPORT_PATH,
  `${JSON.stringify(
    {
      metadata,
      noGpsPhotos: noGpsPhotos.map((photo) => ({
        id: photo.id,
        fileName: photo.fileName,
        image: photo.image,
        thumb: photo.thumb,
        shotAt: photo.shotAt,
      })),
      clusters: clusterReport,
    },
    null,
    2,
  )}\n`,
);

console.log(JSON.stringify(metadata, null, 2));

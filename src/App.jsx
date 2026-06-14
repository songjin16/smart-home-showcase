import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  FileText,
  Home,
  LampCeiling,
  Layers3,
  MapPin,
  Moon,
  PencilLine,
  Play,
  Plus,
  ShieldCheck,
  Sofa,
  Sun,
  ThermometerSun,
  Tv,
  Download,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';
import * as THREE from 'three';
import { budgetPlans, cases, lightingSimulations, productPoints, scenes, showroomCases } from './data/demoData.js';
import zhizhuangxiaAvatar from './assets/zhizhuangxia-avatar.png';
import zhizhuangxiaLogo from './assets/zhizhuangxia-logo.png';

const CaseAmap = lazy(() => import('./components/CaseAmap.jsx'));
const PhotoUploadPanel = lazy(() => import('./components/PhotoUploadPanel.jsx'));

const UPLOADED_PHOTOS_KEY = 'zhizhuangxia_uploaded_photos';
const UPLOADED_CASE_INTRO = '由上传的水印照片自动生成，可点击查看这个小区关联的现场图片。';
const COMPACT_SERVICE_COUNT = 12;
const SEARCH_SERVICE_COUNT = 20;
const HOTSPOT_CONFIG_KEY = 'zhizhuangxia_showroom_hotspots_v1';
const FIXED_CASE_CONFIG_KEY = 'zhizhuangxia_fixed_case_content_v1';
const IS_LOCAL_EDITING_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOCAL_EDITING === 'true';
const EMPTY_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80';
const ALL_SERVICE_AREAS = '全部区域';
const inspectionVrProjects = [
  {
    id: 'zhizhuangxia-flagship-showroom',
    name: '智装侠人车家旗舰体验展厅',
    city: '郑州 智装侠展厅',
    date: '精选作品',
    type: '展厅全景',
    summary: '智装侠人车家旗舰体验展厅全景，可在线查看展厅空间和场景布置。',
    url: 'https://vr.zzxaiot.com/tour/11f380427787dd7e',
  },
  {
    id: 'muse-high-end-showroom',
    name: '木色高定展厅',
    city: '展厅案例',
    date: '精选作品',
    type: '展厅全景',
    summary: '木色高定展厅全景案例，适合展示定制展厅空间和客户参观动线。',
    url: 'https://vr.zzxaiot.com/tour/357ea796c53af541',
  },
  {
    id: 'xintiancheng-villa-construction',
    name: '新田城别墅施工全景',
    city: '郑州 新田城',
    date: '2025年4月1日',
    type: '水电验收 / 施工全景',
    summary: '使用现有智装侠 VR 全景系统查看施工现场，可切换场景、查看导航，并支持独立打开分享。',
    url: 'https://vr.zzxaiot.com/tour/9d2b80aacb7ce463',
  },
  {
    id: 'rongsheng-huafu-construction',
    name: '荣盛华府施工全景',
    city: '施工项目',
    date: '精选作品',
    type: '施工全景',
    summary: '荣盛华府施工现场全景，用于查看工地阶段、现场环境和施工细节。',
    url: 'https://vr.zzxaiot.com/tour/06376a96dd260f9a',
  },
  {
    id: 'zhongshan-baote-showroom',
    name: '中山宝特展厅',
    city: '中山 展厅',
    date: '精选作品',
    type: '展厅全景',
    summary: '中山宝特展厅全景案例，可用于客户线上了解展厅空间。',
    url: 'https://vr.zzxaiot.com/tour/bf1f8620ea2cb631',
  },
  {
    id: 'snail-audio-shenzhen-flagship',
    name: '蜗牛音响深圳旗舰店',
    city: '深圳 门店',
    date: '精选作品',
    type: '门店全景',
    summary: '蜗牛音响深圳旗舰店全景，展示门店空间、产品陈列和体验区。',
    url: 'https://vr.zzxaiot.com/tour/1b04023996bee4c3',
  },
  {
    id: 'xingguang-haoyi-showroom',
    name: '星光联盟皓逸展厅',
    city: '展厅案例',
    date: '精选作品',
    type: '展厅全景',
    summary: '星光联盟皓逸展厅全景，可在线查看展厅布局与产品展示区域。',
    url: 'https://vr.zzxaiot.com/tour/a6714477955e23af',
  },
  {
    id: 'beijing-qumei-whole-home',
    name: '北京曲美整家',
    city: '北京 整家案例',
    date: '精选作品',
    type: '整家全景',
    summary: '北京曲美整家全景案例，适合展示整家空间和客户参观体验。',
    url: 'https://vr.zzxaiot.com/tour/dc43bb8b86dcb508',
  },
  {
    id: 'beijing-no9-mansion',
    name: '北京9 号公馆',
    city: '北京 9号公馆',
    date: '精选作品',
    type: '项目全景',
    summary: '北京9号公馆项目全景，可在线查看空间环境和项目展示内容。',
    url: 'https://vr.zzxaiot.com/tour/ddd80b07f51cc5b8',
  },
  {
    id: 'mixue-headquarters',
    name: '蜜雪冰城总部',
    city: '总部案例',
    date: '精选作品',
    type: '商业空间全景',
    summary: '蜜雪冰城总部全景案例，用于展示商业空间和办公环境。',
    url: 'https://vr.zzxaiot.com/tour/17e0124e9229bdad',
  },
  {
    id: 'jinke-smart-valley-office',
    name: '金科智慧谷办事大厅',
    city: '办事大厅',
    date: '精选作品',
    type: '公共空间全景',
    summary: '金科智慧谷办事大厅全景，可在线查看公共服务空间布局。',
    url: 'https://vr.zzxaiot.com/tour/2fd06980c87c0fe5',
  },
  {
    id: 'shanshui-shangjing-construction',
    name: '善水上镜施工全景',
    city: '施工项目',
    date: '精选作品',
    type: '施工全景',
    summary: '善水上镜施工现场全景，适合查看施工阶段和现场记录。',
    url: 'https://vr.zzxaiot.com/tour/6246da33269d76f1',
  },
  {
    id: 'xiangxie-lishe-construction',
    name: '香榭丽舍施工全景',
    city: '施工项目',
    date: '精选作品',
    type: '施工全景',
    summary: '香榭丽舍施工现场全景，用于工地验收和施工过程展示。',
    url: 'https://vr.zzxaiot.com/tour/10fa14463feea281',
  },
  {
    id: 'junlin-dayuan-construction',
    name: '君临大院施工全景',
    city: '施工项目',
    date: '精选作品',
    type: '施工全景',
    summary: '君临大院施工现场全景，可查看工地空间、线路和现场状态。',
    url: 'https://vr.zzxaiot.com/tour/348f4e59527baaec',
  },
  {
    id: 'cuiyuan-yunding-construction',
    name: '翠园云鼎施工全景',
    city: '施工项目',
    date: '精选作品',
    type: '施工全景',
    summary: '翠园云鼎施工现场全景，适合线上查看项目施工和验收记录。',
    url: 'https://vr.zzxaiot.com/tour/4bd7f97d06196886',
  },
  {
    id: 'biguiyuan-xihu-construction',
    name: '碧桂园西湖施工全景',
    city: '施工项目',
    date: '精选作品',
    type: '施工全景',
    summary: '碧桂园西湖施工现场全景，用于查看施工现场和验收细节。',
    url: 'https://vr.zzxaiot.com/tour/fd5db81b3d870902',
  },
  {
    id: 'aoyuan-construction',
    name: '奥园施工全景',
    city: '施工项目',
    date: '精选作品',
    type: '施工全景',
    summary: '奥园施工现场全景，可作为工地验收和施工展示案例。',
    url: 'https://vr.zzxaiot.com/tour/6bd9b51832451f1e',
  },
];

const sceneIcons = {
  bright: Sun,
  relax: Sofa,
  warm: LampCeiling,
  away: ShieldCheck,
};

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return { path, navigate };
}

function readUploadedPhotos() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(UPLOADED_PHOTOS_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function useUploadedPhotos() {
  const [photos, setPhotos] = useState(readUploadedPhotos);

  const savePhotos = (nextPhotos) => {
    setPhotos(nextPhotos);
    window.localStorage.setItem(UPLOADED_PHOTOS_KEY, JSON.stringify(nextPhotos));
  };

  const addPhoto = (draft) => {
    const nextPhoto = {
      id: `photo-${Date.now()}`,
      name: draft.name,
      city: draft.city,
      position: draft.position,
      imageUrl: draft.imageUrl,
      fileName: draft.fileName,
      detectedText: draft.detectedText,
      hasGps: draft.hasGps,
      createdAt: new Date().toISOString(),
    };
    savePhotos([...photos, nextPhoto]);
    return nextPhoto;
  };

  const updateCase = (caseName, draft) => {
    const scenes = draft.scenes
      .split(/[，,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const highlights = draft.highlights
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    const nextPhotos = photos.map((photo) =>
      photo.name === caseName
        ? {
            ...photo,
            name: draft.name.trim(),
            city: draft.city.trim() || '郑州 待确认',
            caseIntro: draft.intro.trim() || UPLOADED_CASE_INTRO,
            caseScenes: scenes,
            caseHighlights: highlights,
          }
        : photo,
    );
    savePhotos(nextPhotos);
  };

  return { photos, addPhoto, updateCase };
}

function buildCasesWithPhotos(baseCases, uploadedPhotos) {
  const groupedPhotos = uploadedPhotos.reduce((groups, photo) => {
    const key = photo.name;
    return { ...groups, [key]: [...(groups[key] ?? []), photo] };
  }, {});

  const baseNames = new Set(baseCases.flatMap((item) => [item.name, item.defaultName].filter(Boolean)));
  const enrichedCases = baseCases.map((item) => ({
    ...item,
    photos: [
      ...(item.photos ?? []),
      ...(groupedPhotos[item.name] ?? []),
      ...(item.defaultName && item.defaultName !== item.name ? groupedPhotos[item.defaultName] ?? [] : []),
    ],
  }));

  const customCases = Object.entries(groupedPhotos)
    .filter(([name]) => !baseNames.has(name))
    .map(([name, photos]) => {
      const latestPhoto = photos[photos.length - 1];
      return {
        id: `uploaded-${name}`,
        name,
        city: latestPhoto.city,
        homeType: '项目照片归档',
        area: `${photos.length} 张照片`,
        rooms: '现场照片',
        position: latestPhoto.position,
        cover: latestPhoto.imageUrl,
        images: photos.map((photo) => photo.imageUrl),
        intro: latestPhoto.caseIntro ?? UPLOADED_CASE_INTRO,
        scenes: latestPhoto.caseScenes?.length ? latestPhoto.caseScenes : ['照片归档'],
        highlights: latestPhoto.caseHighlights?.length
          ? latestPhoto.caseHighlights
          : ['上传照片自动归类', latestPhoto.hasGps ? '已读取照片位置' : '位置待人工确认'],
        benefits: ['减少手工整理', '地图查找更直观'],
        devices: [],
        photos,
        isUploaded: true,
      };
    });

  return [...enrichedCases, ...customCases];
}

function getServiceArea(caseItem) {
  const parts = String(caseItem.city ?? '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || '区域待确认';
}

function readFixedCaseConfig() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(FIXED_CASE_CONFIG_KEY) ?? '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function mergeFixedCases(config) {
  return cases.map((item) => {
    const override = config[item.id] ?? {};
    return {
      ...item,
      ...override,
      defaultName: item.name,
      images: Array.isArray(override.images) ? override.images : item.images,
      sceneImages: {
        ...item.sceneImages,
        ...(override.sceneImages ?? {}),
      },
    };
  });
}

function useFixedCases() {
  const [config, setConfig] = useState(readFixedCaseConfig);
  const fixedCases = useMemo(() => mergeFixedCases(config), [config]);

  const saveConfig = (nextConfig) => {
    setConfig(nextConfig);
    window.localStorage.setItem(FIXED_CASE_CONFIG_KEY, JSON.stringify(nextConfig));
  };

  const saveCaseOverride = (caseId, override) => {
    saveConfig({ ...config, [caseId]: override });
  };

  const resetCaseOverride = (caseId) => {
    const nextConfig = { ...config };
    delete nextConfig[caseId];
    saveConfig(nextConfig);
  };

  return { config, fixedCases, saveCaseOverride, resetCaseOverride };
}

function splitCaseLines(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeFixedCaseDraft(caseItem) {
  return {
    name: caseItem.name,
    city: caseItem.city,
    homeType: caseItem.homeType,
    area: caseItem.area,
    rooms: caseItem.rooms,
    intro: caseItem.intro,
    scenes: caseItem.scenes.join('\n'),
    highlights: caseItem.highlights.join('\n'),
    benefits: caseItem.benefits.join('\n'),
    devices: caseItem.devices.join('\n'),
    cover: caseItem.cover,
    images: caseItem.images.join('\n'),
    sceneImages: {
      bright: caseItem.sceneImages.bright,
      relax: caseItem.sceneImages.relax,
      warm: caseItem.sceneImages.warm,
      away: caseItem.sceneImages.away,
    },
  };
}

function makeFixedCaseOverride(draft) {
  return {
    name: draft.name.trim(),
    city: draft.city.trim(),
    homeType: draft.homeType.trim(),
    area: draft.area.trim(),
    rooms: draft.rooms.trim(),
    intro: draft.intro.trim(),
    scenes: splitCaseLines(draft.scenes),
    highlights: splitCaseLines(draft.highlights),
    benefits: splitCaseLines(draft.benefits),
    devices: splitCaseLines(draft.devices),
    cover: draft.cover.trim(),
    images: splitCaseLines(draft.images),
    sceneImages: {
      bright: draft.sceneImages.bright.trim(),
      relax: draft.sceneImages.relax.trim(),
      warm: draft.sceneImages.warm.trim(),
      away: draft.sceneImages.away.trim(),
    },
  };
}

function readLocalImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function exportJsonFile(name, value) {
  const exportFile = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const exportUrl = URL.createObjectURL(exportFile);
  const link = document.createElement('a');
  link.href = exportUrl;
  link.download = name;
  link.click();
  URL.revokeObjectURL(exportUrl);
}

function cloneProductPoint(product, hotspot = product.hotspot) {
  return {
    id: product.id,
    productId: product.productId ?? product.id,
    name: product.name,
    role: product.role,
    location: product.location,
    sceneUse: product.sceneUse,
    image: product.image,
    hotspot: { x: hotspot.x, y: hotspot.y },
  };
}

function readHotspotConfig() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(HOTSPOT_CONFIG_KEY) ?? '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function useHotspotConfig() {
  const [config, setConfig] = useState(readHotspotConfig);

  const saveConfig = (nextConfig) => {
    setConfig(nextConfig);
    window.localStorage.setItem(HOTSPOT_CONFIG_KEY, JSON.stringify(nextConfig));
  };

  const saveImagePoints = (imageKey, points) => {
    saveConfig({
      ...config,
      [imageKey]: points.map((point) => cloneProductPoint(point)),
    });
  };

  const resetImagePoints = (imageKey) => {
    const nextConfig = { ...config };
    delete nextConfig[imageKey];
    saveConfig(nextConfig);
  };

  return { config, saveImagePoints, resetImagePoints };
}

function makeImageKey(caseId, imageId) {
  return `${caseId}:${imageId}`;
}

function makeProductDraft(product, fallbackHotspot = { x: 50, y: 50 }) {
  return {
    id: product?.id ?? `custom-${Date.now()}`,
    productId: product?.productId ?? product?.id ?? '',
    name: product?.name ?? '新产品',
    role: product?.role ?? '',
    location: product?.location ?? '',
    sceneUse: product?.sceneUse ?? '',
    image: product?.image ?? EMPTY_PRODUCT_IMAGE,
    hotspot: { x: fallbackHotspot.x, y: fallbackHotspot.y },
  };
}

function makeDefaultScenePoints(caseItem, imageId) {
  return imageId.startsWith('scene:') && caseItem?.sceneImages
    ? productPoints.map((product) => cloneProductPoint(product))
    : [];
}

function Shell({ children, navigate }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')} aria-label="返回首页">
          <span className="brand-avatar">
            <img src={zhizhuangxiaAvatar} alt="" />
          </span>
          <span className="brand-mark image-logo">
            <img src={zhizhuangxiaLogo} alt="智装侠" />
          </span>
          <span>智能家居案例展示系统</span>
        </button>
        <nav className="nav-links" aria-label="主导航">
          <button onClick={() => navigate('/cases')}>服务地图</button>
          <button onClick={() => navigate(`/showroom/${showroomCases[0].id}`)}>案例演示</button>
          <button onClick={() => navigate('/budget')}>方案预算</button>
          <button onClick={() => navigate('/lighting')}>灯光照度模拟</button>
          <button onClick={() => navigate('/inspection-panoramas')}>水电验收全景</button>
        </nav>
      </header>
      {children}
    </div>
  );
}

function HomePage({ navigate }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=82"
            alt=""
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-layout">
          <div className="hero-content">
            <p className="eyebrow">智装侠智能生活案例</p>
            <h1>智装侠智能家居案例展示</h1>
            <p className="hero-copy">
              从郑州真实落地案例，看回家、观影、睡前和离家时，灯光、窗帘、网络和音响怎样配合一家人的生活。
            </p>
            <div className="hero-points" aria-label="案例亮点">
              <span>进门不摸黑</span>
              <span>观影有氛围</span>
              <span>离家少担心</span>
            </div>
            <div className="hero-actions">
              <button className="primary-action" onClick={() => navigate('/cases')}>
                <MapPin size={20} />
                查看服务地图
              </button>
              <button className="secondary-action" onClick={() => navigate(`/showroom/${showroomCases[0].id}`)}>
                <Play size={20} />
                查看案例演示
              </button>
              <button className="secondary-action" onClick={() => navigate('/lighting')}>
                <LampCeiling size={20} />
                灯光照度模拟
              </button>
              <button className="secondary-action" onClick={() => navigate('/inspection-panoramas')}>
                <Layers3 size={20} />
                水电验收全景
              </button>
              <button className="secondary-action" onClick={() => navigate('/budget')}>
                <Calculator size={20} />
                方案预算样本
              </button>
            </div>
          </div>

        </div>
        <aside className="hero-proof" aria-label="郑州落地服务经验">
          <strong>郑州落地服务始于 2017年</strong>
          <span>小米米家 / 苹果 HomeKit</span>
          <div className="proof-tags">
            <b>绿米</b>
            <b>易来</b>
            <b>领普</b>
            <b>皓逸</b>
            <b>锐捷</b>
            <b>KEF</b>
            <b>蜗牛</b>
            <b>Sonos</b>
            <b>创米</b>
            <b>鹿客</b>
            <b>宝特</b>
            <b>向往</b>
          </div>
        </aside>
      </section>
    </main>
  );
}

function BudgetPlanPage({ navigate }) {
  const [activePlanId, setActivePlanId] = useState(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const pageDragRef = useRef(null);
  const activePlan = budgetPlans.find((plan) => plan.id === activePlanId) ?? null;

  const openPlan = (plan) => {
    setActivePlanId(plan.id);
    setActivePageIndex(0);
    window.setTimeout(() => document.getElementById('budget-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const goToBudgetPage = useCallback(
    (direction) => {
      if (!activePlan) return;
      setActivePageIndex((current) => Math.min(activePlan.pages.length - 1, Math.max(0, current + direction)));
    },
    [activePlan],
  );

  const startBudgetPageDrag = (event) => {
    pageDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishBudgetPageDrag = (event) => {
    const drag = pageDragRef.current;
    pageDragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const swipeThreshold = 48;

    if (Math.max(absX, absY) < swipeThreshold) return;

    const isHorizontal = absX >= absY;
    const direction = isHorizontal ? (deltaX < 0 ? 1 : -1) : deltaY < 0 ? 1 : -1;
    goToBudgetPage(direction);
  };

  return (
    <main className="page budget-page">
      <button className="text-back" onClick={() => navigate('/')}>
        <ArrowLeft size={18} />
        返回首页
      </button>

      <section className="budget-hero" aria-labelledby="budget-title">
        <div>
          <p className="eyebrow">方案预算样本</p>
          <h1 id="budget-title">让客户看懂钱花在哪，也看懂家怎么用</h1>
          <p>
            我们把设备清单、空间位置、生活场景和预算放在同一套资料里。客户不用只看一张密密麻麻的报价表，
            可以知道每个房间有哪些功能、每个场景由哪些设备配合完成。
          </p>
          <div className="budget-proof-row" aria-label="方案预算优势">
            <span>按空间分区</span>
            <span>设备和功能对应</span>
            <span>方便增减预算</span>
          </div>
        </div>

        <div className="budget-sheet-preview" aria-label="方案预算表格示意">
          <div className="budget-sheet-head">
            <span>空间</span>
            <span>功能</span>
            <span>预算说明</span>
          </div>
          {[
            ['客厅', '灯光 / 窗帘 / 影音', '回家、观影、会客'],
            ['卧室', '灯光 / 空调 / 窗帘', '睡前、起夜、晨起'],
            ['安防', '门锁 / 传感器 / 摄像头', '离家提醒、异常提醒'],
            ['网络', '路由 / 面板 / 覆盖', '全屋稳定联网'],
          ].map((row) => (
            <div className="budget-sheet-row" key={row[0]}>
              {row.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="budget-value-grid" aria-label="预算方案说明">
        <article>
          <FileText size={24} />
          <h2>不是只报设备价格</h2>
          <p>把每个空间的功能、设备和使用场景一起说明，客户更容易判断哪些是刚需，哪些可以后期增加。</p>
        </article>
        <article>
          <Layers3 size={24} />
          <h2>复杂户型也能拆清楚</h2>
          <p>复式、别墅、多楼层项目可以按楼层和区域拆分，减少沟通遗漏，也方便施工前确认。</p>
        </article>
        <article>
          <Calculator size={24} />
          <h2>预算调整更有依据</h2>
          <p>客户想控制预算时，可以按场景和区域取舍，而不是盲目删设备，最终使用体验更稳定。</p>
        </article>
      </section>

      <section className="budget-plan-section" aria-labelledby="budget-sample-title">
        <div className="budget-section-heading">
          <p className="eyebrow">典型方案模板</p>
          <h2 id="budget-sample-title">可打开查看的方案预算样本</h2>
          <p>下面这些是做过的典型方案类型，用来展示资料的专业程度和客户理解成本，而不是固定报价。</p>
        </div>

        <div className="budget-plan-grid">
          {budgetPlans.map((plan) => (
            <article className="budget-plan-card" key={plan.id}>
              {plan.thumbnail ? (
                <img className="budget-plan-thumb" src={plan.thumbnail} alt={`${plan.name}封面预览`} />
              ) : (
                <div className="budget-plan-icon">
                  <FileText size={30} />
                </div>
              )}
              <p className="eyebrow">{plan.homeType}</p>
              <h3>{plan.name}</h3>
              <p>{plan.focus}</p>
              <div className="budget-plan-meta">
                <span>{plan.pageLabel}</span>
                {plan.highlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <button className="primary-action full" type="button" onClick={() => openPlan(plan)}>
                <FileText size={18} />
                在线观看方案
              </button>
            </article>
          ))}
        </div>
      </section>

      {activePlan ? (
        <section className="budget-viewer" id="budget-viewer" aria-labelledby="budget-viewer-title">
          <div className="budget-viewer-head">
            <div>
              <p className="eyebrow">在线预览</p>
              <h2 id="budget-viewer-title">{activePlan.name}</h2>
              <p>
                第 {activePageIndex + 1} 页 / 共 {activePlan.pages.length} 页
              </p>
            </div>
            <div className="budget-viewer-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={() => goToBudgetPage(-1)}
                disabled={activePageIndex === 0}
              >
                <ArrowLeft size={18} />
                上一页
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={() => goToBudgetPage(1)}
                disabled={activePageIndex >= activePlan.pages.length - 1}
              >
                下一页
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="budget-viewer-layout">
            <div
              className="budget-page-image"
              role="group"
              aria-label="拖动切换预算页面"
              onPointerDown={startBudgetPageDrag}
              onPointerUp={finishBudgetPageDrag}
              onPointerCancel={() => {
                pageDragRef.current = null;
              }}
            >
              <img src={activePlan.pages[activePageIndex]} alt={`${activePlan.name}第 ${activePageIndex + 1} 页`} />
            </div>
            <aside className="budget-page-strip" aria-label={`${activePlan.name}页面列表`}>
              {activePlan.pages.map((page, index) => (
                <button
                  key={page}
                  className={index === activePageIndex ? 'active' : ''}
                  type="button"
                  onClick={() => setActivePageIndex(index)}
                  aria-label={`查看第 ${index + 1} 页`}
                >
                  <img src={page} alt="" />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </aside>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function LightingSimulationPage({ navigate }) {
  return (
    <main className="page lighting-page">
      <button className="text-back" onClick={() => navigate('/')}>
        <ArrowLeft size={18} />
        返回首页
      </button>
      <LightingSimulationSection />
    </main>
  );
}

function LightingSimulationSection() {
  return (
    <section className="lighting-section" aria-labelledby="lighting-simulation-title">
      <div className="lighting-heading">
        <p className="eyebrow">专业灯光方案</p>
        <h2 id="lighting-simulation-title">灯光场景模拟及照度计算</h2>
        <p>
          在施工前先把灯光效果、亮度分布和关键点位展示出来，客户能更直观看到每个空间的明暗关系，也方便设计和施工人员统一方案。
        </p>
      </div>

      <div className="lighting-grid">
        {lightingSimulations.map((plan) => (
          <article className="lighting-card" key={plan.id}>
            <div className="lighting-card-copy">
              <p className="eyebrow">{plan.type}</p>
              <h3>{plan.name}</h3>
              <p>{plan.summary}</p>
              <div className="lighting-metrics" aria-label={`${plan.name}资料说明`}>
                {plan.metrics.map((metric) => (
                  <span key={metric}>{metric}</span>
                ))}
              </div>
              <div className="lighting-actions">
                <div className="lighting-view-hint">
                  <LampCeiling size={18} />
                  点击下方场景卡片查看方案
                </div>
                <a className="secondary-action" href={plan.reportUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} />
                  {plan.reportLabel}
                </a>
              </div>
            </div>
            <div className="lighting-gallery" aria-label={`${plan.name}场景入口`}>
              {plan.images.map((image, index) => (
                <a key={image.src} href={image.kujialeUrl} target="_blank" rel="noreferrer" aria-label={`打开${plan.name}${image.label}`}>
                  <span className="lighting-scene-index">{String(index + 1).padStart(2, '0')}</span>
                  <LampCeiling size={26} />
                  <strong>{image.label}</strong>
                  <small>
                    在线查看场景
                    <ExternalLink size={14} />
                  </small>
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function InspectionPanoramaPage({ navigate }) {
  const [activeProjectId, setActiveProjectId] = useState(inspectionVrProjects[0].id);
  const activeProject = inspectionVrProjects.find((project) => project.id === activeProjectId) ?? inspectionVrProjects[0];

  return (
    <main className="page inspection-page">
      <button className="text-back" onClick={() => navigate('/')}>
        <ArrowLeft size={18} />
        返回首页
      </button>

      <section className="inspection-hero" aria-labelledby="inspection-title">
        <div className="inspection-copy">
          <p className="eyebrow">水电验收全景图</p>
          <h1 id="inspection-title">全景工地验收 VR</h1>
          <p>接入智装侠现有全景工地验收系统，把施工现场、水电点位和验收记录放在当前网页里直接查看。</p>
          <div className="inspection-meta" aria-label="项目资料">
            <span>
              <Home size={18} />
              {activeProject.city}
            </span>
            <span>
              <FileText size={18} />
              {activeProject.date}
            </span>
            <span>
              <Layers3 size={18} />
              {inspectionVrProjects.length} 个 VR 项目
            </span>
          </div>
        </div>
        <div className="inspection-note">
          <strong>查看方式</strong>
          <span>在下方窗口中拖动画面查看现场，也可以新窗口打开使用完整全景功能。</span>
        </div>
      </section>

      <section className="inspection-viewer-section" aria-labelledby="active-vr-title">
        <div className="inspection-viewer-layout">
          <div className="inspection-viewer-main">
            <div className="inspection-viewer-head">
              <div>
                <p className="eyebrow">当前项目</p>
                <h2 id="active-vr-title">{activeProject.name}</h2>
                <p>{activeProject.summary}</p>
              </div>
              <a className="secondary-action" href={activeProject.url} target="_blank" rel="noreferrer">
                <ExternalLink size={18} />
                新窗口打开
              </a>
            </div>

            <iframe
              className="inspection-vr-frame"
              title={`${activeProject.name}VR全景`}
              src={activeProject.url}
              allow="fullscreen; gyroscope; accelerometer"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <aside className="inspection-project-panel" aria-label="水电验收 VR 项目列表">
            <div>
              <p className="eyebrow">项目列表</p>
              <h2>选择全景项目</h2>
            </div>
            <div className="inspection-project-list">
              {inspectionVrProjects.map((project) => (
                <button
                  key={project.id}
                  className={project.id === activeProject.id ? 'active' : ''}
                  type="button"
                  onClick={() => setActiveProjectId(project.id)}
                >
                  <span>{project.name}</span>
                  <small>{project.type}</small>
                  <strong>{project.city}</strong>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function CaseMapPage({ fixedCaseTools, navigate }) {
  const { photos, addPhoto, updateCase } = useUploadedPhotos();
  const allCases = useMemo(() => buildCasesWithPhotos(fixedCaseTools.fixedCases, photos), [fixedCaseTools.fixedCases, photos]);
  const [activeId, setActiveId] = useState(allCases[0].id);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [caseSearch, setCaseSearch] = useState('');
  const [serviceArea, setServiceArea] = useState(ALL_SERVICE_AREAS);
  const [mapPhotoCaseId, setMapPhotoCaseId] = useState(null);
  const [mapPhotoId, setMapPhotoId] = useState(null);
  const activeCase = allCases.find((item) => item.id === activeId) ?? allCases[0];
  const normalizedCaseSearch = caseSearch.trim().toLowerCase();
  const serviceAreas = useMemo(() => {
    const counts = allCases.reduce((groups, item) => {
      const area = getServiceArea(item);
      groups[area] = (groups[area] ?? 0) + 1;
      return groups;
    }, {});
    return [
      { name: ALL_SERVICE_AREAS, count: allCases.length },
      ...Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
        .map(([name, count]) => ({ name, count })),
    ];
  }, [allCases]);
  const filteredCases = useMemo(
    () => {
      const areaCases = serviceArea === ALL_SERVICE_AREAS ? allCases : allCases.filter((item) => getServiceArea(item) === serviceArea);
      return normalizedCaseSearch
        ? areaCases.filter((item) => `${item.name} ${item.city}`.toLowerCase().includes(normalizedCaseSearch))
        : areaCases;
    },
    [allCases, normalizedCaseSearch, serviceArea],
  );
  const visibleCases = useMemo(() => {
    const limit = normalizedCaseSearch ? SEARCH_SERVICE_COUNT : COMPACT_SERVICE_COUNT;
    const compactCases = filteredCases.slice(0, limit);
    const activeCaseIsVisible = filteredCases.some((item) => item.id === activeCase.id);
    if (!activeCaseIsVisible || compactCases.some((item) => item.id === activeCase.id)) return compactCases;
    return [activeCase, ...compactCases].slice(0, limit);
  }, [activeCase, filteredCases, normalizedCaseSearch]);
  const mapPhotoCase = allCases.find((item) => item.id === mapPhotoCaseId && item.photos?.length) ?? null;
  const mapSelectedPhoto = mapPhotoCase?.photos.find((photo) => photo.id === mapPhotoId) ?? mapPhotoCase?.photos[0] ?? null;

  const handleMapSelectCase = useCallback((caseId) => {
    const nextCase = allCases.find((item) => item.id === caseId);
    setActiveId(caseId);
    if (nextCase?.photos?.length) {
      setMapPhotoCaseId(caseId);
      setMapPhotoId(nextCase.photos[0].id);
      return;
    }
    setMapPhotoCaseId(null);
    setMapPhotoId(null);
  }, [allCases]);

  const handleSavePhoto = (draft) => {
    const name = draft.name.trim();
    const existingCase = allCases.find((item) => item.name === name);
    addPhoto(draft);
    setActiveId(existingCase?.id ?? `uploaded-${name}`);
  };

  const openCaseEditor = () => {
    setEditDraft({
      name: activeCase.name,
      city: activeCase.city,
      intro: activeCase.intro,
      scenes: activeCase.scenes.join('，'),
      highlights: activeCase.highlights.join('\n'),
    });
  };

  const saveCaseEditor = () => {
    const nextName = editDraft.name.trim();
    if (!nextName) return;

    const nextCase = allCases.find((item) => item.name === nextName && item.id !== activeCase.id);
    updateCase(activeCase.name, editDraft);
    setActiveId(nextCase?.id ?? `uploaded-${nextName}`);
    setEditDraft(null);
  };

  useEffect(() => {
    setEditDraft(null);
  }, [activeId]);

  useEffect(() => {
    if (!allCases.some((item) => item.id === activeId)) {
      setActiveId(allCases[0].id);
    }
  }, [activeId, allCases]);

  return (
    <main className="page">
      <div className="page-heading">
        <h1>服务地图</h1>
        <p>展示智能家居的服务过程：从工地的公勘，方案设计，到项目每个环节的对接验收，以及安装调试的实景照片。</p>
      </div>

      <section className="case-map-layout">
        <div className="case-map-stage">
          <Suspense fallback={<div className="amap-state"><h2>服务地图加载中...</h2></div>}>
            <CaseAmap cases={allCases} activeId={activeId} onSelectCase={handleMapSelectCase} />
          </Suspense>
          {mapPhotoCase && mapSelectedPhoto ? (
            <aside className="map-photo-panel" aria-label={`${mapPhotoCase.name}现场照片`}>
              <div className="map-photo-panel-head">
                <div>
                  <strong>{mapPhotoCase.photos.length} 张现场照片</strong>
                  <span>{mapPhotoCase.name}</span>
                </div>
                <button type="button" onClick={() => setMapPhotoCaseId(null)} aria-label="关闭地图照片浮层">
                  <X size={18} />
                </button>
              </div>
              <button className="map-photo-main" type="button" onClick={() => setPreviewPhoto(mapSelectedPhoto)}>
                <img src={mapSelectedPhoto.imageUrl} alt={`${mapPhotoCase.name}现场大图`} />
              </button>
              <div className="map-photo-strip" aria-label="切换现场照片">
                {mapPhotoCase.photos.slice(0, 18).map((photo) => (
                  <button
                    key={photo.id}
                    className={photo.id === mapSelectedPhoto.id ? 'active' : ''}
                    type="button"
                    onClick={() => setMapPhotoId(photo.id)}
                  >
                    <img src={photo.thumbUrl ?? photo.imageUrl} alt={`${mapPhotoCase.name}现场缩略图`} />
                  </button>
                ))}
                {mapPhotoCase.photos.length > 18 ? (
                  <button className="map-photo-more" type="button" onClick={() => setPreviewPhoto(mapSelectedPhoto)}>
                    +{mapPhotoCase.photos.length - 18}
                  </button>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>

        <aside className="case-side">
          <div className="case-browser">
            <label className="case-search">
              <span>查找已服务小区</span>
              <input
                type="search"
                value={caseSearch}
                placeholder="输入小区名或区域"
                onChange={(event) => setCaseSearch(event.target.value)}
              />
            </label>

            <div className="service-area-filter" aria-label="按行政区域筛选">
              {serviceAreas.map((area) => (
                <button
                  key={area.name}
                  className={area.name === serviceArea ? 'active' : ''}
                  type="button"
                  onClick={() => setServiceArea(area.name)}
                >
                  <span>{area.name}</span>
                  <small>{area.count}</small>
                </button>
              ))}
            </div>

            <div className="case-list-summary">
              <strong>{filteredCases.length}</strong>
              <span>{serviceArea === ALL_SERVICE_AREAS ? '个已服务小区' : `${serviceArea}服务点`}</span>
            </div>

            <div className="case-list" aria-label="已服务小区快捷选择">
              {visibleCases.map((item) => (
                <button
                  key={item.id}
                  className={item.id === activeCase.id ? 'selected' : ''}
                  onClick={() => setActiveId(item.id)}
                >
                  <span>{item.name}</span>
                  <small>{item.city}</small>
                </button>
              ))}
              {!filteredCases.length ? <p className="case-list-empty">没有找到匹配的已服务小区。</p> : null}
            </div>
          </div>

          <article className="case-card">
            <img src={activeCase.cover} alt={`${activeCase.name}案例封面`} />
            <div className="case-card-body">
              <p className="case-city">{activeCase.city}</p>
              <h2>{activeCase.name}</h2>
              <p>{activeCase.intro}</p>
              {IS_LOCAL_EDITING_ENABLED && activeCase.isUploaded && !editDraft ? (
                <button className="case-edit-trigger" type="button" onClick={openCaseEditor}>
                  <PencilLine size={16} />
                  修改名称和文字
                </button>
              ) : null}
              {IS_LOCAL_EDITING_ENABLED && activeCase.isUploaded && editDraft ? (
                <div className="case-edit-form">
                  <label>
                    小区名称
                    <input
                      value={editDraft.name}
                      onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label>
                    城市/区域
                    <input
                      value={editDraft.city}
                      onChange={(event) => setEditDraft((current) => ({ ...current, city: event.target.value }))}
                    />
                  </label>
                  <label>
                    简介
                    <textarea
                      value={editDraft.intro}
                      onChange={(event) => setEditDraft((current) => ({ ...current, intro: event.target.value }))}
                    />
                  </label>
                  <label>
                    标签
                    <input
                      value={editDraft.scenes}
                      placeholder="多个标签用逗号隔开"
                      onChange={(event) => setEditDraft((current) => ({ ...current, scenes: event.target.value }))}
                    />
                  </label>
                  <label>
                    亮点
                    <textarea
                      value={editDraft.highlights}
                      placeholder="每行一个亮点"
                      onChange={(event) => setEditDraft((current) => ({ ...current, highlights: event.target.value }))}
                    />
                  </label>
                  <div className="case-edit-actions">
                    <button className="primary-action" type="button" onClick={saveCaseEditor} disabled={!editDraft.name.trim()}>
                      保存修改
                    </button>
                    <button className="secondary-action" type="button" onClick={() => setEditDraft(null)}>
                      取消
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="tag-row">
                {activeCase.scenes.slice(0, 4).map((scene) => (
                  <span key={scene}>{scene}</span>
                ))}
              </div>
              <ul className="compact-list">
                {activeCase.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {activeCase.photos?.length ? (
                <div className="photo-gallery">
                  {activeCase.photos.map((photo) => (
                    <button key={photo.id} className="photo-thumb" type="button" onClick={() => setPreviewPhoto(photo)}>
                      <img src={photo.imageUrl} alt={`${activeCase.name}上传照片`} />
                    </button>
                  ))}
                </div>
              ) : null}
              {!activeCase.isUploaded ? (
                <button className="primary-action full" onClick={() => navigate(`/cases/${activeCase.id}`)}>
                  查看详情
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  className="primary-action full"
                  type="button"
                  onClick={() => {
                    setMapPhotoCaseId(activeCase.id);
                    setMapPhotoId(activeCase.photos[0]?.id ?? null);
                  }}
                >
                  查看 {activeCase.photos.length} 张现场图片
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </article>
        </aside>
      </section>

      {IS_LOCAL_EDITING_ENABLED ? (
        <Suspense fallback={<section className="photo-upload-panel"><p>项目照片维护工具加载中...</p></section>}>
          <PhotoUploadPanel cases={allCases} uploadCount={photos.length} onSave={handleSavePhoto} />
        </Suspense>
      ) : null}

      <FixedCaseMaintenance caseItem={activeCase.isUploaded ? null : activeCase} fixedCaseTools={fixedCaseTools} />

      {previewPhoto ? (
        <div className="photo-preview-backdrop" onClick={() => setPreviewPhoto(null)}>
          <article className="photo-preview" onClick={(event) => event.stopPropagation()}>
            <button className="photo-preview-close" type="button" onClick={() => setPreviewPhoto(null)} aria-label="关闭图片预览">
              <X size={20} />
            </button>
            <img src={previewPhoto.imageUrl} alt={`${previewPhoto.name}项目照片大图`} />
            <div>
              <h2>{previewPhoto.name}</h2>
              <p>{previewPhoto.city}</p>
            </div>
          </article>
        </div>
      ) : null}
    </main>
  );
}

function CaseDetailPage({ caseItem, fixedCaseTools, navigate }) {
  if (!caseItem) {
    return (
      <main className="page centered-page">
        <h1>没有找到这个案例</h1>
        <button className="secondary-action" onClick={() => navigate('/cases')}>
          返回服务地图
        </button>
      </main>
    );
  }

  return (
    <main className="page">
      <button className="text-back" onClick={() => navigate('/cases')}>
        <ArrowLeft size={18} />
        返回服务地图
      </button>

      <section className="detail-hero">
        <div>
          <p className="eyebrow">{caseItem.city}</p>
          <h1>{caseItem.name}</h1>
          <p>{caseItem.intro}</p>
          <div className="detail-actions">
            <button className="secondary-action" onClick={() => navigate('/cases')}>
              查看更多服务记录
            </button>
          </div>
        </div>
        <PanoramaViewer src={caseItem.images[1] ?? caseItem.cover} alt={`${caseItem.name}全景看房`} />
      </section>

      <section className="stats-grid">
        <div>
          <span>户型</span>
          <strong>{caseItem.homeType}</strong>
        </div>
        <div>
          <span>面积</span>
          <strong>{caseItem.area}</strong>
        </div>
        <div>
          <span>房间</span>
          <strong>{caseItem.rooms}</strong>
        </div>
      </section>

      <section className="image-grid">
        {caseItem.images.filter((_, index) => index !== 1).map((image, index) => (
          <img key={image} src={image} alt={`${caseItem.name}案例图片 ${index + 1}`} />
        ))}
      </section>

      <section className="detail-columns">
        <article>
          <h2>智能设备清单</h2>
          <div className="device-grid">
            {caseItem.devices.map((device) => (
              <span key={device}>{device}</span>
            ))}
          </div>
        </article>
        <article>
          <h2>场景说明</h2>
          <ul className="detail-list">
            {caseItem.scenes.map((scene, index) => (
              <li key={scene}>
                {scene}：{caseItem.highlights[index] ?? '把常用设备组合成一个容易理解的使用状态，减少来回操作。'}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h2>客户收益</h2>
          <ul className="detail-list">
            {caseItem.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </article>
      </section>

      <FixedCaseMaintenance caseItem={caseItem} fixedCaseTools={fixedCaseTools} />
    </main>
  );
}

function FixedCaseMaintenance({ caseItem, fixedCaseTools }) {
  const [isManaging, setIsManaging] = useState(false);
  const defaultCase = cases.find((item) => item.id === caseItem?.id);

  if (!IS_LOCAL_EDITING_ENABLED || !caseItem || !defaultCase) return null;

  return (
    <section className="case-maintenance">
      <footer className="showroom-maintenance">
        <label className="manage-toggle">
          <span>编辑案例内容</span>
          <input type="checkbox" checked={isManaging} onChange={(event) => setIsManaging(event.target.checked)} />
        </label>
      </footer>

      {isManaging ? (
        <FixedCaseEditor
          caseItem={caseItem}
          config={fixedCaseTools.config}
          defaultCase={defaultCase}
          onReset={() => fixedCaseTools.resetCaseOverride(caseItem.id)}
          onSave={(override) => fixedCaseTools.saveCaseOverride(caseItem.id, override)}
        />
      ) : null}
    </section>
  );
}

function FixedCaseEditor({ caseItem, config, defaultCase, onReset, onSave }) {
  const [draft, setDraft] = useState(() => makeFixedCaseDraft(caseItem));
  const sceneLabels = {
    bright: '明亮模式图',
    relax: '休闲模式图',
    warm: '温馨模式图',
    away: '离家模式图',
  };

  useEffect(() => {
    setDraft(makeFixedCaseDraft(caseItem));
  }, [caseItem]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateSceneImage = (sceneId, value) => {
    setDraft((current) => ({
      ...current,
      sceneImages: { ...current.sceneImages, [sceneId]: value },
    }));
  };

  const useCoverFile = async (file) => {
    if (!file) return;
    updateDraft('cover', await readLocalImage(file));
  };

  const addGalleryFiles = async (files) => {
    if (!files?.length) return;
    const imageUrls = await Promise.all([...files].map((file) => readLocalImage(file)));
    updateDraft('images', [...splitCaseLines(draft.images), ...imageUrls].join('\n'));
  };

  const useSceneFile = async (sceneId, file) => {
    if (!file) return;
    updateSceneImage(sceneId, await readLocalImage(file));
  };

  return (
    <article className="fixed-case-editor">
      <header>
        <div>
          <p className="eyebrow">固定案例维护</p>
          <h2>编辑 {caseItem.name}</h2>
        </div>
        <div className="fixed-case-editor-actions">
          <button type="button" onClick={() => onSave(makeFixedCaseOverride(draft))}>保存案例内容</button>
          <button type="button" onClick={() => setDraft(makeFixedCaseDraft(caseItem))}>取消本次调整</button>
          <button
            type="button"
            onClick={() => {
              onReset();
              setDraft(makeFixedCaseDraft(defaultCase));
            }}
          >
            恢复默认内容
          </button>
          <button type="button" onClick={() => exportJsonFile('fixed-case-content-config.json', config)}>
            <Download size={17} />
            导出配置
          </button>
        </div>
      </header>

      <div className="fixed-case-editor-grid">
        <section>
          <h3>基本信息</h3>
          <label>
            小区名称
            <input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
          </label>
          <label>
            城市/区域
            <input value={draft.city} onChange={(event) => updateDraft('city', event.target.value)} />
          </label>
          <label>
            户型
            <input value={draft.homeType} onChange={(event) => updateDraft('homeType', event.target.value)} />
          </label>
          <label>
            面积
            <input value={draft.area} onChange={(event) => updateDraft('area', event.target.value)} />
          </label>
          <label>
            房间说明
            <input value={draft.rooms} onChange={(event) => updateDraft('rooms', event.target.value)} />
          </label>
        </section>

        <section>
          <h3>文案内容</h3>
          <label>
            案例简介
            <textarea value={draft.intro} onChange={(event) => updateDraft('intro', event.target.value)} />
          </label>
          <label>
            场景标签，每行一个
            <textarea value={draft.scenes} onChange={(event) => updateDraft('scenes', event.target.value)} />
          </label>
          <label>
            场景亮点，每行一个
            <textarea value={draft.highlights} onChange={(event) => updateDraft('highlights', event.target.value)} />
          </label>
          <label>
            客户收益，每行一个
            <textarea value={draft.benefits} onChange={(event) => updateDraft('benefits', event.target.value)} />
          </label>
          <label>
            智能设备，每行一个
            <textarea value={draft.devices} onChange={(event) => updateDraft('devices', event.target.value)} />
          </label>
        </section>

        <section>
          <h3>图片内容</h3>
          <label>
            封面图地址
            <input value={draft.cover} onChange={(event) => updateDraft('cover', event.target.value)} />
          </label>
          <label className="fixed-case-file">
            选择本地封面图
            <input type="file" accept="image/*" onChange={(event) => useCoverFile(event.target.files?.[0])} />
          </label>
          <img className="fixed-case-preview" src={draft.cover} alt="封面图预览" />
          <label>
            详情相册图，每行一个地址
            <textarea value={draft.images} onChange={(event) => updateDraft('images', event.target.value)} />
          </label>
          <label className="fixed-case-file">
            添加本地相册图
            <input type="file" accept="image/*" multiple onChange={(event) => addGalleryFiles(event.target.files)} />
          </label>
          {Object.entries(sceneLabels).map(([sceneId, label]) => (
            <div key={sceneId} className="fixed-case-scene-image">
              <label>
                {label}地址
                <input
                  value={draft.sceneImages[sceneId]}
                  onChange={(event) => updateSceneImage(sceneId, event.target.value)}
                />
              </label>
              <label className="fixed-case-file">
                选择本地{label}
                <input type="file" accept="image/*" onChange={(event) => useSceneFile(sceneId, event.target.files?.[0])} />
              </label>
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}

function PanoramaViewer({ src, alt }) {
  const mountRef = useRef(null);
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, lon: 0, lat: 0 });
  const viewRef = useRef({ active: false, lastX: 0, lastY: 0, lon: 0, lat: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(74, 1, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1);

    const texture = new THREE.TextureLoader().load(src);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let animationFrame = 0;
    const render = () => {
      const { lon, lat } = viewRef.current;
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta),
      );
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      mount.removeChild(renderer.domElement);
      texture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [src]);

  const handlePointerDown = (event) => {
    dragRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
      lon: viewRef.current.lon,
      lat: viewRef.current.lat,
    };
    mountRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active) return;

    event.preventDefault();
    const nextLon = dragRef.current.lon - (event.clientX - dragRef.current.lastX) * 0.16;
    const nextLat = dragRef.current.lat + (event.clientY - dragRef.current.lastY) * 0.16;
    viewRef.current.lon = nextLon;
    viewRef.current.lat = THREE.MathUtils.clamp(nextLat, -72, 72);
  };

  const handlePointerEnd = (event) => {
    dragRef.current.active = false;
    if (mountRef.current?.hasPointerCapture(event.pointerId)) {
      mountRef.current.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <figure className="panorama-hero">
      <div
        ref={mountRef}
        className="panorama-canvas"
        role="img"
        aria-label={alt}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      />
      <figcaption>
        <span>全景浏览</span>
        <small>拖动视角看房</small>
      </figcaption>
    </figure>
  );
}

function ShowroomPage({ caseId, navigate }) {
  const caseItem = showroomCases.find((item) => item.id === caseId);
  const { config, saveImagePoints, resetImagePoints } = useHotspotConfig();
  const [activeSceneId, setActiveSceneId] = useState('bright');
  const [activeImageId, setActiveImageId] = useState('scene:bright');
  const [activeProduct, setActiveProduct] = useState(null);
  const [isManaging, setIsManaging] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);
  const [editingPointId, setEditingPointId] = useState(null);
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const activePhoto = caseItem?.photos?.find((photo) => activeImageId === `photo:${photo.id}`);
  const activeImageKey = makeImageKey(caseItem?.id ?? 'missing-case', activeImageId);
  const defaultPoints = useMemo(() => makeDefaultScenePoints(caseItem, activeImageId), [activeImageId, caseItem]);
  const savedPoints = config[activeImageKey]?.map((point) => cloneProductPoint(point)) ?? defaultPoints;
  const visiblePoints = isManaging ? draftPoints : savedPoints;
  const editingPoint = draftPoints.find((point) => point.id === editingPointId) ?? null;
  const activeImage = activePhoto?.imageUrl ?? caseItem?.sceneImages?.[activeScene.id] ?? caseItem?.cover;
  const activeImageCaption = activePhoto
    ? {
        title: '现场图片',
        detail: `${activePhoto.fileName ?? caseItem.name}，可按真实位置补充产品点位。`,
      }
    : {
        title: activeScene.name,
        detail: activeScene.detail,
      };

  useEffect(() => {
    setActiveSceneId('bright');
    setActiveImageId('scene:bright');
    setActiveProduct(null);
    setIsManaging(false);
  }, [caseId]);

  useEffect(() => {
    setDraftPoints(savedPoints.map((point) => cloneProductPoint(point)));
    setEditingPointId(null);
  }, [activeImageKey, isManaging]);

  if (!caseItem) {
    return (
      <main className="page centered-page">
        <h1>没有找到这个案例</h1>
        <button className="secondary-action" onClick={() => navigate('/')}>
          返回首页
        </button>
      </main>
    );
  }

  const selectSceneImage = (sceneId) => {
    setActiveSceneId(sceneId);
    setActiveImageId(`scene:${sceneId}`);
  };

  const selectPhotoImage = (photoId) => {
    setActiveImageId(`photo:${photoId}`);
  };

  const addPoint = (hotspot) => {
    const nextPoint = makeProductDraft(null, hotspot);
    setDraftPoints((current) => [...current, nextPoint]);
    setEditingPointId(nextPoint.id);
  };

  const updatePoint = (pointId, update) => {
    setDraftPoints((current) =>
      current.map((point) => (point.id === pointId ? { ...point, ...update } : point)),
    );
  };

  const updatePointHotspot = (pointId, hotspot) => {
    updatePoint(pointId, { hotspot });
  };

  const useExistingProduct = (pointId, productId) => {
    const existingProduct = productPoints.find((product) => product.id === productId);
    if (!existingProduct) return;

    const currentPoint = draftPoints.find((point) => point.id === pointId);
    updatePoint(pointId, {
      ...cloneProductPoint(existingProduct, currentPoint?.hotspot ?? existingProduct.hotspot),
      id: pointId,
    });
  };

  const removePoint = (pointId) => {
    setDraftPoints((current) => current.filter((point) => point.id !== pointId));
    setEditingPointId((current) => (current === pointId ? null : current));
  };

  const saveCurrentPoints = () => {
    saveImagePoints(activeImageKey, draftPoints);
    setEditingPointId(null);
  };

  const cancelCurrentEdits = () => {
    setDraftPoints(savedPoints.map((point) => cloneProductPoint(point)));
    setEditingPointId(null);
  };

  const restoreDefaultPoints = () => {
    resetImagePoints(activeImageKey);
    setDraftPoints(defaultPoints.map((point) => cloneProductPoint(point)));
    setEditingPointId(null);
  };

  const exportHotspotConfig = () => {
    const exportFile = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const exportUrl = URL.createObjectURL(exportFile);
    const link = document.createElement('a');
    link.href = exportUrl;
    link.download = 'showroom-hotspot-config.json';
    link.click();
    URL.revokeObjectURL(exportUrl);
  };

  return (
    <main className="showroom-page">
      <section className="showroom-header">
        <div>
          <p className="eyebrow">{caseItem.city}</p>
          <h1>{caseItem.name}生活场景案例</h1>
          <p>切换不同模式，看同一个客厅怎样从清晨明亮、晚饭后放松，过渡到睡前温暖和离家看护。点击产品点位，可以了解每个设备在家里的作用。</p>
        </div>
      </section>

      <section className="showroom-case-switcher" aria-label="案例列表">
        {showroomCases.map((item) => (
          <button
            key={item.id}
            className={item.id === caseItem.id ? 'active' : ''}
            type="button"
            onClick={() => navigate(`/showroom/${item.id}`)}
          >
            <span>{item.name}</span>
            <small>{item.city}</small>
            <strong>
              {item.homeType} / {item.area}
            </strong>
          </button>
        ))}
      </section>

      <section className="showroom-layout">
        <SceneImageViewer
          caseItem={caseItem}
          caption={activeImageCaption}
          image={activeImage}
          points={visiblePoints}
          isManaging={isManaging}
          onAddPoint={addPoint}
          onEditPoint={setEditingPointId}
          onMovePoint={updatePointHotspot}
          onSelectProduct={setActiveProduct}
        />

        <aside className="control-panel">
          <h2>场景切换</h2>
          <div className="scene-buttons">
            {scenes.map((scene) => {
              const Icon = sceneIcons[scene.id] ?? Sun;
              return (
                <button
                  key={scene.id}
                  className={scene.id === activeScene.id ? 'active' : ''}
                  onClick={() => selectSceneImage(scene.id)}
                >
                  <Icon size={20} />
                  <span>{scene.name}</span>
                </button>
              );
            })}
          </div>

          <div className="status-grid">
            <div>
              <LampCeiling />
              <span>灯光</span>
              <strong>{Math.round(activeScene.light * 100)}%</strong>
            </div>
            <div>
              <ThermometerSun />
              <span>空调</span>
              <strong>{activeScene.ac}</strong>
            </div>
            <div>
              <ShieldCheck />
              <span>安防</span>
              <strong>{activeScene.security}</strong>
            </div>
            <div>
              <Tv />
              <span>窗帘</span>
              <strong>{activeScene.curtain > 0.8 ? '关闭' : '打开'}</strong>
            </div>
          </div>

          {caseItem.photos?.length ? (
            <>
              <h2>现场图片</h2>
              <div className="showroom-photo-switcher">
                {caseItem.photos.map((photo) => (
                  <button
                    key={photo.id}
                    className={activeImageId === `photo:${photo.id}` ? 'active' : ''}
                    type="button"
                    onClick={() => selectPhotoImage(photo.id)}
                  >
                    <img src={photo.imageUrl} alt="" />
                    <span>{photo.fileName ?? photo.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <h2>产品点位</h2>
          <div className="product-list">
            {visiblePoints.map((product) => (
              <button key={product.id} onClick={() => setActiveProduct(product)}>
                <span>{product.name}</span>
                <small>{product.location}</small>
              </button>
            ))}
            {!visiblePoints.length ? <p>这张图片还没有产品点位。</p> : null}
          </div>

          {isManaging ? (
            <HotspotManager
              activePoint={editingPoint}
              defaultCount={defaultPoints.length}
              onAdd={() => addPoint({ x: 50, y: 50 })}
              onCancel={cancelCurrentEdits}
              onDelete={removePoint}
              onExport={exportHotspotConfig}
              onReset={restoreDefaultPoints}
              onSave={saveCurrentPoints}
              onUseExisting={useExistingProduct}
              onUpdate={updatePoint}
            />
          ) : null}
        </aside>
      </section>

      {IS_LOCAL_EDITING_ENABLED ? (
        <footer className="showroom-maintenance">
          <label className="manage-toggle">
            <span>管理模式</span>
            <input type="checkbox" checked={isManaging} onChange={(event) => setIsManaging(event.target.checked)} />
          </label>
        </footer>
      ) : null}

      {activeProduct ? (
        <ProductModal
          product={activeProduct}
          activeScene={activeScene}
          onClose={() => setActiveProduct(null)}
        />
      ) : null}
    </main>
  );
}

function SceneImageViewer({
  caseItem,
  caption,
  image,
  points,
  isManaging,
  onAddPoint,
  onEditPoint,
  onMovePoint,
  onSelectProduct,
}) {
  const getHotspotFromPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Number(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)).toFixed(2)),
      y: Number(Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100)).toFixed(2)),
    };
  };

  return (
    <figure className={`scene-image-viewer ${isManaging ? 'is-managing' : ''}`}>
      <img
        src={image}
        alt={`${caseItem.name}${caption.title}效果图`}
        onClick={(event) => {
          if (isManaging) onAddPoint(getHotspotFromPointer(event));
        }}
      />
      <figcaption>
        <span>{caption.title}</span>
        <small>{caption.detail}</small>
      </figcaption>
      {points.map((product) => (
        <ProductHotspot
          key={product.id}
          product={product}
          isManaging={isManaging}
          onEditPoint={onEditPoint}
          onMovePoint={onMovePoint}
          onSelectProduct={onSelectProduct}
        />
      ))}
    </figure>
  );
}

function ProductHotspot({ product, isManaging, onEditPoint, onMovePoint, onSelectProduct }) {
  const dragRef = useRef(null);

  const updateFromPointer = (event) => {
    const viewer = event.currentTarget.closest('.scene-image-viewer');
    if (!viewer) return;

    const bounds = viewer.getBoundingClientRect();
    onMovePoint(product.id, {
      x: Number(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)).toFixed(2)),
      y: Number(Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100)).toFixed(2)),
    });
  };

  return (
    <button
      className={`product-hotspot ${isManaging ? 'editable' : ''}`}
      style={{
        left: `${product.hotspot.x}%`,
        top: `${product.hotspot.y}%`,
      }}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (isManaging) {
          onEditPoint(product.id);
        } else {
          onSelectProduct(product);
        }
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (!isManaging) return;

        dragRef.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
        onEditPoint(product.id);
      }}
      onPointerMove={(event) => {
        if (!isManaging || !dragRef.current) return;
        event.preventDefault();
        updateFromPointer(event);
      }}
      onPointerUp={(event) => {
        if (!isManaging) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      aria-label={isManaging ? `编辑${product.name}点位` : `查看${product.name}`}
    >
      <span>{product.name}</span>
    </button>
  );
}

function HotspotManager({
  activePoint,
  defaultCount,
  onAdd,
  onCancel,
  onDelete,
  onExport,
  onReset,
  onSave,
  onUseExisting,
  onUpdate,
}) {
  const updateProductField = (field, value) => {
    onUpdate(activePoint.id, { [field]: value, productId: field === 'name' ? '' : activePoint.productId });
  };

  return (
    <section className="hotspot-manager">
      <div className="hotspot-manager-actions">
        <button type="button" onClick={onAdd}>
          <Plus size={17} />
          添加点位
        </button>
        <button type="button" onClick={onSave}>保存点位</button>
        <button type="button" onClick={onCancel}>取消本次调整</button>
        <button type="button" onClick={onReset}>
          {defaultCount ? '恢复默认点位' : '清空这张图'}
        </button>
        <button type="button" onClick={onExport}>
          <Download size={17} />
          导出配置
        </button>
      </div>

      <p className="hotspot-manager-tip">可直接拖动图上点位；点击图片空白处也能添加新点位。</p>

      {activePoint ? (
        <div className="hotspot-editor">
          <div className="hotspot-editor-head">
            <h3>编辑产品点位</h3>
            <button type="button" onClick={() => onDelete(activePoint.id)} aria-label="删除当前点位">
              <Trash2 size={17} />
            </button>
          </div>

          <label>
            选用已有产品
            <select value={activePoint.productId} onChange={(event) => onUseExisting(activePoint.id, event.target.value)}>
              <option value="">自定义产品</option>
              {productPoints.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label>
            产品名称
            <input value={activePoint.name} onChange={(event) => updateProductField('name', event.target.value)} />
          </label>
          <label>
            产品功能
            <textarea value={activePoint.role} onChange={(event) => updateProductField('role', event.target.value)} />
          </label>
          <label>
            适合位置
            <input value={activePoint.location} onChange={(event) => updateProductField('location', event.target.value)} />
          </label>
          <label>
            场景作用
            <textarea value={activePoint.sceneUse} onChange={(event) => updateProductField('sceneUse', event.target.value)} />
          </label>
          <label>
            展示图地址
            <input value={activePoint.image} onChange={(event) => updateProductField('image', event.target.value)} />
          </label>
        </div>
      ) : (
        <p className="hotspot-manager-empty">选择一个点位编辑产品资料，或先添加新点位。</p>
      )}
    </section>
  );
}

function ProductModal({ product, activeScene, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="product-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="icon-close" onClick={onClose} aria-label="关闭产品介绍">
          <X size={20} />
        </button>
        <img src={product.image} alt={product.name} />
        <div>
          <p className="eyebrow">产品介绍</p>
          <h2>{product.name}</h2>
          <dl>
            <div>
              <dt>产品功能</dt>
              <dd>{product.role}</dd>
            </div>
            <div>
              <dt>适合位置</dt>
              <dd>{product.location}</dd>
            </div>
            <div>
              <dt>当前场景作用</dt>
              <dd>
                {activeScene.name}中，{product.sceneUse}
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  );
}

export default function App() {
  const { path, navigate } = useRoute();
  const fixedCaseTools = useFixedCases();
  const caseMatch = path.match(/^\/cases\/([^/]+)$/);
  const showroomMatch = path.match(/^\/showroom(?:\/([^/]+))?$/);
  const caseId = caseMatch ? decodeURIComponent(caseMatch[1]) : null;
  const showroomCaseId = showroomMatch?.[1] ? decodeURIComponent(showroomMatch[1]) : showroomCases[0].id;
  const caseItem = caseId ? fixedCaseTools.fixedCases.find((item) => item.id === caseId) : null;

  return (
    <Shell navigate={navigate}>
      {path === '/' ? <HomePage navigate={navigate} /> : null}
      {path === '/cases' ? <CaseMapPage fixedCaseTools={fixedCaseTools} navigate={navigate} /> : null}
      {path === '/budget' ? <BudgetPlanPage navigate={navigate} /> : null}
      {path === '/lighting' ? <LightingSimulationPage navigate={navigate} /> : null}
      {path === '/inspection-panoramas' ? <InspectionPanoramaPage navigate={navigate} /> : null}
      {caseMatch ? <CaseDetailPage caseItem={caseItem} fixedCaseTools={fixedCaseTools} navigate={navigate} /> : null}
      {showroomMatch ? <ShowroomPage caseId={showroomCaseId} navigate={navigate} /> : null}
      {!['/', '/cases', '/budget', '/lighting', '/inspection-panoramas'].includes(path) && !caseMatch && !showroomMatch ? (
        <main className="page centered-page">
          <h1>页面不存在</h1>
          <button className="secondary-action" onClick={() => navigate('/')}>
            返回首页
          </button>
        </main>
      ) : null}
    </Shell>
  );
}

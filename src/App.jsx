import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BedDouble,
  ChevronRight,
  Home,
  LampCeiling,
  MapPin,
  Moon,
  Play,
  ShieldCheck,
  Sofa,
  Sun,
  ThermometerSun,
  Tv,
  X,
} from 'lucide-react';
import { cases, productPoints, scenes } from './data/demoData.js';
import CaseAmap from './components/CaseAmap.jsx';
import PhotoUploadPanel from './components/PhotoUploadPanel.jsx';
import ThreeShowroom from './components/ThreeShowroom.jsx';
import zhizhuangxiaLogo from './assets/zhizhuangxia-logo.png';

const UPLOADED_PHOTOS_KEY = 'zhizhuangxia_uploaded_photos';

const sceneIcons = {
  home: Home,
  movie: Tv,
  sleep: Moon,
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

  return { photos, addPhoto };
}

function buildCasesWithPhotos(baseCases, uploadedPhotos) {
  const groupedPhotos = uploadedPhotos.reduce((groups, photo) => {
    const key = photo.name;
    return { ...groups, [key]: [...(groups[key] ?? []), photo] };
  }, {});

  const baseNames = new Set(baseCases.map((item) => item.name));
  const enrichedCases = baseCases.map((item) => ({
    ...item,
    photos: groupedPhotos[item.name] ?? [],
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
        intro: '由上传的水印照片自动生成，可点击查看这个小区关联的现场图片。',
        scenes: ['照片归档'],
        highlights: ['上传照片自动归类', latestPhoto.hasGps ? '已读取照片位置' : '位置待人工确认'],
        benefits: ['减少手工整理', '地图查找更直观'],
        devices: [],
        photos,
        isUploaded: true,
      };
    });

  return [...enrichedCases, ...customCases];
}

function Shell({ children, navigate }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')} aria-label="返回首页">
          <span className="brand-mark image-logo">
            <img src={zhizhuangxiaLogo} alt="智装侠" />
          </span>
          <span>智能家居方案展示系统</span>
        </button>
        <nav className="nav-links" aria-label="主导航">
          <button onClick={() => navigate('/cases')}>案例地图</button>
          <button onClick={() => navigate('/showroom')}>3D/VR 方案</button>
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
        <div className="hero-content">
          <p className="eyebrow">Smart Home Demo</p>
          <h1>智装侠3D智能家居方案展示系统</h1>
          <p className="hero-copy">用 3D 和案例地图，直观看懂智能家居方案。</p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => navigate('/cases')}>
              <MapPin size={20} />
              查看案例地图
            </button>
            <button className="secondary-action" onClick={() => navigate('/showroom')}>
              <Play size={20} />
              进入 3D/VR 方案
            </button>
          </div>
        </div>
      </section>

      <section className="quick-grid">
        <article>
          <MapPin />
          <h2>真实案例分布</h2>
          <p>通过示意地图看到已完成的小区案例，快速建立信任感。</p>
        </article>
        <article>
          <Sofa />
          <h2>客厅样板间</h2>
          <p>用轻量 3D 空间展示灯光、窗帘、空调和安防状态。</p>
        </article>
        <article>
          <LampCeiling />
          <h2>一键场景</h2>
          <p>回家、观影、睡眠、离家四种模式，一眼看懂变化。</p>
        </article>
      </section>
    </main>
  );
}

function CaseMapPage({ navigate }) {
  const { photos, addPhoto } = useUploadedPhotos();
  const allCases = useMemo(() => buildCasesWithPhotos(cases, photos), [photos]);
  const [activeId, setActiveId] = useState(allCases[0].id);
  const activeCase = allCases.find((item) => item.id === activeId) ?? allCases[0];

  const handleSavePhoto = (draft) => {
    const name = draft.name.trim();
    const existingCase = allCases.find((item) => item.name === name);
    addPhoto(draft);
    setActiveId(existingCase?.id ?? `uploaded-${name}`);
  };

  useEffect(() => {
    if (!allCases.some((item) => item.id === activeId)) {
      setActiveId(allCases[0].id);
    }
  }, [activeId, allCases]);

  return (
    <main className="page">
      <div className="page-heading">
        <p className="eyebrow">案例地图</p>
        <h1>已落地小区案例</h1>
        <p>通过真实地图展示已完成的小区案例，方便客户直观看到“做过哪里、做了什么”。</p>
      </div>

      <section className="case-map-layout">
        <CaseAmap cases={allCases} activeId={activeId} onSelectCase={setActiveId} />

        <aside className="case-side">
          <div className="case-list">
            {allCases.map((item) => (
              <button
                key={item.id}
                className={item.id === activeCase.id ? 'selected' : ''}
                onClick={() => setActiveId(item.id)}
              >
                <span>{item.name}</span>
                <small>{item.city}</small>
              </button>
            ))}
          </div>

          <article className="case-card">
            <img src={activeCase.cover} alt={`${activeCase.name}案例封面`} />
            <div className="case-card-body">
              <p className="case-city">{activeCase.city}</p>
              <h2>{activeCase.name}</h2>
              <p>{activeCase.intro}</p>
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
                    <img key={photo.id} src={photo.imageUrl} alt={`${activeCase.name}上传照片`} />
                  ))}
                </div>
              ) : null}
              {!activeCase.isUploaded ? (
                <button className="primary-action full" onClick={() => navigate(`/cases/${activeCase.id}`)}>
                  查看详情
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button className="secondary-action full" type="button">
                  已归档 {activeCase.photos.length} 张照片
                </button>
              )}
            </div>
          </article>
        </aside>
      </section>

      <PhotoUploadPanel cases={allCases} uploadCount={photos.length} onSave={handleSavePhoto} />
    </main>
  );
}

function CaseDetailPage({ caseItem, navigate }) {
  if (!caseItem) {
    return (
      <main className="page centered-page">
        <h1>没有找到这个案例</h1>
        <button className="secondary-action" onClick={() => navigate('/cases')}>
          返回案例地图
        </button>
      </main>
    );
  }

  return (
    <main className="page">
      <button className="text-back" onClick={() => navigate('/cases')}>
        <ArrowLeft size={18} />
        返回案例地图
      </button>

      <section className="detail-hero">
        <div>
          <p className="eyebrow">{caseItem.city}</p>
          <h1>{caseItem.name}</h1>
          <p>{caseItem.intro}</p>
          <div className="detail-actions">
            <button className="primary-action" onClick={() => navigate('/showroom')}>
              进入 3D 方案
              <ChevronRight size={18} />
            </button>
            <button className="secondary-action" onClick={() => navigate('/cases')}>
              查看更多案例
            </button>
          </div>
        </div>
        <img src={caseItem.cover} alt={`${caseItem.name}智能家居案例`} />
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
        {caseItem.images.map((image, index) => (
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
            {caseItem.scenes.map((scene) => (
              <li key={scene}>{scene}：把灯光、窗帘、空调和安防组合成一个容易理解的使用状态。</li>
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
    </main>
  );
}

function ShowroomPage() {
  const [activeSceneId, setActiveSceneId] = useState('home');
  const [activeProduct, setActiveProduct] = useState(null);
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];

  return (
    <main className="showroom-page">
      <section className="showroom-header">
        <div>
          <p className="eyebrow">3D/VR 智能家居方案</p>
          <h1>客厅样板间</h1>
          <p>点击场景按钮查看灯光、窗帘、空调和安防状态变化。点击 3D 空间里的点位，可以查看产品作用。</p>
        </div>
        <div className="scene-status">
          <span>当前场景</span>
          <strong>{activeScene.name}</strong>
          <p>{activeScene.short}</p>
        </div>
      </section>

      <section className="showroom-layout">
        <div className="viewer-panel">
          <ThreeShowroom
            scene={activeScene}
            products={productPoints}
            onSelectProduct={setActiveProduct}
          />
        </div>

        <aside className="control-panel">
          <h2>场景切换</h2>
          <div className="scene-buttons">
            {scenes.map((scene) => {
              const Icon = sceneIcons[scene.id] ?? Sun;
              return (
                <button
                  key={scene.id}
                  className={scene.id === activeScene.id ? 'active' : ''}
                  onClick={() => setActiveSceneId(scene.id)}
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
              <BedDouble />
              <span>窗帘</span>
              <strong>{activeScene.curtain > 0.8 ? '关闭' : '打开'}</strong>
            </div>
          </div>

          <h2>产品点位</h2>
          <div className="product-list">
            {productPoints.map((product) => (
              <button key={product.id} onClick={() => setActiveProduct(product)}>
                <span>{product.name}</span>
                <small>{product.location}</small>
              </button>
            ))}
          </div>
        </aside>
      </section>

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
  const caseMatch = path.match(/^\/cases\/([^/]+)$/);
  const caseItem = caseMatch ? cases.find((item) => item.id === caseMatch[1]) : null;

  return (
    <Shell navigate={navigate}>
      {path === '/' ? <HomePage navigate={navigate} /> : null}
      {path === '/cases' ? <CaseMapPage navigate={navigate} /> : null}
      {caseMatch ? <CaseDetailPage caseItem={caseItem} navigate={navigate} /> : null}
      {path === '/showroom' ? <ShowroomPage /> : null}
      {!['/', '/cases', '/showroom'].includes(path) && !caseMatch ? (
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

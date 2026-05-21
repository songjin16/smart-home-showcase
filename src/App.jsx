import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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
import * as THREE from 'three';
import { cases, productPoints, scenes } from './data/demoData.js';
import CaseAmap from './components/CaseAmap.jsx';
import PhotoUploadPanel from './components/PhotoUploadPanel.jsx';
import zhizhuangxiaLogo from './assets/zhizhuangxia-logo.png';

const UPLOADED_PHOTOS_KEY = 'zhizhuangxia_uploaded_photos';

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
          <span>智能家居案例展示系统</span>
        </button>
        <nav className="nav-links" aria-label="主导航">
          <button onClick={() => navigate('/cases')}>案例地图</button>
          <button onClick={() => navigate(`/showroom/${cases[0].id}`)}>案例演示</button>
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
                查看案例地图
              </button>
              <button className="secondary-action" onClick={() => navigate(`/showroom/${cases[0].id}`)}>
                <Play size={20} />
                查看案例演示
              </button>
            </div>
          </div>

        </div>
        <aside className="hero-proof" aria-label="郑州落地服务经验">
          <strong>郑州落地服务始于 2017</strong>
          <span>小米米家 / 苹果 HomeKit</span>
          <div className="proof-tags">
            <b>绿米</b>
            <b>易来</b>
            <b>领普</b>
            <b>皓逸</b>
            <b>锐捷网络覆盖</b>
            <b>KEF</b>
            <b>蜗牛</b>
            <b>Sonos</b>
          </div>
        </aside>
      </section>
    </main>
  );
}

function CaseMapPage({ navigate }) {
  const { photos, addPhoto } = useUploadedPhotos();
  const allCases = useMemo(() => buildCasesWithPhotos(cases, photos), [photos]);
  const [activeId, setActiveId] = useState(allCases[0].id);
  const [previewPhoto, setPreviewPhoto] = useState(null);
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
        <p>先看做过哪些小区，再看每套房子怎么把灯光、窗帘、空调和安防变成日常好用的生活场景。</p>
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
                <button className="secondary-action full" type="button">
                  已归档 {activeCase.photos.length} 张照片
                </button>
              )}
            </div>
          </article>
        </aside>
      </section>

      <PhotoUploadPanel cases={allCases} uploadCount={photos.length} onSave={handleSavePhoto} />

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
            <button className="primary-action" onClick={() => navigate(`/showroom/${caseItem.id}`)}>
              查看案例演示
              <ArrowRight size={18} />
            </button>
            <button className="secondary-action" onClick={() => navigate('/cases')}>
              查看更多案例
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
    </main>
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

function ShowroomPage({ caseItem, navigate }) {
  const [activeSceneId, setActiveSceneId] = useState('bright');
  const [activeProduct, setActiveProduct] = useState(null);
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const activeImage = caseItem?.sceneImages?.[activeScene.id] ?? caseItem?.cover;

  useEffect(() => {
    setActiveSceneId('bright');
    setActiveProduct(null);
  }, [caseItem?.id]);

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
    <main className="showroom-page">
      <section className="showroom-header">
        <div>
          <p className="eyebrow">{caseItem.city}</p>
          <h1>{caseItem.name}生活场景案例</h1>
          <p>切换不同模式，看同一个客厅怎样从清晨明亮、晚饭后放松，过渡到睡前温暖和离家看护。点击产品点位，可以了解每个设备在家里的作用。</p>
        </div>
      </section>

      <section className="showroom-case-switcher" aria-label="案例列表">
        {cases.map((item) => (
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
          scene={activeScene}
          image={activeImage}
          products={productPoints}
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
              <Tv />
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

function SceneImageViewer({ caseItem, scene, image, products, onSelectProduct }) {
  return (
    <figure className="scene-image-viewer">
      <img src={image} alt={`${caseItem.name}${scene.name}效果图`} />
      <figcaption>
        <span>{scene.name}</span>
        <small>{scene.detail}</small>
      </figcaption>
      {products.map((product) => (
        <button
          key={product.id}
          className="product-hotspot"
          style={{
            left: `${product.hotspot.x}%`,
            top: `${product.hotspot.y}%`,
          }}
          type="button"
          onClick={() => onSelectProduct(product)}
          aria-label={`查看${product.name}`}
        >
          <span>{product.name}</span>
        </button>
      ))}
    </figure>
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
  const showroomMatch = path.match(/^\/showroom(?:\/([^/]+))?$/);
  const caseItem = caseMatch ? cases.find((item) => item.id === caseMatch[1]) : null;
  const showroomCaseId = showroomMatch?.[1] ?? cases[0].id;
  const showroomCase = showroomMatch ? cases.find((item) => item.id === showroomCaseId) : null;

  return (
    <Shell navigate={navigate}>
      {path === '/' ? <HomePage navigate={navigate} /> : null}
      {path === '/cases' ? <CaseMapPage navigate={navigate} /> : null}
      {caseMatch ? <CaseDetailPage caseItem={caseItem} navigate={navigate} /> : null}
      {showroomMatch ? <ShowroomPage caseItem={showroomCase} navigate={navigate} /> : null}
      {!['/', '/cases'].includes(path) && !caseMatch && !showroomMatch ? (
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

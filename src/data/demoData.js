import cityOneFloorplan from '../assets/generated-home-showcase/city-one-floorplan.png';
import cityOneLightLuxury from '../assets/generated-home-showcase/city-one-light-luxury.png';
import cityOneModern from '../assets/generated-home-showcase/city-one-modern.png';
import cityOneNaturalWood from '../assets/generated-home-showcase/city-one-natural-wood.png';
import cityOnePanorama from '../assets/generated-home-showcase/city-one-panorama.png';
import greenVillaFloorplan from '../assets/generated-home-showcase/green-villa-floorplan.png';
import greenVillaLightLuxury from '../assets/generated-home-showcase/green-villa-light-luxury.png';
import greenVillaModern from '../assets/generated-home-showcase/green-villa-modern.png';
import greenVillaNaturalWood from '../assets/generated-home-showcase/green-villa-natural-wood.png';
import greenVillaPanorama from '../assets/generated-home-showcase/green-villa-panorama.png';
import lakeGardenFloorplan from '../assets/generated-home-showcase/lake-garden-floorplan.png';
import lakeGardenLightLuxury from '../assets/generated-home-showcase/lake-garden-light-luxury.png';
import lakeGardenModern from '../assets/generated-home-showcase/lake-garden-modern.png';
import lakeGardenNaturalWood from '../assets/generated-home-showcase/lake-garden-natural-wood.png';
import lakeGardenPanorama from '../assets/generated-home-showcase/lake-garden-panorama.png';
import riverParkFloorplan from '../assets/generated-home-showcase/river-park-floorplan.png';
import riverParkLightLuxury from '../assets/generated-home-showcase/river-park-light-luxury.png';
import riverParkModern from '../assets/generated-home-showcase/river-park-modern.png';
import riverParkNaturalWood from '../assets/generated-home-showcase/river-park-natural-wood.png';
import riverParkPanorama from '../assets/generated-home-showcase/river-park-panorama.png';
import cityOneAway from '../assets/generated-home-showcase/scene-modes/city-one-away.png';
import cityOneBright from '../assets/generated-home-showcase/scene-modes/city-one-bright.png';
import cityOneRelax from '../assets/generated-home-showcase/scene-modes/city-one-relax.png';
import cityOneWarm from '../assets/generated-home-showcase/scene-modes/city-one-warm.png';
import greenVillaAway from '../assets/generated-home-showcase/scene-modes/green-villa-away.png';
import greenVillaBright from '../assets/generated-home-showcase/scene-modes/green-villa-bright.png';
import greenVillaRelax from '../assets/generated-home-showcase/scene-modes/green-villa-relax.png';
import greenVillaWarm from '../assets/generated-home-showcase/scene-modes/green-villa-warm.png';
import lakeGardenAway from '../assets/generated-home-showcase/scene-modes/lake-garden-away.png';
import lakeGardenBright from '../assets/generated-home-showcase/scene-modes/lake-garden-bright.png';
import lakeGardenRelax from '../assets/generated-home-showcase/scene-modes/lake-garden-relax.png';
import lakeGardenWarm from '../assets/generated-home-showcase/scene-modes/lake-garden-warm.png';
import riverParkAway from '../assets/generated-home-showcase/scene-modes/river-park-away.png';
import riverParkBright from '../assets/generated-home-showcase/scene-modes/river-park-bright.png';
import riverParkRelax from '../assets/generated-home-showcase/scene-modes/river-park-relax.png';
import riverParkWarm from '../assets/generated-home-showcase/scene-modes/river-park-warm.png';

export const cases = [
  {
    id: 'river-park',
    name: '建业天筑',
    city: '郑州 郑东新区',
    homeType: '三室两厅',
    area: '128 平方米',
    rooms: '客厅、主卧、儿童房、餐厅',
    position: [113.763522, 34.757588],
    mapPosition: { x: 31, y: 38 },
    cover: riverParkModern,
    images: [riverParkFloorplan, riverParkPanorama, riverParkLightLuxury, riverParkNaturalWood],
    sceneImages: {
      bright: riverParkBright,
      relax: riverParkRelax,
      warm: riverParkWarm,
      away: riverParkAway,
    },
    intro: '一家三口下班放学回到家，玄关灯先亮起，客厅空调提前调到舒服温度，晚饭后再一键切到观影氛围。',
    scenes: ['回家模式', '观影模式', '睡眠模式', '离家模式'],
    highlights: ['进门不用摸黑找开关', '观影时灯光和窗帘一起配合', '出门后自动检查灯光、空调和门窗'],
    benefits: ['每天少做重复操作', '客厅氛围更容易切换', '夜间起居更安心'],
    devices: ['智能灯', '智能窗帘', '智能面板', '空调控制器', '门窗传感器'],
  },
  {
    id: 'lake-garden',
    name: '正弘蓝堡湾',
    city: '郑州 金水区',
    homeType: '四室两厅',
    area: '156 平方米',
    rooms: '客厅、餐厅、书房、主卧',
    position: [113.670829, 34.800174],
    mapPosition: { x: 58, y: 31 },
    cover: lakeGardenModern,
    images: [lakeGardenFloorplan, lakeGardenPanorama, lakeGardenLightLuxury, lakeGardenNaturalWood],
    sceneImages: {
      bright: lakeGardenBright,
      relax: lakeGardenRelax,
      warm: lakeGardenWarm,
      away: lakeGardenAway,
    },
    intro: '四居室空间多、开关多，方案把客厅、书房和卧室分区管理，老人和孩子只需要按熟悉的场景按钮。',
    scenes: ['会客模式', '阅读模式', '睡眠模式', '安防模式'],
    highlights: ['客厅会客灯光明亮不刺眼', '书房阅读亮度提前设好', '夜里门窗异常及时提醒'],
    benefits: ['家人使用门槛低', '每个空间状态更清楚', '夜间提醒更安心'],
    devices: ['智能面板', '人体传感器', '智能音箱', '智能灯带', '摄像头'],
  },
  {
    id: 'city-one',
    name: '亚星盛世星苑',
    city: '郑州 二七区',
    homeType: '两室两厅',
    area: '96 平方米',
    rooms: '客厅、主卧、次卧、开放厨房',
    position: [113.625419, 34.717086],
    mapPosition: { x: 70, y: 55 },
    cover: cityOneModern,
    images: [cityOneFloorplan, cityOnePanorama, cityOneLightLuxury, cityOneNaturalWood],
    sceneImages: {
      bright: cityOneBright,
      relax: cityOneRelax,
      warm: cityOneWarm,
      away: cityOneAway,
    },
    intro: '小户型最怕墙面杂乱，这套方案把灯光、空调和插座集中到面板与手机里，日常操作更顺手。',
    scenes: ['回家模式', '用餐模式', '观影模式', '离家模式'],
    highlights: ['客餐厅灯光分组更清楚', '做饭吃饭不用来回开关灯', '离家时一键关闭全屋设备'],
    benefits: ['墙面更整洁', '日常控制更直接', '节能状态看得见'],
    devices: ['智能灯', '智能面板', '空调控制器', '智能插座', '环境传感器'],
  },
  {
    id: 'green-villa',
    name: '永威西郡',
    city: '郑州 中原区',
    homeType: '叠墅',
    area: '220 平方米',
    rooms: '客厅、影音室、主卧、露台',
    position: [113.535852, 34.747015],
    mapPosition: { x: 44, y: 66 },
    cover: greenVillaModern,
    images: [greenVillaFloorplan, greenVillaPanorama, greenVillaLightLuxury, greenVillaNaturalWood],
    sceneImages: {
      bright: greenVillaBright,
      relax: greenVillaRelax,
      warm: greenVillaWarm,
      away: greenVillaAway,
    },
    intro: '大户型房间多、动线长，方案把影音、露台、空调和安防串起来，家人不用在楼上楼下来回确认。',
    scenes: ['会客模式', '观影模式', '露台模式', '离家模式'],
    highlights: ['影音室自动进入沉浸灯光', '露台照明按晚间习惯开启', '离家前统一检查多区域状态'],
    benefits: ['大空间管理更省心', '娱乐体验更完整', '离家检查更高效'],
    devices: ['智能窗帘', '智能灯带', '智能音箱', '摄像头', '门窗传感器', '空调控制器'],
  },
];

export const scenes = [
  {
    id: 'bright',
    name: '明亮模式',
    short: '早晨或打扫时使用，主灯全亮、窗帘拉开，家里清清爽爽。',
    detail: '适合起床、做家务和接待朋友。系统把客厅主灯调亮，窗帘打开引入自然光，空调保持舒适温度，老人孩子走动也看得清楚。',
    light: 1,
    warmth: '#fff2c2',
    accent: '#6ee7b7',
    curtain: 0.22,
    ac: '26°C 制冷',
    security: '待机',
  },
  {
    id: 'relax',
    name: '休闲模式',
    short: '晚饭后使用，灯光变柔和，窗帘半开，客厅更放松。',
    detail: '适合一家人聊天、听音乐或陪孩子玩。主灯降到舒服亮度，氛围灯补一点暖光，空调切到静音，空间不会太亮也不会显得昏暗。',
    light: 0.58,
    warmth: '#f7b267',
    accent: '#38bdf8',
    curtain: 0.55,
    ac: '25°C 静音',
    security: '待机',
  },
  {
    id: 'warm',
    name: '温馨模式',
    short: '夜晚准备休息前使用，暖光和窗帘一起收拢家的安静感。',
    detail: '适合睡前阅读、陪伴家人和放慢节奏。灯光变暖，窗帘半合保留隐私，空调维持舒适温度，让人自然从忙碌状态过渡到休息状态。',
    light: 0.42,
    warmth: '#f6ad55',
    accent: '#a78bfa',
    curtain: 0.72,
    ac: '26°C 舒适',
    security: '待机',
  },
  {
    id: 'away',
    name: '离家模式',
    short: '出门时一键使用，灯光空调关闭，门窗和安防进入看护状态。',
    detail: '适合上班、旅行或晚上全家外出。系统统一关闭不需要的设备，窗帘合上保护隐私，安防提醒开启，减少“刚才灯关了吗”的反复担心。',
    light: 0.08,
    warmth: '#dbeafe',
    accent: '#ef4444',
    curtain: 1,
    ac: '已关闭',
    security: '已开启',
  },
];

export const productPoints = [
  {
    id: 'main-light',
    name: '智能主灯',
    role: '根据不同生活场景自动调节亮度和色温。',
    location: '客厅顶部',
    sceneUse: '明亮模式下打开，休闲和温馨模式下自动调暗。',
    hotspot: { x: 50, y: 18 },
    image:
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'curtain',
    name: '智能窗帘',
    role: '一键或自动控制窗帘开合，配合阳光和隐私需求。',
    location: '客厅落地窗',
    sceneUse: '明亮模式打开，温馨和离家模式自动合上。',
    hotspot: { x: 78, y: 34 },
    image:
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'panel',
    name: '智能场景面板',
    role: '把多个设备组合成一个按钮，老人和孩子也能直接使用。',
    location: '入户墙面',
    sceneUse: '可快速切换明亮、休闲、温馨和离家模式。',
    hotspot: { x: 24, y: 46 },
    image:
      'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'speaker',
    name: '智能音箱',
    role: '用语音控制灯光、窗帘、空调等常用设备。',
    location: '电视柜',
    sceneUse: '休闲和温馨模式下可控制音乐与灯光氛围。',
    hotspot: { x: 44, y: 62 },
    image:
      'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ac',
    name: '空调控制器',
    role: '让普通空调接入智能场景，自动调节温度。',
    location: '空调附近',
    sceneUse: '明亮和休闲模式保持舒适温度，离家模式自动关闭。',
    hotspot: { x: 86, y: 48 },
    image:
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sensor',
    name: '门窗传感器',
    role: '检测门窗开合状态，帮助判断家中是否安全。',
    location: '窗边和入户门',
    sceneUse: '离家模式下重点监测门窗状态并提醒异常。',
    hotspot: { x: 72, y: 24 },
    image:
      'https://images.unsplash.com/photo-1558002038-bb4237b52b09?auto=format&fit=crop&w=800&q=80',
  },
];

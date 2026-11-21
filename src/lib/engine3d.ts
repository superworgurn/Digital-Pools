import type { HotspotId } from '../types';

export interface HotspotScreenCoord {
  id: HotspotId;
  title: string;
  subtitle: string;
  icon: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface WorldLabelCoord {
  id: string;
  text: string;
  subtext?: string;
  x: number;
  y: number;
  visible: boolean;
  variant: 'dark-badge' | 'white-tag';
}

export interface NpcStatusBubble {
  id: string;
  text: string;
  x: number;
  y: number;
  visible: boolean;
  color: string;
}

export interface NearbyZoneInfo {
  id: HotspotId;
  title: string;
  icon: string;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
  visible: boolean;
}

interface TurnstileGate {
  id: 'shop-gate' | 'seven-gate';
  x: number;
  z: number;
  scanZ: number;
  exitZ: number;
  flapOpenAmount: number;
  targetOpen: number;
  occupantId: string | null;
  scanPulse: number;
}

interface SwimsuitNpcAgent {
  id: string;
  label: string;
  pos: Vec3;
  gateSide: 'shop-gate' | 'seven-gate';
  targetPool: 'main' | 'kids';
  state:
    | 'WALK_INTO_SHOP'
    | 'WALK_TO_COUNTER'
    | 'RECEIVING_RFID'
    | 'WALK_TO_GATE'
    | 'WAIT_GATE_QUEUE'
    | 'SCANNING_RFID'
    | 'PASSING_GATE'
    | 'WALK_TO_POOL'
    | 'SWIMMING';
  timer: number;
  speed: number;
  currentClothColor: string;
  targetSuitColor: string;
  streetClothesColor: string;
  hasRfidWristband: boolean;
  isScanningRfid: boolean;
  statusText: string;
  statusColor: string;
  swimDirection: number;
  laneZ: number;
}

export class PoolDigitalTwinEngine {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private lastTime = performance.now();
  private elapsed = 0;
  public currentFps = 60;
  private frameCount = 0;
  private fpsTimer = 0;

  private dpr = 1;
  private cachedSkyGrad: CanvasGradient | null = null;
  private sinY = 0;
  private cosY = 1;
  private sinP = 0;
  private cosP = 1;
  private fov = 600;
  private halfW = 400;
  private centerY = 300;
  private lastUiSyncTime = 0;

  // ซูมเข้ามาใกล้ขึ้น (32 แทน 39) เพื่อให้ลานสระขนาดใหญ่เต็มตาและป้ายกระจายตัวไม่เบียดกัน
  private camYaw = -0.52;
  private camPitch = 0.66;
  private camDistance = 32;
  private camTarget: Vec3 = { x: -0.8, y: 0.2, z: 1.8 };

  private targetCamYaw = -0.52;
  private targetCamPitch = 0.66;
  private targetCamDistance = 32;
  private targetCamLook: Vec3 = { x: -0.8, y: 0.2, z: 1.8 };

  private isDragging = false;
  private dragMode: 'orbit' | 'pan' = 'orbit';
  private dragMovedDistance = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private initialPinchDistance = 0;
  private initialPinchCamDistance = 32;
  private lastTapTime = 0;

  private swimmers: { x: number; z: number; speed: number; dir: number; color: string }[] = [
    { x: -5.0, z: -4.2, speed: 2.0, dir: 1, color: '#f97316' },
    { x: 2.0, z: -2.4, speed: 2.4, dir: -1, color: '#ec4899' },
    { x: -3.0, z: -0.6, speed: 1.9, dir: 1, color: '#8b5cf6' },
    { x: 3.5, z: 1.0, speed: 2.2, dir: -1, color: '#10b981' }
  ];

  private turnstileGates: TurnstileGate[] = [
    {
      id: 'shop-gate',
      x: -6.0,
      z: 10.2,
      scanZ: 11.05,
      exitZ: 9.25,
      flapOpenAmount: 0,
      targetOpen: 0,
      occupantId: null,
      scanPulse: 0
    },
    {
      id: 'seven-gate',
      x: 3.1,
      z: 10.2,
      scanZ: 11.05,
      exitZ: 9.25,
      flapOpenAmount: 0,
      targetOpen: 0,
      occupantId: null,
      scanPulse: 0
    }
  ];

  private swimsuitNpcs: SwimsuitNpcAgent[] = [];

  private lifeguardPos: Vec3 = { x: 10.5, y: 2.2, z: -6.5 };
  private lifeguardEmergencyActive = false;
  private lifeguardPhase = 0;
  private lifeguardAngle = 0;

  private isExploration = false;
  private playerPos: Vec3 = { x: -1.5, y: 0, z: 13.8 };
  private playerWalkTarget: Vec3 | null = null;
  private playerIsMoving = false;
  private playerInWater = false;
  private keysPressed: Record<string, boolean> = {};
  private virtualMove: { x: number; z: number } = { x: 0, z: 0 };
  private currentNearbyZoneId: HotspotId | null = null;

  private hotspots3D: {
    id: HotspotId;
    title: string;
    subtitle: string;
    icon: string;
    pos: Vec3;
    interactPos: Vec3;
  }[] = [
    {
      id: 'checkin',
      title: 'จุดเช็คอิน',
      subtitle: 'อยู่หลังทางเข้า-ออก • สแกน QR เข้าสระ',
      icon: '🎟️',
      pos: { x: -1.5, y: 3.1, z: 10.2 },
      interactPos: { x: -1.5, y: 0, z: 11.2 }
    },
    {
      id: 'swimwear',
      title: 'เช่า/ซื้อชุดว่ายน้ำ',
      subtitle: 'ข้างจุดเช็คอิน • เลือกไซส์ & จ่าย QR',
      icon: '👙',
      pos: { x: -11.5, y: 3.2, z: 9.0 },
      interactPos: { x: -10.5, y: 0, z: 11.8 }
    },
    {
      id: 'locker',
      title: 'ล็อกเกอร์',
      subtitle: 'ตู้เก็บของอัจฉริยะ',
      icon: '🔐',
      pos: { x: -14.8, y: 2.6, z: -6.5 },
      interactPos: { x: -13.2, y: 0, z: -6.5 }
    },
    {
      id: 'restroom',
      title: 'ห้องน้ำ & เปลี่ยนชุด',
      subtitle: 'SHOWER ROOMS',
      icon: '🚿',
      pos: { x: -11.8, y: 2.9, z: -14.5 },
      interactPos: { x: -11.8, y: 0, z: -12.8 }
    },
    {
      id: 'courses',
      title: 'คลาสว่ายน้ำ',
      subtitle: 'ตารางเรียน & โค้ช',
      icon: '🏊‍♂️',
      pos: { x: -8.2, y: 2.2, z: -2.0 },
      interactPos: { x: -8.2, y: 0, z: -2.0 }
    },
    {
      id: 'water',
      title: 'คุณภาพน้ำ / IoT',
      subtitle: 'pH 7.4 • Optimal',
      icon: '💧',
      pos: { x: 2.2, y: 1.5, z: -1.5 },
      interactPos: { x: 2.2, y: 0, z: -1.5 }
    },
    {
      id: 'lifeguard',
      title: 'ไลฟ์การ์ด',
      subtitle: 'ดูแลความปลอดภัย',
      icon: '🛟',
      pos: { x: 10.5, y: 3.8, z: -6.5 },
      interactPos: { x: 9.2, y: 0, z: -6.5 }
    },
    {
      id: 'kids-pool',
      title: 'สระเด็ก & สไลเดอร์',
      subtitle: 'โซนน้ำตื้นปลอดภัย',
      icon: '🛝',
      pos: { x: 12.2, y: 1.8, z: 1.8 },
      interactPos: { x: 10.5, y: 0, z: 1.5 }
    }
  ];

  // คงเฉพาะป้ายจุดสำคัญที่ไม่ซ้ำซ้อนกับปุ่ม Hotspot
  private worldLabels3D: {
    id: string;
    text: string;
    subtext?: string;
    pos: Vec3;
    variant: 'dark-badge' | 'white-tag';
  }[] = [
    {
      id: 'lbl-gate',
      text: '🚪 ทางเข้า-ออก',
      pos: { x: -1.5, y: 2.1, z: 16.2 },
      variant: 'dark-badge'
    },
    {
      id: 'lbl-gate-shop',
      text: '🚇 RFID (1 คน)',
      pos: { x: -6.0, y: 1.4, z: 10.2 },
      variant: 'dark-badge'
    },
    {
      id: 'lbl-gate-711',
      text: '🚇 RFID (1 คน)',
      pos: { x: 3.1, y: 1.4, z: 10.2 },
      variant: 'dark-badge'
    },
    {
      id: 'lbl-711-scenery',
      text: '7-ELEVEN',
      pos: { x: 9.2, y: 3.1, z: 11.2 },
      variant: 'white-tag'
    }
  ];

  private onHotspotUpdate?: (coords: HotspotScreenCoord[]) => void;
  private onNpcBubbleUpdate?: (bubbles: NpcStatusBubble[]) => void;
  private onWorldLabelUpdate?: (labels: WorldLabelCoord[]) => void;
  private onFpsUpdate?: (fps: number) => void;
  private onNearbyZoneUpdate?: (zone: NearbyZoneInfo | null) => void;

  constructor(
    container: HTMLElement,
    onHotspotUpdate?: (coords: HotspotScreenCoord[]) => void,
    onNpcBubbleUpdate?: (bubbles: NpcStatusBubble[]) => void,
    onWorldLabelUpdate?: (labels: WorldLabelCoord[]) => void,
    onFpsUpdate?: (fps: number) => void,
    onNearbyZoneUpdate?: (zone: NearbyZoneInfo | null) => void
  ) {
    this.container = container;
    this.onHotspotUpdate = onHotspotUpdate;
    this.onNpcBubbleUpdate = onNpcBubbleUpdate;
    this.onWorldLabelUpdate = onWorldLabelUpdate;
    this.onFpsUpdate = onFpsUpdate;
    this.onNearbyZoneUpdate = onNearbyZoneUpdate;

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none';
    this.canvas.style.cursor = 'grab';
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D context not supported');
    this.ctx = context;

    this.handleResize();

    this.spawnSwimsuitRentalNpc(0xdb2777, 'ลูกค้า #1', 0, 'shop-gate', 'main');
    this.spawnSwimsuitRentalNpc(0x0284c7, 'ลูกค้า #2', 2.8, 'shop-gate', 'main');
    this.spawnSevenElevenSideNpc(0xf59e0b, 'ลูกค้าฝั่ง 7/11');

    this.bindEvents();
    this.animate();
  }

  private hexNumberToCss(num: number | string): string {
    if (typeof num === 'string') return num.startsWith('#') ? num : `#${num}`;
    return '#' + num.toString(16).padStart(6, '0');
  }

  private getEffectiveCamDistance(baseDistance: number): number {
    if (!this.canvas || this.canvas.width <= 0 || this.canvas.height <= 0) {
      return baseDistance;
    }
    const aspect = this.canvas.width / this.canvas.height;
    if (aspect < 0.95) {
      const portraitMultiplier = Math.min(1.22, Math.max(1.04, 0.64 / Math.max(0.48, aspect)));
      return baseDistance * portraitMultiplier;
    }
    return baseDistance;
  }

  private updateCameraTrigCache() {
    this.sinY = Math.sin(this.camYaw);
    this.cosY = Math.cos(this.camYaw);
    this.sinP = Math.sin(this.camPitch);
    this.cosP = Math.cos(this.camPitch);
  }

  private project3D(x: number, y: number, z: number): ProjectedPoint {
    const effDist = this.getEffectiveCamDistance(this.camDistance);
    const dx = x - this.camTarget.x;
    const dy = y - this.camTarget.y;
    const dz = z - this.camTarget.z;

    const rx = dx * this.cosY - dz * this.sinY;
    const rz1 = dx * this.sinY + dz * this.cosY;

    const ry = dy * this.cosP - rz1 * this.sinP;
    const rz = effDist - dy * this.sinP - rz1 * this.cosP;

    if (rz <= 1.0) {
      return { x: -9999, y: -9999, z: rz, scale: 0, visible: false };
    }

    const scale = this.fov / rz;
    const screenX = this.halfW + rx * scale;
    const screenY = this.centerY - ry * scale;

    return {
      x: screenX,
      y: screenY,
      z: rz,
      scale,
      visible:
        screenX > -140 &&
        screenX < this.canvas.width + 140 &&
        screenY > -140 &&
        screenY < this.canvas.height + 140
    };
  }

  private drawQuad3D(
    p0: Vec3,
    p1: Vec3,
    p2: Vec3,
    p3: Vec3,
    fillStyle: string,
    strokeStyle?: string,
    lineWidth = 1
  ) {
    const s0 = this.project3D(p0.x, p0.y, p0.z);
    if (s0.z <= 1.0) return;
    const s1 = this.project3D(p1.x, p1.y, p1.z);
    if (s1.z <= 1.0) return;
    const s2 = this.project3D(p2.x, p2.y, p2.z);
    if (s2.z <= 1.0) return;
    const s3 = this.project3D(p3.x, p3.y, p3.z);
    if (s3.z <= 1.0) return;

    this.ctx.beginPath();
    this.ctx.moveTo(s0.x, s0.y);
    this.ctx.lineTo(s1.x, s1.y);
    this.ctx.lineTo(s2.x, s2.y);
    this.ctx.lineTo(s3.x, s3.y);
    this.ctx.closePath();
    this.ctx.fillStyle = fillStyle;
    this.ctx.fill();
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }
  }

  private drawBox3D(
    cx: number,
    cy: number,
    cz: number,
    w: number,
    h: number,
    d: number,
    topColor: string,
    frontColor: string,
    sideColor: string,
    strokeColor?: string
  ) {
    const hw = w * 0.5;
    const hh = h * 0.5;
    const hd = d * 0.5;

    const x0 = cx - hw;
    const x1 = cx + hw;
    const y0 = cy - hh;
    const y1 = cy + hh;
    const z0 = cz - hd;
    const z1 = cz + hd;

    if (this.cosY >= 0) {
      this.drawQuad3D(
        { x: x0, y: y0, z: z1 },
        { x: x1, y: y0, z: z1 },
        { x: x1, y: y1, z: z1 },
        { x: x0, y: y1, z: z1 },
        frontColor,
        strokeColor,
        0.7
      );
    } else {
      this.drawQuad3D(
        { x: x0, y: y0, z: z0 },
        { x: x1, y: y0, z: z0 },
        { x: x1, y: y1, z: z0 },
        { x: x0, y: y1, z: z0 },
        frontColor,
        strokeColor,
        0.7
      );
    }

    if (this.sinY >= 0) {
      this.drawQuad3D(
        { x: x1, y: y0, z: z0 },
        { x: x1, y: y0, z: z1 },
        { x: x1, y: y1, z: z1 },
        { x: x1, y: y1, z: z0 },
        sideColor,
        strokeColor,
        0.7
      );
    } else {
      this.drawQuad3D(
        { x: x0, y: y0, z: z0 },
        { x: x0, y: y0, z: z1 },
        { x: x0, y: y1, z: z1 },
        { x: x0, y: y1, z: z0 },
        sideColor,
        strokeColor,
        0.7
      );
    }

    this.drawQuad3D(
      { x: x0, y: y1, z: z0 },
      { x: x1, y: y1, z: z0 },
      { x: x1, y: y1, z: z1 },
      { x: x0, y: y1, z: z1 },
      topColor,
      strokeColor,
      0.7
    );
  }

  private drawBtsTurnstileGate3D(gate: TurnstileGate) {
    const laneHalfW = 0.68;
    const leftCabinetX = gate.x - laneHalfW - 0.16;
    const rightCabinetX = gate.x + laneHalfW + 0.16;
    const isOpen = gate.flapOpenAmount > 0.45;
    const ledColor = isOpen ? '#10b981' : gate.occupantId ? '#f59e0b' : '#06b6d4';

    this.drawQuad3D(
      { x: gate.x - laneHalfW, y: 0.02, z: gate.scanZ + 0.35 },
      { x: gate.x + laneHalfW, y: 0.02, z: gate.scanZ + 0.35 },
      { x: gate.x + laneHalfW, y: 0.02, z: gate.scanZ + 0.52 },
      { x: gate.x - laneHalfW, y: 0.02, z: gate.scanZ + 0.52 },
      '#facc15'
    );

    this.drawBox3D(leftCabinetX, 0.52, gate.z, 0.3, 1.04, 1.75, '#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b');
    this.drawBox3D(leftCabinetX, 1.08, gate.z, 0.32, 0.08, 1.78, '#0f172a', '#1e293b', '#334155');
    this.drawBox3D(leftCabinetX, 1.13, gate.z, 0.1, 0.04, 1.5, ledColor, ledColor, ledColor);

    this.drawBox3D(rightCabinetX, 0.52, gate.z, 0.3, 1.04, 1.75, '#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b');
    this.drawBox3D(rightCabinetX, 1.08, gate.z, 0.32, 0.08, 1.78, '#0f172a', '#1e293b', '#334155');
    this.drawBox3D(rightCabinetX, 1.13, gate.z, 0.1, 0.04, 1.5, ledColor, ledColor, ledColor);

    const readerZ = gate.z + 0.62;
    this.drawBox3D(rightCabinetX, 1.18, readerZ, 0.28, 0.14, 0.34, '#38bdf8', '#0284c7', '#0369a1');
    this.drawBox3D(rightCabinetX, 1.26, readerZ, 0.22, 0.03, 0.26, ledColor, ledColor, ledColor);

    const closedSpan = laneHalfW - 0.04;
    const wingWidth = Math.max(0.04, closedSpan * (1 - gate.flapOpenAmount));
    if (wingWidth > 0.05) {
      this.drawBox3D(
        gate.x - laneHalfW + wingWidth * 0.5,
        0.54,
        gate.z,
        wingWidth,
        0.64,
        0.07,
        'rgba(244, 63, 94, 0.82)',
        'rgba(225, 29, 72, 0.9)',
        'rgba(190, 18, 60, 0.92)',
        '#fda4af'
      );
      this.drawBox3D(
        gate.x + laneHalfW - wingWidth * 0.5,
        0.54,
        gate.z,
        wingWidth,
        0.64,
        0.07,
        'rgba(244, 63, 94, 0.82)',
        'rgba(225, 29, 72, 0.9)',
        'rgba(190, 18, 60, 0.92)',
        '#fda4af'
      );
    }

    if (gate.scanPulse > 0.05) {
      const padProj = this.project3D(rightCabinetX, 1.32, readerZ);
      if (padProj.visible) {
        const radius = Math.max(4, (1.15 - gate.scanPulse) * 0.95 * padProj.scale + 4);
        this.ctx.beginPath();
        this.ctx.ellipse(padProj.x, padProj.y, radius, radius * 0.58, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = isOpen
          ? `rgba(16, 185, 129, ${gate.scanPulse})`
          : `rgba(56, 189, 248, ${gate.scanPulse})`;
        this.ctx.lineWidth = 2.4;
        this.ctx.stroke();
      }
    }
  }

  private drawGlassPartition3D(cx: number, cz: number, widthX: number) {
    if (widthX <= 0.1) return;
    this.drawBox3D(cx, 0.1, cz, widthX, 0.2, 0.16, '#94a3b8', '#64748b', '#475569');
    this.drawBox3D(
      cx,
      0.62,
      cz,
      widthX,
      0.84,
      0.06,
      'rgba(186, 230, 253, 0.45)',
      'rgba(125, 211, 252, 0.38)',
      'rgba(56, 189, 248, 0.48)',
      '#7dd3fc'
    );
    this.drawBox3D(cx, 1.06, cz, widthX, 0.06, 0.12, '#e2e8f0', '#cbd5e1', '#94a3b8');
  }

  private drawTree3D(x: number, z: number) {
    const shadowProj = this.project3D(x + 0.5, 0.02, z + 0.5);
    if (shadowProj.visible) {
      this.ctx.beginPath();
      this.ctx.ellipse(
        shadowProj.x,
        shadowProj.y,
        Math.max(6, 1.3 * shadowProj.scale),
        Math.max(4, 0.85 * shadowProj.scale),
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
      this.ctx.fill();
    }

    this.drawBox3D(x, 1.1, z, 0.42, 2.2, 0.42, '#78350f', '#5c280a', '#451a03');

    const leaves = [
      { dx: -0.65, dy: 2.4, dz: 0.4, r: 0.78, col: '#22c55e' },
      { dx: 0.65, dy: 2.45, dz: -0.35, r: 0.82, col: '#15803d' },
      { dx: -0.35, dy: 2.9, dz: -0.55, r: 0.68, col: '#22c55e' },
      { dx: 0, dy: 2.8, dz: 0, r: 1.05, col: '#16a34a' },
      { dx: 0.25, dy: 3.35, dz: 0.25, r: 0.72, col: '#4ade80' }
    ];

    for (let i = 0; i < leaves.length; i++) {
      const lf = leaves[i];
      const p = this.project3D(x + lf.dx, lf.dy, z + lf.dz);
      if (p.visible) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(4, lf.r * p.scale), 0, Math.PI * 2);
        this.ctx.fillStyle = lf.col;
        this.ctx.fill();
      }
    }
  }

  private drawBeachUmbrella3D(x: number, z: number, color1: string, color2: string) {
    this.drawBox3D(x - 0.7, 0.22, z + 0.3, 0.75, 0.22, 1.5, '#f8fafc', '#e2e8f0', '#cbd5e1');
    this.drawBox3D(x, 1.15, z, 0.12, 2.3, 0.12, '#94a3b8', '#64748b', '#475569');

    const peakP = this.project3D(x, 2.52, z);
    if (!peakP.visible) return;
    const radius = 1.45;
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const s1 = this.project3D(x + Math.cos(a1) * radius, 2.05, z + Math.sin(a1) * radius);
      const s2 = this.project3D(x + Math.cos(a2) * radius, 2.05, z + Math.sin(a2) * radius);
      if (s1.z <= 1.0 || s2.z <= 1.0) continue;

      this.ctx.beginPath();
      this.ctx.moveTo(peakP.x, peakP.y);
      this.ctx.lineTo(s1.x, s1.y);
      this.ctx.lineTo(s2.x, s2.y);
      this.ctx.closePath();
      this.ctx.fillStyle = i % 2 === 0 ? color1 : color2;
      this.ctx.fill();
    }
  }

  private drawCharacter3D(
    pos: Vec3,
    shirtColor: string,
    shortsColor: string,
    isSwimming = false,
    hasRfidWristband = false,
    isScanningRfid = false,
    isMoving = true,
    isPlayer = false,
    label?: string
  ) {
    if (isPlayer) {
      const ringP = this.project3D(pos.x, 0.04, pos.z);
      if (ringP.visible) {
        this.ctx.beginPath();
        this.ctx.ellipse(
          ringP.x,
          ringP.y,
          Math.max(8, 0.75 * ringP.scale),
          Math.max(5, 0.48 * ringP.scale),
          0,
          0,
          Math.PI * 2
        );
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#10b981';
        this.ctx.stroke();
      }
    }

    if (isSwimming) {
      this.drawBox3D(pos.x, pos.y + 0.15, pos.z, 1.0, 0.25, 0.42, shirtColor, shirtColor, shortsColor);
      const headProj = this.project3D(pos.x + 0.5, pos.y + 0.28, pos.z);
      if (headProj.visible) {
        this.ctx.beginPath();
        this.ctx.arc(headProj.x, headProj.y, Math.max(3, 0.22 * headProj.scale), 0, Math.PI * 2);
        this.ctx.fillStyle = '#fde68a';
        this.ctx.fill();
      }
      return;
    }

    const walkOffset = isMoving ? Math.sin(this.elapsed * 9) * 0.13 : 0;
    this.drawBox3D(pos.x - 0.13, pos.y + 0.28, pos.z + walkOffset, 0.18, 0.56, 0.18, shortsColor, '#1e293b', '#0f172a');
    this.drawBox3D(pos.x + 0.13, pos.y + 0.28, pos.z - walkOffset, 0.18, 0.56, 0.18, shortsColor, '#1e293b', '#0f172a');

    this.drawBox3D(pos.x, pos.y + 0.9, pos.z, 0.52, 0.68, 0.32, shirtColor, shirtColor, shirtColor);

    const headProj = this.project3D(pos.x, pos.y + 1.5, pos.z);
    if (headProj.visible) {
      this.ctx.beginPath();
      this.ctx.arc(headProj.x, headProj.y, Math.max(4, 0.26 * headProj.scale), 0, Math.PI * 2);
      this.ctx.fillStyle = '#fde68a';
      this.ctx.fill();

      if (isPlayer) {
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#064e3b';
        this.ctx.fillText('▼ คุณ (Player)', headProj.x, headProj.y - Math.max(10, 0.45 * headProj.scale));
      } else if (label) {
        this.ctx.font = 'bold 10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillText(label, headProj.x, headProj.y - Math.max(10, 0.45 * headProj.scale));
      }
    }

    if (hasRfidWristband) {
      const armReachX = isScanningRfid ? 0.52 : 0.36;
      const armReachY = isScanningRfid ? 1.15 : 0.85;
      const armReachZ = isScanningRfid ? -0.25 : 0.05;
      this.drawBox3D(
        pos.x + armReachX * 0.7,
        pos.y + armReachY,
        pos.z + armReachZ * 0.6,
        0.28,
        0.14,
        0.14,
        '#fde68a',
        '#fcd34d',
        '#f59e0b'
      );
      const wristProj = this.project3D(pos.x + armReachX, pos.y + armReachY, pos.z + armReachZ);
      if (wristProj.visible) {
        this.ctx.beginPath();
        this.ctx.arc(wristProj.x, wristProj.y, Math.max(3.5, 0.16 * wristProj.scale), 0, Math.PI * 2);
        this.ctx.fillStyle = '#22d3ee';
        this.ctx.fill();
        this.ctx.lineWidth = 1.6;
        this.ctx.strokeStyle = '#facc15';
        this.ctx.stroke();
      }
    }
  }

  public spawnSwimsuitRentalNpc(
    suitColor: number | string = 0xdb2777,
    customLabel: string = 'NPC เช่าชุดว่ายน้ำ',
    initialDelay: number = 0,
    gateSide: 'shop-gate' | 'seven-gate' = 'shop-gate',
    targetPool: 'main' | 'kids' = 'main'
  ) {
    const cssSuitColor = this.hexNumberToCss(suitColor);
    const streetColor = '#7c3aed';

    const agent: SwimsuitNpcAgent = {
      id: `npc-suit-${Math.random().toString(36).substring(2, 7)}`,
      label: customLabel,
      pos: { x: -1.5, y: 0, z: 16.5 },
      gateSide,
      targetPool,
      state: 'WALK_INTO_SHOP',
      timer: -initialDelay,
      speed: 3.1,
      currentClothColor: streetColor,
      targetSuitColor: cssSuitColor,
      streetClothesColor: streetColor,
      hasRfidWristband: false,
      isScanningRfid: false,
      statusText: '🚶 เข้าร้าน',
      statusColor: '#0284c7',
      swimDirection: 1,
      laneZ: -4.2 + Math.random() * 5.0
    };

    if (this.swimsuitNpcs.length >= 6) {
      this.swimsuitNpcs.shift();
    }
    this.swimsuitNpcs.push(agent);
  }

  private spawnSevenElevenSideNpc(suitColor: number | string, customLabel: string) {
    const cssSuitColor = this.hexNumberToCss(suitColor);
    const agent: SwimsuitNpcAgent = {
      id: `npc-711-${Math.random().toString(36).substring(2, 7)}`,
      label: customLabel,
      pos: { x: 6.6, y: 0, z: 12.8 },
      gateSide: 'seven-gate',
      targetPool: 'main',
      state: 'WALK_TO_GATE',
      timer: 0,
      speed: 2.9,
      currentClothColor: '#f59e0b',
      targetSuitColor: cssSuitColor,
      streetClothesColor: '#f59e0b',
      hasRfidWristband: true,
      isScanningRfid: false,
      statusText: '⌚ ไปราวกั้น',
      statusColor: '#d97706',
      swimDirection: -1,
      laneZ: -1.2
    };
    this.swimsuitNpcs.push(agent);
  }

  private moveTowards(current: Vec3, target: Vec3, maxStep: number): number {
    const dx = target.x - current.x;
    const dz = target.z - current.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.001) {
      const step = Math.min(maxStep, dist);
      current.x += (dx / dist) * step;
      current.z += (dz / dist) * step;
    }
    return dist;
  }

  private updateSwimsuitNpcs(dt: number) {
    for (let g = 0; g < this.turnstileGates.length; g++) {
      const gate = this.turnstileGates[g];

      if (gate.occupantId) {
        const stillPassing = this.swimsuitNpcs.some(
          (n) =>
            n.id === gate.occupantId &&
            (n.state === 'SCANNING_RFID' || n.state === 'PASSING_GATE')
        );
        if (!stillPassing) {
          gate.occupantId = null;
          gate.targetOpen = 0;
        }
      }

      if (this.isExploration && !gate.occupantId) {
        const playerDist = Math.hypot(this.playerPos.x - gate.x, this.playerPos.z - gate.z);
        if (playerDist < 1.35) {
          gate.targetOpen = 1;
          gate.scanPulse = Math.min(1, gate.scanPulse + dt * 2.5);
        } else {
          gate.targetOpen = 0;
        }
      } else if (!gate.occupantId) {
        gate.targetOpen = 0;
      }

      const flapRate = gate.targetOpen > gate.flapOpenAmount ? 6.5 : 9.0;
      gate.flapOpenAmount += (gate.targetOpen - gate.flapOpenAmount) * Math.min(1, flapRate * dt);
      if (gate.scanPulse > 0) {
        gate.scanPulse = Math.max(0, gate.scanPulse - dt * 1.4);
      }
    }

    const shopEntrancePos: Vec3 = { x: -10.5, y: 0, z: 12.6 };
    const shopCounterPos: Vec3 = { x: -10.5, y: 0, z: 11.55 };
    const mainPoolEntryPos: Vec3 = { x: -5.8, y: 0, z: 2.3 };
    const kidsPoolEntryPos: Vec3 = { x: 9.5, y: 0, z: 1.5 };

    for (const npc of this.swimsuitNpcs) {
      if (npc.timer < 0) {
        npc.timer += dt;
        continue;
      }

      const gate =
        this.turnstileGates.find((g) => g.id === npc.gateSide) || this.turnstileGates[0];

      switch (npc.state) {
        case 'WALK_INTO_SHOP': {
          const dist = this.moveTowards(npc.pos, shopEntrancePos, npc.speed * dt);
          if (dist < 0.32) {
            npc.state = 'WALK_TO_COUNTER';
            npc.timer = 0;
            npc.statusText = '💁 เคาน์เตอร์';
            npc.statusColor = '#0284c7';
          }
          break;
        }

        case 'WALK_TO_COUNTER': {
          const dist = this.moveTowards(npc.pos, shopCounterPos, npc.speed * 0.85 * dt);
          if (dist < 0.25) {
            npc.state = 'RECEIVING_RFID';
            npc.timer = 0;
            npc.isScanningRfid = true;
            npc.statusText = '⌚ รับสายข้อมือ';
            npc.statusColor = '#db2777';
          }
          break;
        }

        case 'RECEIVING_RFID': {
          npc.timer += dt;
          if (npc.timer > 0.65) {
            npc.hasRfidWristband = true;
          }
          if (npc.timer >= 1.7) {
            npc.isScanningRfid = false;
            npc.state = 'WALK_TO_GATE';
            npc.timer = 0;
            npc.statusText = '🚶 ไปราวกั้น';
            npc.statusColor = '#0891b2';
          }
          break;
        }

        case 'WALK_TO_GATE': {
          const queueFrontPos: Vec3 = { x: gate.x, y: 0, z: gate.scanZ + 1.25 };
          const dist = this.moveTowards(npc.pos, queueFrontPos, npc.speed * dt);
          if (dist < 0.32) {
            npc.state = 'WAIT_GATE_QUEUE';
            npc.timer = 0;
          }
          break;
        }

        case 'WAIT_GATE_QUEUE': {
          const waitingList = this.swimsuitNpcs.filter(
            (other) =>
              other.gateSide === gate.id &&
              (other.state === 'WAIT_GATE_QUEUE' || other.state === 'SCANNING_RFID')
          );
          const myQueueIndex = waitingList.findIndex((other) => other.id === npc.id);
          const slotZ = gate.scanZ + 1.05 + Math.max(0, myQueueIndex) * 1.15;
          this.moveTowards(npc.pos, { x: gate.x, y: 0, z: slotZ }, npc.speed * 0.85 * dt);

          npc.statusText = myQueueIndex === 0 ? '⌚ รอสแกน' : `⏳ คิว #${myQueueIndex + 1}`;
          npc.statusColor = '#d97706';

          if (myQueueIndex === 0 && gate.occupantId === null && gate.flapOpenAmount < 0.12) {
            gate.occupantId = npc.id;
            npc.state = 'SCANNING_RFID';
            npc.timer = 0;
          }
          break;
        }

        case 'SCANNING_RFID': {
          const scanStandPos: Vec3 = { x: gate.x, y: 0, z: gate.scanZ };
          const dist = this.moveTowards(npc.pos, scanStandPos, npc.speed * 0.85 * dt);
          if (dist < 0.22) {
            npc.isScanningRfid = true;
            npc.timer += dt;
            gate.scanPulse = 1;
            npc.statusText = '📡 สแกน RFID';
            npc.statusColor = '#0284c7';

            if (npc.timer >= 0.85) {
              gate.targetOpen = 1;
              npc.statusText = '✅ เปิด (1 คน)';
              npc.statusColor = '#059669';

              if (gate.flapOpenAmount >= 0.72) {
                npc.isScanningRfid = false;
                npc.state = 'PASSING_GATE';
                npc.timer = 0;
              }
            }
          }
          break;
        }

        case 'PASSING_GATE': {
          gate.targetOpen = 1;
          const pastGatePos: Vec3 = { x: gate.x, y: 0, z: gate.exitZ - 0.35 };
          const dist = this.moveTowards(npc.pos, pastGatePos, npc.speed * 0.95 * dt);
          if (dist < 0.25 || npc.pos.z <= gate.exitZ) {
            gate.occupantId = null;
            gate.targetOpen = 0;
            npc.state = 'WALK_TO_POOL';
            npc.timer = 0;
            npc.statusText = '🏊‍♂️ ลงสระ';
            npc.statusColor = '#059669';
          }
          break;
        }

        case 'WALK_TO_POOL': {
          const poolTarget = npc.targetPool === 'kids' ? kidsPoolEntryPos : mainPoolEntryPos;
          const dist = this.moveTowards(npc.pos, poolTarget, npc.speed * dt);
          if (dist < 0.4) {
            npc.currentClothColor = npc.targetSuitColor;
            npc.state = 'SWIMMING';
            npc.timer = 0;
            if (npc.targetPool === 'kids') {
              npc.pos = { x: 10.4, y: 0.1, z: 1.5 };
            } else {
              npc.pos = { x: -6.2, y: 0.1, z: npc.laneZ };
            }
            npc.statusText = '';
          }
          break;
        }

        case 'SWIMMING': {
          npc.timer += dt;
          if (npc.targetPool === 'kids') {
            npc.pos.x += npc.swimDirection * 1.4 * dt;
            if (npc.pos.x > 13.8) npc.swimDirection = -1;
            if (npc.pos.x < 10.2) npc.swimDirection = 1;
          } else {
            npc.pos.x += npc.swimDirection * 2.0 * dt;
            if (npc.pos.x > 4.5) npc.swimDirection = -1;
            if (npc.pos.x < -6.2) npc.swimDirection = 1;
          }

          if (npc.timer > 18) {
            if (npc.gateSide === 'seven-gate') {
              npc.pos = { x: 6.6, y: 0, z: 12.8 };
              npc.currentClothColor = npc.streetClothesColor;
              npc.hasRfidWristband = true;
              npc.state = 'WALK_TO_GATE';
              npc.timer = 0;
              npc.statusText = '⌚ ไปราวกั้น';
            } else {
              npc.pos = { x: -1.5, y: 0, z: 16.5 };
              npc.currentClothColor = npc.streetClothesColor;
              npc.hasRfidWristband = false;
              npc.state = 'WALK_INTO_SHOP';
              npc.timer = 0;
              npc.statusText = '🚶 เข้าร้าน';
            }
            npc.statusColor = '#0284c7';
          }
          break;
        }
      }
    }
  }

  private drawClouds(w: number, h: number) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    const scaleCloud = w < h ? 0.75 : 1;
    const clouds = [
      { cx: w * 0.48, cy: h * 0.14, r: 42 * scaleCloud },
      { cx: w * 0.51, cy: h * 0.13, r: 52 * scaleCloud },
      { cx: w * 0.55, cy: h * 0.145, r: 38 * scaleCloud },
      { cx: w * 0.22, cy: h * 0.19, r: 30 * scaleCloud },
      { cx: w * 0.25, cy: h * 0.185, r: 36 * scaleCloud },
      { cx: w * 0.78, cy: h * 0.2, r: 32 * scaleCloud },
      { cx: w * 0.81, cy: h * 0.195, r: 40 * scaleCloud }
    ];
    this.ctx.beginPath();
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      this.ctx.moveTo(c.cx + c.r, c.cy);
      this.ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    }
    this.ctx.fill();
  }

  private renderScene(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.cachedSkyGrad) {
      this.ctx.fillStyle = this.cachedSkyGrad;
      this.ctx.fillRect(0, 0, w, h);
    }

    this.drawClouds(w, h);

    this.drawBox3D(0, -0.35, 0, 38, 0.7, 38, '#dce2e8', '#cbd5e1', '#94a3b8');

    const tileStep = 4.75;
    this.ctx.beginPath();
    for (let g = -19; g <= 19; g += tileStep) {
      const p1 = this.project3D(g, 0.01, -19);
      const p2 = this.project3D(g, 0.01, 19);
      if (p1.z > 1.0 && p2.z > 1.0) {
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
      }
      const p3 = this.project3D(-19, 0.01, g);
      const p4 = this.project3D(19, 0.01, g);
      if (p3.z > 1.0 && p4.z > 1.0) {
        this.ctx.moveTo(p3.x, p3.y);
        this.ctx.lineTo(p4.x, p4.y);
      }
    }
    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.drawQuad3D(
      { x: -12.0, y: 0.015, z: 12.2 },
      { x: 9.5, y: 0.015, z: 12.2 },
      { x: 9.5, y: 0.015, z: 14.2 },
      { x: -12.0, y: 0.015, z: 14.2 },
      'rgba(148, 163, 184, 0.42)'
    );

    this.drawQuad3D(
      { x: -6.85, y: 0.016, z: 4.5 },
      { x: -5.15, y: 0.016, z: 4.5 },
      { x: -5.15, y: 0.016, z: 12.2 },
      { x: -6.85, y: 0.016, z: 12.2 },
      'rgba(186, 230, 253, 0.65)'
    );

    this.drawQuad3D(
      { x: 2.25, y: 0.016, z: 4.5 },
      { x: 3.95, y: 0.016, z: 4.5 },
      { x: 3.95, y: 0.016, z: 12.2 },
      { x: 2.25, y: 0.016, z: 12.2 },
      'rgba(254, 243, 199, 0.7)'
    );

    this.drawBox3D(-1.0, 0.08, -1.8, 13.4, 0.2, 8.6, '#ffffff', '#e2e8f0', '#cbd5e1');
    const waveAlpha = 0.92 + Math.sin(this.elapsed * 2.5) * 0.04;
    this.drawQuad3D(
      { x: -7.1, y: 0.2, z: -5.6 },
      { x: 5.1, y: 0.2, z: -5.6 },
      { x: 5.1, y: 0.2, z: 2.0 },
      { x: -7.1, y: 0.2, z: 2.0 },
      `rgba(24, 154, 211, ${waveAlpha})`,
      '#38bdf8',
      1.5
    );

    for (let z = -4.2; z <= 0.8; z += 1.65) {
      this.drawQuad3D(
        { x: -7.0, y: 0.22, z: z - 0.05 },
        { x: 5.0, y: 0.22, z: z - 0.05 },
        { x: 5.0, y: 0.22, z: z + 0.05 },
        { x: -7.0, y: 0.22, z: z + 0.05 },
        z < -3.5 || z > 0.2 ? '#ef4444' : '#f8fafc'
      );
    }

    const sensorP = this.project3D(2.2, 0.25, -1.5);
    if (sensorP.visible) {
      this.ctx.beginPath();
      this.ctx.arc(sensorP.x, sensorP.y, Math.max(4, 0.28 * sensorP.scale), 0, Math.PI * 2);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();
    }

    this.drawBox3D(-11.8, 1.15, -15.2, 4.4, 2.3, 2.8, '#94a3b8', '#64748b', '#475569');
    this.drawBox3D(-12.5, 0.85, -13.75, 1.0, 1.7, 0.12, '#38bdf8', '#0284c7', '#0369a1');
    this.drawBox3D(-11.1, 0.85, -13.75, 1.0, 1.7, 0.12, '#f472b6', '#db2777', '#be185d');

    for (let i = 0; i < 6; i++) {
      const lz = -10.2 + i * 1.45;
      this.drawBox3D(-14.8, 1.05, lz, 1.35, 2.1, 1.25, '#0284c7', '#0369a1', '#1e3a8a');
    }

    this.drawBox3D(-3.4, 0.95, 15.6, 0.35, 1.9, 0.35, '#0284c7', '#0369a1', '#1e3a8a');
    this.drawBox3D(0.4, 0.95, 15.6, 0.35, 1.9, 0.35, '#0284c7', '#0369a1', '#1e3a8a');
    this.drawBox3D(-1.5, 1.95, 15.6, 4.2, 0.35, 0.45, '#0ea5e9', '#0284c7', '#0369a1');
    this.drawBox3D(-2.3, 0.45, 15.6, 0.25, 0.9, 0.7, '#334155', '#1e293b', '#0f172a');
    this.drawBox3D(-0.7, 0.45, 15.6, 0.25, 0.9, 0.7, '#334155', '#1e293b', '#0f172a');

    this.drawBox3D(-1.5, 0.55, 10.2, 4.4, 1.1, 1.3, '#0284c7', '#1e293b', '#0f172a');
    this.drawBox3D(-3.5, 1.45, 10.2, 0.22, 1.9, 0.22, '#e2e8f0', '#cbd5e1', '#94a3b8');
    this.drawBox3D(0.5, 1.45, 10.2, 0.22, 1.9, 0.22, '#e2e8f0', '#cbd5e1', '#94a3b8');
    this.drawBox3D(-1.5, 2.4, 10.2, 4.6, 0.28, 1.5, '#38bdf8', '#0284c7', '#0369a1');
    this.drawCharacter3D({ x: -1.5, y: 0, z: 9.2 }, '#0ea5e9', '#0f172a', false, false, false, false);

    this.drawBox3D(-10.5, 1.15, 9.2, 4.6, 2.3, 2.6, '#ec4899', '#1e1b4b', '#312e81');
    this.drawBox3D(-10.5, 2.45, 9.5, 5.0, 0.32, 3.2, '#f43f5e', '#db2777', '#be185d');
    this.drawBox3D(-10.5, 0.55, 11.0, 4.0, 1.1, 0.9, '#38bdf8', '#0284c7', '#0369a1');
    this.drawBox3D(-9.2, 1.25, 11.0, 0.55, 0.55, 0.25, '#22d3ee', '#0284c7', '#0369a1');
    this.drawCharacter3D({ x: -10.5, y: 0, z: 10.2 }, '#0ea5e9', '#0f172a', false, true, true, false);

    this.drawBox3D(8.2, 1.35, 10.5, 5.4, 2.7, 3.8, '#f8fafc', '#e2e8f0', '#cbd5e1');
    this.drawBox3D(8.2, 2.45, 10.5, 5.6, 0.25, 4.0, '#16a34a', '#16a34a', '#15803d');
    this.drawBox3D(8.2, 2.7, 10.5, 5.6, 0.25, 4.0, '#f97316', '#f97316', '#ea580c');
    this.drawBox3D(8.2, 2.95, 10.5, 5.6, 0.25, 4.0, '#dc2626', '#dc2626', '#b91c1c');
    this.drawBox3D(6.6, 0.95, 12.42, 1.3, 1.9, 0.12, '#38bdf8', '#7dd3fc', '#0284c7');

    this.drawGlassPartition3D(-15.8, 10.2, 6.0);
    this.drawGlassPartition3D(-7.52, 10.2, 1.35);
    this.drawGlassPartition3D(-4.42, 10.2, 1.45);
    this.drawGlassPartition3D(1.48, 10.2, 1.55);
    this.drawGlassPartition3D(4.72, 10.2, 1.55);
    this.drawGlassPartition3D(14.8, 10.2, 7.8);

    for (let g = 0; g < this.turnstileGates.length; g++) {
      this.drawBtsTurnstileGate3D(this.turnstileGates[g]);
    }

    this.drawBeachUmbrella3D(-4.5, -13.5, '#ef4444', '#ffffff');
    this.drawBeachUmbrella3D(-0.8, -13.5, '#3b82f6', '#ffffff');
    this.drawBeachUmbrella3D(2.9, -13.5, '#f59e0b', '#ffffff');
    this.drawBeachUmbrella3D(6.6, -13.5, '#10b981', '#ffffff');

    if (this.lifeguardEmergencyActive) {
      this.lifeguardAngle += 2.2 * dt;
      const radiusX = 8.8;
      const radiusZ = 4.8;
      this.lifeguardPos = {
        x: -1.0 + Math.cos(this.lifeguardAngle) * radiusX,
        y: 0.15,
        z: -1.8 + Math.sin(this.lifeguardAngle) * radiusZ
      };
      this.drawBox3D(10.5, 1.15, -6.5, 1.7, 2.3, 1.7, '#ffffff', '#ef4444', '#dc2626');
      this.drawBox3D(10.5, 2.95, -6.5, 2.0, 0.25, 2.0, '#ef4444', '#dc2626', '#b91c1c');
      this.drawCharacter3D(this.lifeguardPos, '#dc2626', '#fef08a', false, false, false, true, false, '🚨 ไลฟ์การ์ดวิ่งตรวจสระ!');
    } else {
      this.drawBox3D(10.5, 1.15, -6.5, 1.7, 2.3, 1.7, '#ffffff', '#ef4444', '#dc2626');
      this.drawBox3D(10.5, 2.95, -6.5, 2.0, 0.25, 2.0, '#ef4444', '#dc2626', '#b91c1c');
      this.drawCharacter3D(this.lifeguardPos, '#ef4444', '#fef08a', false, false, false, false);
    }

    this.drawBox3D(12.2, 0.08, 1.5, 5.4, 0.2, 4.8, '#e2e8f0', '#cbd5e1', '#94a3b8');
    this.drawQuad3D(
      { x: 9.8, y: 0.2, z: -0.6 },
      { x: 14.6, y: 0.2, z: -0.6 },
      { x: 14.6, y: 0.2, z: 3.6 },
      { x: 9.8, y: 0.2, z: 3.6 },
      'rgba(56, 189, 248, 0.92)',
      '#7dd3fc',
      1.2
    );
    this.drawBox3D(14.0, 0.75, 0.5, 1.4, 1.3, 1.2, '#facc15', '#eab308', '#ca8a04');
    const ringP = this.project3D(11.8, 0.28, 1.5);
    if (ringP.visible) {
      this.ctx.beginPath();
      this.ctx.arc(ringP.x, ringP.y, Math.max(5, 0.48 * ringP.scale), 0, Math.PI * 2);
      this.ctx.fillStyle = '#fb7185';
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();
    }

    this.drawBeachUmbrella3D(5.2, 6.2, '#ec4899', '#ffffff');
    this.drawBeachUmbrella3D(8.8, 6.2, '#8b5cf6', '#ffffff');

    this.drawTree3D(-16.5, -14.5);
    this.drawTree3D(-16.5, 1.5);
    this.drawTree3D(-2.0, -17.0);
    this.drawTree3D(15.5, -12.5);
    this.drawTree3D(16.5, -2.5);
    this.drawTree3D(15.5, 14.5);

    for (let i = 0; i < this.swimmers.length; i++) {
      const s = this.swimmers[i];
      this.drawCharacter3D({ x: s.x, y: 0.15, z: s.z }, s.color, '#0f172a', true);
    }

    for (let i = 0; i < this.swimsuitNpcs.length; i++) {
      const npc = this.swimsuitNpcs[i];
      if (npc.timer < 0) continue;
      const isMoving =
        npc.state !== 'RECEIVING_RFID' &&
        npc.state !== 'SCANNING_RFID' &&
        npc.state !== 'WAIT_GATE_QUEUE';

      this.drawCharacter3D(
        npc.pos,
        npc.currentClothColor,
        '#0f172a',
        npc.state === 'SWIMMING',
        npc.hasRfidWristband,
        npc.isScanningRfid,
        isMoving
      );
    }

    if (this.isExploration) {
      if (this.playerWalkTarget) {
        const tgtP = this.project3D(this.playerWalkTarget.x, 0.04, this.playerWalkTarget.z);
        if (tgtP.visible) {
          this.ctx.beginPath();
          this.ctx.arc(tgtP.x, tgtP.y, Math.max(5, 0.45 * tgtP.scale), 0, Math.PI * 2);
          this.ctx.strokeStyle = '#10b981';
          this.ctx.lineWidth = 2.5;
          this.ctx.stroke();
        }
      }

      this.drawCharacter3D(
        this.playerPos,
        '#10b981',
        '#0284c7',
        this.playerInWater,
        true,
        false,
        this.playerIsMoving,
        true
      );
    }
  }

  public setCameraPreset(preset: string) {
    const presets: Record<string, { yaw: number; pitch: number; dist: number; look: Vec3 }> = {
      overview: { yaw: -0.52, pitch: 0.66, dist: 32, look: { x: -0.8, y: 0.2, z: 1.8 } },
      top: { yaw: 0.0, pitch: 1.42, dist: 34, look: { x: -1.0, y: 0, z: 2.0 } },
      entrance: { yaw: -0.25, pitch: 0.58, dist: 22, look: { x: -1.5, y: 0.5, z: 12.2 } },
      pool: { yaw: -0.45, pitch: 0.72, dist: 23, look: { x: -1.0, y: 0, z: -1.8 } },
      locker: { yaw: -0.65, pitch: 0.68, dist: 22, look: { x: -13.0, y: 0.5, z: -8.5 } },
      swimwear: { yaw: -0.35, pitch: 0.62, dist: 21, look: { x: -8.5, y: 0.5, z: 10.5 } },
      restroom: { yaw: -0.65, pitch: 0.68, dist: 21, look: { x: -11.8, y: 0.8, z: -14.5 } },
      kids: { yaw: 0.45, pitch: 0.68, dist: 22, look: { x: 12.2, y: 0.5, z: 1.5 } }
    };
    const p = presets[preset] || presets.overview;
    this.targetCamYaw = p.yaw;
    this.targetCamPitch = p.pitch;
    this.targetCamDistance = p.dist;
    this.targetCamLook = { ...p.look };
  }

  public adjustCamera(deltaYaw: number, deltaPitch: number, deltaZoom: number) {
    this.targetCamYaw += deltaYaw;
    this.targetCamPitch = Math.max(0.25, Math.min(1.5, this.targetCamPitch + deltaPitch));
    this.targetCamDistance = Math.max(10, Math.min(68, this.targetCamDistance + deltaZoom));
  }

  public panCameraOffset(dx: number, dz: number) {
    this.targetCamLook.x += dx * this.cosY + dz * this.sinY;
    this.targetCamLook.z += -dx * this.sinY + dz * this.cosY;
    this.targetCamLook.x = Math.max(-35, Math.min(35, this.targetCamLook.x));
    this.targetCamLook.z = Math.max(-35, Math.min(35, this.targetCamLook.z));
  }

  public setVirtualJoystick(vx: number, vz: number) {
    this.virtualMove = { x: vx, z: vz };
  }

  public getNearbyZone(): NearbyZoneInfo | null {
    if (!this.currentNearbyZoneId) return null;
    const found = this.hotspots3D.find((h) => h.id === this.currentNearbyZoneId);
    if (!found) return null;
    return { id: found.id, title: found.title, icon: found.icon };
  }

  public changeView(view: string) {
    this.setCameraPreset(view);
  }

  public triggerLifeguardEmergency() {
    this.lifeguardEmergencyActive = true;
    this.lifeguardPhase = 0;
    this.lifeguardAngle = 0;
    this.lifeguardPos = { x: 10.5, y: 2.2, z: -6.5 };
  }

  public setExplorationMode(enabled: boolean) {
    const wasEnabled = this.isExploration;
    this.isExploration = enabled;
    if (enabled && !wasEnabled) {
      const isPortrait = this.canvas.height > this.canvas.width;
      this.playerPos = { x: -1.5, y: 0, z: 14.2 };
      this.playerWalkTarget = null;
      this.targetCamDistance = isPortrait ? 31 : 24;
      this.targetCamPitch = 0.64;
      this.targetCamLook = isPortrait
        ? { x: -1.0, y: 0.4, z: 4.5 }
        : { x: this.playerPos.x, y: 0.8, z: this.playerPos.z };
    }
    if (!enabled) {
      this.playerWalkTarget = null;
      this.currentNearbyZoneId = null;
      this.onNearbyZoneUpdate?.(null);
    }
  }

  public setPlayerMode(enabled: boolean) {
    this.setExplorationMode(enabled);
  }

  private panCameraByScreenDelta(dx: number, dy: number) {
    const panFactor = this.camDistance * 0.0022;
    this.targetCamLook.x -= (dx * this.cosY - dy * this.sinY) * panFactor;
    this.targetCamLook.z -= (-dx * this.sinY - dy * this.cosY) * panFactor;

    this.targetCamLook.x = Math.max(-35, Math.min(35, this.targetCamLook.x));
    this.targetCamLook.z = Math.max(-35, Math.min(35, this.targetCamLook.z));
  }

  private screenToGround3D(clientX: number, clientY: number): Vec3 | null {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = (clientX - rect.left) * this.dpr;
    const screenY = (clientY - rect.top) * this.dpr;

    const effDist = this.getEffectiveCamDistance(this.camDistance);
    const ndcY = (this.centerY - screenY) / this.fov;
    const denom = this.sinP - ndcY * this.cosP;
    if (Math.abs(denom) < 0.001) return null;

    const rz1 = (-ndcY * effDist) / denom;
    const rz = effDist - rz1 * this.cosP;
    if (rz <= 1.0) return null;

    const scale = this.fov / rz;
    const rx = (screenX - this.halfW) / scale;

    const dx = rx * this.cosY + rz1 * this.sinY;
    const dz = -rx * this.sinY + rz1 * this.cosY;

    return {
      x: Math.max(-18.2, Math.min(18.2, this.camTarget.x + dx)),
      y: 0,
      z: Math.max(-18.2, Math.min(18.2, this.camTarget.z + dz))
    };
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('dblclick', this.handleDoubleClick);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  private handleResize = () => {
    if (!this.container || !this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = this.container.clientWidth * this.dpr;
    this.canvas.height = this.container.clientHeight * this.dpr;

    this.fov = Math.min(this.canvas.width, this.canvas.height) * 0.96;
    this.halfW = this.canvas.width * 0.5;
    this.centerY = this.canvas.height * 0.52;

    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#5bc0e4');
    skyGrad.addColorStop(0.45, '#9edcf1');
    skyGrad.addColorStop(1, '#d9f2fa');
    this.cachedSkyGrad = skyGrad;
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private handleDoubleClick = (e: MouseEvent) => {
    const groundPt = this.screenToGround3D(e.clientX, e.clientY);
    if (!groundPt) return;

    if (this.isExploration) {
      this.playerWalkTarget = groundPt;
    } else {
      this.targetCamLook = { x: groundPt.x, y: 0.4, z: groundPt.z };
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.dragMovedDistance = 0;
    this.dragMode =
      e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey
        ? 'pan'
        : 'orbit';
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.canvas.style.cursor = 'grabbing';
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.dragMovedDistance += Math.hypot(dx, dy);
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    if (this.dragMode === 'pan') {
      this.panCameraByScreenDelta(dx, dy);
    } else {
      this.targetCamYaw += dx * 0.008;
      this.targetCamPitch = Math.max(0.25, Math.min(1.5, this.targetCamPitch + dy * 0.007));
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (this.isDragging && this.dragMovedDistance < 6 && e.button === 0 && this.isExploration) {
      const groundPt = this.screenToGround3D(e.clientX, e.clientY);
      if (groundPt) {
        this.playerWalkTarget = groundPt;
      }
    }
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.targetCamDistance = Math.max(10, Math.min(68, this.targetCamDistance + e.deltaY * 0.024));
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    this.dragMovedDistance = 0;
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.dragMode = 'orbit';
      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      this.isDragging = true;
      this.dragMode = 'pan';
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      this.lastPointerX = (t0.clientX + t1.clientX) / 2;
      this.lastPointerY = (t0.clientY + t1.clientY) / 2;
      this.initialPinchDistance = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      this.initialPinchCamDistance = this.targetCamDistance;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.isDragging) return;

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - this.lastPointerX;
      const dy = e.touches[0].clientY - this.lastPointerY;
      this.dragMovedDistance += Math.hypot(dx, dy);
      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;

      this.targetCamYaw += dx * 0.0085;
      this.targetCamPitch = Math.max(0.25, Math.min(1.5, this.targetCamPitch + dy * 0.0075));
    } else if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;
      const dx = midX - this.lastPointerX;
      const dy = midY - this.lastPointerY;
      this.lastPointerX = midX;
      this.lastPointerY = midY;

      this.panCameraByScreenDelta(dx, dy);

      const currentPinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      if (this.initialPinchDistance > 10) {
        const pinchRatio = this.initialPinchDistance / Math.max(10, currentPinchDist);
        this.targetCamDistance = Math.max(
          10,
          Math.min(68, this.initialPinchCamDistance * pinchRatio)
        );
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      if (this.isDragging && this.dragMovedDistance < 8) {
        const now = performance.now();
        const groundPt = this.screenToGround3D(this.lastPointerX, this.lastPointerY);
        if (groundPt) {
          if (this.isExploration) {
            this.playerWalkTarget = groundPt;
          } else if (now - this.lastTapTime < 320) {
            this.targetCamLook = { x: groundPt.x, y: 0.4, z: groundPt.z };
          }
        }
        this.lastTapTime = now;
      }
      this.isDragging = false;
    } else if (e.touches.length === 1) {
      this.dragMode = 'orbit';
      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keysPressed[key] = true;

    if (this.isExploration && (key === 'e' || key === 'enter') && this.currentNearbyZoneId) {
      window.dispatchEvent(
        new CustomEvent('dp-open-hotspot', { detail: this.currentNearbyZoneId })
      );
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.key.toLowerCase()] = false;
  };

  private updatePlayerExploration(dt: number) {
    if (!this.isExploration) return;

    let inputForward = this.virtualMove.z;
    let inputRight = this.virtualMove.x;

    if (this.keysPressed['w'] || this.keysPressed['arrowup']) inputForward -= 1;
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) inputForward += 1;
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) inputRight -= 1;
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) inputRight += 1;

    const speed = (this.keysPressed['shift'] ? 10.5 : 6.0) * dt;
    this.playerIsMoving = false;

    if (Math.abs(inputForward) > 0.01 || Math.abs(inputRight) > 0.01) {
      this.playerWalkTarget = null;
      const len = Math.hypot(inputRight, inputForward) || 1;
      const nx = inputRight / len;
      const nz = inputForward / len;

      const worldDx = nx * this.cosY + nz * this.sinY;
      const worldDz = -nx * this.sinY + nz * this.cosY;

      this.playerPos.x += worldDx * speed;
      this.playerPos.z += worldDz * speed;
      this.playerIsMoving = true;
    } else if (this.playerWalkTarget) {
      const dist = this.moveTowards(this.playerPos, this.playerWalkTarget, speed);
      this.playerIsMoving = true;
      if (dist < 0.25) {
        this.playerWalkTarget = null;
        this.playerIsMoving = false;
      }
    }

    this.playerPos.x = Math.max(-18.0, Math.min(18.0, this.playerPos.x));
    this.playerPos.z = Math.max(-18.0, Math.min(18.0, this.playerPos.z));

    const inMainPool =
      this.playerPos.x >= -7.0 &&
      this.playerPos.x <= 5.0 &&
      this.playerPos.z >= -5.5 &&
      this.playerPos.z <= 1.9;
    const inKidsPool =
      this.playerPos.x >= 9.8 &&
      this.playerPos.x <= 14.6 &&
      this.playerPos.z >= -0.6 &&
      this.playerPos.z <= 3.6;

    this.playerInWater = inMainPool || inKidsPool;
    this.playerPos.y = this.playerInWater ? 0.12 : 0;

    if (this.playerIsMoving) {
      this.targetCamLook.x += (this.playerPos.x - this.targetCamLook.x) * 0.14;
      this.targetCamLook.z += (this.playerPos.z - this.targetCamLook.z) * 0.14;
    }

    let closestZone: (typeof this.hotspots3D)[number] | null = null;
    let closestDist = 3.6;

    for (let i = 0; i < this.hotspots3D.length; i++) {
      const h = this.hotspots3D[i];
      const d = Math.hypot(
        this.playerPos.x - h.interactPos.x,
        this.playerPos.z - h.interactPos.z
      );
      if (d < closestDist) {
        closestDist = d;
        closestZone = h;
      }
    }

    const nextZoneId = closestZone ? closestZone.id : null;
    if (nextZoneId !== this.currentNearbyZoneId) {
      this.currentNearbyZoneId = nextZoneId;
      this.onNearbyZoneUpdate?.(
        closestZone
          ? { id: closestZone.id, title: closestZone.title, icon: closestZone.icon }
          : null
      );
    }
  }

  private updateScreenCoordinates(now: number) {
    if (now - this.lastUiSyncTime < 32) return;
    this.lastUiSyncTime = now;

    const invDpr = 1 / this.dpr;

    if (this.onHotspotUpdate) {
      const coords: HotspotScreenCoord[] = new Array(this.hotspots3D.length);
      for (let i = 0; i < this.hotspots3D.length; i++) {
        const h = this.hotspots3D[i];
        const proj = this.project3D(h.pos.x, h.pos.y, h.pos.z);
        coords[i] = {
          id: h.id,
          title: h.title,
          subtitle: h.subtitle,
          icon: h.icon,
          x: Math.round(proj.x * invDpr * 10) / 10,
          y: Math.round(proj.y * invDpr * 10) / 10,
          visible: proj.visible
        };
      }
      this.onHotspotUpdate(coords);
    }

    if (this.onWorldLabelUpdate) {
      const labels: WorldLabelCoord[] = new Array(this.worldLabels3D.length);
      for (let i = 0; i < this.worldLabels3D.length; i++) {
        const l = this.worldLabels3D[i];
        const proj = this.project3D(l.pos.x, l.pos.y, l.pos.z);
        labels[i] = {
          id: l.id,
          text: l.text,
          subtext: l.subtext,
          x: Math.round(proj.x * invDpr * 10) / 10,
          y: Math.round(proj.y * invDpr * 10) / 10,
          visible: proj.visible,
          variant: l.variant
        };
      }
      this.onWorldLabelUpdate(labels);
    }

    if (this.onNpcBubbleUpdate) {
      const bubbles: NpcStatusBubble[] = [];
      for (let i = 0; i < this.swimsuitNpcs.length; i++) {
        const n = this.swimsuitNpcs[i];
        if (n.timer < 0 || n.state === 'SWIMMING' || !n.statusText) continue;
        const proj = this.project3D(n.pos.x, n.pos.y + 1.9, n.pos.z);
        bubbles.push({
          id: n.id,
          text: n.statusText,
          x: Math.round(proj.x * invDpr * 10) / 10,
          y: Math.round(proj.y * invDpr * 10) / 10,
          visible: proj.visible,
          color: n.statusColor
        });
      }
      this.onNpcBubbleUpdate(bubbles);
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    if (document.hidden) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.elapsed += dt;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.6) {
      this.currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      this.onFpsUpdate?.(this.currentFps);
    }

    this.updatePlayerExploration(dt);

    this.camYaw += (this.targetCamYaw - this.camYaw) * 0.16;
    this.camPitch += (this.targetCamPitch - this.camPitch) * 0.16;
    this.camDistance += (this.targetCamDistance - this.camDistance) * 0.16;
    this.camTarget.x += (this.targetCamLook.x - this.camTarget.x) * 0.16;
    this.camTarget.y += (this.targetCamLook.y - this.camTarget.y) * 0.16;
    this.camTarget.z += (this.targetCamLook.z - this.camTarget.z) * 0.16;

    this.updateCameraTrigCache();

    for (let i = 0; i < this.swimmers.length; i++) {
      const s = this.swimmers[i];
      s.x += s.speed * s.dir * dt;
      if (s.x > 4.8) s.dir = -1;
      if (s.x < -6.8) s.dir = 1;
    }

    this.updateSwimsuitNpcs(dt);

    if (this.lifeguardEmergencyActive) {
      this.lifeguardPhase += dt;
      if (this.lifeguardPhase > 6.0) {
        this.lifeguardEmergencyActive = false;
        this.lifeguardPhase = 0;
        this.lifeguardPos = { x: 10.5, y: 2.2, z: -6.5 };
      }
    }

    this.renderScene(dt);
    this.updateScreenCoordinates(now);
  };

  public dispose() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}
import type { Hotspot, HotspotProjected, Label3D } from '../types';

export const HOTSPOTS_DATA: Hotspot[] = [
  { id: 'reception', title: 'เคาน์เตอร์ต้อนรับ & จุดเช็คอิน', subtitle: 'Check-in · Reception · Membership', short: 'จุดเช็คอิน', icon: 'ScanLine', anchor3d: [0, 5.4, 12.5], cam3d: [0, 6.8, 25], look3d: [0, 2, 12.5] },
  { id: 'locker', title: 'โซนตู้ล็อกเกอร์', subtitle: 'Locker Management · 30 ตู้', short: 'ล็อกเกอร์', icon: 'Lock', anchor3d: [-16, 3.9, 0], cam3d: [-3.5, 6, 9], look3d: [-16, 1.2, 0] },
  { id: 'water', title: 'คุณภาพน้ำ & เซนเซอร์ IoT', subtitle: 'Water Quality Monitor · Capacity Gauge', short: 'คุณภาพน้ำ / IoT', icon: 'Droplets', anchor3d: [12, 4.6, 3], cam3d: [5.5, 5.5, 13], look3d: [11, 2.2, 3] },
  { id: 'lifeguard', title: 'ป้อมไลฟ์การ์ด', subtitle: 'Lifeguard Station · Shift Schedule', short: 'ไลฟ์การ์ด', icon: 'LifeBuoy', anchor3d: [14, 6.6, -8], cam3d: [8, 7.5, 2.5], look3d: [14, 3.6, -8] },
  { id: 'training', title: 'โซนฝึกสอน & คลาสเรียน', subtitle: 'Training Lane · Instructors & Classes', short: 'คลาสว่ายน้ำ', icon: 'GraduationCap', anchor3d: [-8, 3.1, 8], cam3d: [-6, 6.5, 18], look3d: [-8, 1.2, 8] }
];

export const LABELS_DATA: Label3D[] = [
  { t: 'LOCKER ZONE', p: [-16.4, 3.3, 0], c: 'zone3' },
  { t: 'RECEPTION · CHECK-IN', p: [0, 5.0, 12.5], c: 'zone3' },
  { t: 'LIFEGUARD', p: [14, 6.1, -8], c: 'zone3' },
  { t: 'TRAINING LANE', p: [-8, 2.4, 8], c: 'zone3' },
  { t: 'WATER QUALITY', p: [12, 4.3, 3], c: 'zone3' },
  { t: 'SHOWER ROOMS', p: [-17.2, 3.6, -11.3], c: 'zone3' },
  { t: 'KIDS POOL', p: [16.2, 2.8, -2.0], c: 'zone3' },
  { t: 'ทางเข้า-ออก', p: [8, 2.9, 15.5], c: 'zone3' },
  { t: 'สระว่ายน้ำหลัก', p: [0, 0.3, -6.3], c: 'tag3' },
  { t: 'เคาน์เตอร์ต้อนรับ', p: [0, 0.3, 14.8], c: 'tag3' },
  { t: 'จุดยืนยันตัวตน (สแกน QR)', p: [0, 0.25, 15.6], c: 'tag3' },
  { t: 'ล็อกเกอร์', p: [-16.4, 0.3, 8.8], c: 'tag3' },
  { t: 'ป้อมไลฟ์การ์ด', p: [14, 0.3, -5.2], c: 'tag3' },
  { t: 'โซนฝึกสอน', p: [-8, 0.3, 10.8], c: 'tag3' },
  { t: 'เซนเซอร์ IoT', p: [12, 0.3, 4.8], c: 'tag3' },
  { t: 'จุดล้างตัวข้างสระ', p: [2, 0.25, -7.4], c: 'tag3' }, // ย้ายป้ายไปฝั่งตรงข้ามสระ
  { t: 'ห้องอาบน้ำชาย', p: [-15.8, 0.25, -9.8], c: 'tag3' },
  { t: 'ห้องอาบน้ำหญิง', p: [-15.8, 0.25, -12.8], c: 'tag3' },
  { t: 'สระเด็ก & สไลเดอร์', p: [16.2, 0.3, 0.5], c: 'tag3' },
  { t: '7-ELEVEN', p: [15.5, 3.6, 11.6], c: 'tag3' }
];

interface Vec3 { x: number; y: number; z: number; }
interface ViewBasis { f: Vec3; r: Vec3; u: Vec3; }

export class Engine3D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number = 0;
  private isDestroyed = false;

  private VW = 0;
  private VH = 0;
  private VDPR = 1;

  // Camera Orbit Mode
  private camPos: Vec3 = { x: 26, y: 22, z: 30 };
  private camTarget: Vec3 = { x: 0, y: 1, z: 0 };
  private camAnim: any = null;

  // Smooth Player Mode State
  private isPlayer = false;
  private playerPos: Vec3 = { x: 8, y: 1.65, z: 16.2 };
  private playerVel: Vec3 = { x: 0, y: 0, z: 0 };
  private playerYaw = 0;
  private playerPitch = -0.05;
  private moveInput = { forward: 0, strafe: 0, sprint: false };
  private baseSpeed = 5.8;

  // Emergency Action State
  private isEmergency = false;

  private viewB: ViewBasis = { f: {x:0,y:0,z:0}, r: {x:0,y:0,z:0}, u: {x:0,y:0,z:0} };
  private focal = 1;
  private ccx = 0;
  private ccy = 0;

  private prims: any[] = [];
  private lastT = performance.now();
  private fc = 0;
  private ft = performance.now();

  private onProjectHotspots: (items: HotspotProjected[]) => void;
  private onProjectLabels: (items: Label3D[]) => void;
  private onFpsUpdate: (fps: number) => void;

  private LIGHT = this.vnorm(this.V3(-0.45, 0.85, -0.28));
  private colCache: Record<string, number[]> = {};

  private POOL = { x0: -9.9, x1: 9.9, z0: -4.9, z1: 4.9 };
  private DECK_EDGE = 5.6;
  private OBSTACLES = [
    [-3.95, 11.70, 3.95, 13.35],
    [-18.50, -11.20, -15.90, -8.40],
    [-18.50, -14.20, -15.90, -11.40],
    [-17.10, -8.00, -15.60, 8.00],
    [-14.40, -2.80, -13.60, 2.80],
    [-18.70, 9.30, -17.30, 10.70],
    [12.80, -9.20, 15.20, -6.80],
    [11.70, 2.70, 12.30, 3.30],
    [-3.35, 13.75, -3.05, 14.05],
    [-3.35, 14.85, -3.05, 15.15],
    [3.05, 13.75, 3.35, 14.05],
    [3.05, 14.85, 3.35, 15.15],
    [12.0, 11.5, 18.5, 16.5],
    [13.4, -4.2, 19.0, 0.2]
  ];

  // 🚿 จุดล้างตัวข้างสระ ย้ายไปฝั่งตรงข้ามสระ (z = -6.5, stand = -6.15)
  private RINSE_STATIONS = [
    { x: -3, z: -6.5, stand: -6.15 },
    { x: 2, z: -6.5, stand: -6.15 },
    { x: 7, z: -6.5, stand: -6.15 }
  ];

  private ENTRANCE = { x: 8, z: 16.2 };
  private CHECKIN_POINTS = [ {x: -1.5, z: 13.9}, {x: 1.5, z: 13.9} ];
  private SHOWER_DOOR = { m: {x: -15.2, z: -9.8}, f: {x: -15.2, z: -12.8} };
  private CORRIDOR_X = -14.6;
  private LOCKER_FRONT = -15.5;
  private LANES = [-3.33, -1.67, 0, 1.67];

  private agents: any[] = [];
  private particles: any[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onProjectHotspots: (items: HotspotProjected[]) => void;
      onProjectLabels: (items: Label3D[]) => void;
      onFpsUpdate: (fps: number) => void;
    }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onProjectHotspots = callbacks.onProjectHotspots;
    this.onProjectLabels = callbacks.onProjectLabels;
    this.onFpsUpdate = callbacks.onFpsUpdate;

    this.initAgents();
    this.initParticles();
    this.resize();
    this.flyTo([26, 22, 30], [0, 1, 0], 2.0);
    this.loop(performance.now());
  }

  public setPlayerMode(active: boolean) {
    this.isPlayer = active;
    if (active) {
      this.camAnim = null;
      this.playerPos = { x: 8, y: 1.65, z: 16.2 };
      this.playerVel = { x: 0, y: 0, z: 0 };
      this.playerYaw = 0;
      this.playerPitch = -0.05;
      this.moveInput = { forward: 0, strafe: 0, sprint: false };
    } else {
      this.flyTo([26, 22, 30], [0, 1, 0], 1.5);
    }
  }

  public setMoveInput(forward: number, strafe: number, sprint = false) {
    this.moveInput.forward = forward;
    this.moveInput.strafe = strafe;
    this.moveInput.sprint = sprint;
  }

  public rotatePlayerLook(dx: number, dy: number) {
    this.playerYaw -= dx * 0.0032;
    this.playerPitch = Math.min(0.65, Math.max(-0.65, this.playerPitch - dy * 0.0028));
  }

  public setEmergency(active: boolean) {
    this.isEmergency = active;
  }

  public resize() {
    this.VDPR = Math.min(2, window.devicePixelRatio || 1);
    this.VW = window.innerWidth;
    this.VH = window.innerHeight;
    this.canvas.width = this.VW * this.VDPR;
    this.canvas.height = this.VH * this.VDPR;
    this.canvas.style.width = this.VW + 'px';
    this.canvas.style.height = this.VH + 'px';
  }

  public flyTo(pos: [number, number, number], look: [number, number, number], dur = 1.15) {
    if (this.isPlayer) return;
    this.camAnim = {
      fP: { ...this.camPos },
      tP: { x: pos[0], y: pos[1], z: pos[2] },
      fL: { ...this.camTarget },
      tL: { x: look[0], y: look[1], z: look[2] },
      t: 0,
      dur
    };
  }

  public rotateCamera(dx: number, dy: number) {
    if (this.isPlayer) {
      this.rotatePlayerLook(dx, dy);
      return;
    }
    const off = { x: this.camPos.x - this.camTarget.x, y: this.camPos.y - this.camTarget.y, z: this.camPos.z - this.camTarget.z };
    const dist = Math.hypot(off.x, off.y, off.z);
    let yaw = Math.atan2(off.x, off.z) - dx * 0.005;
    let pitch = Math.min(1.45, Math.max(0.06, Math.asin(Math.min(1, Math.max(-1, off.y / dist))) + dy * 0.004));
    this.camPos = {
      x: this.camTarget.x + dist * Math.cos(pitch) * Math.sin(yaw),
      y: this.camTarget.y + dist * Math.sin(pitch),
      z: this.camTarget.z + dist * Math.cos(pitch) * Math.cos(yaw)
    };
    this.camAnim = null;
  }

  public zoomCamera(deltaY: number) {
    if (this.isPlayer) return;
    const off = { x: this.camPos.x - this.camTarget.x, y: this.camPos.y - this.camTarget.y, z: this.camPos.z - this.camTarget.z };
    const dist = Math.min(90, Math.max(8, Math.hypot(off.x, off.y, off.z) * (1 + deltaY * 0.0012)));
    const l = Math.hypot(off.x, off.y, off.z) || 1;
    const dir = { x: off.x / l, y: off.y / l, z: off.z / l };
    this.camPos = {
      x: this.camTarget.x + dir.x * dist,
      y: this.camTarget.y + dir.y * dist,
      z: this.camTarget.z + dir.z * dist
    };
    this.camAnim = null;
  }

  private V3(x: number, y: number, z: number): Vec3 { return { x, y, z }; }
  private vsub(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
  private vcross(a: Vec3, b: Vec3): Vec3 { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
  private vdot(a: Vec3, b: Vec3): number { return a.x * b.x + a.y * b.y + a.z * b.z; }
  private vnorm(a: Vec3): Vec3 { const l = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; }
  private vlerp(a: Vec3, b: Vec3, t: number): Vec3 { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }; }

  public project(p: Vec3): { x: number; y: number; z: number } | null {
    const d = this.vsub(p, this.camPos);
    const z = this.vdot(d, this.viewB.f);
    if (z < 0.25) return null;
    return {
      x: this.ccx + (this.vdot(d, this.viewB.r) * this.focal) / z,
      y: this.ccy - (this.vdot(d, this.viewB.u) * this.focal) / z,
      z
    };
  }

  private rgba(hex: string, f: number, a: number) {
    let c = this.colCache[hex];
    if (!c) {
      c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
      this.colCache[hex] = c;
    }
    return `rgba(${Math.min(255, (c[0] * f) | 0)},${Math.min(255, (c[1] * f) | 0)},${Math.min(255, (c[2] * f) | 0)},${a})`;
  }

  private nAuto(p: Vec3[]) { return this.vnorm(this.vcross(this.vsub(p[1], p[0]), this.vsub(p[2], p[0]))); }
  private quad(pts: Vec3[], color: string, opt: any = {}) {
    const q = Object.assign({ t: 'q', pts, color, n: opt && opt.n ? opt.n : this.nAuto(pts) }, opt);
    this.prims.push(q);
    return q;
  }
  private sprite(p: Vec3, r: number, color: string, opt: any = {}) {
    const s = Object.assign({ t: 's', p, r, color }, opt);
    this.prims.push(s);
    return s;
  }
  private line(a: Vec3, b: Vec3, color: string, w: number, opt: any = {}) {
    const l = Object.assign({ t: 'l', a, b, color, w }, opt);
    this.prims.push(l);
    return l;
  }
  private box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: string) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([this.V3(x0, y1, z0), this.V3(x1, y1, z0), this.V3(x1, y1, z1), this.V3(x0, y1, z1)], color, { n: this.V3(0, 1, 0) });
    this.quad([this.V3(x0, y0, z0), this.V3(x1, y0, z0), this.V3(x1, y0, z1), this.V3(x0, y0, z1)], color, { n: this.V3(0, -1, 0) });
    this.quad([this.V3(x0, y0, z0), this.V3(x1, y0, z0), this.V3(x1, y1, z0), this.V3(x0, y1, z0)], color, { n: this.V3(0, 0, -1) });
    this.quad([this.V3(x0, y0, z1), this.V3(x1, y0, z1), this.V3(x1, y1, z1), this.V3(x0, y1, z1)], color, { n: this.V3(0, 0, 1) });
    this.quad([this.V3(x0, y0, z0), this.V3(x0, y0, z1), this.V3(x0, y1, z1), this.V3(x0, y1, z0)], color, { n: this.V3(-1, 0, 0) });
    this.quad([this.V3(x1, y0, z0), this.V3(x1, y0, z1), this.V3(x1, y1, z1), this.V3(x1, y1, z0)], color, { n: this.V3(1, 0, 0) });
  }
  private deckRect(x0: number, z0: number, x1: number, z1: number, nx: number, nz: number) {
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const ax = x0 + ((x1 - x0) * i) / nx, bx = x0 + ((x1 - x0) * (i + 1)) / nx;
        const az = z0 + ((z1 - z0) * j) / nz, bz = z0 + ((z1 - z0) * (j + 1)) / nz;
        this.quad([this.V3(ax, 0, az), this.V3(bx, 0, az), this.V3(bx, 0, bz), this.V3(ax, 0, bz)], ((i + j) & 1) ? '#d7dee5' : '#e0e7ed', {
          n: this.V3(0, 1, 0), stroke: 'rgba(255,255,255,.35)', lw: 1
        });
      }
    }
  }

  private wave(x: number, z: number, t: number) {
    return -0.22 + 0.06 * Math.sin(t * 1.6 + x * 0.7) + 0.045 * Math.cos(t * 2.1 + z * 1.1) + 0.03 * Math.sin(t * 0.9 + (x + z) * 0.5);
  }

  private isInWater(a: { x: number; z: number }) {
    return a.x > this.POOL.x0 && a.x < this.POOL.x1 && a.z > this.POOL.z0 && a.z < this.POOL.z1;
  }
  private pushOutOfObstacles(a: { x: number; z: number }) {
    for (const [x0, z0, x1, z1] of this.OBSTACLES) {
      if (a.x > x0 && a.x < x1 && a.z > z0 && a.z < z1) {
        const dl = a.x - x0, dr = x1 - a.x, dt = a.z - z0, db = z1 - a.z;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) a.x = x0 - 0.08;
        else if (m === dr) a.x = x1 + 0.08;
        else if (m === dt) a.z = z0 - 0.08;
        else a.z = z1 + 0.08;
      }
    }
  }
  private pushOutOfPool(a: { x: number; z: number }) {
    if (this.isInWater(a)) {
      const dT = a.z - this.POOL.z0, dB = this.POOL.z1 - a.z, dL = a.x - this.POOL.x0, dR = this.POOL.x1 - a.x;
      const m = Math.min(dT, dB, dL, dR);
      if (m === dT) a.z = this.POOL.z0 - 0.22;
      else if (m === dB) a.z = this.POOL.z1 + 0.22;
      else if (m === dL) a.x = this.POOL.x0 - 0.22;
      else a.x = this.POOL.x1 + 0.22;
    }
  }

  private dropShadow(x: number, z: number, r: number, alpha = 0.35) {
    const N = 8; const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push(this.V3(x + Math.cos(a) * r * 1.2, 0.01, z + Math.sin(a) * r));
    }
    this.quad(pts, '#000000', { n: this.V3(0, 1, 0), alpha });
  }

  private drawPalmTree(x: number, z: number, scale = 1, seed = 0) {
    const trunkH = 5 * scale; const segments = 5;
    for (let i = 0; i < segments; i++) {
      const y = (i * trunkH) / segments;
      const bendX = Math.sin(i * 0.3 + seed) * 0.3 * scale;
      const bendZ = Math.cos(i * 0.2 + seed) * 0.2 * scale;
      const segR = (0.28 - i * 0.04) * scale;
      this.box(x + bendX, y + trunkH / (2 * segments), z + bendZ, segR * 2, trunkH / segments, segR * 2, '#7a5230');
    }
    const topY = trunkH;
    const leafColors = ['#22c55e', '#16a34a', '#15803d', '#166534'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + seed;
      const leafLen = 2.8 * scale;
      for (let j = 0; j < 4; j++) {
        const tt = j / 3;
        this.sprite(this.V3(x + Math.cos(angle) * leafLen * tt, topY + Math.sin(tt * Math.PI * 0.6) * 0.5 * scale - tt * 0.8 * scale, z + Math.sin(angle) * leafLen * tt),
          0.5 * scale * (1 - tt * 0.4), leafColors[(i + j) % leafColors.length], { alpha: 0.95 });
      }
    }
  }

  private drawLounger(x: number, z: number, angle = 0) {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const basePts = [this.V3(-0.9, 0.2, -0.35), this.V3(0.9, 0.2, -0.35), this.V3(0.9, 0.2, 0.35), this.V3(-0.9, 0.2, 0.35)]
      .map(p => this.V3(x + p.x * ca - p.z * sa, p.y, z + p.x * sa + p.z * ca));
    this.quad(basePts, '#f5f7fa', { n: this.V3(0, 1, 0) });
    for (const lx of [-0.7, 0.7]) for (const lz of [-0.25, 0.25]) {
      this.line(this.V3(x + lx * ca - lz * sa, 0, z + lx * sa + lz * ca), this.V3(x + lx * ca - lz * sa, 0.2, z + lx * sa + lz * ca), '#94a3b8', 0.04);
    }
    const backPts = [this.V3(-0.9, 0.2, -0.35), this.V3(-0.9, 0.8, -0.15), this.V3(-0.9, 0.8, 0.15), this.V3(-0.9, 0.2, 0.35)]
      .map(p => this.V3(x + p.x * ca - p.z * sa, p.y, z + p.x * sa + p.z * ca));
    this.quad(backPts, '#e2e8f0', { n: this.V3(-1, 0, 0) });
    const cushionPts = [this.V3(-0.85, 0.28, -0.32), this.V3(0.85, 0.28, -0.32), this.V3(0.85, 0.28, 0.32), this.V3(-0.85, 0.28, 0.32)]
      .map(p => this.V3(x + p.x * ca - p.z * sa, p.y, z + p.x * sa + p.z * ca));
    this.quad(cushionPts, '#fbbf24', { n: this.V3(0, 1, 0), alpha: 0.9 });
  }

  private drawUmbrella(x: number, z: number, color = '#ef4444', stripeColor = '#ffffff', poleHeight = 2.8) {
    this.line(this.V3(x, 0, z), this.V3(x, poleHeight, z), '#8b7355', 0.08);
    const r = 1.8;
    for (let i = 0; i < 8; i++) {
      const a1 = (i / 8) * Math.PI * 2, a2 = ((i + 1) / 8) * Math.PI * 2;
      const col = i % 2 === 0 ? color : stripeColor;
      this.quad([
        this.V3(x, poleHeight, z),
        this.V3(x + Math.cos(a1) * r, poleHeight - 0.2, z + Math.sin(a1) * r),
        this.V3(x + Math.cos((a1 + a2) / 2) * r * 1.05, poleHeight - 0.35, z + Math.sin((a1 + a2) / 2) * r * 1.05),
        this.V3(x + Math.cos(a2) * r, poleHeight - 0.2, z + Math.sin(a2) * r)
      ], col, { n: this.V3(0, 1, 0), alpha: 0.95 });
    }
  }

  private drawCloud(x: number, y: number, z: number, scale = 1) {
    [{dx: 0, dy: 0, r: 1.5}, {dx: 1.2, dy: 0.2, r: 1.2}, {dx: -1.1, dy: -0.1, r: 1.3}]
      .forEach(p => this.sprite(this.V3(x + p.dx * scale, y + p.dy * scale, z), p.r * scale, '#ffffff', { alpha: 0.85 }));
  }

  private drawBush(x: number, z: number, scale = 1, seed = 0) {
    const colors = ['#16a34a', '#15803d', '#22c55e', '#166534'];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + seed;
      const r = 0.4 * scale * (0.7 + (((seed * 13 + i * 7) % 10) / 14));
      this.sprite(this.V3(x + Math.cos(a) * 0.3 * scale, 0.3 * scale, z + Math.sin(a) * 0.3 * scale), r, colors[i % 4], { alpha: 0.9 });
    }
    this.sprite(this.V3(x, 0.4 * scale, z), 0.5 * scale, '#16a34a');
  }

  // 🚿 วาดเสาฝักบัวล้างตัว (ปรับให้หันหัวฝักบัวเข้าหาสระอย่างถูกต้อง ไม่ว่าจะอยู่ฝั่งใด)
  private drawShowerStation(s: {x: number; z: number}, t: number, occupied: boolean) {
    const fz = s.z < 0 ? 1 : -1; // ถ้าอยู่ฝั่ง z < 0 ให้หันหัวฝักบัวเข้าหาด้านใน (+Z)
    this.line(this.V3(s.x, 0, s.z), this.V3(s.x, 2.1, s.z), '#94a3b8', 0.07);
    this.line(this.V3(s.x, 2.1, s.z), this.V3(s.x, 2.1, s.z + fz * 0.35), '#94a3b8', 0.06);
    this.sprite(this.V3(s.x, 2.05, s.z + fz * 0.35), 0.13, '#cbd5e1');
    this.quad([
      this.V3(s.x - 0.35, 0.015, s.z + fz * 0.7),
      this.V3(s.x + 0.35, 0.015, s.z + fz * 0.7),
      this.V3(s.x + 0.35, 0.015, s.z),
      this.V3(s.x - 0.35, 0.015, s.z)
    ], '#8fa3b0', { n: this.V3(0, 1, 0), alpha: 0.8 });
    this.box(s.x, 1.35, s.z - fz * 0.08, 0.3, 0.22, 0.05, '#0ea5e9');

    if (occupied) {
      for (let i = 0; i < 8; i++) {
        const ph = (t * 2.2 + i * 0.37) % 1;
        const dy = 2.0 - ph * 1.85;
        const dx = Math.sin(i * 2.1) * 0.16 * (ph + 0.2);
        const dz = Math.cos(i * 1.7) * 0.14 * (ph + 0.2);
        this.sprite(this.V3(s.x + dx, dy, s.z + fz * 0.35 + dz), 0.035, '#bfe3f2', { alpha: 0.85 * (1 - ph * 0.5) });
      }
      this.sprite(this.V3(s.x, 0.02, s.z + fz * 0.35), 0.4 + Math.sin(t * 6) * 0.05, '#7fc9e8', { alpha: 0.35 });
    }
  }

  private drawShowerRoom(cx: number, cz: number, signColor: string) {
    this.box(cx, 1.3, cz, 2.2, 2.6, 2.6, '#e2e8f0');
    this.box(cx, 2.75, cz, 2.6, 0.2, 3.0, '#94a3b8');
    const fx = cx + 1.12;
    this.quad([
      this.V3(fx, 0, cz - 0.45),
      this.V3(fx, 0, cz + 0.45),
      this.V3(fx, 2.0, cz + 0.45),
      this.V3(fx, 2.0, cz - 0.45)
    ], '#334155', { n: this.V3(1, 0, 0) });
    this.sprite(this.V3(fx + 0.04, 1.0, cz - 0.3), 0.05, '#cbd5e1');
    this.box(fx + 0.05, 2.3, cz, 0.08, 0.5, 1.0, signColor);
    this.quad([
      this.V3(fx, 2.05, cz - 0.5),
      this.V3(fx + 0.4, 2.0, cz - 0.5),
      this.V3(fx + 0.4, 2.0, cz + 0.5),
      this.V3(fx, 2.05, cz + 0.5)
    ], '#94a3b8', { n: this.V3(0, 1, 0) });
  }

  private drawEntranceGate(t: number) {
    this.box(6.8, 1.1, 15.5, 0.25, 2.2, 0.25, '#334155');
    this.box(9.2, 1.1, 15.5, 0.25, 2.2, 0.25, '#334155');
    this.box(8, 2.35, 15.5, 2.8, 0.4, 0.3, '#0ea5e9');
    this.sprite(this.V3(8, 2.35, 15.32), 0.08 + Math.sin(t * 3) * 0.02, '#22d3ee', { alpha: 0.9 });
    this.line(this.V3(8, 1.0, 15.5), this.V3(8, 1.0, 14.7), '#94a3b8', 0.06);
    this.sprite(this.V3(8, 1.0, 14.7), 0.09, '#22d3ee');
  }

  private drawCheckinPoint(t: number) {
    this.sprite(this.V3(-1.5, 0.02, 13.9), 0.55, '#22d3ee', { alpha: 0.22 });
    this.sprite(this.V3(1.5, 0.02, 13.9), 0.55, '#22d3ee', { alpha: 0.22 });
    this.sprite(this.V3(0.0, 0.02, 14.6), 0.55, '#22d3ee', { alpha: 0.16 });
    [[-3.2, 13.9], [-3.2, 15.0], [3.2, 13.9], [3.2, 15.0]].forEach(([x, z]) => {
      this.line(this.V3(x, 0, z), this.V3(x, 0.95, z), '#475569', 0.06);
      this.sprite(this.V3(x, 0.98, z), 0.09, '#94a3b8');
    });
    this.line(this.V3(-3.2, 0.85, 13.9), this.V3(-3.2, 0.85, 15.0), '#0ea5e9', 0.05);
    this.line(this.V3(3.2, 0.85, 13.9), this.V3(3.2, 0.85, 15.0), '#0ea5e9', 0.05);
    this.box(0, 1.05, 14.6, 0.35, 0.9, 0.3, '#334155');
    this.box(0, 1.55, 14.45, 0.4, 0.35, 0.06, '#0f172a');
    const bl = 0.5 + 0.5 * Math.sin(t * 4);
    this.sprite(this.V3(0, 1.55, 14.42), 0.09 + bl * 0.03, '#22d3ee', { alpha: 0.6 + bl * 0.4 });
  }

  private drawPaths() {
    const P = '#c3ccd6';
    this.quad([this.V3(7, 0.02, 6.3), this.V3(9, 0.02, 6.3), this.V3(9, 0.02, 15.0), this.V3(7, 0.02, 15.0)], P, { n: this.V3(0, 1, 0), alpha: 0.75 });
    this.quad([this.V3(-13, 0.02, 6.0), this.V3(12, 0.02, 6.0), this.V3(12, 0.02, 6.7), this.V3(-13, 0.02, 6.7)], P, { n: this.V3(0, 1, 0), alpha: 0.65 });
    this.quad([this.V3(-15.6, 0.02, 10.2), this.V3(12, 0.02, 10.2), this.V3(12, 0.02, 10.8), this.V3(-15.6, 0.02, 10.8)], P, { n: this.V3(0, 1, 0), alpha: 0.65 });
    this.quad([this.V3(-15.6, 0.02, -14.2), this.V3(-14.0, 0.02, -14.2), this.V3(-14.0, 0.02, 10.8), this.V3(-15.6, 0.02, 10.8)], P, { n: this.V3(0, 1, 0), alpha: 0.65 });
    this.quad([this.V3(-3.0, 0.02, 13.6), this.V3(3.0, 0.02, 13.6), this.V3(3.0, 0.02, 15.0), this.V3(-3.0, 0.02, 15.0)], P, { n: this.V3(0, 1, 0), alpha: 0.6 });
    this.quad([this.V3(-3.0, 0.02, 15.3), this.V3(8.8, 0.02, 15.3), this.V3(8.8, 0.02, 15.9), this.V3(-3.0, 0.02, 15.9)], P, { n: this.V3(0, 1, 0), alpha: 0.6 });
    this.quad([this.V3(7.2, 0.02, 15.0), this.V3(8.8, 0.02, 15.0), this.V3(8.8, 0.02, 16.4), this.V3(7.2, 0.02, 16.4)], P, { n: this.V3(0, 1, 0), alpha: 0.6 });
  }

  // 🏊‍♂️ สระว่ายน้ำสำหรับเด็ก
  private drawKidsPool(t: number) {
    const kx0 = 13.5, kx1 = 18.9;
    const kz0 = -4.0, kz1 = 0.0;
    const cx = (kx0 + kx1) / 2, cz = (kz0 + kz1) / 2;

    this.quad([
      this.V3(kx0, -0.55, kz0),
      this.V3(kx1, -0.55, kz0),
      this.V3(kx1, -0.55, kz1),
      this.V3(kx0, -0.55, kz1)
    ], '#38bdf8', { n: this.V3(0, 1, 0) });

    for (let i = 0; i < 4; i++) {
      const mx = kx0 + 0.8 + i * 1.2;
      this.sprite(this.V3(mx, -0.54, cz), 0.22, i % 2 === 0 ? '#fde047' : '#ec4899', { alpha: 0.8 });
    }

    this.quad([this.V3(kx0, 0, kz0), this.V3(kx1, 0, kz0), this.V3(kx1, -0.55, kz0), this.V3(kx0, -0.55, kz0)], '#0284c7', { n: this.V3(0, 0, 1) });
    this.quad([this.V3(kx0, 0, kz1), this.V3(kx1, 0, kz1), this.V3(kx1, -0.55, kz1), this.V3(kx0, -0.55, kz1)], '#0284c7', { n: this.V3(0, 0, -1) });
    this.quad([this.V3(kx0, 0, kz0), this.V3(kx0, 0, kz1), this.V3(kx0, -0.55, kz1), this.V3(kx0, -0.55, kz0)], '#0284c7', { n: this.V3(1, 0, 0) });
    this.quad([this.V3(kx1, 0, kz0), this.V3(kx1, 0, kz1), this.V3(kx1, -0.55, kz1), this.V3(kx1, -0.55, kz0)], '#0284c7', { n: this.V3(-1, 0, 0) });

    const kwy = -0.14 + 0.025 * Math.sin(t * 2.4);
    this.quad([
      this.V3(kx0 + 0.05, kwy, kz0 + 0.05),
      this.V3(kx1 - 0.05, kwy, kz0 + 0.05),
      this.V3(kx1 - 0.05, kwy, kz1 - 0.05),
      this.V3(kx0 + 0.05, kwy, kz1 - 0.05)
    ], '#67e8f9', { n: this.V3(0, 1, 0), alpha: 0.82 });

    this.sprite(this.V3(cx - 0.8, kwy + 0.01, cz - 0.6), 0.35 + Math.sin(t * 3) * 0.08, '#ffffff', { alpha: 0.3 });
    this.sprite(this.V3(cx + 0.9, kwy + 0.01, cz + 0.5), 0.3 + Math.cos(t * 2.8) * 0.06, '#ffffff', { alpha: 0.28 });

    this.line(this.V3(kx0 - 0.15, 0.08, kz0 - 0.15), this.V3(kx1 + 0.15, 0.08, kz0 - 0.15), '#facc15', 0.28);
    this.line(this.V3(kx0 - 0.15, 0.08, kz1 + 0.15), this.V3(kx1 + 0.15, 0.08, kz1 + 0.15), '#facc15', 0.28);
    this.line(this.V3(kx0 - 0.15, 0.08, kz0 - 0.15), this.V3(kx0 - 0.15, 0.08, kz1 + 0.15), '#facc15', 0.28);
    this.line(this.V3(kx1 + 0.15, 0.08, kz0 - 0.15), this.V3(kx1 + 0.15, 0.08, kz1 + 0.15), '#facc15', 0.28);

    const slX = 18.2, slZ = -3.4;
    this.box(slX, 0.65, slZ, 0.6, 1.3, 0.6, '#38bdf8');
    this.box(slX, 1.35, slZ, 0.75, 0.12, 0.75, '#0284c7');
    this.line(this.V3(slX + 0.35, 0, slZ), this.V3(slX + 0.35, 1.3, slZ), '#94a3b8', 0.05);

    this.quad([
      this.V3(slX - 0.3, 1.3, slZ - 0.25),
      this.V3(slX - 0.3, 1.3, slZ + 0.25),
      this.V3(slX - 1.8, 0.05, slZ + 0.25),
      this.V3(slX - 1.8, 0.05, slZ - 0.25)
    ], '#ea580c', { n: this.V3(0, 1, 0) });
    this.line(this.V3(slX - 0.3, 1.5, slZ + 0.25), this.V3(slX - 1.8, 0.25, slZ + 0.25), '#facc15', 0.08);
    this.line(this.V3(slX - 0.3, 1.5, slZ - 0.25), this.V3(slX - 1.8, 0.25, slZ - 0.25), '#facc15', 0.08);

    const mshX = 15.6, mshZ = -2.2;
    this.line(this.V3(mshX, 0, mshZ), this.V3(mshX, 1.7, mshZ), '#06b6d4', 0.12);
    this.sprite(this.V3(mshX, 1.75, mshZ), 0.75, '#ef4444');
    [[-0.3, 0.15], [0.3, 0.15], [0, 0.35], [-0.2, -0.15], [0.2, -0.15]].forEach(([dx, dz]) => {
      this.sprite(this.V3(mshX + dx, 1.85, mshZ + dz), 0.1, '#ffffff');
    });

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t * 0.8;
      const dropY = 1.6 - ((t * 2.5 + i * 0.4) % 1.5);
      const dropR = 0.65 + (1.6 - dropY) * 0.35;
      this.sprite(this.V3(mshX + Math.cos(a) * dropR, dropY, mshZ + Math.sin(a) * dropR), 0.045, '#bae6fd', { alpha: 0.85 });
    }
    this.sprite(this.V3(mshX, kwy + 0.01, mshZ), 0.7 + Math.sin(t * 4) * 0.1, '#38bdf8', { ring: '#ffffff', ringw: 0.05, alpha: 0.5 });

    const duckX = 14.6, duckZ = -1.1;
    this.sprite(this.V3(duckX, kwy + 0.05, duckZ), 0.25, '#facc15', { ring: '#eab308', ringw: 0.06 });
    this.sprite(this.V3(duckX + 0.16, kwy + 0.18, duckZ), 0.12, '#facc15');
    this.sprite(this.V3(duckX + 0.25, kwy + 0.16, duckZ), 0.06, '#f97316');

    this.sprite(this.V3(17.3, kwy + 0.05, -1.2), 0.26, '#ec4899', { ring: '#f472b6', ringw: 0.07 });
    this.sprite(this.V3(16.5, kwy + 0.12, -0.6), 0.16, '#f43f5e', { ring: '#3b82f6', ringw: 0.05 });

    const slideCycle = (t * 0.8) % 1;
    const kid1X = slX - 0.4 - slideCycle * 1.3;
    const kid1Y = 1.15 - slideCycle * 1.0;
    this.drawPerson(kid1X, kid1Y, slZ, '#f6d7b0', '#06b6d4', '#0284c7', {
      scale: 0.68, capColor: '#06b6d4', hasCap: true, noLegSwing: true, armPhase: t * 8
    });
    if (slideCycle > 0.85) {
      this.sprite(this.V3(kid1X - 0.2, kwy + 0.1, slZ), 0.25, '#ffffff', { alpha: 0.85 });
    }

    const kid2Bob = Math.sin(t * 3.5) * 0.03;
    this.drawPerson(duckX - 0.08, kwy + 0.15 + kid2Bob, duckZ, '#f6d7b0', '#ec4899', '#ec4899', {
      scale: 0.65, hasCap: true, capColor: '#f472b6', noLegSwing: false, armPhase: t * 5
    });
    this.sprite(this.V3(duckX - 0.35, kwy + 0.02, duckZ), 0.15, '#ffffff', { alpha: 0.7 });

    const kid3Bob = Math.sin(t * 3) * 0.02;
    this.drawPerson(mshX + 0.45, 0.45 + kid3Bob, mshZ + 0.35, '#d4a574', '#10b981', '#047857', {
      scale: 0.68, hasHair: true, hairColor: '#1e293b', noLegSwing: true, armPhase: t * 6
    });

    const kid4Splash = Math.sin(t * 5) * 0.04;
    this.drawPerson(14.8, 0.48 + kid4Splash, -3.0, '#f6d7b0', '#eab308', '#ca8a04', {
      scale: 0.62, hasFloat: true, floatColor: '#ea580c', noLegSwing: false, armPhase: t * 10
    });
    this.sprite(this.V3(14.8, kwy + 0.08, -3.0), 0.25 + Math.sin(t * 6) * 0.05, '#ffffff', { alpha: 0.75 });

    this.drawPerson(14.2, 0.58, 0.25, '#f6d7b0', '#a855f7', '#6b21a8', {
      scale: 0.88, hasHair: true, hairColor: '#3a2414', hasSunglasses: true, noLegSwing: true
    });
  }

  private drawSevenEleven(t: number) {
    const cx = 15.2, cz = 13.8;
    const sx = 5.2, sy = 2.8, sz = 4.2;

    this.quad([
      this.V3(cx - sx / 2 - 0.4, 0.03, cz - sz / 2 - 0.6),
      this.V3(cx + sx / 2 + 0.4, 0.03, cz - sz / 2 - 0.6),
      this.V3(cx + sx / 2 + 0.4, 0.03, cz + sz / 2 + 0.4),
      this.V3(cx - sx / 2 - 0.4, 0.03, cz + sz / 2 + 0.4)
    ], '#cbd5e1', { n: this.V3(0, 1, 0) });

    this.box(cx, sy / 2, cz, sx, sy, sz, '#f8fafc');
    this.box(cx, sy + 0.1, cz, sx + 0.5, 0.22, sz + 0.5, '#e2e8f0');

    const fz = cz - sz / 2 - 0.02;
    const fx0 = cx - sx / 2 - 0.25, fx1 = cx + sx / 2 + 0.25;
    const topY = sy + 0.2;

    this.box(cx, topY - 0.25, fz + 0.1, sx + 0.5, 0.55, 0.25, '#ffffff');
    this.quad([this.V3(fx0, topY - 0.08, fz - 0.03), this.V3(fx1, topY - 0.08, fz - 0.03), this.V3(fx1, topY, fz - 0.03), this.V3(fx0, topY, fz - 0.03)], '#ea580c', { n: this.V3(0, 0, -1) });
    this.quad([this.V3(fx0, topY - 0.18, fz - 0.03), this.V3(fx1, topY - 0.18, fz - 0.03), this.V3(fx1, topY - 0.08, fz - 0.03), this.V3(fx0, topY - 0.08, fz - 0.03)], '#16a34a', { n: this.V3(0, 0, -1) });
    this.quad([this.V3(fx0, topY - 0.26, fz - 0.03), this.V3(fx1, topY - 0.26, fz - 0.03), this.V3(fx1, topY - 0.18, fz - 0.03), this.V3(fx0, topY - 0.18, fz - 0.03)], '#dc2626', { n: this.V3(0, 0, -1) });

    const sx0 = cx - sx / 2 - 0.15;
    const sz0 = cz - sz / 2 - 0.25, sz1 = cz + sz / 2 + 0.25;
    this.quad([this.V3(sx0, topY - 0.08, sz0), this.V3(sx0, topY - 0.08, sz1), this.V3(sx0, topY, sz1), this.V3(sx0, topY, sz0)], '#ea580c', { n: this.V3(-1, 0, 0) });
    this.quad([this.V3(sx0, topY - 0.18, sz0), this.V3(sx0, topY - 0.18, sz1), this.V3(sx0, topY - 0.08, sz1), this.V3(sx0, topY - 0.08, sz0)], '#16a34a', { n: this.V3(-1, 0, 0) });
    this.quad([this.V3(sx0, topY - 0.26, sz0), this.V3(sx0, topY - 0.26, sz1), this.V3(sx0, topY - 0.18, sz1), this.V3(sx0, topY - 0.18, sz0)], '#dc2626', { n: this.V3(-1, 0, 0) });

    this.box(cx, topY - 0.25, fz - 0.06, 0.7, 0.48, 0.08, '#ffffff');
    this.box(cx, topY - 0.25, fz - 0.11, 0.58, 0.4, 0.02, '#15803d');
    this.sprite(this.V3(cx, topY - 0.25, fz - 0.14), 0.14, '#ea580c');

    this.quad([
      this.V3(cx - 2.2, 0.35, fz - 0.01),
      this.V3(cx + 2.2, 0.35, fz - 0.01),
      this.V3(cx + 2.2, 2.1, fz - 0.01),
      this.V3(cx - 2.2, 2.1, fz - 0.01)
    ], '#bae6fd', { n: this.V3(0, 0, -1), alpha: 0.75 });

    this.box(cx - 0.8, 1.1, fz - 0.02, 1.4, 1.7, 0.04, '#38bdf8');
    this.line(this.V3(cx - 1.4, 1.1, fz - 0.05), this.V3(cx - 0.2, 1.1, fz - 0.05), '#16a34a', 0.05);
    this.line(this.V3(cx - 1.4, 0.95, fz - 0.05), this.V3(cx - 0.2, 0.95, fz - 0.05), '#ea580c', 0.05);

    this.quad([
      this.V3(cx - 1.5, 0.04, fz - 0.8),
      this.V3(cx - 0.1, 0.04, fz - 0.8),
      this.V3(cx - 0.1, 0.04, fz - 0.05),
      this.V3(cx - 1.5, 0.04, fz - 0.05)
    ], '#dc2626', { n: this.V3(0, 1, 0), alpha: 0.9 });

    this.box(cx + 1.2, 0.9, cz - 0.8, 1.6, 1.0, 0.5, '#f59e0b');
    this.box(cx + 1.2, 1.5, cz - 0.8, 1.5, 0.2, 0.45, '#ef4444');
    this.sprite(this.V3(cx, 2.2, cz - 0.5), 1.2, '#fef08a', { alpha: 0.25 });

    const px = cx - 3.2, pz = cz - 2.2;
    this.line(this.V3(px, 0, pz), this.V3(px, 5.8, pz), '#475569', 0.12);
    this.box(px, 5.2, pz, 1.4, 1.1, 0.35, '#ffffff');
    this.quad([this.V3(px - 0.65, 5.65, pz - 0.19), this.V3(px + 0.65, 5.65, pz - 0.19), this.V3(px + 0.65, 5.75, pz - 0.19), this.V3(px - 0.65, 5.75, pz - 0.19)], '#ea580c', { n: this.V3(0, 0, -1) });
    this.quad([this.V3(px - 0.65, 5.55, pz - 0.19), this.V3(px + 0.65, 5.55, pz - 0.19), this.V3(px + 0.65, 5.65, pz - 0.19), this.V3(px - 0.65, 5.65, pz - 0.19)], '#16a34a', { n: this.V3(0, 0, -1) });
    this.quad([this.V3(px - 0.65, 5.45, pz - 0.19), this.V3(px + 0.65, 5.45, pz - 0.19), this.V3(px + 0.65, 5.55, pz - 0.19), this.V3(px - 0.65, 5.55, pz - 0.19)], '#dc2626', { n: this.V3(0, 0, -1) });
    this.box(px, 5.0, pz - 0.2, 0.7, 0.6, 0.04, '#15803d');
    this.sprite(this.V3(px, 5.0, pz - 0.24), 0.18, '#ea580c');
    this.sprite(this.V3(px, 5.2, pz), 1.5, '#22c55e', { alpha: 0.12 });

    const mx = cx - 2.4, mz = cz - 1.2;
    this.box(mx, 0.45, mz, 0.4, 0.4, 0.9, '#f8fafc');
    this.box(mx, 0.75, mz + 0.25, 0.45, 0.45, 0.45, '#ea580c');
    this.box(mx, 0.75, mz + 0.26, 0.35, 0.12, 0.46, '#16a34a');
    this.sprite(this.V3(mx, 0.22, mz - 0.35), 0.22, '#1e293b');
    this.sprite(this.V3(mx, 0.22, mz + 0.35), 0.22, '#1e293b');
    this.line(this.V3(mx, 0.5, mz - 0.3), this.V3(mx, 0.85, mz - 0.25), '#334155', 0.05);

    const ax = cx + 2.2, az = cz - sz / 2 - 0.15;
    this.box(ax, 0.8, az, 0.6, 1.4, 0.4, '#7c3aed');
    this.box(ax, 1.05, az - 0.21, 0.45, 0.35, 0.03, '#38bdf8');
    this.sprite(this.V3(ax, 1.35, az - 0.21), 0.08, '#22d3ee', { alpha: 0.9 });

    const bx = cx + 1.2, bz = cz - sz / 2 - 0.4;
    this.box(bx - 0.35, 0.35, bz, 0.25, 0.65, 0.25, '#16a34a');
    this.box(bx, 0.35, bz, 0.25, 0.65, 0.25, '#eab308');
    this.box(bx + 0.35, 0.35, bz, 0.25, 0.65, 0.25, '#2563eb');

    this.drawPerson(cx - 0.5, 0.9, cz - sz / 2 - 0.9, '#f6d7b0', '#0284c7', '#334155', { bobPhase: t * 1.5 });
    this.drawPerson(cx + 0.4, 0.9, cz - sz / 2 - 0.9, '#d4a574', '#ea580c', '#1e293b', { bobPhase: t * 1.5 + 1.2 });
    this.drawChatBubble(cx - 0.05, 1.95, cz - sz / 2 - 0.9, t, 0);
  }

  private drawChatBubble(x: number, y: number, z: number, t: number, offset = 0) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + offset);
    this.sprite(this.V3(x, y + pulse * 0.06, z), 0.16, '#ffffff', { alpha: 0.92 });
    this.sprite(this.V3(x - 0.05, y + pulse * 0.06, z), 0.035, '#3b82f6');
    this.sprite(this.V3(x, y + pulse * 0.06, z), 0.035, '#3b82f6');
    this.sprite(this.V3(x + 0.05, y + pulse * 0.06, z), 0.035, '#3b82f6');
  }

  private drawPerson(x: number, y: number, z: number, skinColor: string, shirtColor: string, pantsColor: string, opt: any = {}) {
    const scale = opt.scale || 1;
    const hasHair = opt.hasHair !== false;
    const hairColor = opt.hairColor || '#3a2414';
    const hasCap = opt.hasCap || false;
    const capColor = opt.capColor || '#dc2626';
    const hasVest = opt.hasVest || false;
    const vestColor = opt.vestColor || '#ef4444';
    const hasFloat = opt.hasFloat || false;
    const floatColor = opt.floatColor || '#f97316';
    const armPhase = opt.armPhase || 0;
    const bobPhase = opt.bobPhase || 0;
    const hasSunglasses = opt.hasSunglasses || false;
    const hasTowel = opt.hasTowel || false;
    const towelColor = opt.towelColor || '#f472b6';
    const noLegSwing = opt.noLegSwing || false;
    const isPointing = opt.isPointing || false;

    const headR = 0.22 * scale, bodyR = 0.28 * scale, bodyH = 0.6 * scale, legH = 0.35 * scale;
    const bob = Math.sin(bobPhase) * 0.02 * scale;

    if (y < 2 && y > 0.3) this.sprite(this.V3(x, 0.02, z), 0.35 * scale, '#000000', { alpha: 0.25 });

    const legOffset = 0.12 * scale;
    const legSwing = noLegSwing ? 0 : Math.sin(armPhase) * 0.1 * scale;
    this.sprite(this.V3(x - legOffset, y - legH - legSwing + bob, z), 0.12 * scale, pantsColor);
    this.sprite(this.V3(x + legOffset, y - legH + legSwing + bob, z), 0.12 * scale, pantsColor);
    this.sprite(this.V3(x - legOffset, y - legH - legSwing + bob - 0.08 * scale, z), 0.1 * scale, '#1e293b');
    this.sprite(this.V3(x + legOffset, y - legH + legSwing + bob - 0.08 * scale, z), 0.1 * scale, '#1e293b');

    this.sprite(this.V3(x, y + bodyH * 0.3 + bob, z), bodyR, shirtColor);
    if (hasVest) {
      this.sprite(this.V3(x, y + bodyH * 0.3 + bob, z), bodyR * 1.08, vestColor, { alpha: 0.9 });
      this.sprite(this.V3(x, y + bodyH * 0.45 + bob, z), bodyR * 1.1, '#fef3c7', { alpha: 0.7 });
    }
    if (hasTowel) {
      this.sprite(this.V3(x - 0.25 * scale, y + bodyH * 0.5 + bob, z), 0.15 * scale, towelColor, { alpha: 0.85 });
      this.sprite(this.V3(x - 0.35 * scale, y + bodyH * 0.3 + bob, z), 0.1 * scale, towelColor, { alpha: 0.85 });
    }
    this.sprite(this.V3(x, y + bodyH * 0.7 + bob, z), 0.1 * scale, skinColor);

    this.sprite(this.V3(x, y + bodyH * 0.9 + headR + bob, z), headR, skinColor);
    if (hasCap) {
      this.sprite(this.V3(x, y + bodyH * 0.9 + headR + 0.1 * scale + bob, z), headR * 0.95, capColor);
      this.sprite(this.V3(x + 0.12 * scale, y + bodyH * 0.9 + headR * 0.8 + bob, z), 0.1 * scale, capColor, { alpha: 0.9 });
    } else if (hasHair) {
      this.sprite(this.V3(x, y + bodyH * 0.9 + headR * 1.3 + bob, z), headR * 0.85, hairColor);
    }
    if (hasSunglasses) {
      this.sprite(this.V3(x + 0.15 * scale, y + bodyH * 0.9 + headR + bob, z), 0.06 * scale, '#0f172a');
      this.sprite(this.V3(x + 0.05 * scale, y + bodyH * 0.9 + headR + bob, z), 0.06 * scale, '#0f172a');
    }

    const armX = 0.3 * scale, armY = y + bodyH * 0.35 + bob;
    if (isPointing) {
      this.sprite(this.V3(x - armX, armY, z), 0.1 * scale, skinColor);
      this.sprite(this.V3(x - armX, armY - 0.18 * scale, z), 0.1 * scale, shirtColor);
      this.sprite(this.V3(x + armX, armY + 0.18 * scale, z + 0.28 * scale), 0.1 * scale, skinColor);
      this.sprite(this.V3(x + armX, armY + 0.08 * scale, z + 0.14 * scale), 0.1 * scale, shirtColor);
    } else {
      const armSwing = Math.sin(armPhase) * 0.15 * scale;
      this.sprite(this.V3(x - armX, armY + armSwing, z), 0.1 * scale, skinColor);
      this.sprite(this.V3(x - armX, armY + armSwing - 0.2 * scale, z), 0.1 * scale, shirtColor);
      this.sprite(this.V3(x + armX, armY - armSwing, z), 0.1 * scale, skinColor);
      this.sprite(this.V3(x + armX, armY - armSwing - 0.2 * scale, z), 0.1 * scale, shirtColor);
    }

    if (hasFloat) this.sprite(this.V3(x, y + bodyH * 0.2 + bob, z), 0.38 * scale, floatColor, { ring: '#ffffff', ringw: 0.09 * scale, alpha: 0.95 });
  }

  private drawSwimmer(x: number, y: number, z: number, suitColor: string, skinColor: string, t: number, dir: number, lanePhase: number, orient: string = 'x') {
    const bodyR = 0.25, headR = 0.2;
    const strokePhase = t * 3 + lanePhase;
    const armSwing = Math.sin(strokePhase) * 0.5;
    const lift = Math.abs(Math.sin(strokePhase)) * 0.15;
    const lift2 = Math.abs(Math.cos(strokePhase)) * 0.15;
    const fx = orient === 'x' ? dir : 0;
    const fz = orient === 'z' ? dir : 0;
    const px = orient === 'x' ? 0 : 1;
    const pz = orient === 'x' ? 1 : 0;

    this.sprite(this.V3(x, -1.5, z), 0.5, '#000000', { alpha: 0.15 });
    this.sprite(this.V3(x, y, z), bodyR * 1.3, suitColor, { alpha: 0.85 });
    this.sprite(this.V3(x - fx * 0.3, y, z - fz * 0.3), bodyR, suitColor, { alpha: 0.85 });
    this.sprite(this.V3(x + fx * 0.3, y, z + fz * 0.3), bodyR, suitColor, { alpha: 0.85 });
    this.sprite(this.V3(x + fx * 0.6, y + 0.05, z + fz * 0.6), headR, skinColor);
    this.sprite(this.V3(x + fx * 0.6, y + 0.15, z + fz * 0.6), headR * 0.95, suitColor);
    this.sprite(this.V3(x + fx * 0.75, y + 0.07, z + fz * 0.75), 0.05, '#0f172a');
    const a1x = x + px * (-0.22) + fx * (armSwing * 0.35);
    const a1z = z + pz * (-0.22) + fz * (armSwing * 0.35);
    this.sprite(this.V3(a1x, y + 0.05 + lift, a1z), 0.11, skinColor, { alpha: 0.95 });
    const a2x = x + px * 0.22 - fx * (armSwing * 0.35);
    const a2z = z + pz * 0.22 - fz * (armSwing * 0.35);
    this.sprite(this.V3(a2x, y + 0.05 + lift2, a2z), 0.11, skinColor, { alpha: 0.95 });
    const legKick = Math.sin(strokePhase * 2) * 0.1;
    this.sprite(this.V3(x - fx * 0.6 + px * 0.1, y - 0.05 + legKick, z - fz * 0.6 + pz * 0.1), 0.1, skinColor, { alpha: 0.8 });
    this.sprite(this.V3(x - fx * 0.6 - px * 0.1, y - 0.05 - legKick, z - fz * 0.6 - pz * 0.1), 0.1, skinColor, { alpha: 0.8 });
  }

  private initAgents() {
    const AGENT_LOOKS = [
      { skin: '#f6d7b0', suit: '#e74c3c', hair: '#3a2414', female: false, street: '#8b5cf6', pants: '#334155' },
      { skin: '#e0b090', suit: '#8e44ad', hair: '#1a1a2e', female: true, street: '#f97316', pants: '#1e293b' },
      { skin: '#d4a574', suit: '#16a085', hair: '#4a2c1a', female: false, street: '#22c55e', pants: '#6b7280' },
      { skin: '#f6d7b0', suit: '#f1c40f', hair: '#2a1810', female: true, street: '#ec4899', pants: '#334155' },
      { skin: '#e0b090', suit: '#2c3e50', hair: '#3a2414', female: false, street: '#0ea5e9', pants: '#1e293b' },
      { skin: '#d4a574', suit: '#e67e22', hair: '#1a1a2e', female: true, street: '#64748b', pants: '#334155' },
      { skin: '#f6d7b0', suit: '#0ea5e9', hair: '#4a2c1a', female: false, street: '#f43f5e', pants: '#1e293b' },
      { skin: '#e0b090', suit: '#ec4899', hair: '#1a1a2e', female: true, street: '#84cc16', pants: '#334155' }
    ];
    this.agents = AGENT_LOOKS.map((look, i) => ({
      state: 'gone', timer: 0, wait: i * 3.0,
      x: this.ENTRANCE.x, z: this.ENTRANCE.z, wps: [],
      lane: this.LANES[i % 4], swimX: 0, dir: 1, entryX: 0,
      checkPt: this.CHECKIN_POINTS[i % 2],
      speed: 1.6 + ((i * 37) % 10) / 12, swimDur: 14 + (i * 13) % 10,
      checkinDur: 3, changingDur: 5, rinseDur: 4, lockerDur: 4, showerDur: 6,
      station: null, lockerZ: 0, towel: false, rz: -6.15,
      orient: 'x', wdir: 1,
      gender: look.female ? 'f' : 'm', ...look
    }));
  }

  private initParticles() {
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 50, y: Math.random() * 12, z: (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 0.02, vy: Math.random() * 0.01 + 0.005, vz: (Math.random() - 0.5) * 0.02,
        size: Math.random() * 0.05 + 0.02, alpha: Math.random() * 0.4 + 0.2, phase: Math.random() * Math.PI * 2
      });
    }
  }

  private startEntering(a: any) {
    a.state = 'entering'; a.timer = 0; a.towel = false;
    a.x = this.ENTRANCE.x + ((((a.swimDur * 7) | 0) % 20 - 10) / 12);
    a.z = this.ENTRANCE.z;
    a.checkPt = this.CHECKIN_POINTS[((a.swimDur * 3) | 0) % 2];
    a.entryX = -7 + ((a.swimDur * 11) | 0) % 14;
    a.wps = [
      { x: a.x, z: 15.5 },
      { x: a.checkPt.x, z: 15.5 },
      { x: a.checkPt.x, z: 14.6 },
      { x: a.checkPt.x, z: a.checkPt.z }
    ];
    a.lane = this.LANES[((a.swimDur * 5) | 0) % 4];
  }

  private followWps(a: any, dt: number) {
    if (!a.wps.length) return true;
    const w = a.wps[0];
    const dx = w.x - a.x, dz = w.z - a.z;
    const d = Math.hypot(dx, dz);
    const step = a.speed * dt;
    if (d <= step) { a.x = w.x; a.z = w.z; a.wps.shift(); return a.wps.length === 0; }
    a.x += (dx / d) * step; a.z += (dz / d) * step;
    return false;
  }

  private doorOf(a: any) { return a.gender === 'm' ? this.SHOWER_DOOR.m : this.SHOWER_DOOR.f; }

  private updateAgents(dt: number) {
    for (const a of this.agents) {
      a.timer += dt;
      switch (a.state) {
        case 'gone':
          if (a.timer > a.wait) this.startEntering(a);
          break;
        case 'entering':
          if (this.followWps(a, dt)) { a.state = 'checkin'; a.timer = 0; a.checkinDur = 2.5 + ((a.swimDur * 7) | 0) % 3; }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
        case 'checkin':
          if (a.timer > a.checkinDur) {
            a.state = 'toChanging'; a.timer = 0;
            const door = this.doorOf(a);
            a.wps = [
              { x: a.x, z: 15.5 },
              { x: -5, z: 15.5 },
              { x: this.CORRIDOR_X, z: 10.5 },
              { x: this.CORRIDOR_X, z: door.z },
              { x: door.x, z: door.z }
            ];
          }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
        case 'toChanging':
          if (this.followWps(a, dt)) { a.state = 'changing'; a.timer = 0; a.changingDur = 4 + ((a.swimDur * 11) | 0) % 4; }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
        case 'changing':
          if (a.timer > a.changingDur) {
            a.state = 'toPool'; a.timer = 0;
            const door = this.doorOf(a);
            a.x = door.x; a.z = door.z;
            a.wps = [
              { x: this.CORRIDOR_X, z: door.z },
              { x: this.CORRIDOR_X, z: 6.3 },
              { x: a.entryX, z: 6.3 },
              { x: a.entryX, z: this.DECK_EDGE }
            ];
          }
          this.pushOutOfObstacles(a);
          break;
        case 'toPool':
          if (this.followWps(a, dt)) {
            a.state = 'swim'; a.timer = 0; a.swimX = a.x;
            a.dir = a.x > 0 ? -1 : 1; a.orient = 'z'; a.wdir = Math.sign(a.lane - a.z) || -1;
          }
          this.pushOutOfObstacles(a);
          break;
        case 'swim': {
          if (Math.abs(a.z - a.lane) > 0.15) {
            a.orient = 'z'; a.wdir = Math.sign(a.lane - a.z) || 1;
            a.z += a.wdir * a.speed * 0.9 * dt;
          } else {
            a.orient = 'x'; a.wdir = a.dir;
            a.swimX += a.dir * a.speed * 1.1 * dt;
            if (a.swimX > 8.5) { a.swimX = 8.5; a.dir = -1; }
            if (a.swimX < -8.5) { a.swimX = -8.5; a.dir = 1; }
            a.x = a.swimX; a.z = a.lane;
          }

          // เมื่อว่ายเสร็จ: เดินขึ้นสระฝั่งด้านบน (z = -4.3 -> -5.7) เพื่อไปล้างตัวที่จุดล้างตัวฝั่งตรงข้าม
          if (a.timer > a.swimDur && Math.abs(a.z - a.lane) <= 0.15) {
            a.state = 'toRinse'; a.timer = 0;
            a.station = this.RINSE_STATIONS[((a.swimDur * 3) | 0) % 3];
            a.wps = [{ x: a.swimX, z: -4.3 }, { x: a.swimX, z: -5.7 }, { x: a.station.x, z: a.station.stand }];
            a.orient = 'z'; a.wdir = -1;
          }
          break;
        }
        case 'toRinse':
          if (this.isInWater(a)) { a.orient = 'z'; a.wdir = -1; }
          if (this.followWps(a, dt)) { a.state = 'rinse'; a.timer = 0; a.rz = a.station.stand; a.rinseDur = 3 + ((a.swimDur * 7) | 0) % 3; }
          break;
        case 'rinse':
          // ล้างตัวเสร็จ: เดินเลาะทางเดินริมสระฝั่งบน (z = -7.0) ตรงไปยังตู้ล็อกเกอร์
          if (a.timer > a.rinseDur) {
            a.state = 'toLocker'; a.timer = 0;
            a.lockerZ = -6 + ((a.swimDur * 17) | 0) % 12;
            a.wps = [
              { x: a.station.x, z: -7.0 },
              { x: this.CORRIDOR_X, z: -7.0 },
              { x: this.CORRIDOR_X, z: a.lockerZ },
              { x: this.LOCKER_FRONT, z: a.lockerZ }
            ];
          }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
        case 'toLocker':
          if (this.followWps(a, dt)) { a.state = 'locker'; a.timer = 0; a.lockerDur = 3 + ((a.swimDur * 11) | 0) % 4; }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
        case 'locker':
          if (a.timer > a.lockerDur) {
            a.state = 'toShower'; a.timer = 0; a.towel = true;
            const door = this.doorOf(a);
            a.wps = [{ x: this.CORRIDOR_X, z: a.lockerZ }, { x: this.CORRIDOR_X, z: door.z }, { x: door.x, z: door.z }];
          }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
        case 'toShower':
          if (this.followWps(a, dt)) { a.state = 'shower'; a.timer = 0; a.showerDur = 5 + ((a.swimDur * 13) | 0) % 6; }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
        case 'shower':
          if (a.timer > a.showerDur) {
            a.state = 'leaving'; a.timer = 0;
            const door = this.doorOf(a);
            a.x = door.x; a.z = door.z; a.towel = true;
            a.wps = [
              { x: this.CORRIDOR_X, z: door.z },
              { x: this.CORRIDOR_X, z: 10.5 },
              { x: 8, z: 10.5 },
              { x: 8, z: 15.5 },
              { x: this.ENTRANCE.x, z: this.ENTRANCE.z }
            ];
          }
          break;
        case 'leaving':
          if (this.followWps(a, dt)) { a.state = 'gone'; a.timer = 0; a.wait = 4 + ((a.swimDur * 19) | 0) % 9; }
          this.pushOutOfObstacles(a); this.pushOutOfPool(a);
          break;
      }
    }
  }

  private drawAgents(t: number) {
    for (const a of this.agents) {
      const lookOpt = { hasHair: a.female, hairColor: a.hair, hasCap: !a.female, capColor: a.street };
      const inWater = this.isInWater(a);
      switch (a.state) {
        case 'entering':
        case 'toChanging':
        case 'toPool':
        case 'toRinse':
        case 'toLocker':
        case 'toShower':
        case 'leaving':
          if (inWater) {
            this.drawSwimmer(a.x, this.wave(a.x, a.z, t) - 0.05, a.z, a.suit, a.skin, t, a.wdir || 1, a.lane + 2, a.orient);
          } else {
            const inSwimwear = (a.state === 'toPool' || a.state === 'toRinse' || a.state === 'toLocker');
            this.drawPerson(a.x, 0.9, a.z, a.skin, inSwimwear ? a.suit : a.street, inSwimwear ? a.suit : a.pants,
              Object.assign({ armPhase: t * 6, bobPhase: t * 3, hasTowel: a.towel }, lookOpt));
          }
          break;
        case 'checkin': {
          this.drawPerson(a.x, 0.9, a.z, a.skin, a.street, a.pants, Object.assign({ bobPhase: t * 1.8, noLegSwing: true }, lookOpt));
          this.sprite(this.V3(a.x + 0.28, 1.28, a.z - 0.12), 0.09, '#f8fafc');
          this.sprite(this.V3(a.x + 0.28, 1.28, a.z - 0.12), 0.05, '#0f172a');
          const bl = 0.5 + 0.5 * Math.sin(t * 9);
          this.sprite(this.V3(a.x + 0.28, 1.45, a.z - 0.12), 0.06 + bl * 0.04, '#22d3ee', { alpha: 0.5 + bl * 0.5 });
          if (a.timer > a.checkinDur - 0.9) {
            this.sprite(this.V3(a.x, 2.15, a.z), 0.14, '#34d399', { alpha: 0.95 });
            this.sprite(this.V3(a.x, 2.15, a.z), 0.07, '#ecfdf5', { alpha: 0.95 });
          }
          break;
        }
        case 'swim':
          this.drawSwimmer(a.x, this.wave(a.x, a.z, t) - 0.05, a.z, a.suit, a.skin, t, a.wdir || a.dir, a.lane + 2, a.orient);
          break;
        case 'rinse':
          this.drawPerson(a.x, 0.9, a.rz, a.skin, a.suit, a.suit, Object.assign({ bobPhase: t * 2, noLegSwing: true }, lookOpt));
          break;
        case 'locker':
          this.drawPerson(a.x, 0.9, a.z, a.skin, a.suit, a.suit, Object.assign({ bobPhase: t * 1.5, hasTowel: a.towel, noLegSwing: true }, lookOpt));
          break;
        default: break;
      }
    }
  }

  private updateParticles(t: number) {
    for (const p of this.particles) {
      p.x += p.vx + Math.sin(t * 0.5 + p.phase) * 0.005;
      p.y += p.vy; p.z += p.vz;
      if (p.y > 12) { p.y = 0; p.x = (Math.random() - 0.5) * 50; p.z = (Math.random() - 0.5) * 40; }
      this.sprite(this.V3(p.x, p.y, p.z), p.size, '#ffffff', { alpha: p.alpha * (0.5 + 0.5 * Math.sin(t * 2 + p.phase)) });
    }
  }

  private buildScene(t: number) {
    this.sprite(this.V3(-40, 25, -30), 2.5, '#fef3c7', { alpha: 0.9 });
    this.sprite(this.V3(-40, 25, -30), 4.0, '#fde68a', { alpha: 0.25 });
    this.sprite(this.V3(-40, 25, -30), 6.5, '#fef3c7', { alpha: 0.08 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.line(this.V3(-40 + Math.cos(a) * 3, 25, -30 + Math.sin(a) * 3), this.V3(-40 + Math.cos(a) * 5.5, 25, -30 + Math.sin(a) * 5.5), '#fef3c7', 0.15, { alpha: 0.3 });
    }
    this.drawCloud(-20, 18, -25, 1.5); this.drawCloud(10, 20, -30, 1.2); this.drawCloud(30, 16, -20, 1.0);
    this.drawCloud(-5, 22, -35, 1.8); this.drawCloud(25, 19, -28, 1.3);

    [[-18, -15, 1.1, 0.5], [18, -16, 1.0, 1.3], [-20, 14, 1.2, 2.1], [20, 16, 0.95, 3.2], [-8, -16, 1.05, 4.1], [8, -17, 1.0, 5.3]]
      .forEach(([x, z, s, sd]) => { this.dropShadow(x, z, 1.5, 0.3); this.drawPalmTree(x, z, s, sd); });
    [[-19, -12, 0.8, 0.1], [-17, -17.5, 0.7, 0.5], [17, -12, 0.8, 0.9], [19, -18, 0.7, 1.2], [-21, 16.5, 0.9, 1.8],
     [-18, 17.5, 0.7, 2.4], [18, 17.5, 0.8, 3.1], [21, 14, 0.7, 3.8], [-9, -17.5, 0.6, 4.2], [9, -18, 0.7, 4.9]]
      .forEach(([x, z, s, sd]) => this.drawBush(x, z, s, sd));

    this.deckRect(-22, -18, 22, -5, 8, 4); this.deckRect(-22, 5, 22, 18, 8, 4);
    this.deckRect(-22, -5, -10, 5, 3, 3); this.deckRect(10, -5, 22, 5, 3, 3);
    this.drawPaths();

    this.drawSevenEleven(t);
    this.drawKidsPool(t);

    this.quad([this.V3(-10, -1.6, -5), this.V3(10, -1.6, -5), this.V3(10, -1.6, 5), this.V3(-10, -1.6, 5)], '#0d6383', { n: this.V3(0, 1, 0) });
    this.quad([this.V3(-10, 0, -5), this.V3(10, 0, -5), this.V3(10, -1.6, -5), this.V3(-10, -1.6, -5)], '#2ba0c8', { n: this.V3(0, 0, 1) });
    this.quad([this.V3(-10, 0, 5), this.V3(10, 0, 5), this.V3(10, -1.6, 5), this.V3(-10, -1.6, 5)], '#2ba0c8', { n: this.V3(0, 0, -1) });
    this.quad([this.V3(-10, 0, -5), this.V3(-10, 0, 5), this.V3(-10, -1.6, 5), this.V3(-10, -1.6, -5)], '#2ba0c8', { n: this.V3(1, 0, 0) });
    this.quad([this.V3(10, 0, -5), this.V3(10, 0, 5), this.V3(10, -1.6, 5), this.V3(10, -1.6, -5)], '#2ba0c8', { n: this.V3(-1, 0, 0) });
    this.line(this.V3(-9.95, -0.8, -4.99), this.V3(9.95, -0.8, -4.99), '#fbbf24', 0.05);
    this.line(this.V3(-9.95, -0.8, 4.99), this.V3(9.95, -0.8, 4.99), '#fbbf24', 0.05);

    const NX = 8, NZ = 4;
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NZ; j++) {
        const ax = -9.96 + (19.92 * i) / NX, bx = -9.96 + (19.92 * (i + 1)) / NX;
        const az = -4.96 + (9.92 * j) / NZ, bz = -4.96 + (9.92 * (j + 1)) / NZ;
        this.quad([
          this.V3(ax, this.wave(ax, az, t), az),
          this.V3(bx, this.wave(bx, az, t), az),
          this.V3(bx, this.wave(bx, bz, t), bz),
          this.V3(ax, this.wave(ax, bz, t), bz)
        ], '#2bb8e0', { n: this.V3(0, 1, 0), alpha: 0.78 + 0.08 * Math.sin(t * 2 + i + j) });
      }
    }
    for (let i = 0; i < 12; i++) {
      const cx2 = -8 + ((t * 0.3 + i * 1.7) % 16);
      const cz2 = -3.5 + Math.sin(t * 0.5 + i) * 2.5;
      this.sprite(this.V3(cx2, this.wave(cx2, cz2, t) + 0.01, cz2), 0.4 + Math.sin(t * 2 + i) * 0.15, '#ffffff', { alpha: 0.18 + 0.1 * Math.sin(t * 3 + i * 2) });
    }

    this.line(this.V3(-10.35, 0.07, -5.35), this.V3(10.35, 0.07, -5.35), '#c9d7e2', 0.5);
    this.line(this.V3(-10.35, 0.07, 5.35), this.V3(10.35, 0.07, 5.35), '#c9d7e2', 0.5);
    this.line(this.V3(-10.35, 0.07, -5), this.V3(-10.35, 0.07, 5), '#c9d7e2', 0.5);
    this.line(this.V3(10.35, 0.07, -5), this.V3(10.35, 0.07, 5), '#c9d7e2', 0.5);
    this.LANES.concat([3.33]).forEach(z => {
      this.line(this.V3(-9.85, -0.16, z), this.V3(9.85, -0.16, z), '#f8fafc', 0.06);
      for (let x = -9; x <= 9; x += 1.5) {
        this.sprite(this.V3(x, -0.16, z), 0.12, (Math.round(Math.abs(x) * 2) % 3 === 0) ? '#ef4444' : '#f8fafc');
      }
    });

    [[-6, 2.4, '#ef4444'], [0.5, -2.6, '#fbbf24'], [7, 2.0, '#ef4444']].forEach(([x, z, c], i) => {
      this.sprite(this.V3(+x, -1.5, +z), 0.4, '#000000', { alpha: 0.15 });
      const y = -0.08 + Math.sin(t * 1.5 + i * 1.7) * 0.06;
      this.sprite(this.V3(+x, y, +z), 0.32, c as string, { ring: '#ffffff', ringw: 0.1, alpha: 0.95 });
    });

    // 🚿 วาดเสาฝักบัวล้างตัว ณ ตำแหน่งใหม่ฝั่งตรงข้ามสระ
    this.RINSE_STATIONS.forEach(s => {
      const occupied = this.agents.some(a => a.state === 'rinse' && a.station === s);
      this.drawShowerStation(s, t, occupied);
    });

    this.drawShowerRoom(-17.2, -9.8, '#3b82f6');
    this.drawShowerRoom(-17.2, -12.8, '#ec4899');

    this.drawEntranceGate(t);
    this.drawCheckinPoint(t);

    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 8; i++) {
        const x = -16.4 + (row === 0 ? 0.46 : -0.46), z = -7 + i * 2;
        this.box(x, 1, z, 0.75, 2, 0.92, (i + row) % 2 ? '#2f7fbf' : '#1f5f93');
        this.line(this.V3(x + (row === 0 ? 0.38 : -0.38), 1.0, z - 0.1), this.V3(x + (row === 0 ? 0.38 : -0.38), 1.0, z + 0.1), '#cbd5e1', 0.04);
      }
    }
    this.box(-14.0, 0.56, 0, 0.62, 0.12, 5.4, '#b9c3cd');
    this.drawBush(-17.5, 7.5, 0.6, 6.1); this.drawBush(-17.5, -7.5, 0.6, 7.2);

    this.box(0, 0.55, 12.5, 7, 1.1, 1.3, '#f1f5f9');
    this.box(0, 1.16, 12.5, 7.3, 0.12, 1.7, '#334155');
    this.line(this.V3(-3.5, 1.06, 13.18), this.V3(3.5, 1.06, 13.18), '#22d3ee', 0.05);
    this.box(-3.6, 2.2, 12.1, 0.45, 4.4, 0.45, '#f1f5f9');
    this.box(3.6, 2.2, 12.1, 0.45, 4.4, 0.45, '#f1f5f9');
    this.box(0, 4.5, 12.1, 7.8, 0.6, 0.5, '#334155');
    this.box(-1.8, 1.28, 12.5, 0.4, 0.3, 0.05, '#0f172a');
    this.box(1.8, 1.28, 12.5, 0.4, 0.3, 0.05, '#0f172a');
    this.drawBush(-4.5, 13.8, 0.4, 8.1); this.drawBush(4.5, 13.8, 0.4, 9.1);

    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => this.box(14 + x * 1.1, 1.65, -8 + z * 1.1, 0.18, 3.3, 0.18, '#f8fafc'));
    this.box(14, 3.3, -8, 3, 0.18, 3, '#f8fafc');
    this.box(14, 3.68, -9.46, 3, 0.5, 0.09, '#dc2626');
    this.box(12.54, 3.68, -8, 0.09, 0.5, 3, '#dc2626');
    this.box(15.46, 3.68, -8, 0.09, 0.5, 3, '#dc2626');
    this.box(14, 3.95, -7.6, 1.25, 0.12, 1.05, '#dc2626');
    this.box(14, 4.5, -7.08, 1.25, 1.05, 0.12, '#dc2626');
    this.box(14, 5.65, -8, 3.5, 0.16, 3.5, '#dc2626');
    this.line(this.V3(14, 5.65, -8), this.V3(14, 7.5, -8), '#94a3b8', 0.04);
    const fw = Math.sin(t * 3) * 0.1;
    this.quad([this.V3(14, 7.4, -8), this.V3(14 + 1.0 + fw, 7.2, -8), this.V3(14 + 1.0 + fw, 6.8, -8), this.V3(14, 7.0, -8)], '#ef4444', { n: this.V3(0, 0, -1), alpha: 0.9 });
    this.sprite(this.V3(15.3, 4.5, -8), 0.3, '#ef4444', { ring: '#ffffff', ringw: 0.08, alpha: 0.9 });

    this.line(this.V3(12.55, 0, -6.8), this.V3(12.55, 3.4, -6.8), '#94a3b8', 0.05);
    this.line(this.V3(13.15, 0, -6.8), this.V3(13.15, 3.4, -6.8), '#94a3b8', 0.05);
    for (let r = 0.5; r < 3.2; r += 0.5) {
      this.line(this.V3(12.55, r, -6.8), this.V3(13.15, r, -6.8), '#cbd5e1', 0.04);
    }

    if (this.isEmergency) {
      const sirenColor = Math.sin(t * 8) > 0 ? '#ef4444' : '#3b82f6';
      this.box(14, 5.85, -8, 0.3, 0.3, 0.3, sirenColor);
      this.sprite(this.V3(14, 5.9, -8), 0.45, sirenColor, { alpha: 0.8 });
      this.sprite(this.V3(14, 5.9, -8), 0.15, '#ffffff', { alpha: 0.95 });
    }

    this.quad([this.V3(-10, 0.03, 6.5), this.V3(-6, 0.03, 6.5), this.V3(-6, 0.03, 9.5), this.V3(-10, 0.03, 9.5)], '#fde68a', { n: this.V3(0, 1, 0), stroke: '#f59e0b', lw: 2 });
    ['#fbbf24', '#f97316', '#38bdf8', '#fbbf24', '#f97316', '#38bdf8'].forEach((c, i) => {
      const y = 0.05 + i * 0.06;
      this.quad([this.V3(-9.2, y, 7.0 + i * 0.18), this.V3(-8.6, y, 7.0 + i * 0.18), this.V3(-8.6, y, 7.46 + i * 0.18), this.V3(-9.2, y, 7.46 + i * 0.18)], c, { n: this.V3(0, 1, 0) });
    });
    [['#e879f9', 8.9], ['#4ade80', 8.45], ['#38bdf8', 8.0]].forEach(([c, z], i) => {
      this.line(this.V3(-7.9, 0.1 + i * 0.14, +z), this.V3(-5.7, 0.1 + i * 0.14, +z), c as string, 0.2);
    });

    this.box(12, 0.15, 3, 1.0, 0.3, 1.0, '#334155');
    this.line(this.V3(12, 0.3, 3), this.V3(12, 3.5, 3), '#334155', 0.12);
    this.sprite(this.V3(12, 3.5, 3), 1.2, '#22d3ee', { alpha: 0.08 });
    this.sprite(this.V3(12, 3.5, 3), 0.8, '#22d3ee', { alpha: 0.15 });
    this.sprite(this.V3(12, 3.5, 3), 0.36, '#22d3ee', { ring: '#67e8f9', ringw: 0.06, alpha: 0.95 });
    const ra = t * 0.5;
    this.sprite(this.V3(12 + Math.cos(ra) * 0.3, 3.5, 3 + Math.sin(ra) * 0.3), 0.08, '#ffffff', { alpha: 0.8 });
    this.sprite(this.V3(12 + Math.cos(ra + Math.PI) * 0.3, 3.5, 3 + Math.sin(ra + Math.PI) * 0.3), 0.08, '#ffffff', { alpha: 0.8 });

    [[-6, '#ef4444'], [-2, '#3b82f6'], [2, '#f59e0b'], [6, '#10b981']].forEach(([x, c]) => {
      this.drawLounger(+x, -12.5, 0); this.drawUmbrella(+x, -12.5, c as string, '#ffffff', 2.2);
    });
    this.drawLounger(15, 6, -Math.PI / 2); this.drawUmbrella(15, 6, '#ec4899', '#ffffff', 2.2);
    this.drawLounger(15, 9, -Math.PI / 2); this.drawUmbrella(15, 9, '#a855f7', '#ffffff', 2.2);

    this.box(-18, 0.3, 10, 1.2, 0.6, 1.2, '#94a3b8');
    this.box(-18, 0.75, 10, 0.8, 0.3, 0.8, '#cbd5e1');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.5;
      const h = 0.3 + Math.sin(t * 2 + i) * 0.1;
      this.line(this.V3(-18, 0.9, 10), this.V3(-18 + Math.cos(a) * 0.4, 0.9 + h, 10 + Math.sin(a) * 0.4), '#22d3ee', 0.03, { alpha: 0.6 });
    }

    const suitColors = ['#e74c3c', '#2c3e50', '#f1c40f', '#8e44ad'];
    const skinColors = ['#f6d7b0', '#e0b090', '#d4a574', '#f6d7b0'];
    this.LANES.forEach((lane, i) => {
      const period = 15 + i * 2;
      const phase = t * (1.4 + i * 0.2);
      const u = phase % (2 * period);
      const dir = u < period ? 1 : -1;
      const progress = u < period ? u / period : (2 * period - u) / period;
      const x = -9.5 + progress * 19;
      this.drawSwimmer(x, this.wave(x, lane, t) - 0.05, lane, suitColors[i], skinColors[i], t, dir, i, 'x');
    });

    if (this.isEmergency) {
      const patrolCycle = (t * 0.75) % 2;
      const patrolDir = patrolCycle < 1 ? -1 : 1;
      const patrolProgress = patrolCycle < 1 ? patrolCycle : (2 - patrolCycle);
      const guardX = 10.5 - patrolProgress * 16.5;
      const guardZ = -5.8;

      this.drawPerson(guardX, 0.9, guardZ, '#e0b090', '#ffffff', '#dc2626', {
        hasVest: true, vestColor: '#ef4444', hasCap: true, capColor: '#dc2626',
        armPhase: t * 7, bobPhase: t * 3.5, hasFloat: true, floatColor: '#ea580c'
      });
      this.box(guardX + (patrolDir > 0 ? 0.35 : -0.35), 1.25, guardZ + 0.25, 0.18, 0.18, 0.28, '#f8fafc');
      this.sprite(this.V3(guardX, 2.05, guardZ), 0.14, '#ef4444');
      this.sprite(this.V3(guardX, 2.05, guardZ), 0.05, '#ffffff');

      const guard2X = -7 + patrolProgress * 14;
      this.drawPerson(guard2X, 0.9, 5.8, '#d4a574', '#ef4444', '#dc2626', {
        hasVest: true, vestColor: '#f97316', hasCap: true, capColor: '#dc2626',
        hasFloat: true, floatColor: '#f97316',
        armPhase: t * 7 + 1, bobPhase: t * 3.5 + 1
      });
    } else {
      this.drawPerson(14, 4.15, -7.7, '#e0b090', '#ffffff', '#dc2626', {
        hasVest: true, vestColor: '#ef4444', hasCap: true, capColor: '#dc2626',
        noLegSwing: true
      });
    }

    this.drawPerson(-8.5, 0.9, 7.5, '#d4a574', '#0891b2', '#1e293b', { hasCap: true, capColor: '#0891b2', noLegSwing: true, hasSunglasses: true });
    this.drawPerson(-7.2, 0.9, 8.2, '#f6d7b0', '#a78bfa', '#1e293b', { hasHair: true, hairColor: '#1a1a2e', noLegSwing: true });
    this.drawPerson(-8.8, 0.9, 8.8, '#e0b090', '#1e293b', '#0f172a', { noLegSwing: true });
    [{x: -7.8, z: 7.2, c: '#fbbf24'}, {x: -8.3, z: 7.8, c: '#f97316'}, {x: -7.5, z: 8.5, c: '#38bdf8'}, {x: -8.0, z: 9.0, c: '#e879f9'}].forEach((k) => {
      this.drawPerson(k.x, 0.65, k.z, '#f6d7b0', k.c, '#1e293b', { scale: 0.75, hasFloat: true, floatColor: k.c, noLegSwing: true });
    });
    this.drawPerson(-1.5, 1.1, 11.2, '#e0b090', '#0891b2', '#0f172a', { noLegSwing: true });
    this.drawPerson(1.5, 1.1, 11.2, '#d4a574', '#0891b2', '#0f172a', { hasHair: true, hairColor: '#2a1810', noLegSwing: true });

    this.sprite(this.V3(-6, 0.55, -12.5), 0.22, '#f6d7b0'); this.sprite(this.V3(-6.3, 0.5, -12.5), 0.25, '#f472b6');
    this.sprite(this.V3(-5.7, 0.5, -12.5), 0.25, '#f472b6'); this.sprite(this.V3(-6.6, 0.6, -12.5), 0.12, '#2a1810');
    this.sprite(this.V3(-2, 0.55, -12.5), 0.22, '#e0b090'); this.sprite(this.V3(-2.3, 0.5, -12.5), 0.25, '#3b82f6');
    this.sprite(this.V3(-1.7, 0.5, -12.5), 0.25, '#e0b090'); this.sprite(this.V3(-2.6, 0.6, -12.5), 0.12, '#3a2414');
    this.drawChatBubble(-4.0, 1.65, -12.5, t, 1.5);

    this.drawPerson(-14, 0.9, -3.6, '#f6d7b0', '#8b5cf6', '#1e293b', { noLegSwing: true });
    this.drawPerson(-13.2, 0.9, -4.2, '#e0b090', '#ec4899', '#6b7280', { hasHair: true, hairColor: '#2a1810', noLegSwing: true, hasSunglasses: true });
    this.drawChatBubble(-13.6, 1.85, -3.9, t, 2.5);

    const pp = 44, pu = (t * 0.5) % (2 * pp);
    const pprog = pu < pp ? pu / pp : (2 * pp - pu) / pp;
    let px = 0, pz = 0;
    if (pprog < 0.25) { px = -11 + pprog * 4 * 22; pz = -6.5; }
    else if (pprog < 0.5) { px = 11; pz = -6.5 + (pprog - 0.25) * 4 * 14.3; }
    else if (pprog < 0.75) { px = 11 - (pprog - 0.5) * 4 * 22; pz = 7.8; }
    else { px = -11; pz = 7.8 - (pprog - 0.75) * 4 * 14.3; }
    this.drawPerson(px, 0.9, pz, '#d4a574', '#fbbf24', '#1e293b', { hasVest: true, vestColor: '#f59e0b', hasCap: true, capColor: '#1e293b', armPhase: t * 3.5, bobPhase: t * 2 });

    this.drawAgents(t);
    this.updateParticles(t);

    for (let i = 0; i < 5; i++) {
      const bx = -30 + i * 8 + Math.sin(t * 0.3 + i) * 2;
      const by = 15 + Math.sin(t * 0.5 + i * 0.7) * 1.5;
      this.line(this.V3(bx - 0.2, by, -35), this.V3(bx, by + 0.1, -35), '#0f172a', 0.03, { alpha: 0.6 });
      this.line(this.V3(bx, by + 0.1, -35), this.V3(bx + 0.2, by, -35), '#0f172a', 0.03, { alpha: 0.6 });
    }
  }

  private updatePlayerPhysics(dt: number) {
    if (!this.isPlayer) return;

    const speed = (this.moveInput.sprint ? 1.75 : 1.0) * this.baseSpeed;
    let targetVx = 0;
    let targetVz = 0;

    if (this.moveInput.forward !== 0 || this.moveInput.strafe !== 0) {
      const forwardX = -Math.sin(this.playerYaw);
      const forwardZ = -Math.cos(this.playerYaw);
      const rightX = Math.cos(this.playerYaw);
      const rightZ = -Math.sin(this.playerYaw);

      const vx = forwardX * this.moveInput.forward + rightX * this.moveInput.strafe;
      const vz = forwardZ * this.moveInput.forward + rightZ * this.moveInput.strafe;
      const len = Math.hypot(vx, vz) || 1;

      targetVx = (vx / len) * speed;
      targetVz = (vz / len) * speed;
    }

    const damp = Math.min(1, dt * 10);
    this.playerVel.x += (targetVx - this.playerVel.x) * damp;
    this.playerVel.z += (targetVz - this.playerVel.z) * damp;

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.z += this.playerVel.z * dt;

    this.pushOutOfObstacles(this.playerPos);
    this.pushOutOfPool(this.playerPos);

    this.playerPos.x = Math.min(21.5, Math.max(-21.5, this.playerPos.x));
    this.playerPos.z = Math.min(18.0, Math.max(-17.5, this.playerPos.z));

    this.camPos = { x: this.playerPos.x, y: 1.65, z: this.playerPos.z };
    const lookDist = 5.0;
    this.camTarget = {
      x: this.playerPos.x - Math.sin(this.playerYaw) * Math.cos(this.playerPitch) * lookDist,
      y: 1.65 + Math.sin(this.playerPitch) * lookDist,
      z: this.playerPos.z - Math.cos(this.playerYaw) * Math.cos(this.playerPitch) * lookDist
    };
  }

  private loop = (now: number) => {
    if (this.isDestroyed) return;
    const dt = Math.min((now - this.lastT) / 1000, 0.05);
    this.lastT = now;
    const t = now / 1000;

    if (this.isPlayer) {
      this.updatePlayerPhysics(dt);
    } else if (this.camAnim) {
      this.camAnim.t = Math.min(1, this.camAnim.t + dt / this.camAnim.dur);
      const ease = this.camAnim.t < 0.5 ? 4 * Math.pow(this.camAnim.t, 3) : 1 - Math.pow(-2 * this.camAnim.t + 2, 3) / 2;
      this.camPos = this.vlerp(this.camAnim.fP, this.camAnim.tP, ease);
      this.camTarget = this.vlerp(this.camAnim.fL, this.camAnim.tL, ease);
      if (this.camAnim.t >= 1) this.camAnim = null;
    }

    this.updateAgents(dt);

    const f = this.vnorm(this.vsub(this.camTarget, this.camPos));
    const r = this.vnorm(this.vcross(f, { x: 0, y: 1, z: 0 }));
    const u = this.vcross(r, f);
    this.viewB = { f, r, u };
    this.focal = (this.VH * 0.5) / Math.tan(0.42);
    this.ccx = this.VW * 0.5;
    this.ccy = this.VH * 0.5;

    this.prims = [];
    this.buildScene(t);

    const list: any[] = [];
    for (const pr of this.prims) {
      if (pr.t === 'q') {
        const P = pr.pts.map((p: Vec3) => this.project(p));
        if (P.some((p: any) => !p)) continue;
        pr._P = P;
        pr._d = (P[0].z + P[1].z + P[2].z + P[3].z) * 0.25;
      } else if (pr.t === 's') {
        const P = this.project(pr.p);
        if (!P) continue;
        pr._P = P;
        pr._d = P.z;
      } else {
        const A = this.project(pr.a), C = this.project(pr.b);
        if (!A || !C) continue;
        pr._P = [A, C];
        pr._d = (A.z + C.z) * 0.5;
      }
      list.push(pr);
    }
    list.sort((a, b) => b._d - a._d);

    this.ctx.setTransform(this.VDPR, 0, 0, this.VDPR, 0, 0);
    const g = this.ctx.createLinearGradient(0, 0, 0, this.VH);
    g.addColorStop(0, '#87ceeb');
    g.addColorStop(0.35, '#b4d9ec');
    g.addColorStop(0.65, '#d8eaf4');
    g.addColorStop(1, '#c5d9e6');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.VW, this.VH);

    const sunProj = this.project(this.V3(-40, 25, -30));
    if (sunProj) {
      const grad = this.ctx.createRadialGradient(sunProj.x, sunProj.y, 0, sunProj.x, sunProj.y, 300);
      grad.addColorStop(0, 'rgba(254,243,199,0.25)');
      grad.addColorStop(0.3, 'rgba(254,243,199,0.1)');
      grad.addColorStop(1, 'rgba(254,243,199,0)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.VW, this.VH);
    }

    for (const pr of list) {
      if (pr.t === 'q') {
        const lightF = 0.62 + 0.38 * Math.abs(this.vdot(pr.n, this.LIGHT));
        this.ctx.fillStyle = this.rgba(pr.color, lightF, pr.alpha == null ? 1 : pr.alpha);
        const P = pr._P;
        this.ctx.beginPath();
        this.ctx.moveTo(P[0].x, P[0].y);
        for (let i = 1; i < P.length; i++) this.ctx.lineTo(P[i].x, P[i].y);
        this.ctx.closePath();
        this.ctx.fill();
        if (pr.stroke) {
          this.ctx.strokeStyle = pr.stroke;
          this.ctx.lineWidth = pr.lw || 1;
          this.ctx.stroke();
        }
      } else if (pr.t === 's') {
        const P = pr._P, rad = Math.max(0.5, (pr.r * this.focal) / P.z);
        this.ctx.globalAlpha = pr.alpha == null ? 1 : pr.alpha;
        this.ctx.fillStyle = this.rgba(pr.color, 1, 1);
        this.ctx.beginPath();
        this.ctx.arc(P.x, P.y, rad, 0, 7);
        this.ctx.fill();
        if (pr.ring) {
          this.ctx.strokeStyle = pr.ring;
          this.ctx.lineWidth = Math.max(1, (pr.ringw * this.focal) / P.z);
          this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
      } else {
        const A = pr._P[0], C = pr._P[1], zz = (A.z + C.z) / 2;
        this.ctx.strokeStyle = this.rgba(pr.color, 1, pr.alpha == null ? 1 : pr.alpha);
        this.ctx.lineWidth = Math.max(1, (pr.w * this.focal) / zz);
        this.ctx.beginPath();
        this.ctx.moveTo(A.x, A.y);
        this.ctx.lineTo(C.x, C.y);
        this.ctx.stroke();
      }
    }

    const projHotspots: HotspotProjected[] = HOTSPOTS_DATA.map(h => {
      const p = this.project(this.V3(h.anchor3d[0], h.anchor3d[1], h.anchor3d[2]));
      return {
        ...h,
        x: p ? p.x : 0,
        y: p ? p.y : 0,
        z: p ? p.z : 9999,
        visible: !!p
      };
    });
    this.onProjectHotspots(projHotspots);

    const projLabels: Label3D[] = LABELS_DATA.map(l => {
      const p = this.project(this.V3(l.p[0], l.p[1], l.p[2]));
      return {
        ...l,
        x: p ? p.x : 0,
        y: p ? p.y : 0,
        z: p ? p.z : 9999,
        scale: p ? Math.min(1.08, Math.max(0.7, 20 / p.z)) : 1,
        visible: !!p
      };
    });
    this.onProjectLabels(projLabels);

    this.fc++;
    if (now - this.ft >= 1000) {
      this.onFpsUpdate(this.fc);
      this.fc = 0;
      this.ft = now;
    }

    this.animId = requestAnimationFrame(this.loop);
  };

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animId);
  }
}


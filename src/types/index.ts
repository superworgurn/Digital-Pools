export interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  short: string;
  icon: string;
  anchor3d: [number, number, number];
  cam3d: [number, number, number];
  look3d: [number, number, number];
}

export interface HotspotProjected extends Hotspot {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

export interface Label3D {
  t: string;
  p: [number, number, number];
  c: 'zone3' | 'tag3';
  x?: number;
  y?: number;
  z?: number;
  visible?: boolean;
  scale?: number;
}

export interface Slot {
  id: string;
  name: string;
  time: string;
  total: number;
  booked: number;
  price: number;
}

export interface Booking {
  id: string;
  slotId: string;
  dateIdx: number;
  status: 'confirmed' | 'cancelled';
  placed: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  msg: string;
  type: 'success' | 'danger' | 'warn' | 'info';
}

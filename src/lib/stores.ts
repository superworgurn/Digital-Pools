import { writable } from 'svelte/store';
import type { ToastMessage } from '../types';

export interface UserProfile {
  username: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Booking {
  id: string;
  slotId: string;
  slotName: string;
  dateIdx: number;
  dateLabel: string;
  memberCount: number;
  pricePerPerson: number;
  totalPrice: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  placed: string;
}

export interface ClassRegistration {
  id: string;
  classIdx: number;
  className: string;
  coach: string;
  time: string;
  pricePerPerson: number;
  memberCount: number;
  totalPrice: number;
  status: 'unpaid' | 'paid';
  registeredAt: string;
}

export interface CheckinEntry {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  pricePerPerson: number;
  totalPrice: number;
  status: 'unpaid' | 'paid' | 'checked_out';
  inTime: string;
  outTime: string;
}

export const currentUser = writable<UserProfile | null>(null);
export const isLoginModalOpen = writable<boolean>(false);
export const activeModal = writable<string | null>(null);
export const activeModalTab = writable<string | null>(null); // ควบคุมแท็บย่อยจาก URL Parameter
export const prefillCheckin = writable<{ code: string; name: string }>({ code: '', name: '' }); // ข้อมูลเติมอัตโนมัติจาก URL

export const isDrawerOpen = writable<boolean>(false);
export const activeView = writable<string>('overview');
export const currentFps = writable<number>(60);
export const isPlayerMode = writable<boolean>(false);
export const isEmergency = writable<boolean>(false);

export const poolCapacity = writable({ current: 35, max: 50 });

export const waterQuality = writable({
  ph: 7.42,
  chlorine: 1.20,
  temp: 27.5,
  orp: 742,
  turbidity: 0.42,
  tds: 480,
  updated: '2 นาทีที่แล้ว'
});

export const sensorsStore = writable([
  { name: 'pH Probe #A1', status: 'online', value: '7.42', ping: '12 ms' },
  { name: 'Chlorine Analyzer #B2', status: 'online', value: '1.20 ppm', ping: '18 ms' },
  { name: 'Thermal Sensor #C3', status: 'online', value: '27.5 °C', ping: '9 ms' },
  { name: 'Turbidity #D4', status: 'warning', value: '0.42 NTU', ping: '240 ms' }
]);

export const lockerState = writable<Array<'free' | 'used' | 'mine'>>(
  Array.from({ length: 30 }, (_, i) => ((i * 7 + 5) % 13) < 4 ? 'used' : 'free')
);

export const slotsStore = writable([
  { id: 'morning', name: 'Morning Slot', time: '06:00 – 12:00', total: 50, booked: 38, price: 120 },
  { id: 'afternoon', name: 'Afternoon Slot', time: '12:00 – 17:00', total: 50, booked: 47, price: 120 },
  { id: 'night', name: 'Night Slot', time: '17:00 – 21:00', total: 40, booked: 19, price: 150 }
]);

export const dateOptions = [
  { d: 'จ.', n: '12' }, { d: 'อ.', n: '13' }, { d: 'พ.', n: '14' },
  { d: 'พฤ.', n: '15' }, { d: 'ศ.', n: '16' }, { d: 'ส.', n: '17' }, { d: 'อา.', n: '18' }
];

export const myBookings = writable<Booking[]>([
  {
    id: 'BK-2501',
    slotId: 'morning',
    slotName: 'Morning Slot',
    dateIdx: 1,
    dateLabel: 'อ. 13',
    memberCount: 2,
    pricePerPerson: 120,
    totalPrice: 240,
    status: 'unpaid',
    placed: '08:12'
  },
  {
    id: 'BK-2502',
    slotId: 'night',
    slotName: 'Night Slot',
    dateIdx: 4,
    dateLabel: 'ศ. 16',
    memberCount: 1,
    pricePerPerson: 150,
    totalPrice: 150,
    status: 'paid',
    placed: '08:40'
  }
]);

export const checkinEntriesStore = writable<CheckinEntry[]>([
  {
    id: 'CK-8842',
    name: 'ณภัทร ส.',
    code: 'QR-8842',
    memberCount: 2,
    pricePerPerson: 120,
    totalPrice: 240,
    status: 'checked_out',
    inTime: '08:12',
    outTime: '09:35'
  },
  {
    id: 'CK-2311',
    name: 'ปุณยวีร์ ก.',
    code: 'RF-2311',
    memberCount: 1,
    pricePerPerson: 120,
    totalPrice: 120,
    status: 'paid',
    inTime: '09:04',
    outTime: '—'
  }
]);

export const memberData = {
  name: 'ปุณยวีร์ กิตติวงศ์',
  id: 'DP-004512',
  tier: 'GOLD',
  points: 1280,
  nextTier: 2000,
  expiry: '31 ธ.ค. 2568',
  visits: 42
};

export const billingList = [
  { item: 'ค่าสมาชิกรายเดือน (Gold)', amount: 850 },
  { item: 'ค่าคอร์สเรียนว่ายน้ำ (4 ครั้ง)', amount: 1200 },
  { item: 'ค่าเช่าล็อกเกอร์ประจำ', amount: 150 },
  { item: 'ส่วนลดสมาชิก Gold (10%)', amount: -220 }
];

export const guardsList = [
  { name: 'อนุชา พงษ์ทอง', role: 'Head Lifeguard', shift: '06:00 – 12:00', zone: 'โซน A / สระหลัก', status: 'on-duty', cert: 'ILS Certified', phone: '081-234-5678' },
  { name: 'วรัญญา ศรีสุข', role: 'Lifeguard', shift: '12:00 – 17:00', zone: 'โซน B / สระเด็ก', status: 'standby', cert: 'CPR / AED', phone: '089-876-5432' },
  { name: 'กิตติพงษ์ แก้วดี', role: 'Lifeguard', shift: '17:00 – 21:00', zone: 'โซน A / สระหลัก', status: 'off', cert: 'ILS Certified', phone: '086-555-1122' }
];

export const instructorsList = [
  { name: 'โค้ชไมเคิล ใจดี', specialty: 'Freestyle / Competition', rating: 4.9, classes: 128, exp: '8 ปี', color: 'cyan' },
  { name: 'โค้ชแพรว พิมพ์ใจ', specialty: 'Beginner / Kids', rating: 4.8, classes: 96, exp: '5 ปี', color: 'violet' },
  { name: 'โค้ชเต้ย ธนวัฒน์', specialty: 'Advanced Stroke / Rescue', rating: 4.7, classes: 74, exp: '6 ปี', color: 'emerald' }
];

export const classesStore = writable([
  { name: 'Freestyle Beginner', level: 'Beginner', time: 'จ. / พ. 18:00', coach: 'โค้ชแพรว พิมพ์ใจ', seats: 4, total: 12, price: 1500 },
  { name: 'Advanced Stroke', level: 'Intermediate', time: 'อ. / พฤ. 19:00', coach: 'โค้ชไมเคิล ใจดี', seats: 2, total: 10, price: 1800 },
  { name: 'Kids Water Safety', level: 'Kids 6-12', time: 'ส. 10:00', coach: 'โค้ชแพรว พิมพ์ใจ', seats: 7, total: 15, price: 1200 },
  { name: 'Rescue & CPR', level: 'Advanced', time: 'อา. 14:00', coach: 'โค้ชเต้ย ธนวัฒน์', seats: 0, total: 8, price: 2500 }
]);

export const classRegistrationsStore = writable<ClassRegistration[]>([
  {
    id: 'CR-101',
    classIdx: 0,
    className: 'Freestyle Beginner',
    coach: 'โค้ชแพรว พิมพ์ใจ',
    time: 'จ. / พ. 18:00',
    pricePerPerson: 1500,
    memberCount: 2,
    totalPrice: 3000,
    status: 'unpaid',
    registeredAt: '10:15 น.'
  }
]);

export const dashboardTimeframes = {
  daily: {
    revenue: 42850,
    growth: '+12.4%',
    visitors: '214 คน',
    visitorsSub: 'เฉลี่ยต่อชั่วโมง 18 คน',
    utilization: '70%',
    utilizationSub: 'สูงสุด 18:00 (92%)',
    waterScore: 'Optimal (98%)',
    waterSub: 'pH 7.42 · Cl 1.2 ppm',
    peakSummary: '17:00 – 19:30 น. (หนาแน่น 85–92%)',
    offPeakSummary: '11:00 – 14:00 น. (คนน้อย 25–35%)',
    peakDetails: [
      { label: '06:00', val: 22 }, { label: '08:00', val: 58 }, { label: '10:00', val: 44 },
      { label: '12:00', val: 35 }, { label: '14:00', val: 48 }, { label: '16:00', val: 76 },
      { label: '18:00', val: 92 }, { label: '20:00', val: 54 }
    ],
    breakdown: [
      { label: 'ค่าบัตรรายวัน / รอบว่ายน้ำ', value: 18400, color: 'bg-cyan-400' },
      { label: 'สมาชิกรายเดือน', value: 14200, color: 'bg-violet-400' },
      { label: 'คอร์สเรียนว่ายน้ำ', value: 6800, color: 'bg-emerald-400' },
      { label: 'ล็อกเกอร์ & บริการเสริม', value: 3450, color: 'bg-amber-400' }
    ]
  },
  weekly: {
    revenue: 248600,
    growth: '+8.2%',
    visitors: '1,520 คน',
    visitorsSub: 'เฉลี่ย 217 คน/วัน',
    utilization: '68%',
    utilizationSub: 'สูงสุดวันเสาร์-อาทิตย์',
    waterScore: 'Stable (97%)',
    waterSub: 'อุณหภูมิเฉลี่ย 27.6°C',
    peakSummary: 'ศุกร์เย็น และ เสาร์–อาทิตย์ (14:00 – 19:00 น.)',
    offPeakSummary: 'วันอังคาร และ วันพุธ (ช่วงกลางวัน)',
    peakDetails: [
      { label: 'จันทร์', val: 55 }, { label: 'อังคาร', val: 42 }, { label: 'พุธ', val: 48 },
      { label: 'พฤหัส', val: 62 }, { label: 'ศุกร์', val: 84 }, { label: 'เสาร์', val: 96 },
      { label: 'อาทิตย์', val: 90 }
    ],
    breakdown: [
      { label: 'ค่าบัตรรายวัน / รอบว่ายน้ำ', value: 92000, color: 'bg-cyan-400' },
      { label: 'คอร์สเรียนว่ายน้ำ', value: 85000, color: 'bg-emerald-400' },
      { label: 'สมาชิกรายเดือน', value: 52000, color: 'bg-violet-400' },
      { label: 'ล็อกเกอร์ & บริการเสริม', value: 19600, color: 'bg-amber-400' }
    ]
  },
  monthly: {
    revenue: 892400,
    growth: '+9.8%',
    visitors: '6,428 คน',
    visitorsSub: 'เฉลี่ย 214 คน/วัน',
    utilization: '72%',
    utilizationSub: 'สัปดาห์ที่ 1 และ 4 สูงสุด',
    waterScore: 'Excellent (99%)',
    waterSub: 'การเปลี่ยนน้ำตามรอบมาตรฐาน',
    peakSummary: 'สัปดาห์ที่ 1 และ 4 ของเดือน (ช่วงเปิดรอบคอร์ส)',
    offPeakSummary: 'สัปดาห์ที่ 2 ช่วงกลางสัปดาห์',
    peakDetails: [
      { label: 'สัปดาห์ 1', val: 88 }, { label: 'สัปดาห์ 2', val: 64 },
      { label: 'สัปดาห์ 3', val: 71 }, { label: 'สัปดาห์ 4', val: 94 }
    ],
    breakdown: [
      { label: 'สมาชิกรายเดือน', value: 395000, color: 'bg-violet-400' },
      { label: 'คอร์สเรียนว่ายน้ำ', value: 268000, color: 'bg-emerald-400' },
      { label: 'ค่าบัตรรายวัน / รอบว่ายน้ำ', value: 165000, color: 'bg-cyan-400' },
      { label: 'ล็อกเกอร์ & บริการเสริม', value: 64400, color: 'bg-amber-400' }
    ]
  }
};

export const toasts = writable<ToastMessage[]>([]);

export function addToast(title: string, msg: string, type: ToastMessage['type'] = 'info') {
  const id = Math.random().toString(36).substring(2, 9);
  toasts.update(list => [...list, { id, title, msg, type }]);
  setTimeout(() => {
    toasts.update(list => list.filter(t => t.id !== id));
  }, 3500);
}

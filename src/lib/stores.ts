import { writable, derived } from 'svelte/store';
import type {
  HotspotId,
  UserSession,
  SwimsuitCatalogItem,
  SwimsuitOrder,
  PoolBooking,
  LockerItem,
  CourseRegistration,
  SwimsuitSize,
  VipMembership,
  CrmProfile,
  CrmRank
} from '../types';

export const BRAND_LOGO_IMAGE_URL = '/logo.png';
export const PAYMENT_QR_IMAGE_URL = '/my-qrcode.png';

export const activeHotspot = writable<HotspotId | null>(null);
export const isManagerDrawerOpen = writable<boolean>(false);
export const isExplorationMode = writable<boolean>(false);
export const isLoginModalOpen = writable<boolean>(false);
export const currentUser = writable<UserSession | null>(null);

export interface ToastItem {
  id: string;
  title: string;
  msg: string;
  type: 'success' | 'danger' | 'warn' | 'warning' | 'info';
}

export const toasts = writable<ToastItem[]>([]);

export function addToast(
  title: string,
  msg: string,
  type: ToastItem['type'] = 'info'
) {
  const normalizedType = type === 'warning' ? 'warn' : type;
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  toasts.update((all) => [...all, { id, title, msg, type: normalizedType }]);
  setTimeout(() => {
    toasts.update((all) => all.filter((t) => t.id !== id));
  }, 4200);
}

// --- Queue Ticket Generator & JPG Export ---
let queueSequence = 1;
export function generateQueueCode(prefix: string = 'Q'): string {
  const num = String(queueSequence++).padStart(3, '0');
  return `${prefix}-${num}`;
}

export interface QueueTicketData {
  queueCode: string;
  serviceTitle: string;
  customerName: string;
  detailLine1: string;
  detailLine2: string;
  amountText: string;
  timestamp: string;
}

export const latestQueueTicket = writable<QueueTicketData | null>(null);

export function downloadQueueTicketJpg(ticket: QueueTicketData) {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(40, 40, 640, 880, 28);
  ctx.fill();

  const grad = ctx.createLinearGradient(40, 40, 680, 200);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(40, 40, 640, 175, [28, 28, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DIGITAL POOLS • บัตรคิวบริการ', 360, 112);

  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#e0f2fe';
  ctx.fillText('Smart Aquatics Platform Queue Ticket', 360, 155);

  ctx.fillStyle = '#f0f9ff';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(90, 250, 540, 195, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('หมายเลขคิวของคุณ (QUEUE NUMBER)', 360, 298);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 92px monospace';
  ctx.fillText(ticket.queueCode, 360, 398);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(80, 480);
  ctx.lineTo(640, 480);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '22px sans-serif';
  ctx.fillText('ประเภทบริการ:', 90, 535);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(ticket.serviceTitle, 90, 572);

  ctx.fillStyle = '#64748b';
  ctx.font = '22px sans-serif';
  ctx.fillText('ชื่อผู้ใช้บริการ:', 90, 625);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 25px sans-serif';
  ctx.fillText(ticket.customerName, 90, 660);

  ctx.fillStyle = '#334155';
  ctx.font = '22px sans-serif';
  ctx.fillText(ticket.detailLine1, 90, 712);
  ctx.fillText(ticket.detailLine2, 90, 748);

  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  ctx.roundRect(90, 780, 540, 75, 14);
  ctx.fill();

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ticket.amountText, 360, 827);

  ctx.fillStyle = '#64748b';
  ctx.font = '20px sans-serif';
  ctx.fillText(`ออกบัตรคิวเมื่อ: ${ticket.timestamp}`, 360, 895);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `DigitalPools-Queue-${ticket.queueCode}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  addToast('ดาวน์โหลดบัตรคิว JPG สำเร็จ', `บันทึกไฟล์ DigitalPools-Queue-${ticket.queueCode}.jpg แล้ว`, 'success');
}

// --- CRM Loyalty Points Store (สำหรับ User ทุกระดับ) ---
export const crmProfile = writable<CrmProfile>({
  points: 120,
  lifetimePoints: 120,
  visitCount: 2,
  transactions: [
    {
      id: 'CRM-INIT-1',
      title: 'โบนัสต้อนรับสมาชิก Digital Pools',
      points: 120,
      type: 'earn',
      timestamp: 'วันนี้'
    }
  ]
});

export const crmTierStatus = derived(crmProfile, ($crm) => {
  const pts = $crm.lifetimePoints;
  let rank: CrmRank = 'Bronze';
  let nextRank: CrmRank | 'Max Level' = 'Silver';
  let currentFloor = 0;
  let nextThreshold = 100;

  if (pts >= 600) {
    rank = 'Platinum';
    nextRank = 'Max Level';
    currentFloor = 600;
    nextThreshold = 600;
  } else if (pts >= 300) {
    rank = 'Gold';
    nextRank = 'Platinum';
    currentFloor = 300;
    nextThreshold = 600;
  } else if (pts >= 100) {
    rank = 'Silver';
    nextRank = 'Gold';
    currentFloor = 100;
    nextThreshold = 300;
  }

  const progressPercent =
    rank === 'Platinum'
      ? 100
      : Math.min(100, Math.round(((pts - currentFloor) / (nextThreshold - currentFloor)) * 100));

  const pointsToNext = rank === 'Platinum' ? 0 : Math.max(0, nextThreshold - pts);

  return {
    rank,
    nextRank,
    nextThreshold,
    progressPercent,
    pointsToNext
  };
});

export function earnCrmPoints(amountBaht: number, reason: string, incrementVisit = false) {
  const earned = Math.max(5, Math.floor(amountBaht / 10));
  const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  crmProfile.update((prev) => ({
    points: prev.points + earned,
    lifetimePoints: prev.lifetimePoints + earned,
    visitCount: incrementVisit ? prev.visitCount + 1 : prev.visitCount,
    transactions: [
      {
        id: `CRM-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: reason,
        points: earned,
        type: 'earn',
        timestamp: nowStr
      },
      ...prev.transactions
    ]
  }));
  return earned;
}

export function redeemCrmPoints(pointsToUse: number, reason: string): boolean {
  let success = false;
  const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  crmProfile.update((prev) => {
    if (prev.points < pointsToUse || pointsToUse <= 0) return prev;
    success = true;
    return {
      ...prev,
      points: prev.points - pointsToUse,
      transactions: [
        {
          id: `CRM-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: reason,
          points: pointsToUse,
          type: 'redeem',
          timestamp: nowStr
        },
        ...prev.transactions
      ]
    };
  });
  return success;
}

// --- VIP Membership Store ---
export const activeVipMembership = writable<VipMembership | null>(null);
export const vipHistory = writable<VipMembership[]>([]);

export const vipDiscountPercent = derived(activeVipMembership, ($vip) => {
  if (!$vip || $vip.status !== 'active') return 0;
  return $vip.discountPercent;
});

// --- Pool Metrics (ครบ 6 ค่าคุณภาพน้ำ & IoT ตามสไลด์) ---
export const poolMetrics = writable({
  ph: 7.4,
  chlorine: 1.5,
  temperature: 28.5,
  orp: 745,
  turbidity: 0.3,
  tds: 420,
  telemetryPingMs: 18,
  currentSwimmers: 18,
  maxCapacity: 60,
  kidsPoolSwimmers: 6,
  activeLifeguards: 4
});

// --- Catalog & Size Modifiers ---
export const SIZE_PRICE_MODIFIERS: Record<
  SwimsuitSize,
  { extraRent: number; extraBuy: number; chest: string }
> = {
  KIDS: { extraRent: 0, extraBuy: 0, chest: '24-28 นิ้ว' },
  XS: { extraRent: 0, extraBuy: 0, chest: '30-32 นิ้ว' },
  S: { extraRent: 0, extraBuy: 0, chest: '32-34 นิ้ว' },
  M: { extraRent: 0, extraBuy: 0, chest: '34-36 นิ้ว' },
  L: { extraRent: 10, extraBuy: 30, chest: '36-38 นิ้ว' },
  XL: { extraRent: 20, extraBuy: 50, chest: '38-40 นิ้ว' },
  '2XL': { extraRent: 30, extraBuy: 80, chest: '40-44 นิ้ว' }
};

export const SWIMSUIT_CATALOG = writable<SwimsuitCatalogItem[]>([
  {
    id: 'suit-men-pro',
    name: 'กางเกงว่ายน้ำชาย Pro Jammer',
    category: 'men',
    icon: '🩲',
    description: 'ผ้ากันคลอรีน 100% กระชับกล้ามเนื้อ ลดแรงต้านน้ำ',
    rentPrice: 80,
    buyPrice: 450,
    depositPrice: 100,
    colorHex: '#0284c7',
    colorNumber: 0x0284c7,
    availableColors: [
      { colorId: 'navy', colorName: 'น้ำเงินเข้ม', colorHex: '#0284c7', colorNumber: 0x0284c7 },
      { colorId: 'black', colorName: 'ดำสนิท', colorHex: '#1e293b', colorNumber: 0x1e293b }
    ],
    rentStock: { KIDS: 0, XS: 3, S: 5, M: 8, L: 6, XL: 4, '2XL': 2 },
    buyStock: { KIDS: 0, XS: 4, S: 6, M: 10, L: 8, XL: 5, '2XL': 3 }
  },
  {
    id: 'suit-women-onepiece',
    name: 'ชุดว่ายน้ำหญิง One-Piece Sport',
    category: 'women',
    icon: '🩱',
    description: 'ดีไซน์สปอร์ตสายไขว้หลัง คล่องตัวทุกท่าว่าย',
    rentPrice: 120,
    buyPrice: 690,
    depositPrice: 150,
    colorHex: '#db2777',
    colorNumber: 0xdb2777,
    availableColors: [
      { colorId: 'pink', colorName: 'ชมพูบานเย็น', colorHex: '#db2777', colorNumber: 0xdb2777 },
      { colorId: 'teal', colorName: 'เขียวน้ำทะเล', colorHex: '#0d9488', colorNumber: 0x0d9488 }
    ],
    rentStock: { KIDS: 0, XS: 4, S: 6, M: 7, L: 5, XL: 3, '2XL': 2 },
    buyStock: { KIDS: 0, XS: 5, S: 8, M: 9, L: 6, XL: 4, '2XL': 2 }
  },
  {
    id: 'suit-unisex-rashguard',
    name: 'ชุดว่ายน้ำแขนยาวกัน UV (Unisex)',
    category: 'unisex',
    icon: '👕',
    description: 'ป้องกันรังสี UPF 50+ ใส่ได้ทั้งชายและหญิง',
    rentPrice: 140,
    buyPrice: 790,
    depositPrice: 150,
    colorHex: '#06b6d4',
    colorNumber: 0x06b6d4,
    availableColors: [
      { colorId: 'cyan', colorName: 'ฟ้าเทอร์ควอยซ์', colorHex: '#06b6d4', colorNumber: 0x06b6d4 },
      { colorId: 'slate', colorName: 'เทากราไฟต์', colorHex: '#475569', colorNumber: 0x475569 }
    ],
    rentStock: { KIDS: 2, XS: 3, S: 5, M: 6, L: 5, XL: 4, '2XL': 2 },
    buyStock: { KIDS: 3, XS: 4, S: 7, M: 8, L: 6, XL: 4, '2XL': 3 }
  },
  {
    id: 'suit-kids-float',
    name: 'ชุดว่ายน้ำเด็กพร้อมโฟมพยุงตัว',
    category: 'kids',
    icon: '🧒',
    description: 'ปลอดภัยสำหรับเด็กเล็ก สีสันสดใสเห็นชัดเจน',
    rentPrice: 90,
    buyPrice: 520,
    depositPrice: 100,
    colorHex: '#f59e0b',
    colorNumber: 0xf59e0b,
    availableColors: [
      { colorId: 'amber', colorName: 'เหลืองส้ม', colorHex: '#f59e0b', colorNumber: 0xf59e0b },
      { colorId: 'sky', colorName: 'ฟ้าสดใส', colorHex: '#38bdf8', colorNumber: 0x38bdf8 }
    ],
    rentStock: { KIDS: 10, XS: 4, S: 2, M: 0, L: 0, XL: 0, '2XL': 0 },
    buyStock: { KIDS: 12, XS: 5, S: 3, M: 0, L: 0, XL: 0, '2XL': 0 }
  },
  {
    id: 'gear-goggles-cap',
    name: 'เซ็ตแว่นตาว่ายน้ำกันฝ้า + หมวกซิลิโคน',
    category: 'gear',
    icon: '🥽',
    description: 'เลนส์เคลือบสารกันฝ้า UV Protection พร้อมหมวกซิลิโคนนุ่ม',
    rentPrice: 60,
    buyPrice: 350,
    depositPrice: 80,
    colorHex: '#6366f1',
    colorNumber: 0x6366f1,
    availableColors: [
      { colorId: 'indigo', colorName: 'น้ำเงินคราม', colorHex: '#6366f1', colorNumber: 0x6366f1 },
      { colorId: 'rose', colorName: 'ชมพูโรส', colorHex: '#f43f5e', colorNumber: 0xf43f5e }
    ],
    rentStock: { KIDS: 15, XS: 15, S: 15, M: 15, L: 15, XL: 15, '2XL': 15 },
    buyStock: { KIDS: 20, XS: 20, S: 20, M: 20, L: 20, XL: 20, '2XL': 20 }
  },
  {
    id: 'towel-microfiber-pro',
    name: 'ผ้าขนหนูไมโครไฟเบอร์ซับน้ำเร็วพิเศษ (Quick-Dry Towel)',
    category: 'towel',
    icon: '🧣',
    description: 'ผ้านุ่มพิเศษ ซับน้ำได้ดีกว่าผ้าทั่วไป 3 เท่า แห้งไว ไม่อับชื้น ขนาด 70×140 ซม.',
    rentPrice: 50,
    buyPrice: 290,
    depositPrice: 50,
    colorHex: '#10b981',
    colorNumber: 0x10b981,
    availableColors: [
      { colorId: 'emerald', colorName: 'เขียวมรกต', colorHex: '#10b981', colorNumber: 0x10b981 },
      { colorId: 'white', colorName: 'ขาวโรงแรม', colorHex: '#f8fafc', colorNumber: 0xf8fafc },
      { colorId: 'navy', colorName: 'กรมท่า', colorHex: '#1e3a8a', colorNumber: 0x1e3a8a }
    ],
    rentStock: { KIDS: 25, XS: 25, S: 25, M: 25, L: 25, XL: 25, '2XL': 25 },
    buyStock: { KIDS: 30, XS: 30, S: 30, M: 30, L: 30, XL: 30, '2XL': 30 }
  }
]);

export const swimsuitOrders = writable<SwimsuitOrder[]>([]);
export const bookings = writable<PoolBooking[]>([
  {
    id: 'BK-1001',
    queueCode: 'Q-000',
    customerName: 'คุณธนากร ใจดี',
    phone: '081-234-5678',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '16:00 - 18:00',
    poolZone: 'main',
    memberCount: 2,
    totalPrice: 240,
    status: 'paid',
    qrRef: 'DP-QR-1001'
  }
]);

// --- ตู้ล็อกเกอร์ 30 ตู้ แบ่ง 3 โซน (โซน A, โซน B และ โซน C VIP) ---
export const lockers = writable<LockerItem[]>(
  Array.from({ length: 30 }, (_, i) => {
    const idx = i + 1;
    const num = String(idx).padStart(2, '0');
    const isZoneA = idx <= 10;
    const isZoneB = idx > 10 && idx <= 20;
    const prefix = isZoneA ? 'A' : isZoneB ? 'B' : 'C';
    const zoneLabel = isZoneA
      ? 'โซน A (ชาย)'
      : isZoneB
        ? 'โซน B (หญิง)'
        : 'โซน C (VIP)';
    const tierType = isZoneA || isZoneB ? 'standard' : 'vip';
    const price = tierType === 'vip' ? 80 : 40;
    const occupiedIndices = [2, 6, 13, 18, 24, 28];

    return {
      id: `lk-${num}`,
      number: `${prefix}-${num}`,
      zone: zoneLabel,
      tierType,
      price,
      status: occupiedIndices.includes(idx) ? 'occupied' : 'available'
    };
  })
);

export const courseRegistrations = writable<CourseRegistration[]>([
  {
    id: 'CR-1001',
    queueCode: 'C-000',
    studentName: 'น้องต้นกล้า',
    phone: '089-555-1212',
    courseName: 'Kids Beginner Survival (10 ชม.)',
    instructor: 'โค้ชฉลาม (ครูเอก)',
    schedule: 'เสาร์-อาทิตย์ 10:00 - 11:00',
    memberCount: 1,
    totalPrice: 3500,
    status: 'paid'
  }
]);

// --- Total Revenue Summary ---
export const totalRevenueSummary = derived(
  [swimsuitOrders, bookings, lockers, courseRegistrations, vipHistory],
  ([$orders, $bookings, $lockers, $courses, $vips]) => {
    let swimsuitRev = 0;
    let bookingRev = 0;
    let lockerRev = 0;
    let courseRev = 0;
    let vipRev = 0;
    let penaltyRev = 0;

    $orders.forEach((o) => {
      if (o.status === 'cancelled') {
        penaltyRev += o.penaltyAmount ?? 0;
      } else {
        swimsuitRev += o.totalAmount;
      }
    });

    $bookings.forEach((b) => {
      if (b.status === 'cancelled') {
        penaltyRev += b.penaltyAmount ?? 0;
      } else {
        bookingRev += b.totalPrice;
      }
    });

    $lockers.forEach((l) => {
      if (l.status === 'reserved') {
        lockerRev += l.paidAmount ?? (l.isVipFree ? 0 : l.price);
      }
    });

    $courses.forEach((c) => {
      if (c.status === 'cancelled') {
        penaltyRev += c.penaltyAmount ?? 0;
      } else {
        courseRev += c.totalPrice;
      }
    });

    $vips.forEach((v) => {
      if (v.status === 'cancelled') {
        penaltyRev += Math.round(v.price * 0.2);
      } else {
        vipRev += v.price;
      }
    });

    return {
      swimsuitRev,
      bookingRev,
      lockerRev,
      courseRev,
      vipRev,
      penaltyRev,
      total: swimsuitRev + bookingRev + lockerRev + courseRev + vipRev + penaltyRev
    };
  }
);
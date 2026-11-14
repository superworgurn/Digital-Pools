import { writable, derived } from 'svelte/store';
import type {
  UserProfile,
  HotspotId,
  PoolMetrics,
  LockerItem,
  BookingItem,
  CourseRegistration,
  SwimsuitCatalogItem,
  SwimsuitOrder,
  SwimsuitSize,
  ToastMessage
} from '../types';

export const BRAND_LOGO_IMAGE_URL = '/logo.png';
export const PAYMENT_QR_IMAGE_URL = '/my-qrcode.png';

export const SIZE_PRICE_MODIFIERS: Record<
  SwimsuitSize,
  { label: string; chest: string; extraRent: number; extraBuy: number }
> = {
  KIDS: { label: 'KIDS (เด็ก)', chest: '22-26"', extraRent: -20, extraBuy: -50 },
  XS: { label: 'XS', chest: '30-32"', extraRent: 0, extraBuy: 0 },
  S: { label: 'S', chest: '32-34"', extraRent: 0, extraBuy: 0 },
  M: { label: 'M', chest: '34-36"', extraRent: 0, extraBuy: 0 },
  L: { label: 'L', chest: '36-38"', extraRent: 10, extraBuy: 30 },
  XL: { label: 'XL', chest: '38-41"', extraRent: 20, extraBuy: 50 },
  XXL: { label: 'XXL', chest: '42-45"', extraRent: 30, extraBuy: 80 },
  '2XL': { label: '2XL (Plus)', chest: '42-45"', extraRent: 30, extraBuy: 80 }
};

export const SWIMSUIT_CATALOG = writable<SwimsuitCatalogItem[]>([
  {
    id: 'suit-men-pro',
    name: 'กางเกงว่ายน้ำชาย Pro Jammer',
    nameTH: 'กางเกงว่ายน้ำชาย Pro Jammer',
    category: 'men',
    rentPrice: 80,
    buyPrice: 450,
    depositPrice: 100,
    colorHex: '#0284c7',
    colorNumber: 0x0284c7,
    icon: '🩳',
    description: 'ผ้า Spandex กันคลอรีน กระชับกล้ามเนื้อ แห้งไว',
    available: true,
    availableColors: [
      { colorId: 'blue', colorName: 'สีฟ้าสมุทร', colorHex: '#0284c7', colorNumber: 0x0284c7 },
      { colorId: 'dark', colorName: 'สีดำเข้ม', colorHex: '#0f172a', colorNumber: 0x0f172a },
      { colorId: 'teal', colorName: 'สีเขียวเทล', colorHex: '#0d9488', colorNumber: 0x0d9488 }
    ],
    rentStock: { KIDS: 5, XS: 8, S: 12, M: 15, L: 14, XL: 10, XXL: 6, '2XL': 6 },
    buyStock: { KIDS: 3, XS: 5, S: 10, M: 12, L: 8, XL: 6, XXL: 4, '2XL': 4 }
  },
  {
    id: 'suit-women-onepiece',
    name: 'ชุดว่ายน้ำหญิง One-Piece Sport',
    nameTH: 'ชุดว่ายน้ำหญิง One-Piece Sport',
    category: 'women',
    rentPrice: 120,
    buyPrice: 690,
    depositPrice: 150,
    colorHex: '#db2777',
    colorNumber: 0xdb2777,
    icon: '🩱',
    description: 'ดีไซน์สปอร์ตคล่องตัว ซับในเต็มตัว กัน UV UPF 50+',
    available: true,
    availableColors: [
      { colorId: 'pink', colorName: 'สีชมพูมาเจนตา', colorHex: '#db2777', colorNumber: 0xdb2777 },
      { colorId: 'purple', colorName: 'สีม่วงลาเวนเดอร์', colorHex: '#9333ea', colorNumber: 0x9333ea },
      { colorId: 'navy', colorName: 'สีน้ำเงินกรมท่า', colorHex: '#1e3a8a', colorNumber: 0x1e3a8a }
    ],
    rentStock: { KIDS: 4, XS: 10, S: 14, M: 16, L: 12, XL: 8, XXL: 5, '2XL': 5 },
    buyStock: { KIDS: 2, XS: 6, S: 8, M: 10, L: 7, XL: 5, XXL: 3, '2XL': 3 }
  },
  {
    id: 'suit-rashguard-uv',
    name: 'ชุดว่ายน้ำแขนยาว Rashguard Set (Unisex)',
    nameTH: 'ชุดว่ายน้ำแขนยาว Rashguard Set (Unisex)',
    category: 'unisex',
    rentPrice: 150,
    buyPrice: 890,
    depositPrice: 150,
    colorHex: '#0d9488',
    colorNumber: 0x0d9488,
    icon: '👕',
    description: 'เสื้อแขนยาวพร้อมกางเกงขายาว กันแดดและรักษาอุณหภูมิร่างกาย',
    available: true,
    availableColors: [
      { colorId: 'teal', colorName: 'สีเขียวเทล', colorHex: '#0d9488', colorNumber: 0x0d9488 },
      { colorId: 'blue', colorName: 'สีฟ้าโอเชียน', colorHex: '#0284c7', colorNumber: 0x0284c7 },
      { colorId: 'dark', colorName: 'สีดำสปอร์ต', colorHex: '#1e293b', colorNumber: 0x1e293b }
    ],
    rentStock: { KIDS: 8, XS: 10, S: 15, M: 18, L: 15, XL: 12, XXL: 8, '2XL': 8 },
    buyStock: { KIDS: 5, XS: 6, S: 10, M: 12, L: 10, XL: 8, XXL: 5, '2XL': 5 }
  },
  {
    id: 'suit-kids-dino',
    name: 'ชุดว่ายน้ำเด็กพร้อมหมวก Aqua Kids',
    nameTH: 'ชุดว่ายน้ำเด็กพร้อมหมวก Aqua Kids',
    category: 'kids',
    rentPrice: 70,
    buyPrice: 390,
    depositPrice: 50,
    colorHex: '#f59e0b',
    colorNumber: 0xf59e0b,
    icon: '🧒',
    description: 'เนื้อผ้านุ่มพิเศษสำหรับเด็ก มาพร้อมหมวกว่ายน้ำเข้าชุด',
    available: true,
    availableColors: [
      { colorId: 'yellow', colorName: 'สีเหลืองไดโน', colorHex: '#f59e0b', colorNumber: 0xf59e0b },
      { colorId: 'sky', colorName: 'สีฟ้าอควา', colorHex: '#38bdf8', colorNumber: 0x38bdf8 },
      { colorId: 'rose', colorName: 'สีชมพูคิดส์', colorHex: '#fb7185', colorNumber: 0xfb7185 }
    ],
    rentStock: { KIDS: 20, XS: 10, S: 6, M: 2, L: 0, XL: 0, XXL: 0, '2XL': 0 },
    buyStock: { KIDS: 15, XS: 8, S: 4, M: 2, L: 0, XL: 0, XXL: 0, '2XL': 0 }
  },
  {
    id: 'gear-goggles-cap',
    name: 'เซ็ตแว่นตาว่ายน้ำ Anti-Fog + หมวกซิลิโคน',
    nameTH: 'เซ็ตแว่นตาว่ายน้ำ Anti-Fog + หมวกซิลิโคน',
    category: 'gear',
    rentPrice: 50,
    buyPrice: 290,
    depositPrice: 50,
    colorHex: '#6366f1',
    colorNumber: 0x6366f1,
    icon: '🥽',
    description: 'แว่นตากันฝ้า UV400 พร้อมหมวกซิลิโคนเกรดแข่งขัน',
    available: true,
    availableColors: [
      { colorId: 'indigo', colorName: 'สีน้ำเงินอินดิโก้', colorHex: '#6366f1', colorNumber: 0x6366f1 },
      { colorId: 'dark', colorName: 'สีดำเมทัลลิก', colorHex: '#334155', colorNumber: 0x334155 },
      { colorId: 'rose', colorName: 'สีโรสโกลด์', colorHex: '#f43f5e', colorNumber: 0xf43f5e }
    ],
    rentStock: { KIDS: 15, XS: 15, S: 20, M: 25, L: 20, XL: 15, XXL: 10, '2XL': 10 },
    buyStock: { KIDS: 10, XS: 10, S: 15, M: 18, L: 15, XL: 10, XXL: 8, '2XL': 8 }
  }
]);

export const currentUser = writable<UserProfile | null>({
  username: 'user',
  name: 'สมาชิกสระว่ายน้ำ (Member User)',
  displayName: 'สมาชิกสระว่ายน้ำ (Member User)',
  role: 'user'
});

export const isLoginModalOpen = writable<boolean>(false);
export const showLoginModal = isLoginModalOpen;

export const activeHotspot = writable<HotspotId | null>(null);
export const activeModal = activeHotspot;
export const activeModalTab = writable<string>('default');

export const isManagerDrawerOpen = writable<boolean>(false);
export const isDrawerOpen = isManagerDrawerOpen;

export const isExplorationMode = writable<boolean>(false);
export const isEmergency = writable<boolean>(false);
export const prefillCheckin = writable<{ code: string; name: string }>({ code: '', name: '' });

export const poolMetrics = writable<PoolMetrics>({
  ph: 7.4,
  chlorine: 1.5,
  temperature: 28.5,
  turbidity: 0.3,
  currentSwimmers: 35,
  maxCapacity: 50,
  kidsPoolSwimmers: 6,
  activeLifeguards: 3
});

export const lockers = writable<LockerItem[]>(
  Array.from({ length: 24 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    const zone = i < 8 ? 'A (ชาย)' : i < 16 ? 'B (หญิง)' : 'C (VIP)';
    const isOccupied = [2, 5, 9, 14, 19].includes(i);
    return {
      id: `locker-${num}`,
      number: `${zone[0]}-${num}`,
      zone,
      status: isOccupied ? 'occupied' : 'available',
      reservedBy: isOccupied ? 'สมาชิกสระ' : undefined,
      price: zone === 'C (VIP)' ? 80 : 40
    };
  })
);

export const bookings = writable<BookingItem[]>([
  {
    id: 'BK-1001',
    customerName: 'คุณธนกร สายชล',
    phone: '081-234-5678',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '16:00 - 18:00',
    poolZone: 'main',
    memberCount: 2,
    totalPrice: 240,
    status: 'paid',
    qrRef: 'DP-QR-8821'
  },
  {
    id: 'BK-1002',
    customerName: 'คุณพิมพ์ชนก รักสุขภาพ',
    phone: '089-876-5432',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '18:00 - 20:00',
    poolZone: 'kids',
    memberCount: 3,
    totalPrice: 270,
    status: 'checked_in',
    qrRef: 'DP-QR-8822'
  }
]);

export const courseRegistrations = writable<CourseRegistration[]>([
  {
    id: 'CR-2001',
    studentName: 'น้องภูผา',
    phone: '082-111-2233',
    courseName: 'Kids Beginner Survival (10 ชม.)',
    instructor: 'โค้ชฉลาม (ครูเอก)',
    schedule: 'เสาร์-อาทิตย์ 10:00 - 11:00',
    memberCount: 1,
    totalPrice: 3500,
    status: 'paid'
  }
]);

export const swimsuitOrders = writable<SwimsuitOrder[]>([
  {
    id: 'SW-3001',
    customerName: 'คุณอานนท์ วารี',
    phone: '086-555-4433',
    items: [
      {
        cartItemId: 'ci-1',
        itemId: 'suit-men-pro',
        swimsuitId: 'suit-men-pro',
        name: 'กางเกงว่ายน้ำชาย Pro Jammer (สีฟ้าสมุทร)',
        orderType: 'rent',
        size: 'L',
        colorName: 'สีฟ้าสมุทร',
        quantity: 1,
        rentalDays: 1,
        unitPrice: 90,
        depositPerUnit: 100,
        totalPrice: 190,
        colorHex: '#0284c7',
        colorNumber: 0x0284c7,
        color: '#0284c7'
      }
    ],
    subtotal: 90,
    totalDeposit: 100,
    totalAmount: 190,
    status: 'paid',
    createdAt: '14:20 น.'
  }
]);

export const toasts = writable<ToastMessage[]>([]);

export function addToast(
  title: string,
  message: string,
  type: ToastMessage['type'] = 'info'
) {
  const id = Math.random().toString(36).substring(2, 9);
  const normalizedType: ToastMessage['type'] =
    type === 'warning' ? 'warn' : type === 'error' ? 'danger' : type;

  toasts.update((all) => [
    ...all,
    { id, title, message, msg: message, type: normalizedType }
  ]);
  setTimeout(() => {
    toasts.update((all) => all.filter((t) => t.id !== id));
  }, 4200);
}

export const totalRevenueSummary = derived(
  [bookings, courseRegistrations, swimsuitOrders, lockers],
  ([$bookings, $courses, $swimsuits, $lockers]) => {
    const bookingRev = $bookings
      .filter((b) => b.status === 'paid' || b.status === 'checked_in')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const courseRev = $courses
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.totalPrice, 0);

    const swimsuitRev = $swimsuits
      .filter((s) => s.status === 'paid' || s.status === 'rented' || s.status === 'returned')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const lockerRev = $lockers
      .filter((l) => l.status === 'occupied' || l.status === 'reserved')
      .reduce((sum, l) => sum + l.price, 0);

    return {
      bookingRev,
      courseRev,
      swimsuitRev,
      lockerRev,
      total: bookingRev + courseRev + swimsuitRev + lockerRev
    };
  }
);
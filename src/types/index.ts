export type UserRole = 'admin' | 'member' | 'guest' | 'user';

export interface UserProfile {
  username: string;
  displayName?: string;
  name?: string;
  role: UserRole;
}

export type HotspotId =
  | 'checkin'
  | 'locker'
  | 'courses'
  | 'swimwear'
  | 'restroom'
  | 'water'
  | 'lifeguard'
  | 'kids-pool'
  | 'seven-eleven';

export interface HotspotData {
  id: HotspotId;
  title: string;
  subtitle: string;
  icon: string;
  position: { x: number; y: number; z: number };
  badge?: string;
}

export type SwimsuitSize = 'KIDS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '2XL';
export type SwimsuitOrderType = 'rent' | 'buy';
export type SwimsuitCategory =
  | 'men'
  | 'women'
  | 'kids'
  | 'unisex'
  | 'gear'
  | 'one-piece'
  | 'bikini'
  | 'racing'
  | 'trunks'
  | 'rashguard'
  | 'accessories';

export interface SwimsuitColorOption {
  colorId: string;
  colorName: string;
  colorHex: string;
  colorNumber: number;
}

export interface SwimsuitCatalogItem {
  id: string;
  name: string;
  nameTH?: string;
  category: SwimsuitCategory;
  rentPrice: number;
  rentalPrice?: number;
  buyPrice: number;
  price?: number;
  depositPrice: number;
  deposit?: number;
  colorHex: string;
  color?: string;
  colorNumber: number;
  availableColors: SwimsuitColorOption[];
  icon: string;
  description: string;
  available?: boolean;
  rentStock: Record<SwimsuitSize, number>;
  buyStock: Record<SwimsuitSize, number>;
  stock?: Record<SwimsuitSize, number>;
}

export type SwimsuitItem = SwimsuitCatalogItem;

export interface SwimsuitCartItem {
  cartItemId: string;
  itemId: string;
  swimsuitId?: string;
  name: string;
  nameTH?: string;
  orderType: SwimsuitOrderType;
  size: SwimsuitSize;
  colorName: string;
  quantity: number;
  rentalDays?: number;
  unitPrice: number;
  depositPerUnit: number;
  totalPrice: number;
  colorHex: string;
  colorNumber: number;
  color?: string;
}

export type SwimsuitOrderStatus =
  | 'pending'
  | 'pending_payment'
  | 'paid'
  | 'rented'
  | 'returned'
  | 'cancelled';

export interface SwimsuitOrder {
  id: string;
  customerName: string;
  phone: string;
  items: SwimsuitCartItem[];
  subtotal?: number;
  totalDeposit?: number;
  totalAmount: number;
  status: SwimsuitOrderStatus;
  createdAt: string;
  swimsuitId?: string;
  size?: SwimsuitSize;
  quantity?: number;
}

export type SwimsuitRental = SwimsuitOrder;

export interface BookingItem {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  timeSlot: string;
  poolZone: 'main' | 'kids' | 'olympic';
  memberCount: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'checked_in' | 'cancelled';
  qrRef: string;
}

export interface CourseRegistration {
  id: string;
  studentName: string;
  phone: string;
  courseName: string;
  instructor: string;
  schedule: string;
  memberCount: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface LockerItem {
  id: string;
  number: string;
  zone: 'A (ชาย)' | 'B (หญิง)' | 'C (VIP)';
  status: 'available' | 'occupied' | 'reserved';
  reservedBy?: string;
  price: number;
}

export interface PoolMetrics {
  ph: number;
  chlorine: number;
  temperature: number;
  turbidity: number;
  currentSwimmers: number;
  maxCapacity: number;
  kidsPoolSwimmers: number;
  activeLifeguards: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'danger' | 'warn';
  title: string;
  message: string;
  msg: string;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';
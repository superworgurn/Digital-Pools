export type HotspotId =
  | 'checkin'
  | 'locker'
  | 'courses'
  | 'swimwear'
  | 'restroom'
  | 'water'
  | 'lifeguard'
  | 'kids-pool'
  | 'vip'
  | 'seven-eleven';

export type SwimsuitSize = 'KIDS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL';
export type SwimsuitOrderType = 'rent' | 'buy';
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export type VipTier = 'none' | 'single' | 'couple' | 'family';
export type VipBillingCycle = 'monthly' | 'yearly';

export type CrmRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface CrmPointTransaction {
  id: string;
  title: string;
  points: number;
  type: 'earn' | 'redeem';
  timestamp: string;
}

export interface CrmProfile {
  points: number;
  lifetimePoints: number;
  visitCount: number;
  transactions: CrmPointTransaction[];
}

export interface VipMembership {
  id: string;
  tier: VipTier;
  tierName: string;
  billingCycle: VipBillingCycle;
  price: number;
  discountPercent: number;
  maxMembers: number;
  ownerName: string;
  phone: string;
  familyMembers: string[];
  expiresAt: string;
  queueCode: string;
  status: 'active' | 'cancelled';
  refundAmount?: number;
  penaltyAmount?: number;
}

export interface UserSession {
  username: string;
  name: string;
  displayName: string;
  role: 'admin' | 'user';
}

export interface SwimsuitColorOption {
  colorId: string;
  colorName: string;
  colorHex: string;
  colorNumber: number;
}

export interface SwimsuitCatalogItem {
  id: string;
  name: string;
  category: 'men' | 'women' | 'kids' | 'unisex' | 'gear' | 'towel';
  icon: string;
  description: string;
  rentPrice: number;
  buyPrice: number;
  depositPrice: number;
  colorHex: string;
  colorNumber: number;
  availableColors?: SwimsuitColorOption[];
  rentStock: Record<SwimsuitSize, number>;
  buyStock: Record<SwimsuitSize, number>;
}

export interface SwimsuitCartItem {
  cartItemId: string;
  itemId: string;
  swimsuitId: string;
  name: string;
  orderType: SwimsuitOrderType;
  size: SwimsuitSize;
  colorName: string;
  quantity: number;
  rentalDays: number;
  unitPrice: number;
  depositPerUnit: number;
  totalPrice: number;
  colorHex: string;
  colorNumber: number;
  color: string;
}

export interface SwimsuitOrder {
  id: string;
  queueCode: string;
  customerName: string;
  phone: string;
  items: SwimsuitCartItem[];
  subtotalBeforeDiscount: number;
  vipDiscountAmount: number;
  crmDiscountAmount?: number;
  totalAmount: number;
  status: 'paid' | 'cancelled';
  refundAmount?: number;
  penaltyAmount?: number;
  createdAt: string;
}

export interface PoolBooking {
  id: string;
  queueCode: string;
  customerName: string;
  phone: string;
  date: string;
  timeSlot: string;
  poolZone: 'main' | 'kids' | 'olympic';
  memberCount: number;
  totalPrice: number;
  status: 'paid' | 'checked-in' | 'checked-out' | 'cancelled';
  checkedInAt?: string;
  checkedOutAt?: string;
  refundAmount?: number;
  penaltyAmount?: number;
  qrRef: string;
}

export interface LockerItem {
  id: string;
  number: string;
  zone: string;
  tierType: 'standard' | 'vip';
  price: number;
  status: 'available' | 'reserved' | 'occupied';
  reservedBy?: string;
  queueCode?: string;
  paidAmount?: number;
  isVipFree?: boolean;
  durationHours?: number;
  reservedUntil?: string;
}

export interface CourseRegistration {
  id: string;
  queueCode: string;
  studentName: string;
  phone: string;
  courseName: string;
  instructor: string;
  schedule: string;
  memberCount: number;
  totalPrice: number;
  status: 'paid' | 'cancelled';
  refundAmount?: number;
  penaltyAmount?: number;
}
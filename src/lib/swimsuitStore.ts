import { derived } from 'svelte/store';
import {
  SWIMSUIT_CATALOG,
  SIZE_PRICE_MODIFIERS,
  PAYMENT_QR_IMAGE_URL,
  swimsuitOrders
} from './stores';
import type {
  SwimsuitCatalogItem,
  SwimsuitOrder,
  SwimsuitCartItem,
  SwimsuitSize
} from '../types';

export type SwimsuitItem = SwimsuitCatalogItem;
export type SwimsuitRental = SwimsuitOrder;

export {
  SWIMSUIT_CATALOG,
  SIZE_PRICE_MODIFIERS,
  PAYMENT_QR_IMAGE_URL,
  swimsuitOrders
};

export const swimsuits = SWIMSUIT_CATALOG;
export const swimsuitRentals = swimsuitOrders;

export const swimsuitStats = derived(
  [SWIMSUIT_CATALOG, swimsuitOrders],
  ([$catalog, $orders]) => {
    const activeRentals = $orders.filter((r) => r.status === 'paid').length;

    const totalRevenue = $orders
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + Number(r.totalAmount || r.subtotalBeforeDiscount || 0), 0);

    const availableItems = $catalog.filter((item) => {
      const rentTotal = Object.values(item.rentStock || {}).reduce((s, n) => s + (n || 0), 0);
      const buyTotal = Object.values(item.buyStock || {}).reduce((s, n) => s + (n || 0), 0);
      return rentTotal + buyTotal > 0;
    }).length;

    return {
      activeRentals,
      totalRevenue,
      availableItems
    };
  }
);

export function createCartItemFromSelection(
  product: SwimsuitCatalogItem,
  size: SwimsuitSize,
  quantity: number,
  orderType: 'rent' | 'buy' = 'rent',
  rentalDays: number = 1
): SwimsuitCartItem {
  const mod = SIZE_PRICE_MODIFIERS[size] || SIZE_PRICE_MODIFIERS.M;
  const baseRent = product.rentPrice ?? 80;
  const baseBuy = product.buyPrice ?? 450;
  const depositPerUnit = orderType === 'rent' ? (product.depositPrice ?? 100) : 0;

  const unitPrice =
    orderType === 'rent'
      ? Math.max(40, baseRent + mod.extraRent) * Math.max(1, rentalDays)
      : Math.max(150, baseBuy + mod.extraBuy);

  const defaultColor = product.availableColors?.[0] || {
    colorName: 'สีมาตรฐาน',
    colorHex: product.colorHex || '#0284c7',
    colorNumber: product.colorNumber || 0x0284c7
  };

  return {
    cartItemId: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    itemId: product.id,
    swimsuitId: product.id,
    name: `${product.name} (${defaultColor.colorName})`,
    orderType,
    size,
    colorName: defaultColor.colorName,
    quantity,
    rentalDays,
    unitPrice,
    depositPerUnit,
    totalPrice: (unitPrice + depositPerUnit) * quantity,
    colorHex: defaultColor.colorHex,
    colorNumber: defaultColor.colorNumber,
    color: defaultColor.colorHex
  };
}

export function returnSwimsuitOrder(orderId: string) {
  swimsuitOrders.update((orders: SwimsuitOrder[]) =>
    orders.map((o) => {
      if (o.id !== orderId || o.status === 'cancelled') return o;
      SWIMSUIT_CATALOG.update((catalog) =>
        catalog.map((item) => {
          const nextRentStock = { ...item.rentStock };
          o.items.forEach((ci) => {
            if (ci.itemId === item.id && ci.orderType === 'rent') {
              nextRentStock[ci.size] = (nextRentStock[ci.size] || 0) + ci.quantity;
            }
          });
          return { ...item, rentStock: nextRentStock };
        })
      );
      return o;
    })
  );
}
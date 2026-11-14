import { derived } from 'svelte/store';
import {
  SWIMSUIT_CATALOG,
  SIZE_PRICE_MODIFIERS,
  PAYMENT_QR_IMAGE_URL,
  swimsuitOrders
} from './stores';
import type {
  SwimsuitItem,
  SwimsuitRental,
  SwimsuitCartItem,
  SwimsuitSize
} from '../types';

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
    const activeRentals = $orders.filter(
      (r) => r.status === 'paid' || r.status === 'rented'
    ).length;

    const totalRevenue = $orders
      .filter((r) => r.status === 'paid' || r.status === 'rented' || r.status === 'returned')
      .reduce((sum, r) => sum + Number(r.totalAmount || r.subtotal || 0), 0);

    const availableItems = $catalog.filter((item) => item.available !== false).length;

    return {
      activeRentals,
      totalRevenue,
      availableItems
    };
  }
);

export function createCartItemFromSelection(
  product: SwimsuitItem,
  size: SwimsuitSize,
  quantity: number,
  orderType: 'rent' | 'buy' = 'rent',
  rentalDays: number = 1
): SwimsuitCartItem {
  const mod = SIZE_PRICE_MODIFIERS[size] || SIZE_PRICE_MODIFIERS.M;
  const baseRent = product.rentPrice ?? product.rentalPrice ?? 80;
  const baseBuy = product.buyPrice ?? product.price ?? 450;
  const depositPerUnit =
    orderType === 'rent' ? (product.depositPrice ?? product.deposit ?? 100) : 0;

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
    name: `${product.nameTH || product.name} (${defaultColor.colorName})`,
    nameTH: product.nameTH || product.name,
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
  swimsuitOrders.update((orders: SwimsuitRental[]) =>
    orders.map((o) => {
      if (o.id !== orderId) return o;
      SWIMSUIT_CATALOG.update((catalog) =>
        catalog.map((item) => {
          const nextRentStock = { ...item.rentStock };
          const nextBuyStock = { ...item.buyStock };
          o.items.forEach((ci) => {
            if (ci.itemId === item.id) {
              if (ci.orderType === 'rent') {
                nextRentStock[ci.size] = (nextRentStock[ci.size] || 0) + ci.quantity;
              } else {
                nextBuyStock[ci.size] = (nextBuyStock[ci.size] || 0) + ci.quantity;
              }
            }
          });
          return { ...item, rentStock: nextRentStock, buyStock: nextBuyStock };
        })
      );
      return { ...o, status: 'returned' as const };
    })
  );
}
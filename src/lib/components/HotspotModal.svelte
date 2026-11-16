<script lang="ts">
  import { onMount } from 'svelte';
  import {
    activeHotspot,
    currentUser,
    SWIMSUIT_CATALOG,
    SIZE_PRICE_MODIFIERS,
    PAYMENT_QR_IMAGE_URL,
    swimsuitOrders,
    bookings,
    courseRegistrations,
    lockers,
    poolMetrics,
    activeVipMembership,
    vipHistory,
    vipDiscountPercent,
    crmProfile,
    crmTierStatus,
    earnCrmPoints,
    redeemCrmPoints,
    latestQueueTicket,
    generateQueueCode,
    downloadQueueTicketJpg,
    addToast
  } from '../stores';
  import type {
    SwimsuitSize,
    SwimsuitOrderType,
    SwimsuitCartItem,
    SwimsuitCatalogItem,
    LockerItem,
    VipTier,
    VipBillingCycle,
    PoolBooking,
    SwimsuitOrder,
    CourseRegistration
  } from '../../types';

  type CategoryFilter = 'all' | 'men' | 'women' | 'kids' | 'unisex' | 'gear' | 'towel';

  interface CourseOption {
    id: string;
    name: string;
    instructor: string;
    schedule: string;
    price: number;
    maxStudents: number;
  }

  let isConfirmingPayment = false;
  const LOCKER_DURATION_HOURS = 4;

  // --- VIP Membership & CRM State ---
  interface VipPackageConfig {
    tier: Exclude<VipTier, 'none'>;
    name: string;
    subtitle: string;
    monthlyPrice: number;
    yearlyPrice: number;
    discountPercent: number;
    maxMembers: number;
  }

  const vipPackages: VipPackageConfig[] = [
    {
      tier: 'single',
      name: 'สมาชิก VIP (เดี่ยว)',
      subtitle: 'สำหรับ 1 ท่าน • จองล็อกเกอร์ฟรีทุกโซน + ส่วนลดร้านเช่า/ซื้อ 10%',
      monthlyPrice: 300,
      yearlyPrice: 3000,
      discountPercent: 10,
      maxMembers: 1
    },
    {
      tier: 'couple',
      name: 'คู่รัก VIP (Couple VIP)',
      subtitle: 'สำหรับ 2 ท่าน • จองล็อกเกอร์ฟรีทุกโซน + ส่วนลดร้านเช่า/ซื้อ 15%',
      monthlyPrice: 500,
      yearlyPrice: 4500,
      discountPercent: 15,
      maxMembers: 2
    },
    {
      tier: 'family',
      name: 'ครอบครัว VIP (Family VIP)',
      subtitle: 'รองรับสูงสุด 6 คน • จองล็อกเกอร์ฟรีทุกโซน + ส่วนลดร้านเช่า/ซื้อ 20%',
      monthlyPrice: 2000,
      yearlyPrice: 25000,
      discountPercent: 20,
      maxMembers: 6
    }
  ];

  let selectedVipTier: Exclude<VipTier, 'none'> = 'single';
  let selectedVipCycle: VipBillingCycle = 'monthly';
  let vipOwnerName = 'สมาชิกสระว่ายน้ำ (Member User)';
  let vipPhone = '081-999-8888';
  let vipMemberNames: string[] = ['', '', '', '', '', ''];
  let showVipQr = false;
  let confirmCancelVip = false;

  $: activeVipPkg = vipPackages.find((p) => p.tier === selectedVipTier) || vipPackages[0];
  $: activeVipPrice =
    selectedVipCycle === 'monthly' ? activeVipPkg.monthlyPrice : activeVipPkg.yearlyPrice;
  $: isUserVip = $activeVipMembership?.status === 'active';

  function proceedToVipQr() {
    if (isUserVip) {
      addToast(
        'คุณเป็นสมาชิก VIP อยู่แล้ว',
        `แพ็กเกจปัจจุบัน: ${$activeVipMembership?.tierName} (หมดอายุ ${$activeVipMembership?.expiresAt})`,
        'warning'
      );
      return;
    }
    if (!vipOwnerName.trim()) {
      addToast('กรุณากรอกชื่อผู้สมัคร', 'ระบุชื่อ-นามสกุลผู้ถือบัตร VIP หลัก', 'warning');
      return;
    }
    showVipQr = true;
  }

  function confirmVipPayment() {
    if (isConfirmingPayment) return;
    if (isUserVip) {
      showVipQr = false;
      addToast('คุณมีสถานะสมาชิก VIP อยู่แล้ว', 'ไม่สามารถสมัครซ้ำซ้อนได้', 'warning');
      return;
    }
    isConfirmingPayment = true;

    try {
      const queueCode = generateQueueCode('VIP');
      const now = new Date();
      const expireDate = new Date(now);
      if (selectedVipCycle === 'monthly') {
        expireDate.setMonth(expireDate.getMonth() + 1);
      } else {
        expireDate.setFullYear(expireDate.getFullYear() + 1);
      }

      const extraMembers = vipMemberNames
        .slice(0, Math.max(0, activeVipPkg.maxMembers - 1))
        .map((n) => n.trim())
        .filter(Boolean);

      const newMembership = {
        id: `VIP-${Math.floor(1000 + Math.random() * 9000)}`,
        tier: activeVipPkg.tier,
        tierName: activeVipPkg.name,
        billingCycle: selectedVipCycle,
        price: activeVipPrice,
        discountPercent: activeVipPkg.discountPercent,
        maxMembers: activeVipPkg.maxMembers,
        ownerName: vipOwnerName.trim(),
        phone: vipPhone.trim(),
        familyMembers: [vipOwnerName.trim(), ...extraMembers],
        expiresAt: expireDate.toLocaleDateString('th-TH'),
        queueCode,
        status: 'active' as const
      };

      activeVipMembership.set(newMembership);
      vipHistory.update((h) => [newMembership, ...h]);
      confirmCancelVip = false;
      const earnedPts = earnCrmPoints(activeVipPrice, `สมัครสมาชิก ${activeVipPkg.name}`);

      latestQueueTicket.set({
        queueCode,
        serviceTitle: `สมัครสมาชิก ${activeVipPkg.name}`,
        customerName: vipOwnerName.trim(),
        detailLine1: `แพ็กเกจ: ${selectedVipCycle === 'monthly' ? 'รายเดือน' : 'รายปี'} (รองรับ ${activeVipPkg.maxMembers} ท่าน)`,
        detailLine2: `สิทธิพิเศษ: ล็อกเกอร์ฟรี + ลด ${activeVipPkg.discountPercent}% • รับ +${earnedPts} แต้ม CRM`,
        amountText: `ชำระแล้ว: ${activeVipPrice.toLocaleString()} บาท`,
        timestamp: now.toLocaleString('th-TH')
      });

      showVipQr = false;
      activeHotspot.set(null);

      addToast(
        'สมัครสมาชิก VIP สำเร็จ! 👑',
        `${activeVipPkg.name} • คิว ${queueCode} • รับ +${earnedPts} แต้มสะสม CRM`,
        'success'
      );
    } finally {
      isConfirmingPayment = false;
    }
  }

  function cancelVipMembership() {
    const currentVip = $activeVipMembership;
    if (!currentVip || currentVip.status !== 'active') return;

    const penalty = Math.round(currentVip.price * 0.2);
    const refund = currentVip.price - penalty;

    vipHistory.update((all) =>
      all.map((v) =>
        v.id === currentVip.id
          ? {
              ...v,
              status: 'cancelled',
              penaltyAmount: penalty,
              refundAmount: refund
            }
          : v
      )
    );

    activeVipMembership.set(null);
    confirmCancelVip = false;
    showVipQr = false;

    addToast(
      `ยกเลิกสมาชิก ${currentVip.tierName} แล้ว`,
      `หักค่าธรรมเนียมยกเลิก 20% (${penalty.toLocaleString()}฿) • คืนเงิน ${refund.toLocaleString()}฿`,
      'warning'
    );
  }

  // --- Swimwear & Towel Rental & Purchase State ---
  let selectedCategory: CategoryFilter = 'all';
  let selectedOrderType: SwimsuitOrderType = 'rent';
  let selectedSuitId: string = 'suit-men-pro';
  let selectedSize: SwimsuitSize = 'M';
  let selectedColorId: string = '';
  let suitQuantity: number = 1;
  let customerName: string = 'สมาชิกสระว่ายน้ำ (Member User)';
  let customerPhone: string = '081-999-8888';
  let cartItems: SwimsuitCartItem[] = [];
  let showSwimsuitQrPayment = false;
  let qrImageLoadError = false;
  let editingCartItemId: string | null = null;
  let useCrmPointDiscount = false;

  const sizeList: SwimsuitSize[] = ['KIDS', 'XS', 'S', 'M', 'L', 'XL', '2XL'];
  const categoryButtons: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'men', label: 'ชาย' },
    { id: 'women', label: 'หญิง' },
    { id: 'unisex', label: 'Unisex แขนยาว' },
    { id: 'kids', label: 'เด็ก' },
    { id: 'gear', label: 'แว่นตา/หมวก' },
    { id: 'towel', label: 'ผ้าขนหนู' }
  ];

  // --- Pool Check-in / Check-out / Booking State ---
  type CheckinSubTab = 'book' | 'checkinout' | 'history';
  let checkinTab: CheckinSubTab = 'book';

  const KIDS_POOL_MAX_CAPACITY = 20;
  let bkName = 'สมาชิกสระว่ายน้ำ (Member User)';
  let bkPhone = '089-123-4567';
  let bkDate = new Date().toISOString().split('T')[0];
  let bkSlot = '16:00 - 18:00';
  let bkZone: 'main' | 'kids' | 'olympic' = 'main';
  let bkCount = 2;
  let showBookingQr = false;

  $: remainingMainPool = Math.max(0, $poolMetrics.maxCapacity - $poolMetrics.currentSwimmers);
  $: remainingKidsPool = Math.max(0, KIDS_POOL_MAX_CAPACITY - $poolMetrics.kidsPoolSwimmers);
  $: remainingSelectedPool = bkZone === 'kids' ? remainingKidsPool : remainingMainPool;

  $: {
    if (remainingSelectedPool > 0) {
      if (bkCount < 1) bkCount = 1;
      if (bkCount > remainingSelectedPool) bkCount = remainingSelectedPool;
    } else {
      bkCount = 1;
    }
  }

  // --- Locker Reservation QR State ---
  type LockerZoneFilter = 'all' | 'A' | 'B' | 'C';
  let lockerZoneFilter: LockerZoneFilter = 'all';
  let selectedLockerForQr: LockerItem | null = null;
  let lockerCustomerName: string = 'สมาชิกสระว่ายน้ำ (Member User)';
  let lastReservedLockerBanner: {
    number: string;
    zone: string;
    queueCode: string;
    reservedUntil: string;
  } | null = null;

  $: filteredLockers =
    lockerZoneFilter === 'all'
      ? $lockers
      : $lockers.filter((l) => l.number.startsWith(`${lockerZoneFilter}-`));

  // --- Course Registration State ---
  const courseOptions: CourseOption[] = [
    {
      id: 'kids-survival',
      name: 'Kids Beginner Survival (10 ชม.)',
      instructor: 'โค้ชฉลาม (ครูเอก)',
      schedule: 'เสาร์-อาทิตย์ 10:00 - 11:00',
      price: 3500,
      maxStudents: 8
    },
    {
      id: 'adult-stroke',
      name: 'Adult Stroke Correction (10 ชม.)',
      instructor: 'โค้ชแพรว (อดีตทีมชาติ)',
      schedule: 'อังคาร-พฤหัสบดี 18:00 - 19:00',
      price: 4200,
      maxStudents: 6
    },
    {
      id: 'athlete-sprint',
      name: 'Athlete Sprint Intensive (12 ชม.)',
      instructor: 'โค้ชวินัย (Head Coach)',
      schedule: 'เสาร์-อาทิตย์ 14:00 - 16:00',
      price: 5500,
      maxStudents: 5
    }
  ];

  let selectedCourseId: string = 'kids-survival';
  let crStudent = 'น้องวิน';
  let crPhone = '082-333-4444';
  let crCount = 1;
  let showCourseQr = false;

  onMount(() => {
    const params = new URLSearchParams(window.location.search);

    const typeParam = params.get('type');
    if (typeParam === 'buy' || typeParam === 'rent') {
      selectedOrderType = typeParam;
    }

    const sizeParam = params.get('size')?.toUpperCase() as SwimsuitSize | undefined;
    if (sizeParam && sizeList.includes(sizeParam)) {
      selectedSize = sizeParam;
    }

    const suitParam = params.get('suit');
    if (suitParam && $SWIMSUIT_CATALOG.some((s) => s.id === suitParam)) {
      selectedSuitId = suitParam;
    }

    const zoneParam = params.get('zone');
    if (zoneParam === 'kids' || zoneParam === 'main') {
      bkZone = zoneParam;
    }

    const nameParam = params.get('name');
    if (nameParam) {
      customerName = nameParam;
      bkName = nameParam;
      lockerCustomerName = nameParam;
      crStudent = nameParam;
      vipOwnerName = nameParam;
    }

    const phoneParam = params.get('phone');
    if (phoneParam) {
      customerPhone = phoneParam;
      bkPhone = phoneParam;
      crPhone = phoneParam;
      vipPhone = phoneParam;
    }
  });

  $: selectedCourseObj =
    courseOptions.find((c) => c.id === selectedCourseId) || courseOptions[0];

  $: enrolledInSelectedCourse = $courseRegistrations
    .filter((reg) => reg.status !== 'cancelled' && reg.courseName === selectedCourseObj.name)
    .reduce((sum, reg) => sum + reg.memberCount, 0);

  $: remainingCourseSpots = Math.max(
    0,
    selectedCourseObj.maxStudents - enrolledInSelectedCourse
  );

  $: {
    if (remainingCourseSpots > 0) {
      if (crCount < 1) crCount = 1;
      if (crCount > remainingCourseSpots) crCount = remainingCourseSpots;
    } else {
      crCount = 1;
    }
  }

  $: currentCatalogItem =
    $SWIMSUIT_CATALOG.find((item) => item.id === selectedSuitId) || $SWIMSUIT_CATALOG[0];

  $: isFreeSizeItem =
    currentCatalogItem?.category === 'gear' || currentCatalogItem?.category === 'towel';

  $: if (currentCatalogItem) {
    const availableCols = currentCatalogItem.availableColors || [];
    if (!availableCols.some((c) => c.colorId === selectedColorId) && availableCols.length > 0) {
      selectedColorId = availableCols[0].colorId;
    }
  }

  $: activeColorObj =
    currentCatalogItem?.availableColors?.find((c) => c.colorId === selectedColorId) ||
    currentCatalogItem?.availableColors?.[0] || {
      colorId: 'default',
      colorName: 'สีมาตรฐาน',
      colorHex: currentCatalogItem?.colorHex || '#0284c7',
      colorNumber: currentCatalogItem?.colorNumber || 0x0284c7
    };

  $: filteredCatalog =
    selectedCategory === 'all'
      ? $SWIMSUIT_CATALOG
      : $SWIMSUIT_CATALOG.filter((i) => i.category === selectedCategory);

  function getActiveStockRecord(item: SwimsuitCatalogItem, type: SwimsuitOrderType) {
    return type === 'rent' ? item.rentStock : item.buyStock;
  }

  function getTotalItemStock(item: SwimsuitCatalogItem, type: SwimsuitOrderType): number {
    const stockMap = getActiveStockRecord(item, type);
    if (item.category === 'gear' || item.category === 'towel') {
      return stockMap['M'] ?? 0;
    }
    return sizeList.reduce((sum, sz) => sum + (stockMap[sz] ?? 0), 0);
  }

  function getRemainingSizeStock(item: SwimsuitCatalogItem, sz: SwimsuitSize, type: SwimsuitOrderType): number {
    const stockMap = getActiveStockRecord(item, type);
    const inCart = cartItems
      .filter(
        (ci) =>
          ci.itemId === item.id &&
          ci.size === sz &&
          ci.orderType === type &&
          ci.cartItemId !== editingCartItemId
      )
      .reduce((sum, ci) => sum + ci.quantity, 0);
    return Math.max(0, (stockMap[sz] ?? 0) - inCart);
  }

  $: effectiveSelectionSize = isFreeSizeItem ? 'M' : selectedSize;

  $: reservedInCartForSelection = cartItems
    .filter(
      (ci) =>
        ci.itemId === selectedSuitId &&
        ci.size === effectiveSelectionSize &&
        ci.orderType === selectedOrderType &&
        ci.cartItemId !== editingCartItemId
    )
    .reduce((sum, ci) => sum + ci.quantity, 0);

  $: activeStockMap = currentCatalogItem ? getActiveStockRecord(currentCatalogItem, selectedOrderType) : null;

  $: remainingStockForSelection = activeStockMap
    ? Math.max(0, (activeStockMap[effectiveSelectionSize] ?? 0) - reservedInCartForSelection)
    : 0;

  $: {
    if (remainingStockForSelection > 0) {
      if (suitQuantity < 1) suitQuantity = 1;
      if (suitQuantity > remainingStockForSelection) suitQuantity = remainingStockForSelection;
    } else {
      suitQuantity = 1;
    }
  }

  $: calculatedUnitPrice = (() => {
    if (!currentCatalogItem) return 0;
    const mod = SIZE_PRICE_MODIFIERS[effectiveSelectionSize];
    if (selectedOrderType === 'rent') {
      return Math.max(40, currentCatalogItem.rentPrice + mod.extraRent);
    } else {
      return Math.max(150, currentCatalogItem.buyPrice + mod.extraBuy);
    }
  })();

  $: calculatedDeposit =
    selectedOrderType === 'rent' && currentCatalogItem ? currentCatalogItem.depositPrice : 0;

  $: canRedeemCrm = $crmProfile.points >= 100;
  $: if (!canRedeemCrm && useCrmPointDiscount) {
    useCrmPointDiscount = false;
  }

  $: cartRawTotal = cartItems.reduce((sum, i) => sum + i.totalPrice, 0);
  $: cartBaseRentalOrBuyFee = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  $: cartVipDiscountAmount = Math.round((cartBaseRentalOrBuyFee * $vipDiscountPercent) / 100);
  $: cartCrmDiscountAmount = useCrmPointDiscount && canRedeemCrm ? Math.min(50, Math.max(0, cartRawTotal - cartVipDiscountAmount)) : 0;
  $: cartGrandTotal = Math.max(0, cartRawTotal - cartVipDiscountAmount - cartCrmDiscountAmount);

  $: previewRawTotal = (calculatedUnitPrice + calculatedDeposit) * suitQuantity;
  $: previewVipDiscount = Math.round((calculatedUnitPrice * suitQuantity * $vipDiscountPercent) / 100);
  $: previewCrmDiscount = useCrmPointDiscount && canRedeemCrm ? Math.min(50, Math.max(0, previewRawTotal - previewVipDiscount)) : 0;
  $: previewFinalTotal = Math.max(0, previewRawTotal - previewVipDiscount - previewCrmDiscount);

  function decreaseSuitQty() {
    if (suitQuantity > 1) {
      suitQuantity -= 1;
    }
  }

  function increaseSuitQty() {
    if (suitQuantity < remainingStockForSelection) {
      suitQuantity += 1;
    } else {
      addToast(
        'ถึงจำนวนสูงสุดที่มีในสต็อก',
        `เหลืออีก ${remainingStockForSelection} ชิ้น`,
        'warning'
      );
    }
  }

  function selectCategoryFilter(id: CategoryFilter) {
    selectedCategory = id;
  }

  function handleQrImgError() {
    qrImageLoadError = true;
  }

  function addOrUpdateCartItem() {
    if (!currentCatalogItem) return;
    if (remainingStockForSelection <= 0) {
      addToast('สินค้าหมด', `สินค้าชิ้นนี้สำหรับ${selectedOrderType === 'rent' ? 'เช่า' : 'ซื้อ'}หมดแล้ว`, 'warning');
      return;
    }
    if (suitQuantity < 1) {
      suitQuantity = 1;
      return;
    }
    if (suitQuantity > remainingStockForSelection) {
      suitQuantity = remainingStockForSelection;
      addToast(
        'ปรับจำนวนตามสต็อกคงเหลือ',
        `เหลืออีก ${remainingStockForSelection} ชิ้น`,
        'warning'
      );
      return;
    }

    const totalPerUnit = calculatedUnitPrice + calculatedDeposit;
    const itemNameSuffix = isFreeSizeItem
      ? `(${activeColorObj.colorName}, Free Size)`
      : `(${activeColorObj.colorName}, ไซส์ ${selectedSize})`;
    const newItem: SwimsuitCartItem = {
      cartItemId: editingCartItemId || `cart-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      itemId: currentCatalogItem.id,
      swimsuitId: currentCatalogItem.id,
      name: `${currentCatalogItem.name} ${itemNameSuffix}`,
      orderType: selectedOrderType,
      size: effectiveSelectionSize,
      colorName: activeColorObj.colorName,
      quantity: suitQuantity,
      rentalDays: 1,
      unitPrice: calculatedUnitPrice,
      depositPerUnit: calculatedDeposit,
      totalPrice: totalPerUnit * suitQuantity,
      colorHex: activeColorObj.colorHex,
      colorNumber: activeColorObj.colorNumber,
      color: activeColorObj.colorHex
    };

    if (editingCartItemId) {
      cartItems = cartItems.map((item) => (item.cartItemId === editingCartItemId ? newItem : item));
      editingCartItemId = null;
      addToast('อัปเดตรายการแล้ว', `แก้ไข ${newItem.name} จำนวน ${newItem.quantity} ชิ้น`, 'info');
    } else {
      cartItems = [...cartItems, newItem];
      addToast(
        'เพิ่มลงรายการแล้ว',
        `${newItem.orderType === 'rent' ? 'เช่า' : 'ซื้อ'} ${newItem.name} จำนวน ${newItem.quantity} ชิ้น`,
        'success'
      );
    }
    suitQuantity = 1;
  }

  function editCartItem(item: SwimsuitCartItem) {
    selectedSuitId = item.itemId;
    selectedOrderType = item.orderType;
    selectedSize = item.size;
    suitQuantity = item.quantity;
    editingCartItemId = item.cartItemId;
    showSwimsuitQrPayment = false;
  }

  function removeCartItem(cartItemId: string) {
    cartItems = cartItems.filter((i) => i.cartItemId !== cartItemId);
    if (editingCartItemId === cartItemId) editingCartItemId = null;
  }

  function proceedToSwimsuitQr() {
    if (cartItems.length === 0) {
      addOrUpdateCartItem();
    }
    if (cartItems.length > 0) {
      showSwimsuitQrPayment = true;
    }
  }

  function confirmSwimsuitQrPayment() {
    if (isConfirmingPayment || cartItems.length === 0) return;
    isConfirmingPayment = true;

    try {
      SWIMSUIT_CATALOG.update((catalog) =>
        catalog.map((prod) => {
          const nextRentStock = { ...prod.rentStock };
          const nextBuyStock = { ...prod.buyStock };

          cartItems.forEach((ci) => {
            if (ci.itemId === prod.id) {
              if (ci.orderType === 'rent') {
                nextRentStock[ci.size] = Math.max(0, (nextRentStock[ci.size] || 0) - ci.quantity);
              } else {
                nextBuyStock[ci.size] = Math.max(0, (nextBuyStock[ci.size] || 0) - ci.quantity);
              }
            }
          });
          return { ...prod, rentStock: nextRentStock, buyStock: nextBuyStock };
        })
      );

      const queueCode = generateQueueCode('S');
      const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      const paidTotal = cartGrandTotal;
      const appliedCrmDiscount = cartCrmDiscountAmount;

      if (appliedCrmDiscount > 0) {
        redeemCrmPoints(100, `แลกส่วนลดร้านค้า ${appliedCrmDiscount}฿`);
        useCrmPointDiscount = false;
      }

      const earnedPts = earnCrmPoints(paidTotal, `เช่า/ซื้อสินค้าหน้าร้าน (${queueCode})`);

      const newOrder: SwimsuitOrder = {
        id: `SW-${Math.floor(1000 + Math.random() * 9000)}`,
        queueCode,
        customerName,
        phone: customerPhone,
        items: [...cartItems],
        subtotalBeforeDiscount: cartRawTotal,
        vipDiscountAmount: cartVipDiscountAmount,
        crmDiscountAmount: appliedCrmDiscount,
        totalAmount: paidTotal,
        status: 'paid',
        createdAt: nowTime
      };

      swimsuitOrders.update((orders) => [newOrder, ...orders]);

      latestQueueTicket.set({
        queueCode,
        serviceTitle: 'รับสินค้าเช่า/ซื้อชุดว่ายน้ำ & ผ้าขนหนู',
        customerName,
        detailLine1: `รหัสออเดอร์: ${newOrder.id} (${cartItems.length} รายการ)`,
        detailLine2: `รับเพิ่ม +${earnedPts} แต้มสะสม CRM`,
        amountText: `ยอดชำระสุทธิ: ${paidTotal.toLocaleString()} บาท`,
        timestamp: new Date().toLocaleString('th-TH')
      });

      const firstItem = cartItems[0];
      window.dispatchEvent(
        new CustomEvent('dp-spawn-swimsuit-npc', {
          detail: {
            color: firstItem.colorNumber,
            label: `${customerName} (คิว ${queueCode})`
          }
        })
      );

      cartItems = [];
      showSwimsuitQrPayment = false;
      activeHotspot.set(null);

      addToast(
        `ชำระเงิน QR สำเร็จ! รหัสคิว ${queueCode}`,
        `ยอด ${paidTotal.toLocaleString()}฿ • รับเพิ่ม +${earnedPts} แต้ม CRM`,
        'success'
      );
    } finally {
      isConfirmingPayment = false;
    }
  }

  function cancelSwimsuitOrder(ord: SwimsuitOrder) {
    if (ord.status === 'cancelled') return;
    const penalty = Math.round(ord.totalAmount * 0.2);
    const refund = ord.totalAmount - penalty;

    SWIMSUIT_CATALOG.update((catalog) =>
      catalog.map((prod) => {
        const nextRent = { ...prod.rentStock };
        const nextBuy = { ...prod.buyStock };
        ord.items.forEach((ci) => {
          if (ci.itemId === prod.id) {
            if (ci.orderType === 'rent') {
              nextRent[ci.size] = (nextRent[ci.size] || 0) + ci.quantity;
            } else {
              nextBuy[ci.size] = (nextBuy[ci.size] || 0) + ci.quantity;
            }
          }
        });
        return { ...prod, rentStock: nextRent, buyStock: nextBuy };
      })
    );

    swimsuitOrders.update((all) =>
      all.map((o) =>
        o.id === ord.id
          ? { ...o, status: 'cancelled', penaltyAmount: penalty, refundAmount: refund }
          : o
      )
    );

    addToast(
      'ยกเลิกรายการหน้าร้านแล้ว',
      `หักค่าธรรมเนียม 20% (${penalty.toLocaleString()}฿) • คืนเงิน ${refund.toLocaleString()}฿`,
      'warning'
    );
  }

  function triggerLifeguardSimulation() {
    activeHotspot.set(null);
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('dp-lifeguard-emergency'));
    });
    addToast(
      '🚨 สัญญาณกู้ภัยทำงาน!',
      'ไลฟ์การ์ดกำลังวิ่งรอบสระเพื่อเข้าช่วยเหลือผู้ประสบภัยทันที',
      'warning'
    );
  }

  function openKidsPoolBooking() {
    bkZone = 'kids';
    checkinTab = 'book';
    activeHotspot.set('checkin');
  }

  function proceedToBookingQr() {
    if (remainingSelectedPool <= 0) {
      addToast('สระรอบนี้เต็มแล้ว', 'กรุณาเลือกโซนสระอื่นหรือรอรอบถัดไป', 'warning');
      return;
    }
    if (bkCount < 1) {
      bkCount = 1;
      addToast('ระบุจำนวนไม่ถูกต้อง', 'กรุณาระบุจำนวนผู้เข้าใช้บริการอย่างน้อย 1 ท่าน', 'warning');
      return;
    }
    if (bkCount > remainingSelectedPool) {
      bkCount = remainingSelectedPool;
      addToast(
        'ปรับจำนวนผู้เข้าใช้ตามที่ว่าง',
        `สระนี้รับได้อีก ${remainingSelectedPool} คน`,
        'warning'
      );
      return;
    }
    showBookingQr = true;
  }

  function confirmBookingPayment() {
    if (isConfirmingPayment) return;
    isConfirmingPayment = true;

    try {
      const pricePerPerson = bkZone === 'kids' ? 90 : 120;
      const total = pricePerPerson * bkCount;
      const queueCode = generateQueueCode('Q');
      const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBooking: PoolBooking = {
        id: bookingId,
        queueCode,
        customerName: bkName,
        phone: bkPhone,
        date: bkDate,
        timeSlot: bkSlot,
        poolZone: bkZone,
        memberCount: bkCount,
        totalPrice: total,
        status: 'paid',
        qrRef: `DP-QR-${Math.floor(1000 + Math.random() * 9000)}`
      };

      bookings.update((all) => [newBooking, ...all]);
      const earnedPts = earnCrmPoints(total, `จองรอบสระว่ายน้ำ (${queueCode})`, true);

      latestQueueTicket.set({
        queueCode,
        serviceTitle: `จองรอบสระว่ายน้ำ (${bkZone === 'kids' ? 'สระเด็ก' : 'สระหลัก'})`,
        customerName: bkName,
        detailLine1: `วันที่ ${bkDate} • รอบ ${bkSlot}`,
        detailLine2: `ผู้ใช้บริการ ${bkCount} ท่าน • รับ +${earnedPts} แต้ม CRM`,
        amountText: `ชำระแล้ว: ${total.toLocaleString()} บาท`,
        timestamp: new Date().toLocaleString('th-TH')
      });

      showBookingQr = false;
      activeHotspot.set(null);

      addToast(
        `จองรอบสระสำเร็จ! รหัสคิว ${queueCode}`,
        `ยอดชำระ ${total.toLocaleString()} บาท • รับ +${earnedPts} แต้ม CRM`,
        'success'
      );
    } finally {
      isConfirmingPayment = false;
    }
  }

  function handlePoolCheckIn(booking: PoolBooking) {
    if (booking.status !== 'paid') return;
    const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    bookings.update((all) =>
      all.map((b) =>
        b.id === booking.id ? { ...b, status: 'checked-in', checkedInAt: nowStr } : b
      )
    );

    poolMetrics.update((m) => ({
      ...m,
      currentSwimmers:
        booking.poolZone === 'kids'
          ? m.currentSwimmers
          : Math.min(m.maxCapacity, m.currentSwimmers + booking.memberCount),
      kidsPoolSwimmers:
        booking.poolZone === 'kids'
          ? Math.min(KIDS_POOL_MAX_CAPACITY, m.kidsPoolSwimmers + booking.memberCount)
          : m.kidsPoolSwimmers
    }));

    addToast(
      `เช็คอินเข้าสระสำเร็จ (คิว ${booking.queueCode})`,
      `${booking.customerName} (${booking.memberCount} ท่าน) เข้าใช้บริการเวลา ${nowStr}`,
      'success'
    );
  }

  function handlePoolCheckOut(booking: PoolBooking) {
    if (booking.status !== 'checked-in') return;
    const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    bookings.update((all) =>
      all.map((b) =>
        b.id === booking.id ? { ...b, status: 'checked-out', checkedOutAt: nowStr } : b
      )
    );

    poolMetrics.update((m) => ({
      ...m,
      currentSwimmers:
        booking.poolZone === 'kids'
          ? m.currentSwimmers
          : Math.max(0, m.currentSwimmers - booking.memberCount),
      kidsPoolSwimmers:
        booking.poolZone === 'kids'
          ? Math.max(0, m.kidsPoolSwimmers - booking.memberCount)
          : m.kidsPoolSwimmers
    }));

    addToast(
      `เช็คเอาท์ออกจากสระสำเร็จ (คิว ${booking.queueCode})`,
      `${booking.customerName} คืนสายรัดข้อมือ RFID เวลา ${nowStr} เรียบร้อย`,
      'info'
    );
  }

  function cancelPoolBooking(booking: PoolBooking) {
    if (booking.status !== 'paid') {
      addToast('ไม่สามารถยกเลิกได้', 'รายการนี้เช็คอินแล้วหรือถูกยกเลิกไปแล้ว', 'warning');
      return;
    }
    const penalty = Math.round(booking.totalPrice * 0.2);
    const refund = booking.totalPrice - penalty;

    bookings.update((all) =>
      all.map((b) =>
        b.id === booking.id
          ? { ...b, status: 'cancelled', penaltyAmount: penalty, refundAmount: refund }
          : b
      )
    );

    addToast(
      `ยกเลิกการจอง ${booking.id} แล้ว`,
      `หักค่าธรรมเนียมยกเลิก 20% (${penalty.toLocaleString()}฿) • คืนเงิน ${refund.toLocaleString()}฿`,
      'warning'
    );
  }

  function proceedToCourseQr() {
    if (remainingCourseSpots <= 0) {
      addToast('คอร์สนี้เต็มแล้ว', 'กรุณาเลือกคอร์สเรียนอื่น', 'warning');
      return;
    }
    if (crCount < 1) {
      crCount = 1;
      addToast('ระบุจำนวนไม่ถูกต้อง', 'กรุณาระบุจำนวนผู้เรียนอย่างน้อย 1 ท่าน', 'warning');
      return;
    }
    if (crCount > remainingCourseSpots) {
      crCount = remainingCourseSpots;
      addToast(
        'ปรับจำนวนผู้เรียนตามที่นั่งว่าง',
        `คอร์สนี้รับได้อีก ${remainingCourseSpots} คน`,
        'warning'
      );
      return;
    }
    showCourseQr = true;
  }

  function confirmCoursePayment() {
    if (isConfirmingPayment) return;
    isConfirmingPayment = true;

    try {
      const total = selectedCourseObj.price * crCount;
      const queueCode = generateQueueCode('C');
      const regId = `CR-${Math.floor(1000 + Math.random() * 9000)}`;

      const newCourse: CourseRegistration = {
        id: regId,
        queueCode,
        studentName: crStudent,
        phone: crPhone,
        courseName: selectedCourseObj.name,
        instructor: selectedCourseObj.instructor,
        schedule: selectedCourseObj.schedule,
        memberCount: crCount,
        totalPrice: total,
        status: 'paid'
      };

      courseRegistrations.update((all) => [newCourse, ...all]);
      const earnedPts = earnCrmPoints(total, `สมัครคอร์ส ${selectedCourseObj.name}`);

      latestQueueTicket.set({
        queueCode,
        serviceTitle: `สมัครคอร์สเรียน: ${selectedCourseObj.name}`,
        customerName: crStudent,
        detailLine1: `ผู้สอน: ${selectedCourseObj.instructor} (${crCount} ท่าน)`,
        detailLine2: `ตารางเรียน: ${selectedCourseObj.schedule} • รับ +${earnedPts} แต้ม CRM`,
        amountText: `ชำระแล้ว: ${total.toLocaleString()} บาท`,
        timestamp: new Date().toLocaleString('th-TH')
      });

      showCourseQr = false;
      activeHotspot.set(null);

      addToast(
        `สมัครคอร์สเรียนสำเร็จ! รหัสคิว ${queueCode}`,
        `${crStudent} (${crCount} ท่าน) • รับเพิ่ม +${earnedPts} แต้ม CRM`,
        'success'
      );
    } finally {
      isConfirmingPayment = false;
    }
  }

  function cancelCourseRegistration(reg: CourseRegistration) {
    if (reg.status === 'cancelled') return;
    const penalty = Math.round(reg.totalPrice * 0.2);
    const refund = reg.totalPrice - penalty;

    courseRegistrations.update((all) =>
      all.map((c) =>
        c.id === reg.id
          ? { ...c, status: 'cancelled', penaltyAmount: penalty, refundAmount: refund }
          : c
      )
    );

    addToast(
      `ยกเลิกคอร์สเรียน ${reg.id} แล้ว`,
      `หักค่าธรรมเนียมยกเลิก 20% (${penalty.toLocaleString()}฿) • คืนเงิน ${refund.toLocaleString()}฿`,
      'warning'
    );
  }

  function openLockerQrPayment(locker: LockerItem) {
    if (locker.status !== 'available') return;
    selectedLockerForQr = locker;
  }

  function confirmLockerQrPayment() {
    if (isConfirmingPayment || !selectedLockerForQr) return;
    isConfirmingPayment = true;

    try {
      const targetLocker = selectedLockerForQr;
      const queueCode = generateQueueCode('L');
      const finalPrice = isUserVip ? 0 : targetLocker.price;

      const expireTime = new Date(Date.now() + LOCKER_DURATION_HOURS * 60 * 60 * 1000);
      const reservedUntilStr =
        expireTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

      lockers.update((all) =>
        all.map((l) =>
          l.id === targetLocker.id
            ? {
                ...l,
                status: 'reserved',
                reservedBy: lockerCustomerName.trim() || 'สมาชิกสระว่ายน้ำ',
                queueCode,
                paidAmount: finalPrice,
                isVipFree: isUserVip,
                durationHours: LOCKER_DURATION_HOURS,
                reservedUntil: reservedUntilStr
              }
            : l
        )
      );

      lastReservedLockerBanner = {
        number: targetLocker.number,
        zone: targetLocker.zone,
        queueCode,
        reservedUntil: reservedUntilStr
      };

      const earnedPts = earnCrmPoints(Math.max(50, finalPrice), `จองตู้ล็อกเกอร์ ${targetLocker.number} (${LOCKER_DURATION_HOURS} ชม.)`);

      latestQueueTicket.set({
        queueCode,
        serviceTitle: `จองล็อกเกอร์ ${targetLocker.number} (ใช้งานได้ ${LOCKER_DURATION_HOURS} ชม.)`,
        customerName: lockerCustomerName.trim() || 'สมาชิกสระว่ายน้ำ',
        detailLine1: `ตู้ ${targetLocker.number} ถูกล็อกไว้ให้คุณ ${LOCKER_DURATION_HOURS} ชั่วโมง (ถึง ${reservedUntilStr})`,
        detailLine2: `${isUserVip ? 'สิทธิ์ VIP จองฟรี' : 'เชื่อม RFID แล้ว'} • รับ +${earnedPts} แต้ม CRM`,
        amountText: isUserVip ? 'ยอดชำระ: 0 บาท (VIP FREE)' : `ชำระแล้ว: ${finalPrice} บาท`,
        timestamp: new Date().toLocaleString('th-TH')
      });

      selectedLockerForQr = null;

      addToast(
        'จองล็อกเกอร์สำเร็จ! 🔐',
        `ตู้ ${targetLocker.number} (${targetLocker.zone}) ถูกล็อกไว้ให้คุณ ${LOCKER_DURATION_HOURS} ชั่วโมง (ถึงเวลา ${reservedUntilStr})`,
        'success'
      );
    } finally {
      isConfirmingPayment = false;
    }
  }

  function cancelLockerReservation(locker: LockerItem) {
    if (locker.status !== 'reserved') return;
    const paid = locker.paidAmount ?? 0;
    const penalty = Math.round(paid * 0.2);
    const refund = paid - penalty;

    lockers.update((all) =>
      all.map((l) =>
        l.id === locker.id
          ? {
              ...l,
              status: 'available',
              reservedBy: undefined,
              queueCode: undefined,
              paidAmount: undefined,
              isVipFree: undefined,
              durationHours: undefined,
              reservedUntil: undefined
            }
          : l
      )
    );

    if (lastReservedLockerBanner?.number === locker.number) {
      lastReservedLockerBanner = null;
    }

    addToast(
      `ยกเลิกจองตู้ ${locker.number} แล้ว`,
      paid > 0
        ? `หักค่าธรรมเนียม 20% (${penalty}฿) • คืนเงิน ${refund}฿`
        : 'คืนสถานะตู้ว่างเรียบร้อย (สิทธิ์ VIP ฟรีไม่มีค่าปรับ)',
      'warning'
    );
  }

  function closeModal() {
    activeHotspot.set(null);
    showSwimsuitQrPayment = false;
    showBookingQr = false;
    showCourseQr = false;
    showVipQr = false;
    confirmCancelVip = false;
    selectedLockerForQr = null;
  }
</script>

<style>
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
  input[type="date"]::-webkit-datetime-edit-year-field {
    order: 3;
  }
  input[type="date"]::-webkit-datetime-edit-month-field {
    order: 2;
  }
  input[type="date"]::-webkit-datetime-edit-day-field {
    order: 1;
  }
  input[type="date"]::-webkit-datetime-edit-text {
    order: 1.5;
    padding: 0 0.2em;
  }
</style>

{#if $activeHotspot && $activeHotspot !== 'seven-eleven'}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto"
  >
    <div
      class="relative w-full max-w-4xl rounded-2xl border border-cyan-500/30 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-auto"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 px-6 py-4"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">
            {#if $activeHotspot === 'swimwear'}👙
            {:else if $activeHotspot === 'vip'}👑
            {:else if $activeHotspot === 'restroom'}🚿
            {:else if $activeHotspot === 'checkin'}🎟️
            {:else if $activeHotspot === 'locker'}🔐
            {:else if $activeHotspot === 'courses'}🏊‍♂️
            {:else if $activeHotspot === 'water'}💧
            {:else if $activeHotspot === 'kids-pool'}🛟
            {:else}🚨{/if}
          </span>
          <div>
            <h2 class="text-lg font-bold text-white">
              {#if $activeHotspot === 'swimwear'}
                ระบบจองเช่าและซื้อชุดว่ายน้ำ & ผ้าขนหนู (Swimwear & Towel Pro Shop)
              {:else if $activeHotspot === 'vip'}
                ระบบสมาชิก VIP & แต้มสะสม CRM (Loyalty & Membership)
              {:else if $activeHotspot === 'restroom'}
                โซนห้องน้ำ & ห้องเปลี่ยนชุดว่ายน้ำ (SHOWER ROOMS)
              {:else if $activeHotspot === 'checkin'}
                ระบบจองรอบสระว่ายน้ำ • เช็คอิน / เช็คเอาท์ & บัตรคิว
              {:else if $activeHotspot === 'locker'}
                ระบบจองตู้ล็อกเกอร์อัจฉริยะ 30 ตู้ (จำกัดเวลา 4 ชม./ครั้ง)
              {:else if $activeHotspot === 'courses'}
                ระบบสมัครคอร์สเรียนว่ายน้ำ & ตารางครูฝึก
              {:else if $activeHotspot === 'water'}
                เซ็นเซอร์ตรวจวัดคุณภาพน้ำ Real-time IoT (Admin Only)
              {:else if $activeHotspot === 'kids-pool'}
                โซนสระเด็ก (Kids Pool & Safety Zone)
              {:else}
                ศูนย์ควบคุมความปลอดภัย Lifeguard
              {/if}
            </h2>
            <p class="text-xs text-cyan-300/80">
              Digital Pools Smart Aquatics Platform • รองรับการชำระเงินผ่าน QR Code & บัตรคิว JPG
            </p>
          </div>
        </div>
        <button
          type="button"
          on:click={closeModal}
          class="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-rose-600 hover:text-white transition cursor-pointer"
        >
          ✕ ปิดหน้าต่าง
        </button>
      </div>

      <!-- Body Content -->
      <div class="max-h-[78vh] overflow-y-auto p-6">
        {#if $activeHotspot === 'vip'}
          <!-- ==================== บัตรสะสมแต้ม CRM (สำหรับ User ทุกระดับ) + ระบบสมาชิก VIP ==================== -->
          {#if !showVipQr}
            <div class="space-y-5">
              <div class="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-800/90 via-cyan-950/40 to-slate-900 p-4 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="text-xs font-bold text-cyan-300">🎖️ บัตรสะสมแต้มดิจิทัล & CRM (สำหรับผู้ใช้บริการทุกระดับ)</div>
                    <div class="text-base font-extrabold text-white mt-0.5">
                      ระดับปัจจุบัน: <span class="text-amber-300">{$crmTierStatus.rank}</span> • แต้มคงเหลือ <span class="text-emerald-400">{$crmProfile.points.toLocaleString()} แต้ม</span>
                    </div>
                  </div>
                  <div class="text-right text-xs">
                    <div class="text-slate-300">เข้าใช้บริการแล้ว <strong class="text-white">{$crmProfile.visitCount} ครั้ง</strong></div>
                    <div class="text-[11px] text-cyan-300">ทุก 10 บาท = 1 แต้ม • 100 แต้ม แลกส่วนลดร้านค้า 50฿</div>
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex justify-between text-[11px]">
                    <span class="text-slate-300">
                      ความคืบหน้าสู่ระดับ <strong class="text-amber-300">{$crmTierStatus.nextRank}</strong>
                    </span>
                    <span class="text-cyan-300 font-semibold">
                      {$crmTierStatus.rank === 'Platinum'
                        ? 'ระดับสูงสุดแล้ว (Platinum)'
                        : `อีก ${$crmTierStatus.pointsToNext} แต้ม (${$crmTierStatus.progressPercent}%)`}
                    </span>
                  </div>
                  <div class="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 transition-all duration-300"
                      style="width: {$crmTierStatus.progressPercent}%;"
                    ></div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1.5 pt-1">
                  {#each $crmProfile.transactions.slice(0, 3) as tx}
                    <span
                      class="rounded-lg px-2.5 py-1 text-[11px] border {tx.type === 'earn'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'}"
                    >
                      {tx.type === 'earn' ? `+${tx.points}` : `-${tx.points}`} แต้ม • {tx.title}
                    </span>
                  {/each}
                </div>
              </div>

              {#if isUserVip && $activeVipMembership}
                {@const vipPenalty = Math.round($activeVipMembership.price * 0.2)}
                {@const vipRefund = $activeVipMembership.price - vipPenalty}
                <div class="rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 p-4 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div class="text-xs font-bold text-amber-400">👑 สถานะสมาชิก VIP ปัจจุบันของคุณ (สมัครเรียบร้อยแล้ว)</div>
                      <div class="text-base font-extrabold text-white mt-0.5">
                        {$activeVipMembership.tierName} ({$activeVipMembership.billingCycle === 'monthly' ? 'รายเดือน' : 'รายปี'}) • รหัสคิว {$activeVipMembership.queueCode}
                      </div>
                      <div class="text-xs text-slate-300 mt-1">
                        สิทธิประโยชน์: <strong>จองล็อกเกอร์ฟรีทุกโซน (รวมโซน C VIP)</strong> • <strong>ส่วนลดร้านค้า {$activeVipMembership.discountPercent}%</strong> (ยกเว้น 7/11) • หมดอายุ {$activeVipMembership.expiresAt}
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        on:click={() =>
                          $activeVipMembership &&
                          downloadQueueTicketJpg({
                            queueCode: $activeVipMembership.queueCode,
                            serviceTitle: `บัตรสมาชิก ${$activeVipMembership.tierName}`,
                            customerName: $activeVipMembership.ownerName,
                            detailLine1: `สมาชิก: ${$activeVipMembership.familyMembers.join(', ')}`,
                            detailLine2: `ส่วนลดร้านค้า ${$activeVipMembership.discountPercent}% + จองล็อกเกอร์ฟรี`,
                            amountText: `ค่าสมัคร: ${$activeVipMembership.price.toLocaleString()} บาท`,
                            timestamp: $activeVipMembership.expiresAt
                          })}
                        class="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-4 py-2 text-xs cursor-pointer"
                      >
                        📥 โหลดบัตรคิว VIP (.JPG)
                      </button>

                      {#if !confirmCancelVip}
                        <button
                          type="button"
                          on:click={() => (confirmCancelVip = true)}
                          class="rounded-xl border border-rose-500/50 bg-rose-950/60 hover:bg-rose-600 text-rose-200 hover:text-white font-bold px-3.5 py-2 text-xs transition cursor-pointer"
                        >
                          ยกเลิกสมาชิก VIP (หัก 20%)
                        </button>
                      {/if}
                    </div>
                  </div>

                  {#if confirmCancelVip}
                    <div class="rounded-xl border border-rose-500/50 bg-rose-950/50 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div class="text-rose-200">
                        ⚠️ ยืนยันการยกเลิก <strong>{$activeVipMembership.tierName}</strong> (ยอดชำระ {$activeVipMembership.price.toLocaleString()}฿):
                        ระบบจะ<strong>หักค่าธรรมเนียม 20% ({vipPenalty.toLocaleString()}฿)</strong> และคืนเงิน <strong class="text-emerald-300">{vipRefund.toLocaleString()}฿</strong>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          on:click={() => (confirmCancelVip = false)}
                          class="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-200 font-semibold cursor-pointer"
                        >
                          ไม่ยกเลิก
                        </button>
                        <button
                          type="button"
                          on:click={cancelVipMembership}
                          class="rounded-lg bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-white font-extrabold cursor-pointer"
                        >
                          ยืนยันยกเลิก (หัก 20%)
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}

              <div class="grid grid-cols-2 gap-2 rounded-xl bg-slate-800/90 p-1.5 border border-slate-700 max-w-md mx-auto">
                <button
                  type="button"
                  disabled={isUserVip}
                  on:click={() => (selectedVipCycle = 'monthly')}
                  class="rounded-lg py-2 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer {selectedVipCycle === 'monthly'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'}"
                >
                  📅 สมัครรายเดือน (Monthly)
                </button>
                <button
                  type="button"
                  disabled={isUserVip}
                  on:click={() => (selectedVipCycle = 'yearly')}
                  class="rounded-lg py-2 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer {selectedVipCycle === 'yearly'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'}"
                >
                  🌟 สมัครรายปี (Yearly สุดคุ้ม)
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {#each vipPackages as pkg}
                  {@const displayPrice =
                    selectedVipCycle === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice}
                  <button
                    type="button"
                    disabled={isUserVip}
                    on:click={() => (selectedVipTier = pkg.tier)}
                    class="text-left rounded-2xl p-4 border transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex flex-col justify-between {selectedVipTier === pkg.tier
                      ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/30'
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}"
                  >
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          สูงสุด {pkg.maxMembers} คน
                        </span>
                        <span class="text-xs font-extrabold text-emerald-400">
                          ลด {pkg.discountPercent}%
                        </span>
                      </div>
                      <div class="mt-3 text-base font-extrabold text-white">{pkg.name}</div>
                      <div class="mt-2 text-2xl font-black text-amber-300">
                        {displayPrice.toLocaleString()} ฿
                        <span class="text-xs font-normal text-slate-400">
                          / {selectedVipCycle === 'monthly' ? 'เดือน' : 'ปี'}
                        </span>
                      </div>
                      <p class="mt-2 text-xs text-slate-300 leading-relaxed">{pkg.subtitle}</p>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-700/70 text-[11px] text-cyan-300 space-y-1">
                      <div>✓ จองตู้ล็อกเกอร์ฟรีทุกโซน (A, B, C VIP)</div>
                      <div>✓ ส่วนลดเช่า/ซื้อชุดว่ายน้ำ & ผ้าขนหนู {pkg.discountPercent}%</div>
                      <div class="text-slate-400">* ยกเว้นสินค้าในร้าน 7-Eleven</div>
                    </div>
                  </button>
                {/each}
              </div>

              <div class="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
                <h3 class="text-sm font-bold text-white">
                  {isUserVip ? '✅ คุณมีสถานะสมาชิก VIP ใช้งานอยู่แล้ว (หากต้องการเปลี่ยนแพ็กเกจ กรุณายกเลิกแพ็กเกจเดิมก่อน)' : `ข้อมูลผู้สมัคร ${activeVipPkg.name}`}
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label for="vip-owner" class="block text-xs text-slate-400 mb-1">ชื่อ-นามสกุล ผู้สมัครหลัก</label>
                    <input
                      id="vip-owner"
                      type="text"
                      disabled={isUserVip}
                      bind:value={vipOwnerName}
                      class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label for="vip-phone" class="block text-xs text-slate-400 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      id="vip-phone"
                      type="text"
                      disabled={isUserVip}
                      bind:value={vipPhone}
                      class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {#if activeVipPkg.maxMembers > 1}
                  <div class="space-y-2 pt-1">
                    <div class="text-xs font-semibold text-amber-300">
                      รายชื่อสมาชิกเพิ่มเติมในแพ็กเกจ (เพิ่มได้อีกสูงสุด {activeVipPkg.maxMembers - 1} ท่าน)
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {#each Array(activeVipPkg.maxMembers - 1) as _, idx}
                        <input
                          type="text"
                          disabled={isUserVip}
                          placeholder={`สมาชิกคนที่ ${idx + 2} (ระบุชื่อ-นามสกุล)`}
                          bind:value={vipMemberNames[idx]}
                          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                        />
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if isUserVip && $activeVipMembership}
                  <button
                    type="button"
                    disabled
                    class="w-full rounded-xl bg-slate-700 text-amber-300 border border-amber-400/40 font-extrabold py-3 text-sm cursor-not-allowed"
                  >
                    👑 สมัครสมาชิก VIP แล้ว ({$activeVipMembership.tierName} • หมดอายุ {$activeVipMembership.expiresAt})
                  </button>
                {:else}
                  <button
                    type="button"
                    on:click={proceedToVipQr}
                    class="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold py-3 text-sm shadow-lg cursor-pointer"
                  >
                    👑 ชำระค่าสมัคร {activeVipPkg.name} ผ่าน QR Code ({activeVipPrice.toLocaleString()} ฿)
                  </button>
                {/if}
              </div>
            </div>
          {:else}
            <div class="text-center space-y-4 max-w-sm mx-auto py-2">
              <div class="inline-block rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300">
                สแกน QR Code สมัครสมาชิก VIP
              </div>
              <div class="text-xs text-slate-300">
                แพ็กเกจ: <strong class="text-white">{activeVipPkg.name}</strong> ({selectedVipCycle === 'monthly' ? 'รายเดือน' : 'รายปี'})<br />
                ยอดชำระสุทธิ: <strong class="text-emerald-400 text-base">{activeVipPrice.toLocaleString()} บาท</strong>
              </div>
              <div class="mx-auto w-52 h-52 rounded-2xl bg-white p-3 flex items-center justify-center border-4 border-amber-400 shadow-xl">
                {#if !qrImageLoadError}
                  <img src={PAYMENT_QR_IMAGE_URL} alt="VIP QR" class="w-full h-full object-contain" on:error={handleQrImgError} />
                {:else}
                  <span class="text-xs text-slate-700 font-semibold">วางรูป QR ที่ public/my-qrcode.png</span>
                {/if}
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  on:click={() => (showVipQr = false)}
                  class="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  ← แก้ไขแพ็กเกจ
                </button>
                <button
                  type="button"
                  disabled={isConfirmingPayment || isUserVip}
                  on:click|stopPropagation={confirmVipPayment}
                  class="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-2.5 text-xs cursor-pointer"
                >
                  ✅ ยืนยันชำระเงิน VIP
                </button>
              </div>
            </div>
          {/if}

        {:else if $activeHotspot === 'swimwear'}
          <!-- ==================== ร้านเช่าและซื้อชุดว่ายน้ำ & ผ้าขนหนู ==================== -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-7 space-y-4">
              <div class="grid grid-cols-2 gap-2 rounded-xl bg-slate-800/90 p-1.5 border border-slate-700">
                <button
                  type="button"
                  on:click={() => (selectedOrderType = 'rent')}
                  class="rounded-lg py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer {selectedOrderType === 'rent'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'}"
                >
                  🔄 เช่าอุปกรณ์/ชุด/ผ้าขนหนู (Rent)
                </button>
                <button
                  type="button"
                  on:click={() => (selectedOrderType = 'buy')}
                  class="rounded-lg py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer {selectedOrderType === 'buy'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'}"
                >
                  🛍️ ซื้ออุปกรณ์/ชุด/ผ้าขนหนู (Buy)
                </button>
              </div>

              <div class="flex flex-wrap gap-1.5">
                {#each categoryButtons as cat}
                  <button
                    type="button"
                    on:click={() => selectCategoryFilter(cat.id)}
                    class="px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer {selectedCategory === cat.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                  >
                    {cat.label}
                  </button>
                {/each}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each filteredCatalog as item}
                  {@const totalRemaining = getTotalItemStock(item, selectedOrderType)}
                  <button
                    type="button"
                    on:click={() => (selectedSuitId = item.id)}
                    class="text-left rounded-xl p-3.5 border transition relative overflow-hidden cursor-pointer {selectedSuitId === item.id
                      ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/30'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'}"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <span class="text-2xl">{item.icon}</span>
                      <div class="flex items-center gap-1.5">
                        <span
                          class="rounded-full px-2 py-0.5 text-[10px] font-bold {totalRemaining > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}"
                        >
                          {totalRemaining > 0 ? `เหลือรวม ${totalRemaining} ชิ้น` : 'สินค้าหมด'}
                        </span>
                        <span
                          class="inline-block h-4 w-4 rounded-full border border-white/40 shrink-0"
                          style="background-color: {item.colorHex};"
                        ></span>
                      </div>
                    </div>
                    <div class="mt-2 font-semibold text-sm text-white">{item.name}</div>
                    <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                    <div class="mt-2.5 flex items-center justify-between text-xs">
                      {#if selectedOrderType === 'rent'}
                        <span class="text-cyan-300 font-bold text-sm">ค่าเช่า: {item.rentPrice}฿</span>
                      {:else}
                        <span class="text-pink-300 font-bold text-sm">ราคาซื้อ: {item.buyPrice}฿</span>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>

              {#if currentCatalogItem}
                <div class="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm font-semibold text-cyan-300">
                      📏 {isFreeSizeItem ? 'ขนาดมาตรฐาน (Free Size)' : `เลือกไซส์ (${selectedOrderType === 'rent' ? 'โหมดเช่า' : 'โหมดซื้อ'})`} — {currentCatalogItem.name}
                    </span>
                    <span class="text-xs text-slate-300">
                      {isFreeSizeItem ? 'ฟรีไซส์มาตรฐาน' : `รอบอก: ${SIZE_PRICE_MODIFIERS[selectedSize].chest}`}
                    </span>
                  </div>

                  {#if currentCatalogItem.availableColors && currentCatalogItem.availableColors.length > 0}
                    <div class="space-y-1.5">
                      <label for="color-select" class="block text-xs font-semibold text-slate-300">
                        🎨 เลือกสี: <strong class="text-white">{activeColorObj.colorName}</strong>
                      </label>
                      <div class="flex flex-wrap gap-2">
                        {#each currentCatalogItem.availableColors as col}
                          <button
                            type="button"
                            on:click={() => (selectedColorId = col.colorId)}
                            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer {selectedColorId === col.colorId
                              ? 'border-cyan-400 bg-cyan-950/80 text-white ring-2 ring-cyan-400/30'
                              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'}"
                          >
                            <span class="h-3 w-3 rounded-full border border-white/50" style="background-color: {col.colorHex};"></span>
                            <span>{col.colorName}</span>
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  {#if isFreeSizeItem}
                    <div class="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs text-cyan-200 flex items-center justify-between">
                      <span>
                        {currentCatalogItem.category === 'towel'
                          ? '🧣 ผ้าขนหนูไมโครไฟเบอร์ขนาดมาตรฐาน 70×140 ซม. ผ่านการฆ่าเชื้ออบโอโซนทุกผืน'
                          : '🥽 แว่นตาและหมวกว่ายน้ำ: ขนาดมาตรฐาน (Free Size) ปรับสายรัดซิลิโคนได้ตามขนาดศีรษะ'}
                      </span>
                      <span class="font-bold text-emerald-400 shrink-0 ml-2">
                        เหลือ {getRemainingSizeStock(currentCatalogItem, 'M', selectedOrderType)} ชิ้น
                      </span>
                    </div>
                  {:else}
                    <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {#each sizeList as sz}
                        {@const stockCount = getRemainingSizeStock(currentCatalogItem, sz, selectedOrderType)}
                        <button
                          type="button"
                          on:click={() => (selectedSize = sz)}
                          class="rounded-lg py-2 px-1 text-center border transition cursor-pointer {selectedSize === sz
                            ? stockCount > 0
                              ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold shadow'
                              : 'border-rose-400 bg-rose-950/80 text-rose-200 font-bold'
                            : stockCount > 0
                              ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                              : 'border-slate-800 bg-slate-950/60 text-rose-400/70'}"
                        >
                          <div class="text-xs font-bold">{sz}</div>
                          <div class="text-[10px] opacity-90">
                            {stockCount > 0 ? `เหลือ ${stockCount}` : 'สินค้าหมด'}
                          </div>
                        </button>
                      {/each}
                    </div>
                  {/if}

                  <div class="rounded-xl border border-slate-700 bg-slate-900/90 p-3 space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label for="suit-qty" class="block text-xs font-bold text-white">
                          จำนวนที่ต้องการ{selectedOrderType === 'rent' ? 'เช่า' : 'ซื้อ'} ({isFreeSizeItem ? 'Free Size' : `ไซส์ ${selectedSize}`})
                        </label>
                        <div class="mt-1 flex items-center gap-1.5">
                          {#if remainingStockForSelection > 0}
                            <span
                              class="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold {remainingStockForSelection > 3
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}"
                            >
                              📦 เหลืออีก {remainingStockForSelection} ชิ้น
                            </span>
                          {:else}
                            <span
                              class="inline-block rounded-full px-3 py-0.5 text-xs font-extrabold bg-rose-500/25 text-rose-300 border border-rose-500/50"
                            >
                              ❌ สินค้าหมด
                            </span>
                          {/if}
                        </div>
                      </div>

                      <div class="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={suitQuantity <= 1 || remainingStockForSelection <= 0}
                          on:click={decreaseSuitQty}
                          class="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-base font-extrabold text-white cursor-pointer"
                        >
                          −
                        </button>
                        <input
                          id="suit-qty"
                          type="number"
                          min="1"
                          max={Math.max(1, remainingStockForSelection)}
                          disabled={remainingStockForSelection <= 0}
                          bind:value={suitQuantity}
                          class="h-9 w-16 rounded-lg border border-slate-700 bg-slate-950 text-center text-sm font-bold text-cyan-300 disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={suitQuantity >= remainingStockForSelection || remainingStockForSelection <= 0}
                          on:click={increaseSuitQty}
                          class="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-base font-extrabold text-white cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
                      <div class="text-xs">
                        <div class="text-slate-300">
                          ราคา{selectedOrderType === 'rent' ? 'เช่า' : 'ซื้อ'}:
                          <span class="text-cyan-300 font-bold">{calculatedUnitPrice}฿</span> × {suitQuantity} ชิ้น =
                          <strong class="text-emerald-400">
                            {((calculatedUnitPrice + calculatedDeposit) * suitQuantity).toLocaleString()}฿
                          </strong>
                        </div>
                        {#if selectedOrderType === 'rent'}
                          <div class="text-amber-300/90 text-[11px]">
                            (รวมค่ามัดจำ {calculatedDeposit}฿/ชิ้น คืนเต็มจำนวนเมื่อส่งคืน)
                          </div>
                        {/if}
                      </div>
                      <button
                        type="button"
                        disabled={remainingStockForSelection <= 0}
                        on:click={addOrUpdateCartItem}
                        class="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-rose-950 disabled:text-rose-300 disabled:border disabled:border-rose-500/40 text-slate-950 font-bold px-4 py-2 text-xs transition shadow cursor-pointer"
                      >
                        {#if remainingStockForSelection <= 0}
                          สินค้าหมด
                        {:else if editingCartItemId}
                          💾 บันทึกการแก้ไข
                        {:else}
                          + เพิ่มลงรายการ ({suitQuantity} ชิ้น)
                        {/if}
                      </button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <div class="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-4">
              {#if !showSwimsuitQrPayment}
                <div class="space-y-4">
                  <div class="flex items-center justify-between border-b border-slate-700 pb-2">
                    <h3 class="font-bold text-sm text-white">🛒 รายการที่เลือก ({cartItems.length})</h3>
                    {#if $vipDiscountPercent > 0}
                      <span class="rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        👑 VIP ลด {$vipDiscountPercent}%
                      </span>
                    {/if}
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label for="cust-name" class="block text-xs text-slate-400 mb-1">ชื่อผู้เช่า/ซื้อ</label>
                      <input
                        id="cust-name"
                        type="text"
                        bind:value={customerName}
                        class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label for="cust-phone" class="block text-xs text-slate-400 mb-1">เบอร์โทรศัพท์</label>
                      <input
                        id="cust-phone"
                        type="text"
                        bind:value={customerPhone}
                        class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div class="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div class="font-bold text-cyan-300">🎖️ แต้มสะสม CRM: {$crmProfile.points} แต้ม</div>
                      <div class="text-[11px] text-slate-400">ใช้ 100 แต้ม ลดเพิ่ม 50 บาท (ยกเว้น 7/11)</div>
                    </div>
                    <label class="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={!canRedeemCrm}
                        bind:checked={useCrmPointDiscount}
                        class="rounded accent-cyan-400"
                      />
                      <span class="font-bold {canRedeemCrm ? 'text-emerald-400' : 'text-slate-500'}">
                        {canRedeemCrm ? 'ใช้ส่วนลด 50฿' : 'แต้มไม่พอ'}
                      </span>
                    </label>
                  </div>

                  {#if cartItems.length === 0}
                    <div class="rounded-xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-400">
                      ยังไม่มีรายการในตะกร้า<br />
                      เลือกชุดว่ายน้ำหรือผ้าขนหนู สี ไซส์ จำนวน แล้วกด <strong>"+ เพิ่มลงรายการ"</strong>
                    </div>
                  {:else}
                    <div class="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {#each cartItems as item}
                        <div class="rounded-lg border border-slate-700 bg-slate-900/90 p-3 flex items-center justify-between gap-2">
                          <div class="text-xs">
                            <div class="font-semibold text-white flex items-center gap-1.5">
                              <span
                                class="inline-block h-2.5 w-2.5 rounded-full"
                                style="background-color: {item.colorHex};"
                              ></span>
                              {item.name}
                            </div>
                            <div class="text-slate-400 mt-0.5">
                              <span
                                class="px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 {item.orderType === 'rent'
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'bg-pink-500/20 text-pink-300'}"
                              >
                                {item.orderType === 'rent' ? 'เช่า' : 'ซื้อขาด'}
                              </span>
                              × <strong class="text-cyan-300">{item.quantity} ชิ้น</strong>
                            </div>
                          </div>
                          <div class="text-right">
                            <div class="text-sm font-bold text-emerald-400">{item.totalPrice.toLocaleString()}฿</div>
                            <div class="flex items-center gap-1 mt-1 justify-end">
                              <button
                                type="button"
                                on:click={() => editCartItem(item)}
                                class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-amber-300 cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                on:click={() => removeCartItem(item.cartItemId)}
                                class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}

                  {#if $swimsuitOrders.length > 0}
                    <div class="border-t border-slate-700/80 pt-2 space-y-1.5 max-h-32 overflow-y-auto">
                      <div class="text-[11px] font-bold text-slate-300">ประวัติรายการหน้าร้าน & บัตรคิว</div>
                      {#each $swimsuitOrders as ord}
                        <div class="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-[11px] flex items-center justify-between gap-2">
                          <div>
                            <span class="font-bold text-cyan-300">[{ord.queueCode}]</span>
                            <span class="text-white ml-1">{ord.totalAmount.toLocaleString()}฿</span>
                            {#if ord.status === 'cancelled'}
                              <span class="text-rose-400 ml-1">(ยกเลิกแล้ว หัก 20%)</span>
                            {/if}
                          </div>
                          {#if ord.status !== 'cancelled'}
                            <div class="flex items-center gap-1">
                              <button
                                type="button"
                                on:click={() =>
                                  downloadQueueTicketJpg({
                                    queueCode: ord.queueCode,
                                    serviceTitle: 'รับสินค้าเช่า/ซื้อชุดว่ายน้ำ & ผ้าขนหนู',
                                    customerName: ord.customerName,
                                    detailLine1: `รหัสออเดอร์: ${ord.id}`,
                                    detailLine2: `จำนวน ${ord.items.length} รายการ`,
                                    amountText: `ยอดชำระสุทธิ: ${ord.totalAmount.toLocaleString()} บาท`,
                                    timestamp: ord.createdAt
                                  })}
                                class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer"
                              >
                                คิว JPG
                              </button>
                              <button
                                type="button"
                                on:click={() => cancelSwimsuitOrder(ord)}
                                class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                              >
                                ยกเลิก (-20%)
                              </button>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <div class="border-t border-slate-700 pt-3 space-y-2">
                  {#if $vipDiscountPercent > 0}
                    <div class="flex items-center justify-between text-xs text-amber-300">
                      <span>ส่วนลดสมาชิก VIP ({$vipDiscountPercent}% เฉพาะร้านค้า ไม่รวม 7/11):</span>
                      <span class="font-bold">
                        -{(cartItems.length > 0 ? cartVipDiscountAmount : previewVipDiscount).toLocaleString()} ฿
                      </span>
                    </div>
                  {/if}
                  {#if useCrmPointDiscount && canRedeemCrm}
                    <div class="flex items-center justify-between text-xs text-cyan-300">
                      <span>ส่วนลดแลกแต้ม CRM (100 แต้ม):</span>
                      <span class="font-bold">
                        -{(cartItems.length > 0 ? cartCrmDiscountAmount : previewCrmDiscount).toLocaleString()} ฿
                      </span>
                    </div>
                  {/if}
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-300">ยอดชำระรวมสุทธิ:</span>
                    <span class="text-xl font-extrabold text-emerald-400">
                      {(cartItems.length > 0 ? cartGrandTotal : previewFinalTotal).toLocaleString()} ฿
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={cartItems.length === 0 && remainingStockForSelection <= 0}
                    on:click={proceedToSwimsuitQr}
                    class="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:from-rose-950 disabled:to-rose-900 disabled:text-rose-300 text-slate-950 font-bold py-3 text-sm shadow-lg transition cursor-pointer"
                  >
                    {#if cartItems.length === 0 && remainingStockForSelection <= 0}
                      ❌ สินค้าหมด
                    {:else}
                      📱 ชำระเงินผ่าน QR Code & รับรหัสคิว
                    {/if}
                  </button>
                </div>
              {:else}
                <div class="space-y-4 text-center my-auto">
                  <div class="inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                    สแกน QR Code เพื่อชำระเงิน
                  </div>

                  <div class="mx-auto w-56 h-56 rounded-2xl bg-white p-3 shadow-xl flex flex-col items-center justify-center relative border-4 border-cyan-400">
                    {#if !qrImageLoadError}
                      <img
                        src={PAYMENT_QR_IMAGE_URL}
                        alt="Payment QR Code"
                        class="w-full h-full object-contain rounded-lg"
                        on:error={handleQrImgError}
                      />
                    {:else}
                      <div class="text-slate-800 text-center p-2 space-y-1.5">
                        <div class="text-3xl">📷</div>
                        <div class="text-xs font-bold text-slate-900">พื้นที่สำหรับ QR Code ของคุณ</div>
                        <p class="text-[11px] text-slate-600 leading-tight">
                          นำรูปไปวางที่ <code class="bg-slate-200 px-1 rounded">public/my-qrcode.png</code>
                        </p>
                      </div>
                    {/if}
                  </div>

                  <div class="rounded-xl bg-slate-900/90 p-3 border border-slate-700 text-xs space-y-1">
                    <div class="text-slate-400">ผู้ทำรายการ: <strong class="text-white">{customerName}</strong></div>
                    {#if cartVipDiscountAmount > 0}
                      <div class="text-amber-300">
                        ส่วนลด VIP ({$vipDiscountPercent}%): -{cartVipDiscountAmount.toLocaleString()} บาท
                      </div>
                    {/if}
                    {#if cartCrmDiscountAmount > 0}
                      <div class="text-cyan-300">
                        ส่วนลดแต้ม CRM: -{cartCrmDiscountAmount.toLocaleString()} บาท
                      </div>
                    {/if}
                    <div class="text-base font-extrabold text-emerald-400">
                      ยอดชำระสุทธิ: {cartGrandTotal.toLocaleString()} บาท
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      on:click={() => (showSwimsuitQrPayment = false)}
                      class="rounded-xl border border-slate-600 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                    >
                      ← กลับไปแก้ไขรายการ
                    </button>
                    <button
                      type="button"
                      disabled={isConfirmingPayment}
                      on:click|stopPropagation={confirmSwimsuitQrPayment}
                      class="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-2.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer"
                    >
                      ✅ ยืนยันชำระเงิน & ออกบัตรคิว
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>

        {:else if $activeHotspot === 'lifeguard'}
          <!-- ==================== ศูนย์ควบคุมความปลอดภัย Lifeguard ==================== -->
          <div class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="rounded-xl border border-rose-500/40 bg-rose-950/25 p-4">
                <div class="text-xs text-rose-300">เจ้าหน้าที่ไลฟ์การ์ดประจำจุด</div>
                <div class="text-2xl font-extrabold text-white mt-1">{$poolMetrics.activeLifeguards} นาย</div>
                <div class="text-[11px] text-emerald-400 mt-1">● ปฏิบัติหน้าที่ครบทุกโซน</div>
              </div>
              <div class="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <div class="text-xs text-slate-400">อุปกรณ์กู้ภัย & เครื่องกระตุกหัวใจ (AED)</div>
                <div class="text-2xl font-extrabold text-emerald-400 mt-1">พร้อมใช้งาน 100%</div>
                <div class="text-[11px] text-slate-300 mt-1">ห่วงชูชีพ 8 จุด • ไม้ตะขอกู้ภัย 4 จุด</div>
              </div>
              <div class="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <div class="text-xs text-slate-400">ระดับความลึกสระหลัก / สระเด็ก</div>
                <div class="text-2xl font-extrabold text-cyan-400 mt-1">1.50 ม. / 0.60 ม.</div>
                <div class="text-[11px] text-slate-300 mt-1">มีระบบตรวจจับคนจมน้ำอัตโนมัติ</div>
              </div>
            </div>

            <div class="rounded-xl border border-rose-500/30 bg-slate-800/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-sm text-white">🚨 ระบบแจ้งเหตุฉุกเฉิน & จำลองการช่วยเหลือ</h3>
                <p class="text-xs text-slate-300 mt-1">
                  กดปุ่มด้านขวาเพื่อส่งสัญญาณฉุกเฉิน และดูไลฟ์การ์ดวิ่งตรวจรอบสระน้ำทันที
                </p>
              </div>
              <button
                type="button"
                on:click={triggerLifeguardSimulation}
                class="shrink-0 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-3 text-xs font-extrabold text-white shadow-lg cursor-pointer"
              >
                🚨 ไลฟ์การ์ดวิ่งรอบสระ (Lifeguard Patrol)
              </button>
            </div>
          </div>

        {:else if $activeHotspot === 'kids-pool'}
          <!-- ==================== โซนสระเด็ก ==================== -->
          <div class="space-y-5">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="rounded-xl bg-slate-800/70 p-4 border border-amber-400/30">
                <div class="text-xs text-slate-400">ความลึกระดับน้ำ</div>
                <div class="text-2xl font-extrabold text-amber-300 mt-1">0.60 ม.</div>
                <div class="text-[11px] text-emerald-400 mt-1">ปลอดภัยสำหรับเด็กเล็ก</div>
              </div>
              <div class="rounded-xl bg-slate-800/70 p-4 border border-slate-700">
                <div class="text-xs text-slate-400">อุณหภูมิน้ำอุ่น</div>
                <div class="text-2xl font-extrabold text-cyan-400 mt-1">29.5 °C</div>
                <div class="text-[11px] text-slate-400 mt-1">ควบคุมอุณหภูมิอัตโนมัติ</div>
              </div>
              <div class="rounded-xl bg-slate-800/70 p-4 border border-slate-700">
                <div class="text-xs text-slate-400">เด็กในโซนสระเด็ก</div>
                <div class="text-2xl font-extrabold text-white mt-1">{$poolMetrics.kidsPoolSwimmers} / {KIDS_POOL_MAX_CAPACITY} คน</div>
                <div class="text-[11px] text-emerald-400 mt-1">● รับได้อีก {remainingKidsPool} คน</div>
              </div>
              <div class="rounded-xl bg-slate-800/70 p-4 border border-slate-700">
                <div class="text-xs text-slate-400">สไลเดอร์ & ห่วงยาง</div>
                <div class="text-2xl font-extrabold text-pink-400 mt-1">เปิดใช้งาน</div>
                <div class="text-[11px] text-slate-400 mt-1">พื้นยางกันลื่นรอบสระ</div>
              </div>
            </div>

            <div class="rounded-xl border border-cyan-500/30 bg-slate-800/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-sm text-white">🛟 จองรอบเข้าใช้บริการโซนสระเด็ก (90 บาท / ท่าน)</h3>
                <p class="text-xs text-slate-300 mt-1">
                  รวมบริการห่วงยางนิรภัยสำหรับเด็กและผู้ปกครองดูแลริมสระฟรี (รับได้อีก <strong class="text-emerald-400">{remainingKidsPool} คน</strong>)
                </p>
              </div>
              <button
                type="button"
                on:click={openKidsPoolBooking}
                class="shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg cursor-pointer"
              >
                🎟️ จองรอบสระเด็กทันที
              </button>
            </div>
          </div>

        {:else if $activeHotspot === 'restroom'}
          <!-- ==================== โซนห้องน้ำ & ห้องเปลี่ยนชุด (แสดงผลสั้นๆ ตามต้องการ) ==================== -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-xl border border-cyan-500/30 bg-slate-800/60 p-6 space-y-2 text-center">
              <div class="text-3xl">🚹</div>
              <div class="text-cyan-400 font-bold text-lg">ห้องน้ำกับห้องเปลี่ยนชุดชาย</div>
              <p class="text-xs text-slate-300">ห้องน้ำชายและห้องเปลี่ยนชุดพร้อมให้บริการ</p>
            </div>
            <div class="rounded-xl border border-pink-500/30 bg-slate-800/60 p-6 space-y-2 text-center">
              <div class="text-3xl">🚺</div>
              <div class="text-pink-400 font-bold text-lg">ห้องน้ำกับห้องเปลี่ยนชุดหญิง</div>
              <p class="text-xs text-slate-300">ห้องน้ำหญิงและห้องเปลี่ยนชุดพร้อมให้บริการ</p>
            </div>
          </div>

        {:else if $activeHotspot === 'checkin'}
          <!-- ==================== แยกระบบจองรอบสระ / Check-in / Check-out & ยกเลิกหัก 20% ==================== -->
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-2 rounded-xl bg-slate-800/90 p-1.5 border border-slate-700">
              <button
                type="button"
                on:click={() => {
                  checkinTab = 'book';
                  showBookingQr = false;
                }}
                class="rounded-lg py-2 text-xs font-bold transition cursor-pointer {checkinTab === 'book'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'}"
              >
                1. จองรอบ & รับคิว
              </button>
              <button
                type="button"
                on:click={() => (checkinTab = 'checkinout')}
                class="rounded-lg py-2 text-xs font-bold transition cursor-pointer {checkinTab === 'checkinout'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'}"
              >
                2. Check-in / Check-out
              </button>
              <button
                type="button"
                on:click={() => (checkinTab = 'history')}
                class="rounded-lg py-2 text-xs font-bold transition cursor-pointer {checkinTab === 'history'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'}"
              >
                3. รายการจอง & ยกเลิก (-20%)
              </button>
            </div>

            {#if checkinTab === 'book'}
              {#if !showBookingQr}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h3 class="font-bold text-white text-sm">กรอกข้อมูลจองรอบสระว่ายน้ำ</h3>
                      <span
                        class="rounded-full px-3 py-1 text-xs font-bold {remainingSelectedPool > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}"
                      >
                        🏊‍♂️ สระนี้รับได้อีก {remainingSelectedPool} คน
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 rounded-xl border border-slate-700/80 bg-slate-800/70 p-2.5 text-xs">
                      <div class="flex items-center justify-between px-2">
                        <span class="text-slate-400">สระหลัก ({$poolMetrics.currentSwimmers}/{$poolMetrics.maxCapacity}):</span>
                        <strong class="text-cyan-300">รับได้อีก {remainingMainPool} คน</strong>
                      </div>
                      <div class="flex items-center justify-between px-2 border-l border-slate-700">
                        <span class="text-slate-400">สระเด็ก ({$poolMetrics.kidsPoolSwimmers}/{KIDS_POOL_MAX_CAPACITY}):</span>
                        <strong class="text-amber-300">รับได้อีก {remainingKidsPool} คน</strong>
                      </div>
                    </div>

                    <div>
                      <label for="bk-name" class="block text-xs text-slate-400 mb-1">ชื่อผู้จอง</label>
                      <input id="bk-name" bind:value={bkName} class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label for="bk-date" class="block text-xs text-slate-400 mb-1">วันที่ (วัน / เดือน / ปี)</label>
                        <input id="bk-date" type="date" bind:value={bkDate} class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                      </div>
                      <div>
                        <label for="bk-slot" class="block text-xs text-slate-400 mb-1">รอบเวลา</label>
                        <select id="bk-slot" bind:value={bkSlot} class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                          <option>08:00 - 10:00</option>
                          <option>10:00 - 12:00</option>
                          <option>14:00 - 16:00</option>
                          <option>16:00 - 18:00</option>
                          <option>18:00 - 20:00</option>
                        </select>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label for="bk-zone" class="block text-xs text-slate-400 mb-1">โซนสระ</label>
                        <select id="bk-zone" bind:value={bkZone} class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                          <option value="main">สระหลัก (120฿/ท่าน)</option>
                          <option value="kids">สระเด็ก (90฿/ท่าน)</option>
                        </select>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label for="bk-count" class="text-xs text-slate-400">จำนวนผู้เข้าใช้ (ท่าน)</label>
                          <span class="text-[11px] font-semibold text-emerald-400">
                            รับได้อีก {remainingSelectedPool} คน
                          </span>
                        </div>
                        <input
                          id="bk-count"
                          type="number"
                          min="1"
                          max={Math.max(1, remainingSelectedPool)}
                          bind:value={bkCount}
                          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div class="text-[11px] text-amber-300/90">
                      * หมายเหตุ: หากยกเลิกการจองก่อนถึงเวลาจะหักค่าธรรมเนียม 20% ของเงินทั้งหมด
                    </div>
                    <button
                      type="button"
                      disabled={remainingSelectedPool <= 0}
                      on:click={proceedToBookingQr}
                      class="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold py-2.5 text-sm cursor-pointer"
                    >
                      {remainingSelectedPool > 0
                        ? `ดำเนินการชำระเงินผ่าน QR Code (${(bkZone === 'kids' ? 90 : 120) * bkCount} ฿)`
                        : 'สระรอบนี้เต็มแล้ว'}
                    </button>
                  </div>
                  <div class="space-y-2">
                    <h3 class="font-bold text-white text-sm">รายการจองล่าสุด & รหัสคิว</h3>
                    {#each $bookings as b}
                      <div class="rounded-lg border border-slate-800 bg-slate-800/50 p-3 flex items-center justify-between text-xs">
                        <div>
                          <div class="font-semibold text-white">
                            <span class="text-cyan-300 font-bold">[{b.queueCode}]</span> {b.customerName} ({b.memberCount} ท่าน)
                          </div>
                          <div class="text-slate-400">{b.date} • {b.timeSlot}</div>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <span class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">{b.totalPrice}฿</span>
                          <button
                            type="button"
                            on:click={() =>
                              downloadQueueTicketJpg({
                                queueCode: b.queueCode,
                                serviceTitle: `จองรอบสระว่ายน้ำ (${b.poolZone === 'kids' ? 'สระเด็ก' : 'สระหลัก'})`,
                                customerName: b.customerName,
                                detailLine1: `วันที่ ${b.date} • รอบ ${b.timeSlot}`,
                                detailLine2: `จำนวนผู้ใช้บริการ: ${b.memberCount} ท่าน`,
                                amountText: `ชำระแล้ว: ${b.totalPrice.toLocaleString()} บาท`,
                                timestamp: b.date
                              })}
                            class="px-2 py-1 rounded bg-slate-700 hover:bg-cyan-500 hover:text-slate-950 text-white font-bold cursor-pointer"
                          >
                            JPG
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else}
                <div class="text-center space-y-4 max-w-sm mx-auto">
                  <div class="text-sm font-bold text-cyan-300">สแกน QR Code ชำระค่าเข้าสระว่ายน้ำ</div>
                  <div class="text-xs text-slate-300">
                    โซน: <strong>{bkZone === 'kids' ? 'สระเด็ก' : 'สระหลัก'}</strong> ({bkCount} ท่าน) • ยอดชำระ{' '}
                    <strong class="text-emerald-400">{(bkZone === 'kids' ? 90 : 120) * bkCount} บาท</strong>
                  </div>
                  <div class="mx-auto w-48 h-48 rounded-xl bg-white p-3 flex items-center justify-center border-4 border-cyan-400">
                    {#if !qrImageLoadError}
                      <img src={PAYMENT_QR_IMAGE_URL} alt="QR" class="w-full h-full object-contain" on:error={handleQrImgError} />
                    {:else}
                      <span class="text-xs text-slate-700 font-semibold">วางรูป QR ที่ public/my-qrcode.png</span>
                    {/if}
                  </div>
                  <div class="flex gap-2">
                    <button type="button" on:click={() => (showBookingQr = false)} class="flex-1 rounded-lg bg-slate-800 py-2 text-xs cursor-pointer">← แก้ไข</button>
                    <button
                      type="button"
                      disabled={isConfirmingPayment}
                      on:click|stopPropagation={confirmBookingPayment}
                      class="flex-1 rounded-lg bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold py-2 text-xs cursor-pointer"
                    >
                      ✅ ยืนยันชำระเงิน & ออกบัตรคิว
                    </button>
                  </div>
                </div>
              {/if}

            {:else if checkinTab === 'checkinout'}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="rounded-xl border border-emerald-500/30 bg-slate-800/50 p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-emerald-400">🟢 รอเช็คอินเข้าสระ (Check-In)</h3>
                    <span class="text-xs text-slate-400">
                      {$bookings.filter((b) => b.status === 'paid').length} รายการ
                    </span>
                  </div>
                  {#if $bookings.filter((b) => b.status === 'paid').length === 0}
                    <div class="rounded-lg border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">
                      ไม่มีรายการรอเช็คอิน
                    </div>
                  {:else}
                    <div class="space-y-2 max-h-72 overflow-y-auto">
                      {#each $bookings.filter((b) => b.status === 'paid') as b}
                        <div class="rounded-xl border border-slate-700 bg-slate-900/90 p-3 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div class="font-bold text-white">
                              <span class="text-cyan-300">[{b.queueCode}]</span> {b.customerName}
                            </div>
                            <div class="text-slate-400 mt-0.5">
                              {b.poolZone === 'kids' ? 'สระเด็ก' : 'สระหลัก'} • {b.memberCount} ท่าน • {b.timeSlot}
                            </div>
                          </div>
                          <button
                            type="button"
                            on:click={() => handlePoolCheckIn(b)}
                            class="shrink-0 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3 py-2 text-xs cursor-pointer"
                          >
                            ✓ เช็คอินเข้าสระ
                          </button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <div class="rounded-xl border border-amber-500/30 bg-slate-800/50 p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-amber-400">🟠 กำลังว่ายน้ำ / รอเช็คเอาท์ (Check-Out)</h3>
                    <span class="text-xs text-slate-400">
                      {$bookings.filter((b) => b.status === 'checked-in').length} รายการ
                    </span>
                  </div>
                  {#if $bookings.filter((b) => b.status === 'checked-in').length === 0}
                    <div class="rounded-lg border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">
                      ไม่มีผู้ใช้งานรอเช็คเอาท์ในขณะนี้
                    </div>
                  {:else}
                    <div class="space-y-2 max-h-72 overflow-y-auto">
                      {#each $bookings.filter((b) => b.status === 'checked-in') as b}
                        <div class="rounded-xl border border-slate-700 bg-slate-900/90 p-3 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div class="font-bold text-white">
                              <span class="text-amber-300">[{b.queueCode}]</span> {b.customerName}
                            </div>
                            <div class="text-slate-400 mt-0.5">
                              เช็คอินเมื่อ: {b.checkedInAt || '-'} • {b.memberCount} ท่าน
                            </div>
                          </div>
                          <button
                            type="button"
                            on:click={() => handlePoolCheckOut(b)}
                            class="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-2 text-xs cursor-pointer"
                          >
                            ↪ เช็คเอาท์ออก
                          </button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

            {:else}
              <div class="space-y-3">
                <div class="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-2.5 text-xs text-rose-200">
                  ⚠️ นโยบายการยกเลิก: หากยกเลิกการจองก่อนถึงเวลาใช้บริการ ระบบจะ<strong>หักค่าธรรมเนียม 20% ของยอดเงินทั้งหมด</strong> และคืนเงินส่วนต่าง 80% ทันที
                </div>
                <div class="space-y-2 max-h-80 overflow-y-auto">
                  {#each $bookings as b}
                    <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div class="font-bold text-white flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">คิว {b.queueCode}</span>
                          <span>{b.customerName} ({b.memberCount} ท่าน)</span>
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold {b.status === 'paid'
                            ? 'bg-sky-500/20 text-sky-300'
                            : b.status === 'checked-in'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : b.status === 'checked-out'
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-rose-500/20 text-rose-300'}">
                            {b.status === 'paid'
                              ? 'จองแล้ว (รอเช็คอิน)'
                              : b.status === 'checked-in'
                                ? `เช็คอินแล้ว (${b.checkedInAt})`
                                : b.status === 'checked-out'
                                  ? `เช็คเอาท์แล้ว (${b.checkedOutAt})`
                                  : `ยกเลิกแล้ว (หัก ${b.penaltyAmount}฿ / คืน ${b.refundAmount}฿)`}
                          </span>
                        </div>
                        <div class="text-slate-400 mt-1">
                          รหัส {b.id} • วันที่ {b.date} • รอบ {b.timeSlot} • ยอดชำระ {b.totalPrice.toLocaleString()} บาท
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          on:click={() =>
                            downloadQueueTicketJpg({
                              queueCode: b.queueCode,
                              serviceTitle: `จองรอบสระว่ายน้ำ (${b.poolZone === 'kids' ? 'สระเด็ก' : 'สระหลัก'})`,
                              customerName: b.customerName,
                              detailLine1: `วันที่ ${b.date} • รอบ ${b.timeSlot}`,
                              detailLine2: `จำนวนผู้ใช้บริการ: ${b.memberCount} ท่าน`,
                              amountText: `ชำระแล้ว: ${b.totalPrice.toLocaleString()} บาท`,
                              timestamp: b.date
                            })}
                          class="rounded-lg bg-slate-700 hover:bg-cyan-500 hover:text-slate-950 px-3 py-1.5 font-bold text-white cursor-pointer"
                        >
                          📥 โหลดคิว JPG
                        </button>
                        {#if b.status === 'paid'}
                          <button
                            type="button"
                            on:click={() => cancelPoolBooking(b)}
                            class="rounded-lg bg-rose-600/80 hover:bg-rose-500 px-3 py-1.5 font-bold text-white cursor-pointer"
                          >
                            ยกเลิกการจอง (หัก 20%)
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

        {:else if $activeHotspot === 'locker'}
          <!-- ==================== ตู้ล็อกเกอร์อัจฉริยะ 30 ตู้ (จำกัดเวลาจอง 4 ชั่วโมง) ==================== -->
          {#if !selectedLockerForQr}
            <div class="space-y-4">
              {#if lastReservedLockerBanner}
                <div class="rounded-2xl border border-emerald-400/60 bg-emerald-950/45 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-xl bg-emerald-500 text-slate-950 font-black grid place-items-center text-sm shrink-0">
                      ✓
                    </div>
                    <div>
                      <div class="text-sm font-extrabold text-emerald-300">
                        จองล็อกเกอร์สำเร็จ! ตู้ {lastReservedLockerBanner.number} ถูกล็อกไว้ให้คุณ {LOCKER_DURATION_HOURS} ชั่วโมง
                      </div>
                      <div class="text-xs text-slate-200 mt-0.5">
                        รหัสคิว <strong class="text-cyan-300">{lastReservedLockerBanner.queueCode}</strong> • {lastReservedLockerBanner.zone} • ใช้งานได้ถึงเวลา <strong class="text-amber-300">{lastReservedLockerBanner.reservedUntil}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    on:click={() => (lastReservedLockerBanner = null)}
                    class="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 cursor-pointer"
                  >
                    รับทราบ
                  </button>
                </div>
              {/if}

              <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs">
                <span class="text-slate-300">
                  {#if isUserVip}
                    👑 สิทธิพิเศษ <strong class="text-amber-300">{$activeVipMembership?.tierName}</strong>: จองล็อกเกอร์ได้ <strong class="text-emerald-400">ฟรี (0 บาท) ทุกโซน</strong> • ระยะเวลาใช้งาน <strong class="text-cyan-300">{LOCKER_DURATION_HOURS} ชั่วโมง / ครั้ง</strong>
                  {:else}
                    ผังตู้ล็อกเกอร์ 30 ตู้ (ระยะเวลาจอง <strong class="text-cyan-300">{LOCKER_DURATION_HOURS} ชม./ครั้ง</strong> • โซน A/B 40฿ • โซน C VIP 80฿)
                  {/if}
                </span>
                <div class="flex items-center gap-3">
                  <span class="text-emerald-400 font-semibold">● ว่าง ({$lockers.filter((l) => l.status === 'available').length})</span>
                  <span class="text-rose-400 font-semibold">● จองแล้ว/ไม่ว่าง ({$lockers.filter((l) => l.status !== 'available').length})</span>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  on:click={() => (lockerZoneFilter = 'all')}
                  class="px-3 py-1 rounded-full text-xs font-bold cursor-pointer {lockerZoneFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                >
                  ทั้งหมด (30 ตู้)
                </button>
                <button
                  type="button"
                  on:click={() => (lockerZoneFilter = 'A')}
                  class="px-3 py-1 rounded-full text-xs font-bold cursor-pointer {lockerZoneFilter === 'A'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                >
                  โซน A • ชาย (A-01 – A-10)
                </button>
                <button
                  type="button"
                  on:click={() => (lockerZoneFilter = 'B')}
                  class="px-3 py-1 rounded-full text-xs font-bold cursor-pointer {lockerZoneFilter === 'B'
                    ? 'bg-pink-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                >
                  โซน B • หญิง (B-11 – B-20)
                </button>
                <button
                  type="button"
                  on:click={() => (lockerZoneFilter = 'C')}
                  class="px-3 py-1 rounded-full text-xs font-bold cursor-pointer {lockerZoneFilter === 'C'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700'}"
                >
                  👑 โซน C • VIP (C-21 – C-30)
                </button>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                {#each filteredLockers as lk}
                  <div class="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={lk.status !== 'available'}
                      on:click={() => openLockerQrPayment(lk)}
                      class="w-full rounded-xl p-2.5 border text-center transition cursor-pointer {lk.status === 'available'
                        ? lk.tierType === 'vip'
                          ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400 text-white'
                          : 'border-slate-700 bg-slate-800/70 hover:border-cyan-400 hover:bg-cyan-950/30 text-white'
                        : 'border-rose-500/30 bg-rose-950/30 text-slate-400 cursor-not-allowed'}"
                    >
                      <div class="text-xs font-extrabold {lk.tierType === 'vip' ? 'text-amber-300' : 'text-white'}">
                        {lk.number}
                      </div>
                      <div class="text-[10px] text-slate-400">{lk.zone}</div>
                      <div class="mt-1 text-[11px] font-semibold {lk.status === 'available' ? 'text-emerald-400' : 'text-rose-400'}">
                        {#if lk.status === 'available'}
                          {isUserVip ? `ว่าง (${LOCKER_DURATION_HOURS} ชม. ฟรี)` : `ว่าง (${lk.price}฿ / ${LOCKER_DURATION_HOURS} ชม.)`}
                        {:else if lk.status === 'reserved'}
                          จองแล้ว ({LOCKER_DURATION_HOURS} ชม.)
                        {:else}
                          ไม่ว่าง
                        {/if}
                      </div>
                      {#if lk.status === 'reserved' && lk.reservedUntil}
                        <div class="text-[9px] text-amber-300 mt-0.5">ถึง {lk.reservedUntil}</div>
                      {/if}
                    </button>
                    {#if lk.status === 'reserved'}
                      <button
                        type="button"
                        on:click={() => cancelLockerReservation(lk)}
                        class="w-full rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold py-1 cursor-pointer"
                      >
                        ยกเลิกตู้ ({lk.isVipFree ? 'ฟรี' : 'หัก 20%'})
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <div class="max-w-md mx-auto space-y-4 text-center py-2">
              <div class="inline-block rounded-full bg-cyan-500/20 px-3.5 py-1 text-xs font-bold text-cyan-300">
                {isUserVip ? `👑 ยืนยันสิทธิ์สมาชิก VIP จองล็อกเกอร์ฟรี (${LOCKER_DURATION_HOURS} ชม.)` : `🔐 ชำระเงินผ่าน QR Code เพื่อยืนยันจองตู้ล็อกเกอร์ (${LOCKER_DURATION_HOURS} ชม.)`}
              </div>

              <div class="rounded-xl border border-slate-700 bg-slate-800/70 p-3.5 text-left space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">หมายเลขตู้ล็อกเกอร์:</span>
                  <strong class="text-cyan-300 text-sm">{selectedLockerForQr.number} ({selectedLockerForQr.zone})</strong>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">ระยะเวลาใช้งานสูงสุด:</span>
                  <strong class="text-amber-300 text-xs">{LOCKER_DURATION_HOURS} ชั่วโมง (ล็อกอัตโนมัติหลังชำระเงิน)</strong>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">ค่าบริการเช่าตู้ล็อกเกอร์:</span>
                  {#if isUserVip}
                    <strong class="text-amber-300 text-base">ฟรี 0 บาท (สิทธิ์สมาชิก VIP)</strong>
                  {:else}
                    <strong class="text-emerald-400 text-base">{selectedLockerForQr.price} บาท</strong>
                  {/if}
                </div>
                <div class="pt-1">
                  <label for="locker-cust-name" class="block text-[11px] text-slate-400 mb-1">ชื่อผู้จองล็อกเกอร์</label>
                  <input
                    id="locker-cust-name"
                    type="text"
                    bind:value={lockerCustomerName}
                    class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {#if !isUserVip}
                <div class="mx-auto w-52 h-52 rounded-2xl bg-white p-3 shadow-xl flex flex-col items-center justify-center border-4 border-cyan-400">
                  {#if !qrImageLoadError}
                    <img
                      src={PAYMENT_QR_IMAGE_URL}
                      alt="Locker Payment QR Code"
                      class="w-full h-full object-contain rounded-lg"
                      on:error={handleQrImgError}
                    />
                  {:else}
                    <div class="text-slate-800 text-center p-2 space-y-1">
                      <div class="text-3xl">📷</div>
                      <div class="text-xs font-bold text-slate-900">พื้นที่สำหรับ QR Code ของคุณ</div>
                      <p class="text-[10px] text-slate-600">
                        วางรูปที่ <code class="bg-slate-200 px-1 rounded">public/my-qrcode.png</code>
                      </p>
                    </div>
                  {/if}
                </div>
              {/if}

              <div class="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  on:click={() => (selectedLockerForQr = null)}
                  class="rounded-xl border border-slate-600 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  ← ยกเลิก / เลือกตู้อื่น
                </button>
                <button
                  type="button"
                  disabled={isConfirmingPayment}
                  on:click|stopPropagation={confirmLockerQrPayment}
                  class="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg cursor-pointer"
                >
                  {isUserVip ? `✅ ยืนยันจองฟรี (${LOCKER_DURATION_HOURS} ชม.)` : `✅ ยืนยันชำระเงิน (${LOCKER_DURATION_HOURS} ชม.)`}
                </button>
              </div>
            </div>
          {/if}

        {:else if $activeHotspot === 'courses'}
          <!-- ==================== คอร์สเรียนว่ายน้ำ ==================== -->
          {#if !showCourseQr}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="space-y-3">
                <div>
                  <label for="cr-student" class="block text-xs text-slate-400 mb-1">ชื่อผู้เรียน</label>
                  <input id="cr-student" bind:value={crStudent} class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label for="cr-course" class="block text-xs text-slate-400 mb-1">คอร์สเรียน</label>
                  <select id="cr-course" bind:value={selectedCourseId} class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                    {#each courseOptions as opt}
                      <option value={opt.id}>
                        {opt.name} - {opt.price.toLocaleString()}฿ (รับสูงสุด {opt.maxStudents} คน)
                      </option>
                    {/each}
                  </select>
                </div>

                <div class="rounded-xl border border-slate-700/80 bg-slate-800/60 p-3 text-xs space-y-1">
                  <div class="flex justify-between">
                    <span class="text-slate-400">ผู้สอน:</span>
                    <strong class="text-white">{selectedCourseObj.instructor}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">ตารางเรียน:</span>
                    <strong class="text-cyan-300">{selectedCourseObj.schedule}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">สถานะที่นั่ง:</span>
                    <strong class={remainingCourseSpots > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      คอร์สนี้รับได้อีก {remainingCourseSpots} คน (สมัครแล้ว {enrolledInSelectedCourse}/{selectedCourseObj.maxStudents} คน)
                    </strong>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label for="cr-count" class="text-xs text-slate-400">จำนวนผู้เรียน</label>
                    <span
                      class="rounded-full px-2.5 py-0.5 text-[11px] font-bold {remainingCourseSpots > 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'}"
                    >
                      คอร์สนี้รับได้อีก {remainingCourseSpots} คน
                    </span>
                  </div>
                  <input
                    id="cr-count"
                    type="number"
                    min="1"
                    max={Math.max(1, remainingCourseSpots)}
                    bind:value={crCount}
                    class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={remainingCourseSpots <= 0}
                  on:click={proceedToCourseQr}
                  class="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold py-2.5 text-sm cursor-pointer"
                >
                  {remainingCourseSpots > 0
                    ? `ชำระค่าคอร์สผ่าน QR Code (${(selectedCourseObj.price * crCount).toLocaleString()} ฿)`
                    : 'คอร์สนี้เต็มแล้ว'}
                </button>
              </div>
              <div class="space-y-2">
                <h4 class="text-xs font-bold text-slate-300">รายชื่อผู้สมัครคอร์สล่าสุด (ยกเลิกก่อนเรียนหัก 20%)</h4>
                {#each $courseRegistrations as c}
                  <div class="rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div class="font-bold text-white">
                        <span class="text-cyan-300">[{c.queueCode}]</span> {c.studentName} ({c.memberCount} ท่าน) • {c.courseName}
                      </div>
                      <div class="text-slate-400">
                        {c.instructor} ({c.schedule})
                        {#if c.status === 'cancelled'}
                          <span class="text-rose-400 font-bold ml-1">• ยกเลิกแล้ว (หัก {c.penaltyAmount}฿ / คืน {c.refundAmount}฿)</span>
                        {/if}
                      </div>
                    </div>
                    {#if c.status !== 'cancelled'}
                      <div class="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          on:click={() =>
                            downloadQueueTicketJpg({
                              queueCode: c.queueCode,
                              serviceTitle: `สมัครคอร์สเรียน: ${c.courseName}`,
                              customerName: c.studentName,
                              detailLine1: `ผู้สอน: ${c.instructor} (${c.memberCount} ท่าน)`,
                              detailLine2: `ตารางเรียน: ${c.schedule}`,
                              amountText: `ชำระแล้ว: ${c.totalPrice.toLocaleString()} บาท`,
                              timestamp: new Date().toLocaleDateString('th-TH')
                            })}
                          class="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold cursor-pointer"
                        >
                          คิว JPG
                        </button>
                        <button
                          type="button"
                          on:click={() => cancelCourseRegistration(c)}
                          class="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-bold cursor-pointer"
                        >
                          ยกเลิก (-20%)
                        </button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <div class="text-center space-y-4 max-w-sm mx-auto">
              <div class="text-sm font-bold text-cyan-300">สแกน QR ชำระค่าคอร์สเรียนว่ายน้ำ</div>
              <div class="text-xs text-slate-300">
                คอร์ส: <strong>{selectedCourseObj.name}</strong> ({crCount} ท่าน) • ยอดชำระ{' '}
                <strong class="text-emerald-400">{(selectedCourseObj.price * crCount).toLocaleString()} บาท</strong>
              </div>
              <div class="mx-auto w-48 h-48 rounded-xl bg-white p-3 flex items-center justify-center border-4 border-cyan-400">
                {#if !qrImageLoadError}
                  <img src={PAYMENT_QR_IMAGE_URL} alt="QR" class="w-full h-full object-contain" on:error={handleQrImgError} />
                {:else}
                  <span class="text-xs text-slate-700 font-semibold">วางรูป QR ที่ public/my-qrcode.png</span>
                {/if}
              </div>
              <div class="flex gap-2">
                <button type="button" on:click={() => (showCourseQr = false)} class="flex-1 rounded-lg bg-slate-800 py-2 text-xs cursor-pointer">← แก้ไข</button>
                <button
                  type="button"
                  disabled={isConfirmingPayment}
                  on:click|stopPropagation={confirmCoursePayment}
                  class="flex-1 rounded-lg bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold py-2 text-xs cursor-pointer"
                >
                  ✅ ยืนยันชำระเงิน & ออกบัตรคิว
                </button>
              </div>
            </div>
          {/if}

        {:else if $activeHotspot === 'water'}
          <!-- ==================== เซ็นเซอร์คุณภาพน้ำ IoT ครบ 6 ค่า + Telemetry Ping (Admin Only) ==================== -->
          {#if $currentUser?.role === 'admin'}
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-4 py-2.5 text-xs">
                <span class="text-emerald-300 font-bold">● ระบบเซ็นเซอร์ IoT ทำงานปกติครบทุกจุด (6 Sensors Online)</span>
                <span class="text-cyan-300 font-semibold">
                  Telemetry Ping: <strong>{$poolMetrics.telemetryPingMs} ms</strong> • ผู้ว่ายน้ำปัจจุบัน: <strong>{$poolMetrics.currentSwimmers}/{$poolMetrics.maxCapacity} คน</strong>
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div class="rounded-xl bg-slate-800/70 p-4 border border-cyan-500/30">
                  <div class="text-xs text-slate-400">ค่า pH ของน้ำ</div>
                  <div class="text-2xl font-extrabold text-cyan-400 mt-1">{$poolMetrics.ph}</div>
                  <div class="text-[11px] text-emerald-400 mt-1">● ปกติ (มาตรฐาน 7.2 - 7.6)</div>
                </div>

                <div class="rounded-xl bg-slate-800/70 p-4 border border-emerald-500/30">
                  <div class="text-xs text-slate-400">คลอรีนอิสระ (Chlorine)</div>
                  <div class="text-2xl font-extrabold text-emerald-400 mt-1">{$poolMetrics.chlorine} ppm</div>
                  <div class="text-[11px] text-emerald-400 mt-1">● ฆ่าเชื้อเหมาะสม (1.0 - 3.0)</div>
                </div>

                <div class="rounded-xl bg-slate-800/70 p-4 border border-amber-500/30">
                  <div class="text-xs text-slate-400">อุณหภูมิน้ำ (Temperature)</div>
                  <div class="text-2xl font-extrabold text-amber-400 mt-1">{$poolMetrics.temperature} °C</div>
                  <div class="text-[11px] text-slate-300 mt-1">● เย็นสบายมาตรฐาน (26 - 29°C)</div>
                </div>

                <div class="rounded-xl bg-slate-800/70 p-4 border border-sky-500/30">
                  <div class="text-xs text-slate-400">ค่า ORP (ฆ่าเชื้อออกซิเดชัน)</div>
                  <div class="text-2xl font-extrabold text-sky-400 mt-1">{$poolMetrics.orp} mV</div>
                  <div class="text-[11px] text-emerald-400 mt-1">● ประสิทธิภาพสูง (&gt; 650 mV)</div>
                </div>

                <div class="rounded-xl bg-slate-800/70 p-4 border border-indigo-500/30">
                  <div class="text-xs text-slate-400">ความขุ่นของน้ำ (Turbidity)</div>
                  <div class="text-2xl font-extrabold text-indigo-300 mt-1">{$poolMetrics.turbidity} NTU</div>
                  <div class="text-[11px] text-emerald-400 mt-1">● น้ำใสสะอาด (&lt; 0.5 NTU)</div>
                </div>

                <div class="rounded-xl bg-slate-800/70 p-4 border border-teal-500/30">
                  <div class="text-xs text-slate-400">ค่าสารละลายรวม (TDS)</div>
                  <div class="text-2xl font-extrabold text-teal-300 mt-1">{$poolMetrics.tds} ppm</div>
                  <div class="text-[11px] text-emerald-400 mt-1">● อยู่ในเกณฑ์ปลอดภัย (&lt; 1,000)</div>
                </div>
              </div>
            </div>
          {:else}
            <div class="rounded-xl border border-rose-500/40 bg-rose-950/30 p-6 text-center space-y-2">
              <div class="text-2xl">🔒</div>
              <div class="text-sm font-bold text-rose-300">จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only)</div>
              <p class="text-xs text-slate-300">กรุณาเข้าสู่ระบบด้วยบัญชี Admin เพื่อดูข้อมูลเซ็นเซอร์คุณภาพน้ำและระบบ IoT</p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
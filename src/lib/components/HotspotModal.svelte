<script lang="ts">
  import { onMount } from 'svelte';
  import {
    activeHotspot,
    SWIMSUIT_CATALOG,
    SIZE_PRICE_MODIFIERS,
    PAYMENT_QR_IMAGE_URL,
    swimsuitOrders,
    bookings,
    courseRegistrations,
    lockers,
    poolMetrics,
    addToast
  } from '../stores';
  import type {
    SwimsuitSize,
    SwimsuitOrderType,
    SwimsuitCartItem,
    SwimsuitCatalogItem,
    LockerItem
  } from '../../types';

  type CategoryFilter = 'all' | 'men' | 'women' | 'kids' | 'unisex' | 'gear';

  interface CourseOption {
    id: string;
    name: string;
    instructor: string;
    schedule: string;
    price: number;
    maxStudents: number;
  }

  // --- Swimwear Rental & Purchase State ---
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

  const sizeList: SwimsuitSize[] = ['KIDS', 'XS', 'S', 'M', 'L', 'XL', '2XL'];
  const categoryButtons: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'men', label: 'ชาย' },
    { id: 'women', label: 'หญิง' },
    { id: 'unisex', label: 'Unisex แขนยาว' },
    { id: 'kids', label: 'เด็ก' },
    { id: 'gear', label: 'แว่นตา/หมวก' }
  ];

  // --- Pool Check-in / Booking State ---
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

  // --- Locker Reservation QR State ---
  let selectedLockerForQr: LockerItem | null = null;
  let lockerCustomerName: string = 'สมาชิกสระว่ายน้ำ (Member User)';

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
    }

    const phoneParam = params.get('phone');
    if (phoneParam) {
      customerPhone = phoneParam;
      bkPhone = phoneParam;
      crPhone = phoneParam;
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

  $: currentCatalogItem =
    $SWIMSUIT_CATALOG.find((item) => item.id === selectedSuitId) || $SWIMSUIT_CATALOG[0];

  $: isGearItem = currentCatalogItem?.category === 'gear';

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

  $: reservedInCartForSelection = cartItems
    .filter(
      (ci) =>
        ci.itemId === selectedSuitId &&
        ci.size === selectedSize &&
        ci.orderType === selectedOrderType &&
        ci.cartItemId !== editingCartItemId
    )
    .reduce((sum, ci) => sum + ci.quantity, 0);

  $: activeStockMap = currentCatalogItem ? getActiveStockRecord(currentCatalogItem, selectedOrderType) : null;

  $: remainingStockForSelection = activeStockMap
    ? Math.max(0, (activeStockMap[selectedSize] ?? 0) - reservedInCartForSelection)
    : 0;

  $: if (remainingStockForSelection > 0 && suitQuantity > remainingStockForSelection) {
    suitQuantity = remainingStockForSelection;
  } else if (remainingStockForSelection === 0 && suitQuantity !== 1) {
    suitQuantity = 1;
  }

  $: calculatedUnitPrice = (() => {
    if (!currentCatalogItem) return 0;
    const mod = SIZE_PRICE_MODIFIERS[selectedSize];
    if (selectedOrderType === 'rent') {
      return Math.max(40, currentCatalogItem.rentPrice + mod.extraRent);
    } else {
      return Math.max(150, currentCatalogItem.buyPrice + mod.extraBuy);
    }
  })();

  $: calculatedDeposit =
    selectedOrderType === 'rent' && currentCatalogItem ? currentCatalogItem.depositPrice : 0;

  $: cartGrandTotal = cartItems.reduce((sum, i) => sum + i.totalPrice, 0);

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
    const itemNameSuffix = isGearItem ? `(${activeColorObj.colorName})` : `(${activeColorObj.colorName}, ไซส์ ${selectedSize})`;
    const newItem: SwimsuitCartItem = {
      cartItemId: editingCartItemId || `cart-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      itemId: currentCatalogItem.id,
      swimsuitId: currentCatalogItem.id,
      name: `${currentCatalogItem.name} ${itemNameSuffix}`,
      orderType: selectedOrderType,
      size: selectedSize,
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
    if (cartItems.length === 0) return;

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

    const newOrder = {
      id: `SW-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      phone: customerPhone,
      items: [...cartItems],
      totalAmount: cartGrandTotal,
      status: 'paid' as const,
      createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
    };

    swimsuitOrders.update((orders) => [newOrder, ...orders]);

    const firstItem = cartItems[0];
    window.dispatchEvent(
      new CustomEvent('dp-spawn-swimsuit-npc', {
        detail: {
          color: firstItem.colorNumber,
          label: `${customerName} (${firstItem.orderType === 'rent' ? 'เช่า' : 'ซื้อ'} ×${firstItem.quantity})`
        }
      })
    );

    addToast(
      'ชำระเงิน QR สำเร็จ! 👙',
      `รหัส ${newOrder.id} ยอด ${cartGrandTotal.toLocaleString()}฿ • ทำรายการเรียบร้อยแล้ว`,
      'success'
    );

    cartItems = [];
    showSwimsuitQrPayment = false;
    activeHotspot.set(null);
  }

  function triggerLifeguardSimulation() {
    window.dispatchEvent(new CustomEvent('dp-lifeguard-emergency'));
    addToast(
      '🚨 สัญญาณกู้ภัยทำงาน!',
      'ไลฟ์การ์ดกำลังวิ่งรอบสระเพื่อเข้าช่วยเหลือผู้ประสบภัยทันที',
      'warning'
    );
    activeHotspot.set(null);
  }

  function openKidsPoolBooking() {
    bkZone = 'kids';
    activeHotspot.set('checkin');
  }

  function proceedToBookingQr() {
    if (remainingSelectedPool <= 0) {
      addToast('สระรอบนี้เต็มแล้ว', 'กรุณาเลือกโซนสระอื่นหรือรอรอบถัดไป', 'warning');
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
    if (bkCount < 1) {
      bkCount = 1;
    }
    showBookingQr = true;
  }

  function confirmBookingPayment() {
    const pricePerPerson = bkZone === 'kids' ? 90 : 120;
    const total = pricePerPerson * bkCount;
    bookings.update((all) => [
      {
        id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: bkName,
        phone: bkPhone,
        date: bkDate,
        timeSlot: bkSlot,
        poolZone: bkZone,
        memberCount: bkCount,
        totalPrice: total,
        status: 'paid',
        qrRef: `DP-QR-${Math.floor(1000 + Math.random() * 9000)}`
      },
      ...all
    ]);
    poolMetrics.update((m) => ({
      ...m,
      currentSwimmers:
        bkZone === 'kids'
          ? m.currentSwimmers
          : Math.min(m.maxCapacity, m.currentSwimmers + bkCount),
      kidsPoolSwimmers:
        bkZone === 'kids'
          ? Math.min(KIDS_POOL_MAX_CAPACITY, m.kidsPoolSwimmers + bkCount)
          : m.kidsPoolSwimmers
    }));
    showBookingQr = false;
    addToast('จองรอบสระสำเร็จ!', `เช็คอิน ${bkCount} ท่าน ยอดชำระ ${total} บาท`, 'success');
    activeHotspot.set(null);
  }

  function proceedToCourseQr() {
    if (remainingCourseSpots <= 0) {
      addToast('คอร์สนี้เต็มแล้ว', 'กรุณาเลือกคอร์สเรียนอื่น', 'warning');
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
    if (crCount < 1) {
      crCount = 1;
    }
    showCourseQr = true;
  }

  function confirmCoursePayment() {
    const total = selectedCourseObj.price * crCount;
    courseRegistrations.update((all) => [
      {
        id: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName: crStudent,
        phone: crPhone,
        courseName: selectedCourseObj.name,
        instructor: selectedCourseObj.instructor,
        schedule: selectedCourseObj.schedule,
        memberCount: crCount,
        totalPrice: total,
        status: 'paid'
      },
      ...all
    ]);
    showCourseQr = false;
    addToast(
      'สมัครคอร์สเรียนสำเร็จ!',
      `${crStudent} (${crCount} ท่าน) ชำระ ${total.toLocaleString()}฿ ผ่าน QR แล้ว`,
      'success'
    );
    activeHotspot.set(null);
  }

  function openLockerQrPayment(locker: LockerItem) {
    if (locker.status !== 'available') return;
    selectedLockerForQr = locker;
  }

  function confirmLockerQrPayment() {
    if (!selectedLockerForQr) return;
    const targetLocker = selectedLockerForQr;

    lockers.update((all) =>
      all.map((l) =>
        l.id === targetLocker.id
          ? {
              ...l,
              status: 'reserved',
              reservedBy: lockerCustomerName.trim() || 'สมาชิกสระว่ายน้ำ'
            }
          : l
      )
    );

    addToast(
      'ชำระเงิน & จองล็อกเกอร์สำเร็จ! 🔐',
      `ตู้ ${targetLocker.number} (${targetLocker.zone}) ยอด ${targetLocker.price}฿ เชื่อมสายรัดข้อมือ RFID แล้ว`,
      'success'
    );
    selectedLockerForQr = null;
  }

  function closeModal() {
    activeHotspot.set(null);
    showSwimsuitQrPayment = false;
    showBookingQr = false;
    showCourseQr = false;
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
  /* กำหนดรูปแบบการแสดงผลช่องเลือกวันที่ให้เป็น DD/MM/YYYY บนเบราว์เซอร์รองรับ */
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
                ระบบจองเช่าและซื้อชุดว่ายน้ำ (Swimwear Rental & Pro Shop)
              {:else if $activeHotspot === 'restroom'}
                โซนห้องน้ำ & ห้องเปลี่ยนชุดว่ายน้ำ (SHOWER ROOMS)
              {:else if $activeHotspot === 'checkin'}
                ระบบจองรอบสระว่ายน้ำ & เช็คอิน QR / RFID
              {:else if $activeHotspot === 'locker'}
                ระบบจองตู้ล็อกเกอร์อัจฉริยะ (Smart Lockers)
              {:else if $activeHotspot === 'courses'}
                ระบบสมัครคอร์สเรียนว่ายน้ำ & ตารางครูฝึก
              {:else if $activeHotspot === 'water'}
                เซ็นเซอร์ตรวจวัดคุณภาพน้ำ Real-time IoT
              {:else if $activeHotspot === 'kids-pool'}
                โซนสระเด็ก (Kids Pool & Safety Zone)
              {:else}
                ศูนย์ควบคุมความปลอดภัย Lifeguard
              {/if}
            </h2>
            <p class="text-xs text-cyan-300/80">
              Digital Pools Smart Aquatics Platform • รองรับการชำระเงินผ่าน QR Code
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
      <div class="max-h-[80vh] overflow-y-auto p-6">
        {#if $activeHotspot === 'swimwear'}
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
                  🔄 เช่าอุปกรณ์/ชุด (Rent)
                </button>
                <button
                  type="button"
                  on:click={() => (selectedOrderType = 'buy')}
                  class="rounded-lg py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer {selectedOrderType === 'buy'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'}"
                >
                  🛍️ ซื้ออุปกรณ์/ชุด (Buy)
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
                      📏 {isGearItem ? 'ขนาดมาตรฐาน (Free Size ปรับสายได้)' : `เลือกไซส์ (${selectedOrderType === 'rent' ? 'โหมดเช่า' : 'โหมดซื้อ'})`} — {currentCatalogItem.name}
                    </span>
                    <span class="text-xs text-slate-300">
                      {isGearItem ? 'ฟรีไซส์ (ปรับระดับได้)' : `รอบอก: ${SIZE_PRICE_MODIFIERS[selectedSize].chest}`}
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

                  {#if isGearItem}
                    <div class="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs text-cyan-200 flex items-center justify-between">
                      <span>🥽 แว่นตาและหมวกว่ายน้ำ: <strong>ขนาดมาตรฐาน (Free Size) ปรับสายรัดซิลิโคนได้ตามขนาดศีรษะ</strong></span>
                      <span class="font-bold text-emerald-400">เหลือ {getRemainingSizeStock(currentCatalogItem, 'M', selectedOrderType)} ชิ้น</span>
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
                          จำนวนที่ต้องการ{selectedOrderType === 'rent' ? 'เช่า' : 'ซื้อ'} ({isGearItem ? 'Free Size' : `ไซส์ ${selectedSize}`})
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

                    {#if remainingStockForSelection <= 0}
                      <div class="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 text-center">
                        ❌ สินค้าหมด — ไม่มีสินค้าในสต็อก
                      </div>
                    {/if}

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

                  {#if cartItems.length === 0}
                    <div class="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">
                      ยังไม่มีรายการในตะกร้า<br />
                      เลือกสินค้า สี ไซส์ จำนวน แล้วกด <strong>"+ เพิ่มลงรายการ"</strong> หรือกดปุ่มชำระเงินด้านล่างได้เลย
                    </div>
                  {:else}
                    <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
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
                </div>

                <div class="border-t border-slate-700 pt-3 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-300">ยอดชำระรวมทั้งหมด (รวมมัดจำถ้าเช่า):</span>
                    <span class="text-xl font-extrabold text-emerald-400">
                      {(cartItems.length > 0
                        ? cartGrandTotal
                        : (calculatedUnitPrice + calculatedDeposit) * suitQuantity
                      ).toLocaleString()} ฿
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
                      📱 ชำระเงินผ่าน QR Code ({cartItems.length > 0 ? `${cartItems.length} รายการ` : `${suitQuantity} ชิ้น`})
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
                      on:click={confirmSwimsuitQrPayment}
                      class="rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer"
                    >
                      ✅ ยืนยันชำระเงินสำเร็จ
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
          <!-- ==================== โซนห้องน้ำ & ห้องเปลี่ยนชุด ==================== -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-xl border border-cyan-500/30 bg-slate-800/60 p-5 space-y-2">
              <div class="text-cyan-400 font-bold text-base">🚹 ห้องเปลี่ยนชุด & ห้องน้ำชาย</div>
              <div class="text-3xl font-extrabold text-white">ว่าง 5 / 6 ห้อง</div>
              <p class="text-xs text-slate-300">
                ฝักบัวอาบน้ำอุ่น • ไดร์เป่าผม • ตู้ล็อกเกอร์เชื่อมระบบสายรัดข้อมือ RFID
              </p>
            </div>
            <div class="rounded-xl border border-pink-500/30 bg-slate-800/60 p-5 space-y-2">
              <div class="text-pink-400 font-bold text-base">🚺 ห้องเปลี่ยนชุด & ห้องน้ำหญิง</div>
              <div class="text-3xl font-extrabold text-white">ว่าง 4 / 6 ห้อง</div>
              <p class="text-xs text-slate-300">
                ห้องแต่งตัวส่วนตัว • ไดร์เป่าผม • ตู้ล็อกเกอร์เชื่อมระบบสายรัดข้อมือ RFID
              </p>
            </div>
          </div>

        {:else if $activeHotspot === 'checkin'}
          <!-- ==================== ระบบจองรอบสระ & เช็คอิน (วันที่เรียงเป็น วัน/เดือน/ปี) ==================== -->
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
                <h3 class="font-bold text-white text-sm">รายการจองล่าสุด</h3>
                {#each $bookings as b}
                  <div class="rounded-lg border border-slate-800 bg-slate-800/50 p-3 flex items-center justify-between text-xs">
                    <div>
                      <div class="font-semibold text-white">{b.customerName} ({b.memberCount} ท่าน)</div>
                      <div class="text-slate-400">{b.date} • {b.timeSlot}</div>
                    </div>
                    <span class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">{b.totalPrice}฿</span>
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
                <button type="button" on:click={confirmBookingPayment} class="flex-1 rounded-lg bg-emerald-500 text-slate-950 font-bold py-2 text-xs cursor-pointer">✅ ยืนยันชำระเงิน</button>
              </div>
            </div>
          {/if}

        {:else if $activeHotspot === 'locker'}
          <!-- ==================== ตู้ล็อกเกอร์อัจฉริยะ ==================== -->
          {#if !selectedLockerForQr}
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs">
                <span class="text-slate-300">
                  เลือกตู้ล็อกเกอร์ที่ว่างด้านล่าง เพื่อสแกน <strong>QR Code ชำระเงิน</strong> ก่อนยืนยันการจอง
                </span>
                <div class="flex items-center gap-3">
                  <span class="text-emerald-400 font-semibold">● ว่าง ({$lockers.filter((l) => l.status === 'available').length})</span>
                  <span class="text-rose-400 font-semibold">● จองแล้ว/ไม่ว่าง ({$lockers.filter((l) => l.status !== 'available').length})</span>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {#each $lockers as lk}
                  <button
                    type="button"
                    disabled={lk.status !== 'available'}
                    on:click={() => openLockerQrPayment(lk)}
                    class="rounded-xl p-3 border text-center transition cursor-pointer {lk.status === 'available'
                      ? 'border-slate-700 bg-slate-800/70 hover:border-cyan-400 hover:bg-cyan-950/30 text-white'
                      : 'border-rose-500/30 bg-rose-950/30 text-slate-400 cursor-not-allowed'}"
                  >
                    <div class="text-xs font-bold">{lk.number}</div>
                    <div class="text-[10px] text-slate-400">{lk.zone}</div>
                    <div class="mt-1 text-[11px] font-semibold {lk.status === 'available' ? 'text-emerald-400' : 'text-rose-400'}">
                      {lk.status === 'available' ? `ว่าง (${lk.price}฿)` : lk.status === 'reserved' ? 'จองแล้ว' : 'ไม่ว่าง'}
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            <div class="max-w-md mx-auto space-y-4 text-center py-2">
              <div class="inline-block rounded-full bg-cyan-500/20 px-3.5 py-1 text-xs font-bold text-cyan-300">
                🔐 ชำระเงินผ่าน QR Code เพื่อยืนยันจองตู้ล็อกเกอร์
              </div>

              <div class="rounded-xl border border-slate-700 bg-slate-800/70 p-3.5 text-left space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">หมายเลขตู้ล็อกเกอร์:</span>
                  <strong class="text-cyan-300 text-sm">{selectedLockerForQr.number} ({selectedLockerForQr.zone})</strong>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">ค่าบริการเช่าตู้ล็อกเกอร์:</span>
                  <strong class="text-emerald-400 text-base">{selectedLockerForQr.price} บาท</strong>
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
                  on:click={confirmLockerQrPayment}
                  class="rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg cursor-pointer"
                >
                  ✅ ยืนยันชำระเงิน & จองตู้
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
                <h4 class="text-xs font-bold text-slate-300">รายชื่อผู้สมัครคอร์สล่าสุด</h4>
                {#each $courseRegistrations as c}
                  <div class="rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-xs">
                    <div class="font-bold text-white">{c.studentName} ({c.memberCount} ท่าน) • {c.courseName}</div>
                    <div class="text-slate-400">{c.instructor} ({c.schedule})</div>
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
                <button type="button" on:click={confirmCoursePayment} class="flex-1 rounded-lg bg-emerald-500 text-slate-950 font-bold py-2 text-xs cursor-pointer">✅ ยืนยันชำระเงิน</button>
              </div>
            </div>
          {/if}

        {:else}
          <!-- ==================== เซ็นเซอร์คุณภาพน้ำ IoT ==================== -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="rounded-xl bg-slate-800/70 p-4 border border-cyan-500/30">
                <div class="text-xs text-slate-400">ค่า pH ของน้ำ</div>
                <div class="text-2xl font-extrabold text-cyan-400">{$poolMetrics.ph}</div>
                <div class="text-[11px] text-emerald-400 mt-1">● ปกติ (7.2 - 7.6)</div>
              </div>
              <div class="rounded-xl bg-slate-800/70 p-4 border border-emerald-500/30">
                <div class="text-xs text-slate-400">คลอรีนอิสระ</div>
                <div class="text-2xl font-extrabold text-emerald-400">{$poolMetrics.chlorine} ppm</div>
                <div class="text-[11px] text-emerald-400 mt-1">● ฆ่าเชื้อเหมาะสม</div>
              </div>
              <div class="rounded-xl bg-slate-800/70 p-4 border border-amber-500/30">
                <div class="text-xs text-slate-400">อุณหภูมิน้ำ</div>
                <div class="text-2xl font-extrabold text-amber-400">{$poolMetrics.temperature} °C</div>
                <div class="text-[11px] text-slate-300 mt-1">เย็นสบายมาตรฐาน</div>
              </div>
              <div class="rounded-xl bg-slate-800/70 p-4 border border-slate-700">
                <div class="text-xs text-slate-400">ผู้ว่ายน้ำปัจจุบัน</div>
                <div class="text-2xl font-extrabold text-white">{$poolMetrics.currentSwimmers}/{$poolMetrics.maxCapacity}</div>
                <div class="text-[11px] text-cyan-300 mt-1">ความขุ่น {$poolMetrics.turbidity} NTU</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
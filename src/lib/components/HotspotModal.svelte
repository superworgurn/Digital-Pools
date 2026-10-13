<script lang="ts">
  import {
    activeModal, activeModalTab, prefillCheckin, lockerState, slotsStore, myBookings, checkinEntriesStore,
    waterQuality, sensorsStore, poolCapacity, memberData, billingList,
    guardsList, instructorsList, classesStore, classRegistrationsStore,
    dateOptions, isEmergency, currentUser, isLoginModalOpen, addToast
  } from '../stores';
  import type { ClassRegistration, CheckinEntry, Booking } from '../stores';
  import {
    X, Calendar, QrCode, CreditCard, Lock, Droplets, LifeBuoy,
    GraduationCap, Clock, Check, Star, Crown,
    Receipt, UserCheck, RotateCcw, AlertCircle, Radio, ShieldCheck,
    Users, Plus, Minus, Trash2, Edit, LogOut, Ticket
  } from 'lucide-svelte';

  export let modalId: string;

  let currentTab = 'primary';
  let selectedDate = 1;
  let selectedSlot = 'morning';

  let bookingPartyCount = 1;
  let editingBookingId: string | null = null;
  let editingBookingCount = 1;

  // รับค่าเริ่มต้นจาก URL (ถ้ามีส่งมา)
  let checkinCode = $prefillCheckin.code || '';
  let checkinName = $prefillCheckin.name || '';
  let checkinMemberCount = 1;
  const ticketPrice = 120;
  let editingCheckinId: string | null = null;
  let editingCheckinCount = 1;

  let selectedMemberCounts: Record<number, number> = {};
  let editingRegId: string | null = null;
  let editingCount = 1;

  $: if (modalId) {
    // กำหนดแท็บตามที่ส่งมาจาก URL (ถ้ามี) หรือใช้ค่าเริ่มต้น
    currentTab = $activeModalTab || 'primary';
    editingBookingId = null;
    editingCheckinId = null;
    editingRegId = null;
    bookingPartyCount = 1;
  }

  function closeModal() {
    activeModal.set(null);
    activeModalTab.set(null);
  }

  function requireAuth(actionTitle: string): boolean {
    if (!$currentUser) {
      addToast('ต้องเข้าสู่ระบบก่อน', `กรุณาเข้าสู่ระบบเพื่อ${actionTitle}`, 'warn');
      isLoginModalOpen.set(true);
      return false;
    }
    return true;
  }

  function toggleLocker(index: number) {
    if (!requireAuth('จองตู้ล็อกเกอร์')) return;

    lockerState.update(list => {
      const next = [...list];
      if (next[index] === 'used') {
        addToast('ล็อกเกอร์ไม่ว่าง', `ตู้ ${index + 1} มีผู้ใช้งานอยู่`, 'warn');
        return list;
      }
      next[index] = next[index] === 'free' ? 'mine' : 'free';
      if (next[index] === 'mine') {
        addToast('จองล็อกเกอร์สำเร็จ', `ตู้ ${index + 1} ถูกล็อกไว้ให้คุณ 4 ชั่วโมง`, 'success');
      }
      return next;
    });
  }

  function handleBookSlotWithCount() {
    if (!requireAuth('จองรอบว่ายน้ำ')) return;

    slotsStore.update(slots => {
      const s = slots.find(x => x.id === selectedSlot);
      if (!s) return slots;

      const seatsLeft = s.total - s.booked;
      if (seatsLeft < bookingPartyCount) {
        addToast('ที่นั่งไม่พอ', `รอบนี้คงเหลือเพียง ${seatsLeft} ที่นั่ง`, 'warn');
        return slots;
      }

      s.booked += bookingPartyCount;

      myBookings.update(b => [
        {
          id: 'BK-' + Math.floor(2500 + Math.random() * 800),
          slotId: selectedSlot,
          slotName: s.name,
          dateIdx: selectedDate,
          dateLabel: `${dateOptions[selectedDate].d} ${dateOptions[selectedDate].n}`,
          memberCount: bookingPartyCount,
          pricePerPerson: s.price,
          totalPrice: s.price * bookingPartyCount,
          status: 'unpaid',
          placed: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        },
        ...b
      ]);

      addToast('จองรอบสำเร็จ (รอชำระเงิน)', `${s.name} จำนวน ${bookingPartyCount} ท่าน • แก้ไขหรือยกเลิกได้ก่อนจ่ายเงิน`, 'success');
      bookingPartyCount = 1;
      return slots;
    });
  }

  function startEditBooking(b: Booking) {
    if (!requireAuth('แก้ไขรายการจอง')) return;
    editingBookingId = b.id;
    editingBookingCount = b.memberCount;
  }

  function saveEditBooking(b: Booking) {
    if (!requireAuth('บันทึกการแก้ไข')) return;
    if (editingBookingCount === b.memberCount) {
      editingBookingId = null;
      return;
    }

    const diff = editingBookingCount - b.memberCount;

    slotsStore.update(slots => {
      const s = slots.find(x => x.id === b.slotId);
      if (!s) return slots;

      const seatsLeft = s.total - s.booked;
      if (diff > 0 && seatsLeft < diff) {
        addToast('ที่นั่งไม่พอ', `ที่นั่งว่างคงเหลือเพียง ${seatsLeft} ที่`, 'warn');
        return slots;
      }

      s.booked += diff;

      myBookings.update(list => {
        return list.map(item => {
          if (item.id === b.id) {
            return {
              ...item,
              memberCount: editingBookingCount,
              totalPrice: item.pricePerPerson * editingBookingCount
            };
          }
          return item;
        });
      });

      addToast('แก้ไขจำนวนคนสำเร็จ', `${b.slotName} ปรับเป็น ${editingBookingCount} ท่านเรียบร้อย`, 'success');
      editingBookingId = null;
      return slots;
    });
  }

  function cancelBookingEntry(b: Booking) {
    if (!requireAuth('ยกเลิกรายการจอง')) return;
    slotsStore.update(slots => {
      const s = slots.find(x => x.id === b.slotId);
      if (s) s.booked = Math.max(0, s.booked - b.memberCount);
      return slots;
    });

    myBookings.update(list => list.filter(item => item.id !== b.id));
    addToast('ยกเลิกการจองแล้ว', `คืนที่นั่ง ${b.memberCount} ที่เข้าระบบเรียบร้อย`, 'info');
  }

  function payBookingEntry(b: Booking) {
    if (!requireAuth('ชำระเงิน')) return;
    myBookings.update(list => {
      return list.map(item => {
        if (item.id === b.id) {
          return { ...item, status: 'paid' };
        }
        return item;
      });
    });
    addToast('ชำระเงินสำเร็จ', `ยืนยันการจอง ${b.slotName} (${b.memberCount} ท่าน) เรียบร้อย`, 'success');
  }

  function handleRegisterCheckin() {
    if (!requireAuth('เช็คอินเข้าใช้สระ')) return;
    const code = checkinCode.trim() || 'QR-' + Math.floor(1000 + Math.random() * 8999);
    const name = checkinName.trim() || `ผู้ใช้ทั่วไป (${code})`;
    const count = Math.max(1, checkinMemberCount);
    const total = count * ticketPrice;
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    checkinEntriesStore.update(list => [
      {
        id: 'CK-' + Math.floor(1000 + Math.random() * 9000),
        name: name,
        code: code,
        memberCount: count,
        pricePerPerson: ticketPrice,
        totalPrice: total,
        status: 'unpaid',
        inTime: now,
        outTime: '—'
      },
      ...list
    ]);

    addToast('ลงทะเบียนเช็คอินสำเร็จ', `${name} จำนวน ${count} ท่าน • สามารถแก้ไขหรือยกเลิกได้ก่อนชำระเงิน`, 'success');
    checkinCode = '';
    checkinName = '';
    checkinMemberCount = 1;
  }

  function startEditCheckin(item: CheckinEntry) {
    if (!requireAuth('แก้ไขรายการเช็คอิน')) return;
    editingCheckinId = item.id;
    editingCheckinCount = item.memberCount;
  }

  function saveEditCheckin(item: CheckinEntry) {
    if (!requireAuth('บันทึกการแก้ไข')) return;
    checkinEntriesStore.update(list => {
      return list.map(entry => {
        if (entry.id === item.id) {
          return {
            ...entry,
            memberCount: editingCheckinCount,
            totalPrice: editingCheckinCount * entry.pricePerPerson
          };
        }
        return entry;
      });
    });

    addToast('แก้ไขจำนวนสมาชิกสำเร็จ', `${item.name} ปรับเป็น ${editingCheckinCount} ท่านเรียบร้อย`, 'success');
    editingCheckinId = null;
  }

  function cancelCheckin(item: CheckinEntry) {
    if (!requireAuth('ยกเลิกรายการเช็คอิน')) return;
    checkinEntriesStore.update(list => list.filter(entry => entry.id !== item.id));
    addToast('ยกเลิกรายการเช็คอินแล้ว', `ลบรายการ ${item.name} เรียบร้อย`, 'info');
  }

  function payCheckin(item: CheckinEntry) {
    if (!requireAuth('ชำระเงิน')) return;
    checkinEntriesStore.update(list => {
      return list.map(entry => {
        if (entry.id === item.id) {
          return { ...entry, status: 'paid' };
        }
        return entry;
      });
    });

    poolCapacity.update(cap => ({
      ...cap,
      current: Math.min(cap.max, cap.current + item.memberCount)
    }));

    addToast('ชำระเงินเช็คอินสำเร็จ', `${item.name} (${item.memberCount} ท่าน) เข้าใช้บริการสระว่ายน้ำได้ทันที`, 'success');
  }

  function checkoutEntry(item: CheckinEntry) {
    if (!requireAuth('เช็คเอาท์')) return;
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    checkinEntriesStore.update(list => {
      return list.map(entry => {
        if (entry.id === item.id) {
          return { ...entry, status: 'checked_out', outTime: now };
        }
        return entry;
      });
    });

    poolCapacity.update(cap => ({
      ...cap,
      current: Math.max(0, cap.current - item.memberCount)
    }));

    addToast('เช็คเอาท์สำเร็จ', `${item.name} บันทึกเวลาออก ${now} น. เรียบร้อย`, 'info');
  }

  function triggerEmergencyAction() {
    if (!requireAuth('ส่งสัญญาณแจ้งเหตุฉุกเฉิน')) return;

    isEmergency.update(v => {
      const next = !v;
      if (next) {
        addToast('🚨 สัญญาณฉุกเฉินทำงาน', 'ไลฟ์การ์ดเข้าประจำจุดกู้ภัยริมสระทันที!', 'danger');
      } else {
        addToast('สถานการณ์ปลอดภัย', 'ยกเลิกสัญญาณเตือนภัยฉุกเฉินแล้ว', 'success');
      }
      return next;
    });
  }

  function changeNewRegCount(classIdx: number, delta: number, maxSeats: number) {
    const cur = selectedMemberCounts[classIdx] || 1;
    const next = Math.max(1, Math.min(maxSeats, cur + delta));
    selectedMemberCounts[classIdx] = next;
    selectedMemberCounts = { ...selectedMemberCounts };
  }

  function registerClassWithCount(idx: number) {
    if (!requireAuth('สมัครคอร์สเรียน')) return;

    const count = selectedMemberCounts[idx] || 1;
    classesStore.update(cls => {
      const c = cls[idx];
      if (c.seats >= count) {
        c.seats -= count;

        classRegistrationsStore.update(regs => [
          {
            id: 'CR-' + Math.floor(1000 + Math.random() * 9000),
            classIdx: idx,
            className: c.name,
            coach: c.coach,
            time: c.time,
            pricePerPerson: c.price,
            memberCount: count,
            totalPrice: c.price * count,
            status: 'unpaid',
            registeredAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
          },
          ...regs
        ]);

        selectedMemberCounts[idx] = 1;
        selectedMemberCounts = { ...selectedMemberCounts };
        addToast('สมัครคอร์สสำเร็จ (รอชำระเงิน)', `${c.name} จำนวน ${count} ท่าน • สามารถแก้ไขหรือยกเลิกได้ก่อนชำระเงิน`, 'success');
      } else {
        addToast('ที่นั่งไม่เพียงพอ', `คงเหลือเพียง ${c.seats} ที่นั่ง`, 'warn');
      }
      return cls;
    });
  }

  function startEditReg(reg: ClassRegistration) {
    if (!requireAuth('แก้ไขการสมัครคอร์ส')) return;
    editingRegId = reg.id;
    editingCount = reg.memberCount;
  }

  function saveEditReg(reg: ClassRegistration) {
    if (!requireAuth('บันทึกการแก้ไข')) return;
    if (editingCount === reg.memberCount) {
      editingRegId = null;
      return;
    }

    const diff = editingCount - reg.memberCount;

    classesStore.update(cls => {
      const c = cls[reg.classIdx];
      if (diff > 0 && c.seats < diff) {
        addToast('ไม่สามารถเพิ่มได้', `ที่นั่งว่างในคลาสเหลือเพียง ${c.seats} ที่`, 'warn');
        return cls;
      }

      c.seats -= diff;

      classRegistrationsStore.update(regs => {
        return regs.map(r => {
          if (r.id === reg.id) {
            return {
              ...r,
              memberCount: editingCount,
              totalPrice: r.pricePerPerson * editingCount
            };
          }
          return r;
        });
      });

      addToast('แก้ไขจำนวนสำเร็จ', `${reg.className} ปรับเป็น ${editingCount} ท่านเรียบร้อย`, 'success');
      editingRegId = null;
      return cls;
    });
  }

  function cancelRegistration(reg: ClassRegistration) {
    if (!requireAuth('ยกเลิกการสมัครคอร์ส')) return;
    classesStore.update(cls => {
      const c = cls[reg.classIdx];
      if (c) c.seats += reg.memberCount;
      return cls;
    });

    classRegistrationsStore.update(regs => regs.filter(r => r.id !== reg.id));
    addToast('ยกเลิกการสมัครแล้ว', `คืนที่นั่ง ${reg.memberCount} ที่เข้าระบบเรียบร้อย`, 'info');
  }

  function payRegistration(reg: ClassRegistration) {
    if (!requireAuth('ชำระเงินคอร์สเรียน')) return;
    classRegistrationsStore.update(regs => {
      return regs.map(r => {
        if (r.id === reg.id) {
          return { ...r, status: 'paid' };
        }
        return r;
      });
    });
    addToast('ชำระเงินคอร์สเรียนสำเร็จ', `${reg.className} ยอดรวม ฿${reg.totalPrice.toLocaleString()} บันทึกสิทธิ์ถาวรแล้ว`, 'success');
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 select-none">
  <button class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-default" on:click={closeModal} aria-label="Close"></button>

  <div class="glass relative z-10 w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-cyan-500/20">
    <header class="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700/50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 grid place-items-center text-cyan-300">
          {#if modalId === 'reception'}<QrCode class="w-5 h-5" />
          {:else if modalId === 'locker'}<Lock class="w-5 h-5" />
          {:else if modalId === 'water'}<Droplets class="w-5 h-5" />
          {:else if modalId === 'lifeguard'}<LifeBuoy class="w-5 h-5" />
          {:else if modalId === 'training'}<GraduationCap class="w-5 h-5" />
          {/if}
        </div>
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-100">
            {#if modalId === 'reception'}เคาน์เตอร์ต้อนรับ & จุดเช็คอิน
            {:else if modalId === 'locker'}โซนตู้ล็อกเกอร์
            {:else if modalId === 'water'}คุณภาพน้ำ & เซนเซอร์ IoT
            {:else if modalId === 'lifeguard'}ป้อมไลฟ์การ์ด & ปฏิบัติการฉุกเฉิน
            {:else if modalId === 'training'}โซนฝึกสอน & คลาสเรียนว่ายน้ำ
            {/if}
          </h2>
          <p class="text-xs text-slate-400">ระบบบริหารจัดการจุดให้บริการ</p>
        </div>
      </div>
      <button class="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 grid place-items-center hover:bg-red-500/20 transition cursor-pointer" on:click={closeModal}>
        <X class="w-4 h-4 text-slate-300" />
      </button>
    </header>

    {#if !$currentUser}
      <div class="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2 text-amber-300">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>คุณกำลังดูในโหมดผู้เยี่ยมชม (Guest): สามารถดูข้อมูลได้ แต่ต้องเข้าสู่ระบบก่อนจองหรือสมัคร</span>
        </div>
        <button
          on:click={() => isLoginModalOpen.set(true)}
          class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] shrink-0 transition cursor-pointer"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    {/if}

    {#if modalId === 'reception'}
      <div class="flex gap-2 px-4 pt-3 border-b border-slate-700/40 overflow-x-auto">
        <button class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 {currentTab === 'primary' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200 cursor-pointer'}" on:click={() => currentTab = 'primary'}>
          <Calendar class="w-3.5 h-3.5" /> จองรอบว่ายน้ำ
        </button>
        <button class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 {currentTab === 'checkin' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200 cursor-pointer'}" on:click={() => currentTab = 'checkin'}>
          <QrCode class="w-3.5 h-3.5" /> เช็คอิน-เอาท์ วันนี้
        </button>
        <button class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 {currentTab === 'member' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200 cursor-pointer'}" on:click={() => currentTab = 'member'}>
          <CreditCard class="w-3.5 h-3.5" /> สมาชิก & ชำระเงิน
        </button>
      </div>
    {:else if modalId === 'water'}
      <div class="flex gap-2 px-4 pt-3 border-b border-slate-700/40">
        <button class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 {currentTab === 'primary' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200 cursor-pointer'}" on:click={() => currentTab = 'primary'}>
          <Droplets class="w-3.5 h-3.5" /> คุณภาพน้ำ Real-time
        </button>
        <button class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 {currentTab === 'capacity' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200 cursor-pointer'}" on:click={() => currentTab = 'capacity'}>
          <UserCheck class="w-3.5 h-3.5" /> ความจุคนในสระ
        </button>
      </div>
    {/if}

    <div class="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
      {#if modalId === 'reception'}
        {#if currentTab === 'primary'}
          {@const activeSlot = $slotsStore.find(x => x.id === selectedSlot)}
          {@const seatsLeft = activeSlot ? activeSlot.total - activeSlot.booked : 0}
          {@const currentTotal = activeSlot ? activeSlot.price * bookingPartyCount : 0}

          <div class="space-y-4">
            <div>
              <div class="text-xs text-slate-400 mb-2 font-medium">1. เลือกวันที่ต้องการว่ายน้ำ</div>
              <div class="flex gap-2 overflow-x-auto pb-1">
                {#each dateOptions as d, idx}
                  <button class="shrink-0 w-14 py-2 rounded-xl border text-center transition cursor-pointer {selectedDate === idx ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200' : 'bg-slate-800/50 border-slate-700/60 text-slate-400'}" on:click={() => selectedDate = idx}>
                    <div class="text-[10px]">{d.d}</div>
                    <div class="text-sm font-bold">{d.n}</div>
                  </button>
                {/each}
              </div>
            </div>

            <div>
              <div class="text-xs text-slate-400 mb-2 font-medium">2. เลือกรอบเวลา</div>
              <div class="grid sm:grid-cols-3 gap-3">
                {#each $slotsStore as slot}
                  {@const left = slot.total - slot.booked}
                  <button class="p-3.5 rounded-2xl border text-left transition cursor-pointer {selectedSlot === slot.id ? 'ring-2 ring-cyan-400/70 border-cyan-400/50 bg-slate-800/80' : 'border-slate-700/60 bg-slate-800/40'}" on:click={() => { selectedSlot = slot.id; bookingPartyCount = 1; }}>
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-xs font-bold text-slate-100">{slot.name}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full {left <= 3 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}">ว่าง {left}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 mb-2 flex items-center gap-1"><Clock class="w-3 h-3" /> {slot.time}</div>
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-slate-500 text-[10px]">จองแล้ว {slot.booked}/{slot.total}</span>
                      <span class="font-bold text-cyan-300">฿{slot.price}/คน</span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="text-xs font-semibold text-slate-200">
                  รอบที่เลือก: <span class="text-cyan-300 font-bold">{activeSlot?.name}</span> • วันที่ {dateOptions[selectedDate].d} {dateOptions[selectedDate].n}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  คงเหลือ: <span class="text-emerald-400 font-bold">{seatsLeft}</span> ที่นั่ง • ค่าบริการ ฿{activeSlot?.price}/ท่าน
                </div>
              </div>

              {#if seatsLeft > 0}
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      title="ลดจำนวนคน"
                      class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 disabled:opacity-30 cursor-pointer"
                      disabled={bookingPartyCount <= 1}
                      on:click={() => bookingPartyCount = Math.max(1, bookingPartyCount - 1)}
                    >
                      <Minus class="w-3 h-3" />
                    </button>
                    <span class="w-8 text-center font-mono font-bold text-xs text-cyan-300">{bookingPartyCount} คน</span>
                    <button
                      title="เพิ่มจำนวนคน"
                      class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 disabled:opacity-30 cursor-pointer"
                      disabled={bookingPartyCount >= seatsLeft}
                      on:click={() => bookingPartyCount += 1}
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                  </div>

                  <div class="text-right min-w-[70px]">
                    <div class="text-[9px] text-slate-500">ยอดรวม</div>
                    <div class="text-xs font-bold text-cyan-300 font-mono">฿{currentTotal.toLocaleString()}</div>
                  </div>

                  <button on:click={handleBookSlotWithCount} class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shadow">
                    ยืนยันการจอง
                  </button>
                </div>
              {:else}
                <span class="text-xs font-bold text-red-400">รอบเวลานี้เต็มแล้ว</span>
              {/if}
            </div>

            <div class="pt-2 border-t border-slate-700/60">
              <div class="flex items-center justify-between mb-2.5">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Users class="w-3.5 h-3.5 text-cyan-400" />
                  <span>การจองของฉัน ({$myBookings.length} รายการ)</span>
                </span>
                <span class="text-[10px] text-slate-400">* รายการที่ยังไม่ชำระเงิน สามารถแก้ไขจำนวนคนหรือยกเลิกได้</span>
              </div>

              {#if $myBookings.length === 0}
                <div class="p-6 rounded-2xl border border-dashed border-slate-700/80 text-center text-xs text-slate-500">
                  ยังไม่มีประวัติการจอง — เลือกรอบเวลาและระบุจำนวนสมาชิกด้านบนได้ทันที
                </div>
              {:else}
                <div class="space-y-2.5">
                  {#each $myBookings as b}
                    <div class="p-3.5 rounded-2xl border transition-all {b.status === 'paid' ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-800/60 border-amber-500/40'} flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-slate-100">{b.slotName} • {b.dateLabel}</span>
                          <span class="text-[10px] text-slate-500 font-mono">({b.id})</span>

                          {#if b.status === 'paid'}
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                              <Check class="w-3 h-3" /> ชำระเงินแล้ว (ยืนยันสิทธิ์)
                            </span>
                          {:else}
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                              <AlertCircle class="w-3 h-3" /> รอชำระเงิน (แก้ไขได้)
                            </span>
                          {/if}
                        </div>

                        <div class="text-[10px] text-slate-400 mt-1">
                          จองเมื่อ {b.placed} น. • ค่าบริการ ฿{b.pricePerPerson}/คน
                        </div>

                        <div class="text-xs mt-1.5 flex items-center gap-2">
                          {#if editingBookingId === b.id}
                            <div class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-cyan-400/60">
                              <button
                                class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 disabled:opacity-30 cursor-pointer"
                                disabled={editingBookingCount <= 1}
                                on:click={() => editingBookingCount = Math.max(1, editingBookingCount - 1)}
                              >
                                <Minus class="w-2.5 h-2.5" />
                              </button>
                              <span class="w-7 text-center font-mono font-bold text-xs text-cyan-300">{editingBookingCount}</span>
                              <button
                                class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 cursor-pointer"
                                on:click={() => editingBookingCount += 1}
                              >
                                <Plus class="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <button
                              on:click={() => saveEditBooking(b)}
                              class="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check class="w-3 h-3" /> บันทึก
                            </button>
                            <button
                              on:click={() => editingBookingId = null}
                              class="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          {:else}
                            <span class="text-slate-300">จำนวนที่จอง: <strong class="text-cyan-300 font-bold">{b.memberCount} ท่าน</strong></span>
                            <span class="text-slate-500">•</span>
                            <span class="text-slate-300">ยอดรวม: <strong class="text-emerald-300 font-mono font-bold">฿{b.totalPrice.toLocaleString()}</strong></span>
                          {/if}
                        </div>
                      </div>

                      <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {#if b.status === 'unpaid'}
                          {#if editingBookingId !== b.id}
                            <button
                              title="แก้ไขจำนวนสมาชิก"
                              on:click={() => startEditBooking(b)}
                              class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Edit class="w-3.5 h-3.5" />
                              <span>แก้ไข</span>
                            </button>
                          {/if}

                          <button
                            title="ยกเลิกการจอง"
                            on:click={() => cancelBookingEntry(b)}
                            class="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                            <span>ยกเลิก</span>
                          </button>

                          <button
                            on:click={() => payBookingEntry(b)}
                            class="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                          >
                            <CreditCard class="w-3.5 h-3.5" />
                            <span>ชำระเงิน</span>
                          </button>
                        {:else}
                          <div class="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <Check class="w-3.5 h-3.5" />
                            <span>จองสิทธิ์สำเร็จ</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

        {:else if currentTab === 'checkin'}
          <div class="space-y-5">
            <div class="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-slate-700/70 shadow-lg">
              <div class="text-xs font-bold text-cyan-300 mb-3 flex items-center gap-2">
                <Ticket class="w-4 h-4" />
                <span>ลงทะเบียนเช็คอิน / ซื้อบัตรเข้าใช้สระ (Day Pass Entry)</span>
              </div>

              <div class="grid sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label for="ckName" class="block text-[11px] text-slate-400 mb-1">ชื่อผู้ติดต่อ / รหัสสมาชิก</label>
                  <input
                    id="ckName"
                    bind:value={checkinName}
                    placeholder="เช่น ภาคิน ว. หรือ Walk-in"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label for="ckCode" class="block text-[11px] text-slate-400 mb-1">รหัส QR / RFID บัตร (ไม่บังคับ)</label>
                  <input
                    id="ckCode"
                    bind:value={checkinCode}
                    placeholder="เช่น QR-8921 หรือแตะบัตร"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <span class="block text-[11px] text-slate-400 mb-1">จำนวนสมาชิกที่มาด้วยกัน</span>
                  <div class="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 disabled:opacity-30 cursor-pointer"
                      disabled={checkinMemberCount <= 1}
                      on:click={() => checkinMemberCount = Math.max(1, checkinMemberCount - 1)}
                    >
                      <Minus class="w-3 h-3" />
                    </button>
                    <span class="flex-1 text-center font-mono font-bold text-xs text-cyan-300">{checkinMemberCount} ท่าน</span>
                    <button
                      type="button"
                      class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 cursor-pointer"
                      on:click={() => checkinMemberCount += 1}
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
                <div class="text-xs text-slate-400">
                  ค่าบริการ: ฿{ticketPrice}/คน • ยอดรวม ({checkinMemberCount} ท่าน): <strong class="text-cyan-300 font-mono text-sm">฿{(checkinMemberCount * ticketPrice).toLocaleString()}</strong>
                </div>
                <button
                  on:click={handleRegisterCheckin}
                  class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Check class="w-3.5 h-3.5" />
                  <span>บันทึกการเช็คอิน (รอชำระเงิน)</span>
                </button>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2.5">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Users class="w-4 h-4 text-cyan-400" />
                  <span>รายการเช็คอินวันนี้ ({$checkinEntriesStore.length} รายการ)</span>
                </span>
                <span class="text-[10px] text-slate-400">* รายการที่ยังไม่ชำระเงิน สามารถแก้ไขจำนวนคนหรือยกเลิกได้</span>
              </div>

              <div class="space-y-2.5">
                {#each $checkinEntriesStore as item}
                  <div class="p-3.5 rounded-2xl border transition-all {item.status === 'paid' ? 'bg-emerald-950/20 border-emerald-500/40' : item.status === 'checked_out' ? 'bg-slate-800/30 border-slate-700/40 opacity-70' : 'bg-slate-800/60 border-amber-500/40'} flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-100">{item.name}</span>
                        <span class="text-[10px] text-slate-500 font-mono">({item.code})</span>

                        {#if item.status === 'paid'}
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                            <Check class="w-3 h-3" /> ชำระแล้ว / กำลังใช้งาน
                          </span>
                        {:else if item.status === 'checked_out'}
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            ออกแล้ว ({item.outTime} น.)
                          </span>
                        {:else}
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            <AlertCircle class="w-3 h-3" /> รอชำระเงิน (แก้ไขได้)
                          </span>
                        {/if}
                      </div>

                      <div class="text-[10px] text-slate-400 mt-1">
                        เวลาเข้า: {item.inTime} น. • ออก: {item.outTime}
                      </div>

                      <div class="text-xs mt-1.5 flex items-center gap-2">
                        {#if editingCheckinId === item.id}
                          <div class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-cyan-400/60">
                            <button
                              class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 disabled:opacity-30 cursor-pointer"
                              disabled={editingCheckinCount <= 1}
                              on:click={() => editingCheckinCount = Math.max(1, editingCheckinCount - 1)}
                            >
                              <Minus class="w-2.5 h-2.5" />
                            </button>
                            <span class="w-6 text-center font-mono font-bold text-xs text-cyan-300">{editingCheckinCount}</span>
                            <button
                              class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 cursor-pointer"
                              on:click={() => editingCheckinCount += 1}
                            >
                              <Plus class="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <button
                            on:click={() => saveEditCheckin(item)}
                            class="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check class="w-3 h-3" /> บันทึก
                          </button>
                          <button
                            on:click={() => editingCheckinId = null}
                            class="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        {:else}
                          <span class="text-slate-300">จำนวน: <strong class="text-cyan-300 font-bold">{item.memberCount} ท่าน</strong></span>
                          <span class="text-slate-500">•</span>
                          <span class="text-slate-300">ยอดรวม: <strong class="text-emerald-300 font-mono font-bold">฿{item.totalPrice.toLocaleString()}</strong></span>
                        {/if}
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {#if item.status === 'unpaid'}
                        {#if editingCheckinId !== item.id}
                          <button
                            title="แก้ไขจำนวนสมาชิก"
                            on:click={() => startEditCheckin(item)}
                            class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit class="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                        {/if}

                        <button
                          title="ยกเลิกรายการเช็คอิน"
                          on:click={() => cancelCheckin(item)}
                          class="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                          <span>ยกเลิก</span>
                        </button>

                        <button
                          on:click={() => payCheckin(item)}
                          class="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                        >
                          <CreditCard class="w-3.5 h-3.5" />
                          <span>ชำระเงิน</span>
                        </button>
                      {:else if item.status === 'paid'}
                        <button
                          on:click={() => checkoutEntry(item)}
                          class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <LogOut class="w-3.5 h-3.5" />
                          <span>เช็คเอาท์</span>
                        </button>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>

        {:else if currentTab === 'member'}
          <div class="grid lg:grid-cols-2 gap-4">
            <div class="space-y-3">
              <div class="rounded-2xl p-5 bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 border border-cyan-400/30 shadow-xl">
                <div class="flex justify-between items-start">
                  <div><div class="text-[10px] tracking-widest text-cyan-300 font-bold">DIGITAL POOLS</div><div class="text-[9px] text-slate-400">MEMBERSHIP CARD</div></div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1"><Crown class="w-3 h-3" /> {memberData.tier}</span>
                </div>
                <div class="my-5"><div class="text-lg font-bold text-slate-100">{memberData.name}</div><div class="text-xs text-slate-400">{memberData.id}</div></div>
                <div class="flex justify-between text-[10px] text-slate-400"><div>หมดอายุ: {memberData.expiry}</div><div>สะสม: {memberData.visits} ครั้ง</div></div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <div class="flex justify-between text-xs font-bold mb-2"><span>แต้มสะสม CRM</span><span class="text-violet-300">{memberData.points} pts</span></div>
                <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden"><div class="bg-violet-400 h-full" style="width:{(memberData.points/memberData.nextTier)*100}%"></div></div>
                <div class="text-[10px] text-slate-400 mt-2">อีก {memberData.nextTier - memberData.points} แต้มเพื่อเลื่อนระดับเป็น Platinum</div>
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div class="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2"><Receipt class="w-4 h-4 text-cyan-400" /> สรุปค่าใช้จ่ายรอบนี้</div>
                <div class="space-y-2 text-xs">
                  {#each billingList as b}
                    <div class="flex justify-between"><span class="text-slate-400">{b.item}</span><span class="font-bold {b.amount < 0 ? 'text-emerald-400' : 'text-slate-200'}">฿{b.amount}</span></div>
                  {/each}
                </div>
              </div>
              <div class="border-t border-slate-700/60 pt-3 mt-4">
                <div class="flex justify-between items-center mb-3"><span class="text-xs text-slate-400">ยอดสุทธิ</span><span class="text-xl font-extrabold text-cyan-300">฿1,980</span></div>
                <button on:click={() => { if (requireAuth('ชำระเงินสมาชิก')) addToast('ชำระเงินสำเร็จ', 'ตัดบัตรเครดิตเรียบร้อย', 'success'); }} class="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer">ชำระเงินทันที</button>
              </div>
            </div>
          </div>
        {/if}

      <!-- 2. LOCKER CONTENT -->
      {:else if modalId === 'locker'}
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <div><div class="text-[10px] text-slate-400">ตู้ว่าง</div><div class="text-xl font-bold text-emerald-300">{$lockerState.filter(s => s === 'free').length}</div></div>
            </div>
            <div class="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <div><div class="text-[10px] text-slate-400">มีผู้ใช้งาน</div><div class="text-xl font-bold text-red-300">{$lockerState.filter(s => s === 'used').length}</div></div>
            </div>
            <div class="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3">
              <div><div class="text-[10px] text-slate-400">ตู้ของคุณ</div><div class="text-xl font-bold text-cyan-300">{$lockerState.filter(s => s === 'mine').length}</div></div>
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <div class="flex justify-between items-center mb-3">
              <span class="text-xs font-bold text-slate-200">ผังล็อกเกอร์ 1 – 30</span>
              <button on:click={() => { if (requireAuth('คืนตู้ล็อกเกอร์')) lockerState.update(l => l.map(s => s === 'mine' ? 'free' : s)); }} class="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"><RotateCcw class="w-3 h-3" /> คืนตู้ทั้งหมด</button>
            </div>
            <div class="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {#each $lockerState as state, idx}
                <button on:click={() => toggleLocker(idx)} class="p-2.5 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer {state === 'free' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:scale-105' : state === 'used' ? 'bg-red-500/10 border-red-500/30 text-red-300 cursor-not-allowed' : 'bg-cyan-500/25 border-cyan-400 text-cyan-200'}">
                  <span>{String(idx + 1).padStart(2, '0')}</span>
                  <span class="text-[9px] font-normal opacity-80">{state === 'free' ? 'ว่าง' : state === 'used' ? 'ไม่ว่าง' : 'ของคุณ'}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>

      <!-- 3. WATER CONTENT -->
      {:else if modalId === 'water'}
        {#if currentTab === 'primary'}
          <div class="space-y-4">
            <div class="grid sm:grid-cols-3 gap-3">
              <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-center">
                <div class="text-[11px] text-slate-400">ค่า pH น้ำ</div>
                <div class="text-3xl font-extrabold text-cyan-300 mt-1">{$waterQuality.ph}</div>
                <div class="text-[10px] text-emerald-400 mt-1">✓ มาตรฐาน 7.2 – 7.8</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-center">
                <div class="text-[11px] text-slate-400">คลอรีนอิสระ</div>
                <div class="text-3xl font-extrabold text-emerald-300 mt-1">{$waterQuality.chlorine} ppm</div>
                <div class="text-[10px] text-emerald-400 mt-1">✓ มาตรฐาน 1.0 – 3.0</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-center">
                <div class="text-[11px] text-slate-400">อุณหภูมิน้ำ</div>
                <div class="text-3xl font-extrabold text-amber-300 mt-1">{$waterQuality.temp} °C</div>
                <div class="text-[10px] text-slate-400 mt-1">แนะนำ 26 – 29 °C</div>
              </div>
            </div>

            <div class="grid sm:grid-cols-3 gap-3">
              <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60"><div class="text-[10px] text-slate-400">ORP</div><div class="text-base font-bold text-cyan-300">{$waterQuality.orp} mV</div></div>
              <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60"><div class="text-[10px] text-slate-400">ความขุ่น (Turbidity)</div><div class="text-base font-bold text-amber-300">{$waterQuality.turbidity} NTU</div></div>
              <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60"><div class="text-[10px] text-slate-400">TDS</div><div class="text-base font-bold text-emerald-300">{$waterQuality.tds} ppm</div></div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 shadow-lg">
              <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
                <div class="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Radio class="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>สถานะเซนเซอร์ IoT ประจำจุด</span>
                </div>
                <span class="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 live-dot"></span>
                  ระบบ Real-time Telemetry
                </span>
              </div>

              <div class="space-y-1.5">
                {#each $sensorsStore as s}
                  <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800/80 transition-colors text-xs">
                    <span class="w-2 h-2 rounded-full shrink-0 {s.status === 'online' ? 'bg-emerald-400 live-dot shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}"></span>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-slate-200 truncate">{s.name}</div>
                      <div class="text-[10px] text-slate-500">
                        {s.status === 'online' ? 'เชื่อมต่อปกติ · ตรวจวัดทุก 60 วินาที' : 'การตอบสนองช้ากว่าเกณฑ์มาตรฐาน'}
                      </div>
                    </div>
                    <div class="text-right shrink-0 px-2 sm:px-4">
                      <span class="font-mono text-xs sm:text-sm font-bold text-cyan-300 tracking-wide">{s.value}</span>
                    </div>
                    <div class="shrink-0 text-right">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border {s.status === 'online' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' : 'bg-amber-500/15 text-amber-300 border-amber-400/30'}">
                        <span class="w-1.5 h-1.5 rounded-full {s.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                        {s.ping}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {:else if currentTab === 'capacity'}
          <div class="space-y-4">
            <div class="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
              <div class="text-xs text-slate-400 mb-1">จำนวนผู้ใช้งานสระขณะนี้</div>
              <div class="text-5xl font-extrabold text-cyan-300">{$poolCapacity.current} <span class="text-xl text-slate-500">/ {$poolCapacity.max}</span></div>
              <div class="w-full bg-slate-700 h-2.5 rounded-full mt-4 overflow-hidden"><div class="bg-gradient-to-r from-cyan-400 to-sky-500 h-full" style="width:{($poolCapacity.current/$poolCapacity.max)*100}%"></div></div>
            </div>
          </div>
        {/if}

      <!-- 4. LIFEGUARD CONTENT -->
      {:else if modalId === 'lifeguard'}
        <div class="space-y-4">
          <div class="grid sm:grid-cols-3 gap-3">
            {#each guardsList as g}
              <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-cyan-500/20 grid place-items-center text-cyan-300 font-bold text-xs">{g.name.slice(0, 2)}</div>
                  <div><div class="text-xs font-bold text-slate-100">{g.name}</div><div class="text-[10px] text-slate-400">{g.role}</div></div>
                </div>
                <div class="text-[10px] text-slate-400 space-y-1 mb-3">
                  <div>กะเวลา: {g.shift}</div>
                  <div>พื้นที่: {g.zone}</div>
                  <div>ใบรับรอง: {g.cert}</div>
                  <div>โทร: {g.phone}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] {g.status === 'on-duty' ? 'bg-emerald-500/20 text-emerald-300' : g.status === 'standby' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-600/20 text-slate-400'}">{g.status === 'on-duty' ? 'ประจำการ' : g.status === 'standby' ? 'สแตนด์บาย' : 'หมดกะ'}</span>
              </div>
            {/each}
          </div>

          <button
            on:click={triggerEmergencyAction}
            class="w-full py-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer {$isEmergency ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-600/30' : 'bg-red-500/20 border-red-500 hover:bg-red-500/30 text-red-300 shadow-red-500/20 animate-pulse'}"
          >
            {#if $isEmergency}
              <ShieldCheck class="w-5 h-5" />
              <span>สถานการณ์ปลอดภัย / ปิดสัญญาณฉุกเฉิน (Clear Emergency)</span>
            {:else}
              <AlertCircle class="w-5 h-5 text-red-400" />
              <span>กดแจ้งเหตุฉุกเฉิน / ไลฟ์การ์ดเข้ากู้ภัย (Trigger Emergency Action)</span>
            {/if}
          </button>
        </div>

      <!-- 5. TRAINING CONTENT -->
      {:else if modalId === 'training'}
        <div class="space-y-5">
          <div>
            <div class="text-xs text-slate-400 mb-2 font-medium">ครูผู้สอนประจำสระ</div>
            <div class="grid sm:grid-cols-3 gap-3">
              {#each instructorsList as ins}
                <div class="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                  <div class="text-xs font-bold text-slate-100">{ins.name}</div>
                  <div class="text-[10px] text-slate-400">{ins.specialty}</div>
                  <div class="flex justify-between items-center text-[10px] mt-2">
                    <span class="text-amber-300 flex items-center gap-1"><Star class="w-3 h-3 fill-amber-300" /> {ins.rating}</span>
                    <span class="text-slate-500">{ins.exp}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div>
            <div class="text-xs text-slate-400 mb-2 font-medium">ตารางคอร์สเรียนว่ายน้ำ & สมัครเรียน</div>
            <div class="space-y-2.5">
              {#each $classesStore as c, idx}
                {@const userCount = selectedMemberCounts[idx] || 1}
                {@const totalPrice = c.price * userCount}
                <div class="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-cyan-500/40">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-100">{c.name}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">{c.level}</span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">{c.time} • {c.coach}</div>
                    <div class="text-[10px] text-slate-500 mt-1">
                      คงเหลือ: <span class="font-bold {c.seats === 0 ? 'text-red-400' : 'text-emerald-400'}">{c.seats}</span> / {c.total} ที่นั่ง
                    </div>
                  </div>

                  {#if c.seats > 0}
                    <div class="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div class="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
                        <button
                          title="ลดจำนวนคน"
                          class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 disabled:opacity-30 cursor-pointer"
                          disabled={userCount <= 1}
                          on:click={() => changeNewRegCount(idx, -1, c.seats)}
                        >
                          <Minus class="w-3 h-3" />
                        </button>
                        <span class="w-7 text-center font-mono font-bold text-xs text-cyan-300">{userCount}</span>
                        <button
                          title="เพิ่มจำนวนคน"
                          class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 cursor-pointer"
                          disabled={userCount >= c.seats}
                          on:click={() => changeNewRegCount(idx, 1, c.seats)}
                        >
                          <Plus class="w-3 h-3" />
                        </button>
                      </div>

                      <div class="text-right min-w-[75px]">
                        <div class="text-[9px] text-slate-500">รวม ({userCount} คน)</div>
                        <div class="text-xs font-bold text-cyan-300 font-mono">฿{totalPrice.toLocaleString()}</div>
                      </div>

                      <button
                        on:click={() => registerClassWithCount(idx)}
                        class="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition active:scale-95 shadow cursor-pointer"
                      >
                        สมัครเรียน
                      </button>
                    </div>
                  {:else}
                    <div class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700 text-center">
                      ที่นั่งเต็มแล้ว
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <div class="pt-2 border-t border-slate-700/60">
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-cyan-400" />
                <span>คอร์สที่ฉันลงทะเบียนไว้ ({$classRegistrationsStore.length})</span>
              </span>
              <span class="text-[10px] text-slate-400">* สามารถแก้ไขจำนวนหรือยกเลิกได้หากยังไม่กดชำระเงิน</span>
            </div>

            {#if $classRegistrationsStore.length === 0}
              <div class="p-6 rounded-2xl border border-dashed border-slate-700/80 text-center text-xs text-slate-500">
                ยังไม่มีรายการลงทะเบียนคอร์สเรียน — เลือกคอร์สและระบุจำนวนสมาชิกด้านบนได้ทันที
              </div>
            {:else}
              <div class="space-y-2.5">
                {#each $classRegistrationsStore as reg}
                  <div class="p-3.5 rounded-2xl border transition-all {reg.status === 'paid' ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-800/60 border-amber-500/30'} flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-100">{reg.className}</span>
                        {#if reg.status === 'paid'}
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                            <Check class="w-3 h-3" /> ชำระเงินแล้ว
                          </span>
                        {:else}
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            <AlertCircle class="w-3 h-3" /> รอชำระเงิน (แก้ไขได้)
                          </span>
                        {/if}
                      </div>

                      <div class="text-[10px] text-slate-400 mt-1">
                        ผู้สอน: {reg.coach} • เวลา: {reg.time} • ลงทะเบียนเมื่อ {reg.registeredAt}
                      </div>

                      <div class="text-xs mt-1.5 flex items-center gap-2">
                        {#if editingRegId === reg.id}
                          <div class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-cyan-400/50">
                            <button
                              class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 disabled:opacity-30 cursor-pointer"
                              disabled={editingCount <= 1}
                              on:click={() => editingCount = Math.max(1, editingCount - 1)}
                            >
                              <Minus class="w-2.5 h-2.5" />
                            </button>
                            <span class="w-6 text-center font-mono font-bold text-xs text-cyan-300">{editingCount}</span>
                            <button
                              class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 grid place-items-center text-slate-300 cursor-pointer"
                              disabled={editingCount >= reg.memberCount + ($classesStore[reg.classIdx]?.seats || 0)}
                              on:click={() => editingCount += 1}
                            >
                              <Plus class="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <button
                            on:click={() => saveEditReg(reg)}
                            class="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check class="w-3 h-3" /> บันทึก
                          </button>
                          <button
                            on:click={() => editingRegId = null}
                            class="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        {:else}
                          <span class="text-slate-300">จำนวน: <strong class="text-cyan-300">{reg.memberCount} ท่าน</strong> (฿{reg.pricePerPerson.toLocaleString()} / คน)</span>
                          <span class="text-slate-500">•</span>
                          <span class="text-slate-300">ยอดรวม: <strong class="text-emerald-300 font-mono font-bold">฿{reg.totalPrice.toLocaleString()}</strong></span>
                        {/if}
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {#if reg.status === 'unpaid'}
                        {#if editingRegId !== reg.id}
                          <button
                            title="แก้ไขจำนวนสมาชิก"
                            on:click={() => startEditReg(reg)}
                            class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit class="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                        {/if}

                        <button
                          title="ยกเลิกการสมัครคอร์ส"
                          on:click={() => cancelRegistration(reg)}
                          class="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                          <span>ยกเลิก</span>
                        </button>

                        <button
                          on:click={() => payRegistration(reg)}
                          class="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                        >
                          <CreditCard class="w-3.5 h-3.5" />
                          <span>ชำระเงิน</span>
                        </button>
                      {:else}
                        <div class="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check class="w-3.5 h-3.5" />
                          <span>ยืนยันสิทธิ์เรียบร้อย</span>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

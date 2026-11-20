<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from '../lib/components/Navbar.svelte';
  import Scene3D from '../lib/components/Scene3D.svelte';
  import HotspotModal from '../lib/components/HotspotModal.svelte';
  import ManagerDrawer from '../lib/components/ManagerDrawer.svelte';
  import LoginPage from '../lib/components/LoginPage.svelte';
  import ToastContainer from '../lib/components/ToastContainer.svelte';
  import {
    currentUser,
    isLoginModalOpen,
    activeHotspot,
    isManagerDrawerOpen,
    isExplorationMode,
    addToast
  } from '../lib/stores';
  import type { HotspotId } from '../types';

  let mounted = false;

  // ซิงค์สถานะหน้าต่างและโหมดต่างๆ ลงบน URL อัตโนมัติ (Two-way URL Parameter Sync)
  $: if (mounted && typeof window !== 'undefined') {
    const url = new URL(window.location.href);

    if ($activeHotspot && $activeHotspot !== 'seven-eleven') {
      url.searchParams.set('modal', $activeHotspot);
    } else {
      url.searchParams.delete('modal');
      url.searchParams.delete('open');
    }

    if ($isExplorationMode) {
      url.searchParams.set('player', 'true');
    } else {
      url.searchParams.delete('player');
      url.searchParams.delete('mode');
    }

    if ($isManagerDrawerOpen) {
      url.searchParams.set('dashboard', 'true');
    } else {
      url.searchParams.delete('dashboard');
    }

    if ($isLoginModalOpen) {
      url.searchParams.set('login', 'true');
    } else {
      url.searchParams.delete('login');
    }

    window.history.replaceState({}, '', url.toString());
  }

  function applyUrlParameters() {
    const params = new URLSearchParams(window.location.search);

    // 1. กำหนดสิทธิ์ผู้ใช้งาน (?role=admin | ?role=user | ?role=line | ?role=guest)
    const roleParam = params.get('role')?.toLowerCase();
    const customName = params.get('name')?.trim();

    if (roleParam === 'admin') {
      currentUser.set({
        username: 'admin',
        name: customName || 'ผู้จัดการฝ่ายปฏิบัติการ (Admin)',
        displayName: customName || 'ผู้จัดการฝ่ายปฏิบัติการ (Admin)',
        role: 'admin'
      });
    } else if (roleParam === 'line') {
      const lineName = customName || 'Worgurn (LINE Member)';
      currentUser.set({
        username: 'line_user',
        name: lineName,
        displayName: lineName,
        role: 'user'
      });
      addToast('เข้าสู่ระบบผ่าน LINE (URL)', `ยินดีต้อนรับ ${lineName}`, 'success');
    } else if (roleParam === 'guest') {
      currentUser.set(null);
    } else {
      currentUser.set({
        username: 'user',
        name: customName || 'สมาชิกสระว่ายน้ำ (Member User)',
        displayName: customName || 'สมาชิกสระว่ายน้ำ (Member User)',
        role: 'user'
      });
    }

    // 2. เปิดหน้าต่าง Login (?login=true)
    if (params.get('login') === 'true') {
      isLoginModalOpen.set(true);
    }

    // 3. เปิดหน้าต่างบริการ / จุดต่างๆ (?modal=swimwear | checkin | locker | courses | restroom | water | lifeguard | kids-pool | vip)
    const modalParam = (params.get('modal') || params.get('open'))?.toLowerCase();
    if (modalParam) {
      const validHotspots: HotspotId[] = [
        'checkin',
        'locker',
        'courses',
        'swimwear',
        'restroom',
        'water',
        'lifeguard',
        'kids-pool',
        'vip'
      ];
      if (validHotspots.includes(modalParam as HotspotId)) {
        if (modalParam === 'water' && roleParam !== 'admin') {
          addToast('จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ', 'กรุณาใช้ ?role=admin เพื่อดูข้อมูล IoT', 'warn');
        } else {
          activeHotspot.set(modalParam as HotspotId);
        }
      } else if (modalParam === 'reception') {
        activeHotspot.set('checkin');
      }
    }

    // 4. เปลี่ยนมุมกล้องเริ่มต้น (?view=overview | entrance | pool | swimwear | locker | restroom | kids | top)
    const viewParam = params.get('view')?.toLowerCase();
    if (viewParam) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dp-camera-preset', { detail: viewParam }));
      }, 300);
    }

    // 5. เปิดโหมดเดินสำรวจ (?player=true หรือ ?mode=player)
    const isPlayerParam =
      params.get('player') === 'true' || params.get('mode')?.toLowerCase() === 'player';
    if (isPlayerParam) {
      isExplorationMode.set(true);
    }

    // 6. เปิดแดชบอร์ดผู้จัดการ (?dashboard=true)
    if (params.get('dashboard') === 'true') {
      if (roleParam === 'admin') {
        isManagerDrawerOpen.set(true);
      } else {
        addToast('จำกัดสิทธิ์เฉพาะ Admin', 'เพิ่ม ?role=admin&dashboard=true เพื่อเปิดแดชบอร์ด', 'warn');
      }
    }

    // 7. จำลองเหตุฉุกเฉินไลฟ์การ์ดวิ่งรอบสระ (?emergency=true)
    if (params.get('emergency') === 'true') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dp-lifeguard-emergency'));
      }, 500);
    }
  }

  onMount(() => {
    applyUrlParameters();
    mounted = true;

    const handlePopState = () => applyUrlParameters();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });
</script>

<main class="relative w-screen h-screen overflow-hidden bg-sky-300 text-slate-100">
  <Navbar />
  <Scene3D />
  <HotspotModal />
  <ManagerDrawer />

  {#if $isLoginModalOpen}
    <LoginPage />
  {/if}

  <ToastContainer />
</main>
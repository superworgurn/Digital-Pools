<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from './lib/components/Navbar.svelte';
  import Scene3D from './lib/components/Scene3D.svelte';
  import HotspotModal from './lib/components/HotspotModal.svelte';
  import ManagerDrawer from './lib/components/ManagerDrawer.svelte';
  import LoginPage from './lib/components/LoginPage.svelte';
  import ToastContainer from './lib/components/ToastContainer.svelte';
  import {
    currentUser,
    isLoginModalOpen,
    activeHotspot,
    isManagerDrawerOpen,
    isExplorationMode
  } from './lib/stores';
  import type { HotspotId } from './types';

  let mounted = false;

  // ซิงค์พารามิเตอร์ลงบน URL อัตโนมัติเมื่อมีการเปิด/ปิดหน้าต่าง หรือเปลี่ยนโหมดเดินสำรวจ
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
    }

    window.history.replaceState({}, '', url.toString());
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);

    // 1. สิทธิ์การใช้งาน (?role=admin หรือ ?role=user)
    const roleParam = params.get('role');
    if (roleParam === 'admin') {
      currentUser.set({
        username: 'admin',
        name: 'ผู้จัดการสระ (Admin)',
        displayName: 'ผู้จัดการสระ (Admin)',
        role: 'admin'
      });
    } else {
      currentUser.set({
        username: 'user',
        name: 'สมาชิกสระว่ายน้ำ (Member User)',
        displayName: 'สมาชิกสระว่ายน้ำ (Member User)',
        role: 'user'
      });
    }

    // 2. เปิดหน้า Login (?login=true)
    if (params.get('login') === 'true') {
      isLoginModalOpen.set(true);
    }

    // 3. สัญญาณฉุกเฉิน (?emergency=true)
    if (params.get('emergency') === 'true') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dp-lifeguard-emergency'));
      }, 500);
    }

    // 4. เปิดหน้าต่างบริการ (?modal=swimwear | checkin | locker | courses | restroom | water | lifeguard | kids-pool)
    const modalParam = params.get('modal') || params.get('open');
    if (modalParam) {
      const validHotspots: HotspotId[] = [
        'checkin',
        'locker',
        'courses',
        'swimwear',
        'restroom',
        'water',
        'lifeguard',
        'kids-pool'
      ];
      if (validHotspots.includes(modalParam as HotspotId)) {
        activeHotspot.set(modalParam as HotspotId);
      } else if (modalParam === 'reception') {
        activeHotspot.set('checkin');
      }
    }

    // 5. โหมดเดินสำรวจ (?player=true)
    const isPlayerParam = params.get('player') === 'true' || params.get('mode') === 'player';
    if (isPlayerParam) {
      isExplorationMode.set(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dp-toggle-exploration', { detail: true }));
      }, 450);
    }

    // 6. แดชบอร์ดผู้จัดการ (?dashboard=true)
    if (params.get('dashboard') === 'true') {
      isManagerDrawerOpen.set(true);
    }

    mounted = true;
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
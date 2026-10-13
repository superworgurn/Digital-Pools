<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from './lib/components/Navbar.svelte';
  import Scene3D from './lib/components/Scene3D.svelte';
  import ToastContainer from './lib/components/ToastContainer.svelte';
  import LoginPage from './lib/components/LoginPage.svelte';
  import HotspotModal from './lib/components/HotspotModal.svelte';
  import ManagerDrawer from './lib/components/ManagerDrawer.svelte';
  import {
    activeModal, activeModalTab, prefillCheckin, isDrawerOpen,
    currentUser, isLoginModalOpen, isEmergency, addToast
  } from './lib/stores';
  import { BarChart3 } from 'lucide-svelte';

  let sceneComponent: Scene3D;

  function handleViewChange(e: CustomEvent<string>) {
    sceneComponent?.changeView(e.detail);
  }

  // 🔗 ตรวจจับ URL Parameters เมื่อเปิดลิงก์มาจาก LINE OA
  onMount(() => {
    const params = new URLSearchParams(window.location.search);

    // 1. ตรวจจับการล็อกอินด่วนด้วย role เช่น ?role=admin หรือ ?role=user
    const roleParam = params.get('role');
    if (roleParam === 'admin') {
      currentUser.set({ username: 'admin', name: 'ผู้จัดการฝ่ายปฏิบัติการ (Admin)', role: 'admin' });
    } else if (roleParam === 'user') {
      currentUser.set({ username: 'user', name: 'สมาชิกสระว่ายน้ำ (Member User)', role: 'user' });
    }

    // 2. ตรวจจับการเปิดหน้า Login เช่น ?login=true
    if (params.get('login') === 'true') {
      isLoginModalOpen.set(true);
    }

    // 3. ตรวจจับการเปิดสัญญาณฉุกเฉิน เช่น ?emergency=true
    if (params.get('emergency') === 'true') {
      isEmergency.set(true);
    }

    // 4. ตรวจจับการเปิด Modal และ Tab ย่อย เช่น ?modal=reception&tab=checkin
    const modalParam = params.get('modal') || params.get('open');
    const tabParam = params.get('tab');
    if (modalParam) {
      activeModal.set(modalParam);
      if (tabParam) activeModalTab.set(tabParam);
    }

    // 5. เติมข้อมูลรหัส/ชื่ออัตโนมัติจาก LINE OA เช่น ?code=LINE1234&name=Somchai
    const codeParam = params.get('code');
    const nameParam = params.get('name');
    if (codeParam || nameParam) {
      prefillCheckin.set({ code: codeParam || '', name: nameParam || '' });
    }

    // 6. ตรวจจับการปรับมุมมองกล้องหรือเปิดโหมดเดินสำรวจ
    const viewParam = params.get('view');
    const isPlayerParam = params.get('player') === 'true' || params.get('mode') === 'player';

    // หน่วงเวลาเล็กน้อยเพื่อให้ 3D Engine โหลดฐานข้อมูลครบก่อนสั่งงาน
    setTimeout(() => {
      if (viewParam) {
        sceneComponent?.changeView(viewParam);
      }
      if (isPlayerParam) {
        sceneComponent?.setPlayerMode(true);
      }
    }, 450);
  });
</script>

<main class="relative w-screen h-screen overflow-hidden bg-[#0b1220]">
  <Scene3D bind:this={sceneComponent} />
  <Navbar on:changeView={handleViewChange} />

  {#if $currentUser?.role === 'admin'}
    <button
      class="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-900 font-bold text-xs shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
      on:click={() => isDrawerOpen.set(true)}
    >
      <BarChart3 class="w-4 h-4" />
      <span class="hidden sm:inline">Manager Dashboard</span>
    </button>
  {/if}

  {#if $activeModal}
    <HotspotModal modalId={$activeModal} />
  {/if}

  {#if $isDrawerOpen && $currentUser?.role === 'admin'}
    <ManagerDrawer />
  {/if}

  {#if $isLoginModalOpen}
    <LoginPage />
  {/if}

  <ToastContainer />
</main>

<script lang="ts">
  import { poolCapacity, activeView, currentUser, isPlayerMode, isLoginModalOpen, addToast } from '../stores';
  import { Waves, Droplets, Users, LayoutDashboard, Lock, ScanLine, Menu, LogOut, LogIn } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ changeView: string }>();

  let isMobileOpen = false;

  const views = [
    { id: 'overview', label: 'มุมสูง', icon: LayoutDashboard },
    { id: 'pool', label: 'หน้าสระ', icon: Waves },
    { id: 'locker', label: 'ล็อกเกอร์', icon: Lock },
    { id: 'counter', label: 'เคาน์เตอร์', icon: ScanLine }
  ];

  function setView(id: string) {
    activeView.set(id);
    dispatch('changeView', id);
    isMobileOpen = false;
  }

  function handleLogout() {
    currentUser.set(null);
    isPlayerMode.set(false);
    addToast('ออกจากระบบแล้ว', 'คุณกำลังเข้าชมในโหมดผู้เยี่ยมชม (Guest)', 'info');
  }

  function openLogin() {
    isLoginModalOpen.set(true);
  }
</script>

<header class="fixed top-0 inset-x-0 z-30 p-2.5 sm:p-4 pointer-events-none">
  <div class="glass-soft rounded-2xl px-3 sm:px-4 py-2.5 flex items-center gap-3 pointer-events-auto">
    <!-- Brand -->
    <div class="flex items-center gap-2.5 shrink-0">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 grid place-items-center shadow-lg shadow-cyan-500/30 float-anim">
        <Waves class="w-5 h-5 text-slate-900" />
      </div>
      <div class="leading-tight">
        <div class="font-extrabold text-[15px] gradient-text tracking-tight">Digital Pools</div>
        <div class="text-[10px] text-slate-400 hidden sm:block">Smart Aquatics Platform</div>
      </div>
    </div>

    <!-- Status Pills -->
    <div class="hidden xl:flex items-center gap-2 ml-2">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
        <Droplets class="w-3.5 h-3.5" /> คุณภาพน้ำ: Optimal
      </div>
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/25">
        <Users class="w-3.5 h-3.5" /> ผู้เข้าใช้ {$poolCapacity.current}/{$poolCapacity.max}
      </div>
    </div>

    <div class="flex-1"></div>

    <!-- Camera View Presets -->
    <div class="hidden md:flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/60">
      {#each views as v}
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer {$activeView === v.id ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'}"
          on:click={() => setView(v.id)}
        >
          <svelte:component this={v.icon} class="w-3.5 h-3.5" />
          <span>{v.label}</span>
        </button>
      {/each}
    </div>

    <!-- 🟢 ปุ่ม LINE Official Account -->
    <a
      href="https://line.me/R/ti/p/@806irvzm"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition cursor-pointer"
      title="ติดต่อเจ้าหน้าที่ทาง LINE (@806irvzm)"
    >
      <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
      </svg>
      <span class="hidden sm:inline">LINE OA</span>
    </a>

    <!-- User Profile or Login Button -->
    <div class="flex items-center gap-2 border-l border-slate-700/60 pl-2.5 ml-1">
      {#if $currentUser}
        <div class="hidden sm:flex flex-col text-right leading-tight">
          <span class="text-xs font-bold text-slate-200 truncate max-w-[120px]">{$currentUser.name}</span>
          <span class="text-[9px] font-mono font-bold uppercase {$currentUser.role === 'admin' ? 'text-amber-400' : 'text-emerald-400'}">
            {$currentUser.role === 'admin' ? '• ADMIN ROLE' : '• MEMBER USER'}
          </span>
        </div>

        <button
          title="ออกจากระบบ"
          class="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-400/40 text-slate-300 hover:text-red-300 grid place-items-center transition cursor-pointer"
          on:click={handleLogout}
        >
          <LogOut class="w-4 h-4" />
        </button>
      {:else}
        <button
          on:click={openLogin}
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
        >
          <LogIn class="w-3.5 h-3.5" />
          <span>เข้าสู่ระบบ</span>
        </button>
      {/if}
    </div>

    <!-- Mobile Menu Button -->
    <button
      class="md:hidden w-8 h-8 rounded-xl bg-slate-800/70 border border-slate-700 grid place-items-center cursor-pointer"
      on:click={() => isMobileOpen = !isMobileOpen}
    >
      <Menu class="w-4 h-4 text-slate-300" />
    </button>
  </div>

  <!-- Mobile Dropdown Menu -->
  {#if isMobileOpen}
    <div class="md:hidden mt-2 glass-soft rounded-2xl p-2.5 grid grid-cols-2 gap-2 pointer-events-auto shadow-2xl">
      {#each views as v}
        <button
          class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer {$activeView === v.id ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 bg-slate-800/40'}"
          on:click={() => setView(v.id)}
        >
          <svelte:component this={v.icon} class="w-4 h-4" />
          <span>{v.label}</span>
        </button>
      {/each}

      <!-- ปุ่ม LINE OA สำหรับแถบมือถือ -->
      <a
        href="https://line.me/R/ti/p/@806irvzm"
        target="_blank"
        rel="noopener noreferrer"
        class="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[#06C755] hover:bg-[#05b34c] text-white transition shadow-md cursor-pointer"
      >
        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
        <span>เพิ่มเพื่อน LINE Official (@806irvzm)</span>
      </a>
    </div>
  {/if}
</header>

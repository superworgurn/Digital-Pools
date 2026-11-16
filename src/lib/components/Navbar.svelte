<script lang="ts">
  import {
    BRAND_LOGO_IMAGE_URL,
    activeHotspot,
    isManagerDrawerOpen,
    isExplorationMode,
    currentUser,
    isLoginModalOpen,
    poolMetrics,
    activeVipMembership,
    crmProfile,
    crmTierStatus,
    addToast
  } from '../stores';
  import {
    Waves,
    Droplets,
    Users,
    LayoutGrid,
    DoorOpen,
    ShoppingBag,
    Compass,
    LogIn,
    LogOut,
    BarChart3,
    Crown,
    Award
  } from 'lucide-svelte';

  let activeCamTab: string = 'overview';
  let logoLoadError = false;

  function handleLogoError() {
    logoLoadError = true;
  }

  function selectCameraView(preset: string) {
    activeCamTab = preset;
    window.dispatchEvent(new CustomEvent('dp-camera-preset', { detail: preset }));
  }

  function toggleExploration() {
    isExplorationMode.update((v) => {
      const next = !v;
      addToast(
        next ? 'เปิดโหมดเดินสำรวจ (Player Mode)' : 'ปิดโหมดเดินสำรวจ',
        next
          ? 'กด W A S D หรือคลิกบนพื้นสระเพื่อเดินสำรวจ • กด E เพื่อใช้งานจุดบริการ'
          : 'กลับมาใช้โหมดเลื่อนและหมุนกล้องอิสระ',
        'info'
      );
      return next;
    });
  }

  function handleLogout() {
    currentUser.set(null);
    isManagerDrawerOpen.set(false);
    if ($activeHotspot === 'water') {
      activeHotspot.set(null);
    }
    addToast('ออกจากระบบแล้ว', 'กำลังใช้งานในโหมดผู้เยี่ยมชม (Guest)', 'info');
  }
</script>

<header class="fixed top-3 left-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-none">
  <div
    class="pointer-events-auto w-full flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700/60 bg-slate-900/80 px-4 py-2.5 backdrop-blur-xl shadow-2xl"
  >
    <!-- ซ้าย: ช่องใส่รูปโลโก้ + ชื่อแบรนด์ + สถานะคุณภาพน้ำ (Admin Only) + จำนวนผู้เข้าใช้ + VIP & แต้ม CRM -->
    <div class="flex flex-wrap items-center gap-2.5">
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/25 shrink-0"
        >
          {#if !logoLoadError}
            <img
              src={BRAND_LOGO_IMAGE_URL}
              alt="Digital Pools Logo"
              class="h-full w-full object-cover"
              on:error={handleLogoError}
            />
          {:else}
            <Waves class="w-5 h-5" />
          {/if}
        </div>
        <div>
          <h1 class="text-sm sm:text-base font-extrabold tracking-tight text-sky-400 leading-tight">
            Digital Pools
          </h1>
          <p class="text-[11px] text-slate-400 leading-tight">Smart Aquatics Platform</p>
        </div>
      </div>

      <!-- ปุ่มคุณภาพน้ำ / IoT แสดงและกดดูได้เฉพาะ Admin เท่านั้น -->
      {#if $currentUser?.role === 'admin'}
        <button
          type="button"
          on:click={() => activeHotspot.set('water')}
          class="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-400 transition cursor-pointer"
        >
          <Droplets class="w-3.5 h-3.5 text-emerald-400" />
          <span>คุณภาพน้ำ/IoT: <strong class="text-emerald-400">Optimal</strong></span>
        </button>
      {/if}

      <button
        type="button"
        on:click={() => activeHotspot.set('checkin')}
        class="hidden sm:flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400 transition cursor-pointer"
      >
        <Users class="w-3.5 h-3.5 text-cyan-400" />
        <span>ผู้เข้าใช้ <strong class="text-cyan-300">{$poolMetrics.currentSwimmers}/{$poolMetrics.maxCapacity}</strong></span>
      </button>

      <!-- ปุ่มแต้มสะสม CRM (สำหรับ User ทุกระดับ) & สมาชิก VIP -->
      <button
        type="button"
        on:click={() => activeHotspot.set('vip')}
        class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition cursor-pointer {$activeVipMembership?.status === 'active'
          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20'
          : 'border-cyan-500/40 bg-slate-800/80 text-cyan-200 hover:border-amber-400'}"
      >
        {#if $activeVipMembership?.status === 'active'}
          <Crown class="w-3.5 h-3.5 text-amber-400" />
          <span>{$activeVipMembership.tierName} • {$crmProfile.points.toLocaleString()} แต้ม</span>
        {:else}
          <Award class="w-3.5 h-3.5 text-amber-400" />
          <span>{$crmTierStatus.rank}: {$crmProfile.points.toLocaleString()} แต้ม • สมัคร VIP</span>
        {/if}
      </button>
    </div>

    <!-- ขวา: ปุ่มมุมกล้อง + ร้านชุดว่ายน้ำ + LINE OA + โปรไฟล์ -->
    <div class="flex flex-wrap items-center gap-2">
      <div
        class="hidden xl:flex items-center gap-1 rounded-xl border border-slate-700/70 bg-slate-950/60 p-1"
      >
        <button
          type="button"
          on:click={() => selectCameraView('overview')}
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer {activeCamTab === 'overview'
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
            : 'text-slate-300 hover:text-white'}"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span>มุมสูง</span>
        </button>

        <button
          type="button"
          on:click={() => selectCameraView('entrance')}
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer {activeCamTab === 'entrance'
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
            : 'text-slate-300 hover:text-white'}"
        >
          <DoorOpen class="w-3.5 h-3.5" />
          <span>ทางเข้า & เช็คอิน</span>
        </button>

        <button
          type="button"
          on:click={() => selectCameraView('pool')}
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer {activeCamTab === 'pool'
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
            : 'text-slate-300 hover:text-white'}"
        >
          <Waves class="w-3.5 h-3.5" />
          <span>หน้าสระ</span>
        </button>

        <button
          type="button"
          on:click={() => activeHotspot.set('swimwear')}
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-500/20 transition cursor-pointer"
        >
          <ShoppingBag class="w-3.5 h-3.5 text-pink-400" />
          <span>ร้านชุดว่ายน้ำ & ผ้าขนหนู</span>
        </button>
      </div>

      <button
        type="button"
        on:click={() => activeHotspot.set('swimwear')}
        class="xl:hidden flex items-center gap-1 rounded-xl bg-pink-600 hover:bg-pink-500 px-3 py-2 text-xs font-bold text-white shadow cursor-pointer"
      >
        <ShoppingBag class="w-3.5 h-3.5" />
        <span>ร้านเช่า/ซื้อ</span>
      </button>

      <a
        href="https://line.me/R/ti/p/@806irvzm"
        target="_blank"
        rel="noreferrer"
        class="flex items-center gap-1.5 rounded-xl bg-[#06C755] hover:opacity-90 px-3.5 py-2 text-xs font-bold text-white shadow transition"
      >
        <span>LINE OA</span>
      </a>

      {#if $currentUser}
        {#if $currentUser.role === 'admin'}
          <button
            type="button"
            on:click={() => isManagerDrawerOpen.set(true)}
            class="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 shadow transition cursor-pointer"
          >
            <BarChart3 class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Dashboard</span>
          </button>
        {/if}
        <button
          type="button"
          on:click={handleLogout}
          class="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-rose-600 hover:border-rose-500 px-3 py-2 text-xs font-semibold text-white transition cursor-pointer"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      {:else}
        <button
          type="button"
          on:click={() => isLoginModalOpen.set(true)}
          class="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition cursor-pointer"
        >
          <LogIn class="w-3.5 h-3.5" />
          <span>เข้าสู่ระบบ</span>
        </button>
      {/if}
    </div>
  </div>

  <button
    type="button"
    on:click={toggleExploration}
    class="pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-md transition cursor-pointer {$isExplorationMode
      ? 'border-emerald-300 bg-emerald-500 text-slate-950 font-extrabold ring-2 ring-emerald-400/50'
      : 'border-slate-700/70 bg-slate-900/85 text-slate-100 hover:border-cyan-400'}"
  >
    <Compass class="w-4 h-4 {$isExplorationMode ? 'text-slate-950' : 'text-cyan-400'}" />
    <span>{$isExplorationMode ? 'กำลังเดินสำรวจ (คลิกเพื่อออก)' : 'โหมดเดินสำรวจ (Player Mode)'}</span>
  </button>
</header>
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    PoolDigitalTwinEngine,
    type HotspotScreenCoord,
    type NpcStatusBubble,
    type WorldLabelCoord,
    type NearbyZoneInfo
  } from '../engine3d';
  import {
    activeHotspot,
    currentUser,
    isManagerDrawerOpen,
    isExplorationMode,
    addToast
  } from '../stores';
  import type { HotspotId } from '../../types';
  import { BarChart3, Compass, Eye, EyeOff, RotateCcw } from 'lucide-svelte';

  interface LayoutHotspot extends HotspotScreenCoord {
    renderX: number;
    renderY: number;
    shortLabel: string;
  }

  let containerEl: HTMLDivElement;
  let engine: PoolDigitalTwinEngine | null = null;
  let hotspotCoords: HotspotScreenCoord[] = [];
  let worldLabels: WorldLabelCoord[] = [];
  let npcBubbles: NpcStatusBubble[] = [];
  let fps = 60;
  let nearbyZone: NearbyZoneInfo | null = null;

  // เปิด-ปิดป้ายในฉาก 3D ได้อิสระ
  let show3DPins = true;

  // ชื่อย่อสำหรับจอเล็กเพื่อไม่ให้ปุ่มยาวเกินไปจนเบียดกัน
  const mobileShortNames: Partial<Record<HotspotId, string>> = {
    checkin: 'จุดเช็คอิน',
    swimwear: 'เช่า/ซื้อชุด',
    locker: 'ล็อกเกอร์',
    restroom: 'ห้องน้ำ',
    courses: 'คลาสว่ายน้ำ',
    water: 'คุณภาพน้ำ',
    lifeguard: 'ไลฟ์การ์ด',
    'kids-pool': 'สระเด็ก'
  };

  function layoutHotspots(items: HotspotScreenCoord[]): LayoutHotspot[] {
    const laidOut: LayoutHotspot[] = items.map((hs) => ({
      ...hs,
      renderX: hs.x,
      renderY: hs.y,
      shortLabel: mobileShortNames[hs.id] || hs.title
    }));

    // ดันปุ่ม Hotspot ออกจากกันอัตโนมัติหากอยู่ใกล้กันเกินไปบนหน้าจอ
    for (let iter = 0; iter < 5; iter++) {
      for (let i = 0; i < laidOut.length; i++) {
        for (let j = i + 1; j < laidOut.length; j++) {
          const a = laidOut[i];
          const b = laidOut[j];
          const dx = a.renderX - b.renderX;
          const dy = a.renderY - b.renderY;
          const minDx = 102;
          const minDy = 32;

          if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
            const pushY = (minDy - Math.abs(dy)) * 0.55;
            if (a.renderY <= b.renderY) {
              a.renderY -= pushY;
              b.renderY += pushY;
            } else {
              a.renderY += pushY;
              b.renderY -= pushY;
            }
          }
        }
      }
    }

    return laidOut;
  }

  $: if (engine) {
    engine.setExplorationMode($isExplorationMode);
  }

  $: rawVisibleHotspots = hotspotCoords.filter(
    (hs) => hs.visible && (hs.id !== 'water' || $currentUser?.role === 'admin')
  );

  $: visibleHotspots = layoutHotspots(rawVisibleHotspots);

  $: effectiveNearbyZone =
    nearbyZone && nearbyZone.id === 'water' && $currentUser?.role !== 'admin'
      ? null
      : nearbyZone;

  function handleCameraPresetEvent(e: Event) {
    const preset = (e as CustomEvent).detail || 'overview';
    if ($isExplorationMode) {
      isExplorationMode.set(false);
    }
    engine?.setCameraPreset(preset);
  }

  function handleSpawnSwimsuitNpc(e: Event) {
    const detail = (e as CustomEvent).detail || {};
    engine?.spawnSwimsuitRentalNpc(
      detail.color || 0xdb2777,
      detail.label || 'NPC ลูกค้า (เช่าชุดว่ายน้ำ)'
    );
    if ($isExplorationMode) {
      isExplorationMode.set(false);
    }
    engine?.setCameraPreset('swimwear');
  }

  function handleLifeguardEmergency() {
    if (!engine) return;
    if ($isExplorationMode) {
      isExplorationMode.set(false);
    }
    engine.setCameraPreset('pool');
    engine.triggerLifeguardEmergency();
  }

  function handleOpenHotspotEvent(e: Event) {
    const id = (e as CustomEvent).detail as HotspotId;
    if (!id) return;
    if (id === 'water' && $currentUser?.role !== 'admin') {
      addToast('จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ', 'เมนูคุณภาพน้ำ/IoT สำหรับ Admin เท่านั้น', 'warn');
      return;
    }
    activeHotspot.set(id);
  }

  function setDpadMove(vx: number, vz: number) {
    engine?.setVirtualJoystick(vx, vz);
  }

  function interactNearbyZone() {
    if (effectiveNearbyZone) {
      activeHotspot.set(effectiveNearbyZone.id);
    }
  }

  function resetCameraView() {
    if ($isExplorationMode) {
      isExplorationMode.set(false);
    }
    engine?.setCameraPreset('overview');
  }

  onMount(() => {
    engine = new PoolDigitalTwinEngine(
      containerEl,
      (coords) => {
        hotspotCoords = coords;
      },
      (bubbles) => {
        npcBubbles = bubbles;
      },
      (labels) => {
        worldLabels = labels;
      },
      (nextFps) => {
        fps = nextFps;
      },
      (zone) => {
        nearbyZone = zone;
      }
    );

    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view');
    if (initialView) {
      engine.setCameraPreset(initialView);
    }

    if ($isExplorationMode) {
      engine.setExplorationMode(true);
    }

    window.addEventListener('dp-camera-preset', handleCameraPresetEvent);
    window.addEventListener('dp-spawn-swimsuit-npc', handleSpawnSwimsuitNpc);
    window.addEventListener('dp-lifeguard-emergency', handleLifeguardEmergency);
    window.addEventListener('dp-open-hotspot', handleOpenHotspotEvent);
  });

  onDestroy(() => {
    window.removeEventListener('dp-camera-preset', handleCameraPresetEvent);
    window.removeEventListener('dp-spawn-swimsuit-npc', handleSpawnSwimsuitNpc);
    window.removeEventListener('dp-lifeguard-emergency', handleLifeguardEmergency);
    window.removeEventListener('dp-open-hotspot', handleOpenHotspotEvent);
    engine?.dispose();
  });

  function openHotspot(id: HotspotId) {
    if (id === 'water' && $currentUser?.role !== 'admin') {
      addToast('จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ', 'เมนูคุณภาพน้ำ/IoT สำหรับ Admin เท่านั้น', 'warn');
      return;
    }
    activeHotspot.set(id);
  }
</script>

<div class="relative w-full h-screen overflow-hidden select-none touch-none">
  <div bind:this={containerEl} class="w-full h-full touch-none"></div>

  <!-- ปุ่มเครื่องมือมุมขวาบนใต้ Navbar (เว้นระยะพ้นแถบเมนู 2 แถวบนมือถือ/แท็บเล็ต) -->
  <div class="fixed top-[104px] xl:top-[78px] right-2.5 md:right-4 z-20 flex items-center gap-1.5">
    <button
      type="button"
      on:click={() => (show3DPins = !show3DPins)}
      class="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 hover:border-cyan-400 px-3 py-1.5 text-[11px] md:text-xs font-semibold text-slate-200 shadow-lg backdrop-blur-md cursor-pointer"
    >
      {#if show3DPins}
        <EyeOff class="w-3.5 h-3.5 text-cyan-400" />
        <span>ซ่อนป้าย</span>
      {:else}
        <Eye class="w-3.5 h-3.5 text-emerald-400" />
        <span>แสดงป้าย</span>
      {/if}
    </button>

    <button
      type="button"
      on:click={resetCameraView}
      class="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 hover:border-cyan-400 px-2.5 py-1.5 text-[11px] md:text-xs font-semibold text-slate-200 shadow-lg backdrop-blur-md cursor-pointer"
      title="รีเซ็ตมุมกล้อง"
      aria-label="รีเซ็ตมุมกล้อง"
    >
      <RotateCcw class="w-3.5 h-3.5 text-sky-400" />
      <span class="hidden md:inline">รีเซ็ตมุมกล้อง</span>
    </button>
  </div>

  {#if show3DPins}
    <!-- ป้ายชื่อจุดสำคัญในฉาก (แสดงเฉพาะหน้าจอขนาดกลางขึ้นไป md+ เพื่อความโปร่งบนมือถือ) -->
    {#each worldLabels as lbl (lbl.id)}
      {#if lbl.visible}
        <div
          class="hidden md:block pointer-events-none fixed top-0 left-0 z-10 whitespace-nowrap will-change-transform"
          style="transform: translate3d({lbl.x}px, {lbl.y}px, 0) translate(-50%, -50%);"
        >
          {#if lbl.variant === 'dark-badge'}
            <div
              class="rounded-md bg-slate-900/85 border border-slate-700/80 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-cyan-300 shadow"
            >
              {lbl.text}
            </div>
          {:else}
            <div
              class="rounded-md bg-white/95 border border-slate-300 px-1.5 py-0.5 text-center shadow-sm leading-tight"
            >
              <div class="text-[9px] font-bold text-slate-800">{lbl.text}</div>
              {#if lbl.subtext}
                <div class="text-[8px] text-slate-500">{lbl.subtext}</div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}

    <!-- บับเบิลแสดงสถานะ NPC -->
    {#each npcBubbles as nb (nb.id)}
      {#if nb.visible}
        <div
          class="pointer-events-none fixed top-0 left-0 z-10 rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] md:text-[10px] font-semibold text-white shadow border whitespace-nowrap will-change-transform"
          style="transform: translate3d({nb.x}px, {nb.y}px, 0) translate(-50%, -100%); border-color: {nb.color};"
        >
          {nb.text}
        </div>
      {/if}
    {/each}

    <!-- ปุ่ม 3D Hotspots แบบ Pill (กระจายตำแหน่งอัตโนมัติไม่ทับกัน) -->
    {#each visibleHotspots as hs (hs.id)}
      <button
        type="button"
        on:click={() => openHotspot(hs.id)}
        class="fixed top-0 left-0 z-20 group flex items-center gap-1 md:gap-1.5 rounded-full border border-cyan-300/85 bg-slate-900/95 hover:bg-sky-700 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-[11px] font-bold text-white shadow-md transition-colors cursor-pointer whitespace-nowrap will-change-transform"
        style="transform: translate3d({hs.renderX}px, {hs.renderY}px, 0) translate(-50%, -50%);"
      >
        <span class="text-[11px] md:text-xs leading-none">{hs.icon}</span>
        <span class="md:hidden">{hs.shortLabel}</span>
        <span class="hidden md:inline">{hs.title}</span>
      </button>
    {/each}
  {/if}

  <!-- แถบเลือกจุดบริการแบบเลื่อนแนวนอนบนมือถือ/แท็บเล็ต (< md) -->
  {#if !$isExplorationMode}
    <div
      class="md:hidden fixed bottom-12 left-2 right-2 z-20 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
    >
      {#each rawVisibleHotspots as hs (hs.id)}
        <button
          type="button"
          on:click={() => openHotspot(hs.id)}
          class="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-700/90 bg-slate-900/95 active:bg-cyan-500 active:text-slate-950 px-3 py-1.5 text-[11px] font-bold text-slate-100 shadow-lg backdrop-blur-md cursor-pointer"
        >
          <span>{hs.icon}</span>
          <span>{mobileShortNames[hs.id] || hs.title}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- กลุ่มมุมซ้ายล่าง: ปุ่มเดิน W A S D + แถบสถานะ FPS -->
  <div class="fixed bottom-3 left-2.5 md:bottom-4 md:left-4 z-30 flex flex-col items-start gap-1.5 md:gap-2">
    {#if $isExplorationMode}
      <div
        class="grid grid-cols-3 gap-1 rounded-xl md:rounded-2xl border border-slate-700/80 bg-slate-950/90 p-1.5 md:p-2 shadow-xl"
      >
        <div></div>
        <button
          type="button"
          on:mousedown={() => setDpadMove(0, -1)}
          on:mouseup={() => setDpadMove(0, 0)}
          on:mouseleave={() => setDpadMove(0, 0)}
          on:touchstart|preventDefault={() => setDpadMove(0, -1)}
          on:touchend|preventDefault={() => setDpadMove(0, 0)}
          class="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
        >
          W
        </button>
        <div></div>
        <button
          type="button"
          on:mousedown={() => setDpadMove(-1, 0)}
          on:mouseup={() => setDpadMove(0, 0)}
          on:mouseleave={() => setDpadMove(0, 0)}
          on:touchstart|preventDefault={() => setDpadMove(-1, 0)}
          on:touchend|preventDefault={() => setDpadMove(0, 0)}
          class="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
        >
          A
        </button>
        <button
          type="button"
          on:mousedown={() => setDpadMove(0, 1)}
          on:mouseup={() => setDpadMove(0, 0)}
          on:mouseleave={() => setDpadMove(0, 0)}
          on:touchstart|preventDefault={() => setDpadMove(0, 1)}
          on:touchend|preventDefault={() => setDpadMove(0, 0)}
          class="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
        >
          S
        </button>
        <button
          type="button"
          on:mousedown={() => setDpadMove(1, 0)}
          on:mouseup={() => setDpadMove(0, 0)}
          on:mouseleave={() => setDpadMove(0, 0)}
          on:touchstart|preventDefault={() => setDpadMove(1, 0)}
          on:touchend|preventDefault={() => setDpadMove(0, 0)}
          class="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
        >
          D
        </button>
      </div>
    {/if}

    <div
      class="pointer-events-none flex items-center gap-1.5 md:gap-2 rounded-full border border-slate-700/70 bg-slate-900/90 px-3 py-1 md:px-3.5 md:py-1.5 text-[10px] md:text-xs font-semibold text-cyan-300 shadow-lg whitespace-nowrap"
    >
      <span class="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-cyan-400 animate-pulse"></span>
      <span>
        {$isExplorationMode ? 'Player Walk Mode' : 'Free Orbit & Pan 3D'} • {fps} FPS
      </span>
    </div>
  </div>

  <!-- HUD ด้านล่างเมื่อเปิดโหมดเดินสำรวจ -->
  {#if $isExplorationMode}
    <div
      class="fixed bottom-3 left-[138px] right-2.5 md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30 flex flex-col items-center gap-1.5 md:gap-2 md:w-[92vw] md:max-w-md"
    >
      {#if effectiveNearbyZone}
        <button
          type="button"
          on:click={interactNearbyZone}
          class="animate-bounce flex items-center gap-1.5 md:gap-2 rounded-xl md:rounded-2xl border-2 border-emerald-300 bg-emerald-500 hover:bg-emerald-400 px-3 py-2 md:px-5 md:py-2.5 text-[11px] md:text-sm font-extrabold text-slate-950 shadow-2xl cursor-pointer"
        >
          <span>{effectiveNearbyZone.icon}</span>
          <span>แตะใช้งาน: {effectiveNearbyZone.title}</span>
        </button>
      {/if}

      <div
        class="w-full rounded-xl md:rounded-2xl border border-emerald-400/40 bg-slate-950/90 px-3 py-1.5 md:px-4 md:py-2 text-center text-[10px] md:text-[11px] text-slate-200 shadow-xl leading-snug"
      >
        <div class="font-bold text-emerald-400 flex items-center justify-center gap-1">
          <Compass class="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
          <span>โหมดเดินสำรวจ (Player Mode)</span>
        </div>
        <div class="text-slate-300 mt-0.5">
          กด <strong>W A S D</strong> หรือ <strong>แตะบนพื้นสระ</strong> เพื่อเดิน
        </div>
      </div>
    </div>
  {/if}

  <!-- ปุ่มเปิด Manager Dashboard มุมขวาล่าง -->
  {#if $currentUser?.role === 'admin'}
    <button
      type="button"
      on:click={() => isManagerDrawerOpen.set(true)}
      class="fixed bottom-3 right-2.5 md:bottom-4 md:right-4 z-30 flex items-center gap-1.5 md:gap-2 rounded-full md:rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-3 py-1.5 md:px-4 md:py-2.5 text-[10px] md:text-xs font-bold text-slate-950 shadow-xl shadow-cyan-500/30 hover:scale-105 transition cursor-pointer"
    >
      <BarChart3 class="w-3.5 h-3.5 md:w-4 md:h-4" />
      <span>Dashboard</span>
    </button>
  {/if}
</div>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
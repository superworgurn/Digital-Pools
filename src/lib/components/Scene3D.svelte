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
  import { BarChart3, Compass } from 'lucide-svelte';

  let containerEl: HTMLDivElement;
  let engine: PoolDigitalTwinEngine | null = null;
  let hotspotCoords: HotspotScreenCoord[] = [];
  let worldLabels: WorldLabelCoord[] = [];
  let npcBubbles: NpcStatusBubble[] = [];
  let fps = 60;
  let nearbyZone: NearbyZoneInfo | null = null;

  $: if (engine) {
    engine.setExplorationMode($isExplorationMode);
  }

  // กรองปุ่มคุณภาพน้ำ/IoT ให้เฉพาะ Admin เท่านั้นที่มองเห็น
  $: visibleHotspots = hotspotCoords.filter(
    (hs) => hs.visible && (hs.id !== 'water' || $currentUser?.role === 'admin')
  );

  // ป้องกันการกดปุ่ม E หน้าเซ็นเซอร์น้ำหากไม่ใช่ Admin
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

  <!-- ป้ายชื่อโซนในฉาก 3D -->
  {#each worldLabels as lbl (lbl.id)}
    {#if lbl.visible}
      <div
        class="pointer-events-none fixed top-0 left-0 z-10 whitespace-nowrap will-change-transform"
        style="transform: translate3d({lbl.x}px, {lbl.y}px, 0) translate(-50%, -50%);"
      >
        {#if lbl.variant === 'dark-badge'}
          <div
            class="rounded-md bg-slate-900/95 border border-slate-700 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-300 shadow"
          >
            {lbl.text}
          </div>
        {:else}
          <div
            class="rounded-md bg-white/95 border border-slate-300 px-2 py-0.5 text-center shadow-sm leading-tight"
          >
            <div class="text-[10px] font-bold text-slate-800">{lbl.text}</div>
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
        class="pointer-events-none fixed top-0 left-0 z-10 rounded-full bg-slate-900/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow border whitespace-nowrap will-change-transform"
        style="transform: translate3d({nb.x}px, {nb.y}px, 0) translate(-50%, -100%); border-color: {nb.color};"
      >
        {nb.text}
      </div>
    {/if}
  {/each}

  <!-- ปุ่ม 3D Hotspots แบบ Pill (คุณภาพน้ำแสดงเฉพาะ Admin) -->
  {#each visibleHotspots as hs (hs.id)}
    <button
      type="button"
      on:click={() => openHotspot(hs.id)}
      class="fixed top-0 left-0 z-20 group flex items-center gap-2 rounded-full border border-cyan-300/80 bg-slate-900/95 hover:bg-sky-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer whitespace-nowrap will-change-transform"
      style="transform: translate3d({hs.x}px, {hs.y}px, 0) translate(-50%, -50%);"
    >
      <span
        class="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs"
      >
        {hs.icon}
      </span>
      <span>{hs.title}</span>
    </button>
  {/each}

  <!-- HUD เมื่อเปิดโหมดเดินสำรวจ (Player Mode) -->
  {#if $isExplorationMode}
    <div
      class="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-[92vw] max-w-md"
    >
      {#if effectiveNearbyZone}
        <button
          type="button"
          on:click={interactNearbyZone}
          class="animate-bounce flex items-center gap-2 rounded-2xl border-2 border-emerald-300 bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-2xl cursor-pointer"
        >
          <span class="text-base">{effectiveNearbyZone.icon}</span>
          <span>กด [E] หรือคลิกเพื่อใช้งาน: {effectiveNearbyZone.title}</span>
        </button>
      {/if}

      <div
        class="rounded-2xl border border-emerald-400/40 bg-slate-950/90 px-4 py-2 text-center text-[11px] text-slate-200 shadow-xl"
      >
        <div class="font-bold text-emerald-400 flex items-center justify-center gap-1.5">
          <Compass class="w-3.5 h-3.5" />
          <span>โหมดเดินสำรวจเปิดใช้งานอยู่ (Player Mode)</span>
        </div>
        <div class="text-slate-300 mt-0.5">
          กด <strong>W A S D</strong> หรือ <strong>คลิกบนพื้นสระ</strong> เพื่อเดิน • กด <strong>Shift</strong> วิ่ง • ลากเมาส์หมุนมุมมอง
        </div>
      </div>
    </div>

    <div
      class="fixed bottom-16 left-4 z-30 grid grid-cols-3 gap-1 rounded-2xl border border-slate-700/80 bg-slate-950/90 p-2 shadow-xl"
    >
      <div></div>
      <button
        type="button"
        on:mousedown={() => setDpadMove(0, -1)}
        on:mouseup={() => setDpadMove(0, 0)}
        on:mouseleave={() => setDpadMove(0, 0)}
        on:touchstart|preventDefault={() => setDpadMove(0, -1)}
        on:touchend|preventDefault={() => setDpadMove(0, 0)}
        class="h-9 w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
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
        class="h-9 w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
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
        class="h-9 w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
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
        class="h-9 w-9 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-white text-xs cursor-pointer"
      >
        D
      </button>
    </div>
  {/if}

  <!-- แถบสถานะมุมซ้ายล่าง -->
  <div
    class="pointer-events-none fixed bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 shadow-lg"
  >
    <span class="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
    <span>
      {$isExplorationMode ? 'Player Walk Mode' : 'Free Orbit & Pan 3D'} • {fps} FPS
    </span>
  </div>

  <!-- ปุ่มเปิด Manager Dashboard มุมขวาล่าง -->
  {#if $currentUser?.role === 'admin'}
    <button
      type="button"
      on:click={() => isManagerDrawerOpen.set(true)}
      class="fixed bottom-4 right-4 z-20 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-xl shadow-cyan-500/30 hover:scale-105 transition cursor-pointer"
    >
      <BarChart3 class="w-4 h-4" />
      <span>Manager Dashboard</span>
    </button>
  {/if}
</div>
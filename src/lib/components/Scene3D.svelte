<script lang="ts">
  import { onMount } from 'svelte';
  import { Engine3D } from '../engine3d';
  import type { HotspotProjected, Label3D } from '../../types';
  import { currentFps, activeModal, isPlayerMode, isEmergency, addToast } from '../stores';
  import {
    ScanLine, Lock, Droplets, LifeBuoy, GraduationCap,
    Footprints, Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    Zap, AlertOctagon
  } from 'lucide-svelte';

  let canvas: HTMLCanvasElement;
  let engine: Engine3D;
  let hotspots: HotspotProjected[] = [];
  let labels: Label3D[] = [];

  const iconMap: Record<string, any> = {
    ScanLine, Lock, Droplets, LifeBuoy, GraduationCap
  };

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragDist = 0;

  // 🏃‍♂️ สถานะการวิ่งเร็ว (รองรับทั้งกด Shift ค้าง และแตะปุ่มสลับวิ่ง)
  let isShiftHeld = false;
  let isSprintToggle = false;
  $: isSprinting = isShiftHeld || isSprintToggle;

  // ปุ่มทิศทางที่กดค้างอยู่
  const keysDown = new Set<string>();
  let touchForward = 0;
  let touchStrafe = 0;

  // ฟังก์ชันตรวจสอบปุ่มเดิน (รองรับ KeyCode, ภาษาอังกฤษตัวพิมพ์เล็ก-ใหญ่ และภาษาไทยทั้งแบบปกติ/กด Shift)
  function isForwardKey(e: KeyboardEvent): boolean {
    return e.code === 'KeyW' || e.code === 'ArrowUp' || ['w', 'W', 'ไ', '"'].includes(e.key);
  }
  function isBackwardKey(e: KeyboardEvent): boolean {
    return e.code === 'KeyS' || e.code === 'ArrowDown' || ['s', 'S', 'ห', 'ฆ'].includes(e.key);
  }
  function isLeftKey(e: KeyboardEvent): boolean {
    return e.code === 'KeyA' || e.code === 'ArrowLeft' || ['a', 'A', 'ฟ', 'ฤ'].includes(e.key);
  }
  function isRightKey(e: KeyboardEvent): boolean {
    return e.code === 'KeyD' || e.code === 'ArrowRight' || ['d', 'D', 'ก', 'ฏ'].includes(e.key);
  }

  $: if (engine) {
    engine.setEmergency($isEmergency);
  }

  onMount(() => {
    engine = new Engine3D(canvas, {
      onProjectHotspots: (items) => { hotspots = items; },
      onProjectLabels: (items) => { labels = items; },
      onFpsUpdate: (fps) => { currentFps.set(fps); }
    });

    const handleResize = () => engine.resize();
    const handleBlur = () => {
      keysDown.clear();
      isShiftHeld = false;
      updateMovement();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      engine.destroy();
    };
  });

    export function setPlayerMode(active: boolean) {
    if ($isPlayerMode !== active) {
      togglePlayerMode();
    }
  }

  export function changeView(id: string) {
    if ($isPlayerMode) togglePlayerMode();
    const CAM_PRESETS: Record<string, { pos: [number, number, number]; look: [number, number, number] }> = {
      overview: { pos: [26, 22, 30], look: [0, 1, 0] },
      pool: { pos: [0, 6.5, 25], look: [0, 0.5, 0] },
      locker: { pos: [-3.5, 6, 9], look: [-16, 1.2, 0] },
      counter: { pos: [0, 7, 26], look: [0, 2, 12.5] }
    };
    const target = CAM_PRESETS[id];
    if (target) engine.flyTo(target.pos, target.look);
  }

  function togglePlayerMode() {
    isPlayerMode.update(val => {
      const next = !val;
      engine.setPlayerMode(next);

      keysDown.clear();
      isShiftHeld = false;
      isSprintToggle = false;
      touchForward = 0;
      touchStrafe = 0;
      engine.setMoveInput(0, 0, false);

      if (next) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        window.focus();
        addToast('เข้าสู่ Player Mode', 'ใช้ปุ่ม WASD เดิน | กด Shift เพื่อวิ่งเร็ว', 'success');
      } else {
        addToast('ออกจาก Player Mode', 'กลับสู่มุมมองภาพรวมแล้ว', 'info');
      }
      return next;
    });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!$isPlayerMode) return;
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

    if (e.key === 'Escape') {
      togglePlayerMode();
      return;
    }

    // ตรวจจับปุ่ม Shift เพื่อวิ่งเร็ว
    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.shiftKey) {
      isShiftHeld = true;
    }

    let changed = false;
    if (isForwardKey(e)) { keysDown.add('forward'); changed = true; }
    if (isBackwardKey(e)) { keysDown.add('backward'); changed = true; }
    if (isLeftKey(e)) { keysDown.add('left'); changed = true; }
    if (isRightKey(e)) { keysDown.add('right'); changed = true; }

    if (changed || e.key === 'Shift') {
      e.preventDefault();
      updateMovement();
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (!$isPlayerMode) return;

    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      isShiftHeld = false;
    }
    if (!e.shiftKey) {
      isShiftHeld = false;
    }

    if (isForwardKey(e)) { keysDown.delete('forward'); }
    if (isBackwardKey(e)) { keysDown.delete('backward'); }
    if (isLeftKey(e)) { keysDown.delete('left'); }
    if (isRightKey(e)) { keysDown.delete('right'); }

    updateMovement();
  }

  function updateMovement() {
    let forward = touchForward;
    let strafe = touchStrafe;

    if (keysDown.has('forward')) forward += 1;
    if (keysDown.has('backward')) forward -= 1;
    if (keysDown.has('left')) strafe -= 1;
    if (keysDown.has('right')) strafe += 1;

    engine.setMoveInput(forward, strafe, isSprinting);
  }

  function setTouchDir(f: number, s: number) {
    touchForward = f;
    touchStrafe = s;
    updateMovement();
  }

  function toggleSprint() {
    isSprintToggle = !isSprintToggle;
    updateMovement();
  }

  function handlePointerDown(e: PointerEvent) {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    dragDist = 0;
    canvas.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    dragDist += Math.hypot(dx, dy);
    dragStart = { x: e.clientX, y: e.clientY };

    if ($isPlayerMode) {
      engine.rotatePlayerLook(dx, dy);
    } else {
      engine.rotateCamera(dx, dy);
    }
  }

  function handlePointerUp() {
    isDragging = false;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    if (!$isPlayerMode) {
      engine.zoomCamera(e.deltaY);
    }
  }

  function triggerOpenHotspot(id: string, h?: any) {
    activeModal.set(id);
    if (!$isPlayerMode && h) {
      engine.flyTo(h.cam3d, h.look3d);
    }
  }

  function handleCanvasClick(e: MouseEvent) {
    if (dragDist > 8) return;
    for (const h of hotspots) {
      if (h.visible && Math.hypot(h.x - e.clientX, h.y - e.clientY) < 55) {
        triggerOpenHotspot(h.id, h);
        return;
      }
    }
  }
</script>

<div class="fixed inset-0 w-full h-full overflow-hidden select-none">
  {#if $isEmergency}
    <div class="fixed inset-0 pointer-events-none z-30 border-4 border-red-500/70 shadow-[inset_0_0_80px_rgba(239,68,68,0.35)] animate-pulse"></div>
    <div class="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-red-600/90 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-red-400">
      <AlertOctagon class="w-4 h-4 animate-bounce" />
      <span>สัญญาณเตือนภัยฉุกเฉินทำงาน: ไลฟ์การ์ดเข้าประจำจุดกู้ภัย</span>
      <button on:click={() => isEmergency.set(false)} class="ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] text-white cursor-pointer">ยกเลิก</button>
    </div>
  {/if}

  <canvas
    bind:this={canvas}
    class="block w-full h-full cursor-grab active:cursor-grabbing"
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:wheel={handleWheel}
    on:click={handleCanvasClick}
  ></canvas>

  <!-- 3D Labels Layer -->
  <div class="fixed inset-0 pointer-events-none z-10 overflow-hidden">
    {#each labels as l}
      {#if l.visible}
        <div
          class="absolute top-0 left-0 whitespace-nowrap {l.c === 'zone3' ? 'bg-[#0b2033]/90 text-cyan-300 px-3 py-1 rounded-md text-[11px] font-bold border border-cyan-400/30' : 'bg-white/60 text-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold'}"
          style="transform: translate(-50%, -100%) translate({l.x}px, {l.y}px) scale({l.scale}); z-index: {Math.max(1, 900 - Math.round(l.z || 0))};"
        >
          {l.t}
        </div>
      {/if}
    {/each}
  </div>

  <!-- 3D Hotspot Buttons Layer -->
  <div class="fixed inset-0 pointer-events-none z-20 overflow-hidden">
    {#each hotspots as h (h.id)}
      {#if h.visible}
        <div
          class="absolute top-0 left-0 pointer-events-auto"
          style="transform: translate(-50%, -50%) translate({h.x}px, {h.y}px); z-index: {Math.max(1, 1000 - Math.round(h.z))};"
        >
          <button
            type="button"
            class="flex items-center gap-1.5 p-1 sm:pr-2.5 rounded-full bg-sky-950/85 hover:bg-cyan-950 border border-cyan-400 text-cyan-100 text-xs font-semibold backdrop-blur-md shadow-lg shadow-cyan-500/40 hover:scale-105 active:scale-95 transition cursor-pointer"
            on:pointerdown|stopPropagation
            on:click|stopPropagation={() => triggerOpenHotspot(h.id, h)}
          >
            <span class="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-500 grid place-items-center text-slate-900 shadow">
              <svelte:component this={iconMap[h.icon]} class="w-3.5 h-3.5" />
            </span>
            <span class="hidden sm:inline text-[11px] pr-1">{h.short}</span>
          </button>
        </div>
      {/if}
    {/each}
  </div>

  <button
    class="fixed top-20 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all shadow-xl font-bold text-xs cursor-pointer {$isPlayerMode ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/60 shadow-amber-500/30' : 'bg-slate-900/80 text-cyan-300 border-cyan-400/30 hover:bg-slate-800'}"
    on:click={togglePlayerMode}
  >
    <Footprints class="w-4 h-4" />
    <span>{$isPlayerMode ? 'ออกโหมดเดิน (Exit Walk)' : 'โหมดเดินสำรวจ (Player Mode)'}</span>
  </button>

  {#if $isPlayerMode}
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
      <div class="w-2.5 h-2.5 rounded-full border-2 border-cyan-300/80 bg-cyan-400/40"></div>
    </div>

    <div class="fixed top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl glass-soft border border-cyan-400/40 text-cyan-200 text-xs font-semibold pointer-events-none shadow-lg hidden sm:flex items-center gap-2">
      <Compass class="w-4 h-4 text-cyan-400" />
      <span>เดิน: [W, A, S, D] | วิ่งเร็ว: [Shift ค้างไว้] | หันมอง: ลากเมาส์ | ออก: [ESC]</span>
    </div>

    <!-- 🕹️ Virtual D-Pad & Sprint Button -->
    <div class="fixed bottom-6 left-6 z-40 flex items-end gap-3">
      <div class="p-2.5 rounded-3xl glass-soft border border-cyan-500/30 flex flex-col items-center gap-2 shadow-2xl">
        <button
          class="w-13 h-13 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-cyan-300 active:text-slate-950 border border-slate-700 grid place-items-center text-lg font-bold transition shadow cursor-pointer"
          on:pointerdown={() => setTouchDir(1, 0)}
          on:pointerup={() => setTouchDir(0, 0)}
          on:pointerleave={() => setTouchDir(0, 0)}
        ><ArrowUp class="w-6 h-6" /></button>
        <div class="flex gap-2">
          <button
            class="w-13 h-13 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-cyan-300 active:text-slate-950 border border-slate-700 grid place-items-center text-lg font-bold transition shadow cursor-pointer"
            on:pointerdown={() => setTouchDir(0, -1)}
            on:pointerup={() => setTouchDir(0, 0)}
            on:pointerleave={() => setTouchDir(0, 0)}
          ><ArrowLeft class="w-6 h-6" /></button>
          
          <button
            class="w-13 h-13 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-cyan-300 active:text-slate-950 border border-slate-700 grid place-items-center text-lg font-bold transition shadow cursor-pointer"
            on:pointerdown={() => setTouchDir(-1, 0)}
            on:pointerup={() => setTouchDir(0, 0)}
            on:pointerleave={() => setTouchDir(0, 0)}
          ><ArrowDown class="w-6 h-6" /></button>
          
          <button
            class="w-13 h-13 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-cyan-300 active:text-slate-950 border border-slate-700 grid place-items-center text-lg font-bold transition shadow cursor-pointer"
            on:pointerdown={() => setTouchDir(0, 1)}
            on:pointerup={() => setTouchDir(0, 0)}
            on:pointerleave={() => setTouchDir(0, 0)}
          ><ArrowRight class="w-6 h-6" /></button>
        </div>
      </div>

      <!-- ปุ่มวิ่งเร็วบนหน้าจอ (สว่างขึ้นชัดเจนเมื่อกด Shift บนคีย์บอร์ด) -->
      <button
        class="w-14 h-14 rounded-2xl border transition-all grid place-items-center font-bold text-xs shadow-xl cursor-pointer {isSprinting ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/50 scale-105' : 'bg-slate-800/80 text-cyan-300 border-cyan-400/40 hover:bg-slate-700'}"
        on:click={toggleSprint}
      >
        <Zap class="w-5 h-5 {isSprinting ? 'fill-slate-950 text-slate-950' : 'text-cyan-300'}" />
        <span class="text-[9px] mt-0.5 font-bold">{isSprinting ? 'วิ่งเร็ว' : 'เดิน'}</span>
      </button>
    </div>
  {/if}

  <!-- สถานะ HUD ด้านซ้ายล่าง แสดงผลเรียลไทม์เมื่อกำลังวิ่งเร็ว -->
  <div class="fixed bottom-4 left-4 z-30 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-medium backdrop-blur-md flex items-center gap-2">
    <span class="w-2 h-2 rounded-full {$isEmergency ? 'bg-red-500 animate-ping' : $isPlayerMode ? (isSprinting ? 'bg-amber-400 animate-ping' : 'bg-cyan-400') : 'bg-cyan-400'} live-dot"></span>
    <span class="font-bold {isSprinting ? 'text-amber-300' : ''}">
      {$isEmergency ? '🚨 EMERGENCY ACTION' : $isPlayerMode ? (isSprinting ? '⚡ วิ่งเร็ว (Sprinting 12.5 m/s)' : '🚶 โหมดเดิน (Walking 5.5 m/s)') : 'Orbit 3D'} · {$currentFps} FPS
    </span>
  </div>
</div>


<script lang="ts">
  import { isDrawerOpen, dashboardTimeframes } from '../stores';
  import {
    X, BarChart3, TrendingUp, Users, Droplets, Clock, AlertTriangle,
    ShieldCheck, Calendar, CheckCircle2
  } from 'lucide-svelte';

  let currentPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  $: data = dashboardTimeframes[currentPeriod];

  function close() {
    isDrawerOpen.set(false);
  }
</script>

<div class="fixed inset-0 z-50 flex justify-end">
  <button class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-default" on:click={close} aria-label="Close"></button>

  <aside class="glass relative z-10 w-full max-w-2xl h-full flex flex-col border-l border-slate-700/60 overflow-y-auto">
    <!-- Header -->
    <header class="p-5 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-[#0f172a]/90 backdrop-blur-md z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 grid place-items-center text-slate-900 font-bold shadow-lg">
          <BarChart3 class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-lg font-bold gradient-text">Manager Executive Dashboard</h2>
          <p class="text-xs text-slate-400">ระบบวิเคราะห์ความหนาแน่น & คุณภาพสระว่ายน้ำ</p>
        </div>
      </div>
      <button class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 grid place-items-center hover:bg-red-500/20 transition" on:click={close}>
        <X class="w-4 h-4 text-slate-300" />
      </button>
    </header>

    <div class="p-5 space-y-6 flex-1">
      <!-- Period Switcher: Daily / Weekly / Monthly -->
      <div class="flex gap-1.5 p-1 bg-slate-800/60 rounded-2xl border border-slate-700">
        <button class="flex-1 py-2 text-xs font-bold rounded-xl transition {currentPeriod === 'daily' ? 'bg-cyan-500 text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'}" on:click={() => currentPeriod = 'daily'}>รายวัน (Daily)</button>
        <button class="flex-1 py-2 text-xs font-bold rounded-xl transition {currentPeriod === 'weekly' ? 'bg-cyan-500 text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'}" on:click={() => currentPeriod = 'weekly'}>รายสัปดาห์ (Weekly)</button>
        <button class="flex-1 py-2 text-xs font-bold rounded-xl transition {currentPeriod === 'monthly' ? 'bg-cyan-500 text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'}" on:click={() => currentPeriod = 'monthly'}>รายเดือน (Monthly)</button>
      </div>

      <!-- Key Metric Cards -->
      <div class="grid grid-cols-2 gap-3">
        <div class="glass-soft p-4 rounded-2xl border border-slate-700">
          <div class="flex justify-between items-start"><span class="text-xs text-slate-400">รายได้รวม</span><TrendingUp class="w-4 h-4 text-emerald-400" /></div>
          <div class="text-2xl font-extrabold text-cyan-300 mt-1">฿{data.revenue.toLocaleString()}</div>
          <span class="text-[10px] text-emerald-400">{data.growth} เทียบงวดก่อน</span>
        </div>
        <div class="glass-soft p-4 rounded-2xl border border-slate-700">
          <div class="flex justify-between items-start"><span class="text-xs text-slate-400">ผู้เข้าใช้บริการ</span><Users class="w-4 h-4 text-violet-400" /></div>
          <div class="text-2xl font-extrabold text-violet-300 mt-1">{data.visitors}</div>
          <span class="text-[10px] text-slate-400">{data.visitorsSub}</span>
        </div>
      </div>

      <!-- Peak vs Off-peak Analytical Summary -->
      <div class="glass-soft p-4 rounded-2xl border border-slate-700 space-y-3">
        <h3 class="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Clock class="w-4 h-4 text-cyan-400" /> สรุปช่วงเวลาคนเล่นเยอะ vs คนเล่นน้อย
        </h3>
        <div class="grid sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <div class="text-[10px] text-red-300 font-bold mb-1">🔥 ช่วงคนเล่นเยอะ (Peak Hours)</div>
            <div class="font-bold text-slate-100">{data.peakSummary}</div>
            <div class="text-[10px] text-slate-400 mt-1">คำแนะนำ: เพิ่มไลฟ์การ์ด & จัดระบบคิวช่องทางด่วน</div>
          </div>
          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div class="text-[10px] text-emerald-300 font-bold mb-1">🍃 ช่วงคนเล่นน้อย (Off-Peak Hours)</div>
            <div class="font-bold text-slate-100">{data.offPeakSummary}</div>
            <div class="text-[10px] text-slate-400 mt-1">คำแนะนำ: เหมาะสำหรับบำรุงรักษา/โปรโมชันลดราคา</div>
          </div>
        </div>
      </div>

      <!-- Traffic Density Bar Chart -->
      <div class="glass-soft p-4 rounded-2xl border border-slate-700">
        <h3 class="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-cyan-400" /> กราฟความหนาแน่นผู้เข้าใช้ ({currentPeriod === 'daily' ? 'รายชั่วโมง' : currentPeriod === 'weekly' ? 'รายวัน' : 'รายสัปดาห์'})
        </h3>
        <div class="h-36 flex items-end gap-2">
          {#each data.peakDetails as p}
            <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div class="w-full rounded-t-lg bg-gradient-to-t {p.val >= 80 ? 'from-red-500/40 to-red-400' : 'from-cyan-500/30 to-cyan-400'} transition-all" style="height:{p.val}%"></div>
              <span class="text-[9px] text-slate-400 truncate">{p.label}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Water Quality Insights -->
      <div class="glass-soft p-4 rounded-2xl border border-slate-700">
        <h3 class="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Droplets class="w-4 h-4 text-cyan-400" /> สรุปคุณภาพน้ำประจำรอบ ({data.waterScore})
        </h3>
        <div class="p-3 rounded-xl bg-slate-800/60 text-xs space-y-1.5">
          <div class="flex justify-between"><span class="text-slate-400">เกณฑ์ประเมินเฉลี่ย:</span><span class="text-emerald-400 font-bold">{data.waterSub}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">อัตราการหมุนเวียนและกรองน้ำ:</span><span class="text-slate-200">99.2% ผ่านเกณฑ์มาตรฐานสุขอนามัย</span></div>
          <div class="flex justify-between"><span class="text-slate-400">การเติมเคมีบำบัด:</span><span class="text-cyan-300">ระบบอัตโนมัติเติมคลอรีนหลังรอบ 20:00 น.</span></div>
        </div>
      </div>

      <!-- Revenue Breakdown -->
      <div class="glass-soft p-4 rounded-2xl border border-slate-700">
        <h3 class="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-violet-400" /> สัดส่วนรายได้ตามประเภท
        </h3>
        <div class="space-y-3">
          {#each data.breakdown as b}
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-400">{b.label}</span>
                <span class="font-bold text-slate-200">฿{b.value.toLocaleString()}</span>
              </div>
              <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div class="{b.color} h-full" style="width:{(b.value/data.revenue)*100}%"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </aside>
</div>

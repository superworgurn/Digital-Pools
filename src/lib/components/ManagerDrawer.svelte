<script lang="ts">
  import {
    isManagerDrawerOpen,
    totalRevenueSummary,
    swimsuitOrders
  } from '../stores';
  import type { AnalyticsPeriod } from '../../types';

  let period: AnalyticsPeriod = 'daily';

  const periodOptions: { id: AnalyticsPeriod; label: string }[] = [
    { id: 'daily', label: 'รายวัน (Daily)' },
    { id: 'weekly', label: 'รายสัปดาห์ (Weekly)' },
    { id: 'monthly', label: 'รายเดือน (Monthly)' }
  ];

  function selectPeriod(nextPeriod: AnalyticsPeriod) {
    period = nextPeriod;
  }

  $: multiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
</script>

{#if $isManagerDrawerOpen}
  <div class="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
    <div class="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 text-slate-100 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 class="text-lg font-bold text-white">📊 แดชบอร์ดผู้จัดการ & รายได้รวม</h2>
          <p class="text-xs text-slate-400">สรุปยอดจองสระ, เช่า/ซื้อชุดว่ายน้ำ, คอร์สเรียน และล็อกเกอร์</p>
        </div>
        <button
          type="button"
          on:click={() => isManagerDrawerOpen.set(false)}
          class="rounded-lg bg-slate-800 px-3 py-1.5 text-xs hover:bg-rose-600"
        >
          ✕ ปิด
        </button>
      </div>

      <!-- ปุ่มเลือกช่วงเวลา -->
      <div class="flex gap-2">
        {#each periodOptions as p}
          <button
            type="button"
            on:click={() => selectPeriod(p.id)}
            class="flex-1 rounded-xl py-2 text-xs font-bold transition {period === p.id
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-800 text-slate-300'}"
          >
            {p.label}
          </button>
        {/each}
      </div>

      <!-- การ์ดรายได้ -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้เช่า/ซื้อชุดว่ายน้ำ</div>
          <div class="text-xl font-extrabold text-pink-400 mt-1">
            {($totalRevenueSummary.swimsuitRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้ค่าเข้าสระ & ล็อกเกอร์</div>
          <div class="text-xl font-extrabold text-cyan-400 mt-1">
            {(($totalRevenueSummary.bookingRev + $totalRevenueSummary.lockerRev) * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้คอร์สเรียนว่ายน้ำ</div>
          <div class="text-xl font-extrabold text-amber-400 mt-1">
            {($totalRevenueSummary.courseRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-emerald-950/40 p-4 border border-emerald-500/40">
          <div class="text-xs text-emerald-300">รายได้รวมสุทธิ</div>
          <div class="text-2xl font-black text-emerald-400 mt-1">
            {($totalRevenueSummary.total * multiplier).toLocaleString()} ฿
          </div>
        </div>
      </div>

      <!-- ประวัติการเช่า/ซื้อชุดว่ายน้ำล่าสุด -->
      <div class="space-y-2">
        <h3 class="text-sm font-bold text-white">👙 รายการเช่าและซื้อชุดว่ายน้ำล่าสุด ({$swimsuitOrders.length})</h3>
        <div class="space-y-2">
          {#each $swimsuitOrders as ord}
            <div class="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-xs space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white">{ord.id} • {ord.customerName}</span>
                <span class="font-bold text-emerald-400">{ord.totalAmount.toLocaleString()} ฿</span>
              </div>
              {#each ord.items as item}
                <div class="text-slate-300 flex justify-between">
                  <span>
                    [{item.orderType === 'rent' ? 'เช่า' : 'ซื้อ'}] {item.name} (ไซส์ {item.size}) ×{item.quantity}
                  </span>
                  <span>{item.totalPrice}฿</span>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
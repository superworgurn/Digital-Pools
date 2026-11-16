<script lang="ts">
  import {
    isManagerDrawerOpen,
    totalRevenueSummary,
    swimsuitOrders,
    bookings,
    courseRegistrations,
    vipHistory
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

  // --- ข้อมูลกราฟช่วงเวลาคนเข้าใช้สระผู้ใหญ่ (สระหลัก) และสระเด็ก ---
  const timeSlots = [
    { slot: '08:00 - 10:00', baseAdult: 8, baseKids: 3 },
    { slot: '10:00 - 12:00', baseAdult: 12, baseKids: 9 },
    { slot: '14:00 - 16:00', baseAdult: 14, baseKids: 11 },
    { slot: '16:00 - 18:00', baseAdult: 24, baseKids: 15 },
    { slot: '18:00 - 20:00', baseAdult: 19, baseKids: 6 }
  ];

  $: trafficChartData = timeSlots.map((item) => {
    const activeBookingsInSlot = $bookings.filter(
      (b) => b.status !== 'cancelled' && b.timeSlot === item.slot
    );

    const extraAdult = activeBookingsInSlot
      .filter((b) => b.poolZone !== 'kids')
      .reduce((sum, b) => sum + b.memberCount, 0);

    const extraKids = activeBookingsInSlot
      .filter((b) => b.poolZone === 'kids')
      .reduce((sum, b) => sum + b.memberCount, 0);

    const adultCount = (item.baseAdult + extraAdult) * multiplier;
    const kidsCount = (item.baseKids + extraKids) * multiplier;

    return {
      slot: item.slot,
      adultCount,
      kidsCount,
      totalCount: adultCount + kidsCount
    };
  });

  $: maxTrafficCount = Math.max(
    1,
    ...trafficChartData.map((d) => Math.max(d.adultCount, d.kidsCount))
  );

  $: peakTimeSlot = [...trafficChartData].sort((a, b) => b.totalCount - a.totalCount)[0];

  // --- ข้อมูลคอร์สเรียนว่ายน้ำยอดนิยม ---
  const allCourseCatalog = [
    {
      name: 'Kids Beginner Survival (10 ชม.)',
      instructor: 'โค้ชฉลาม (ครูเอก)',
      maxStudents: 8,
      baseStudents: 4,
      unitPrice: 3500
    },
    {
      name: 'Adult Stroke Correction (10 ชม.)',
      instructor: 'โค้ชแพรว (อดีตทีมชาติ)',
      maxStudents: 6,
      baseStudents: 3,
      unitPrice: 4200
    },
    {
      name: 'Athlete Sprint Intensive (12 ชม.)',
      instructor: 'โค้ชวินัย (Head Coach)',
      maxStudents: 5,
      baseStudents: 2,
      unitPrice: 5500
    }
  ];

  $: popularCourses = allCourseCatalog
    .map((course) => {
      const activeRegs = $courseRegistrations.filter(
        (r) => r.status !== 'cancelled' && r.courseName === course.name
      );
      const bookedStudents = activeRegs.reduce((sum, r) => sum + r.memberCount, 0);
      const totalStudents = course.baseStudents + bookedStudents;
      const estimatedRevenue =
        (course.baseStudents * course.unitPrice +
          activeRegs.reduce((sum, r) => sum + r.totalPrice, 0)) *
        multiplier;
      const occupancyPercent = Math.min(
        100,
        Math.round((totalStudents / course.maxStudents) * 100)
      );

      return {
        ...course,
        totalStudents,
        estimatedRevenue,
        occupancyPercent
      };
    })
    .sort((a, b) => b.totalStudents - a.totalStudents);
</script>

{#if $isManagerDrawerOpen}
  <div class="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
    <div class="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 text-slate-100 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 class="text-lg font-bold text-white">📊 แดชบอร์ดผู้จัดการ & รายได้รวม</h2>
          <p class="text-xs text-slate-400">สรุปยอดจองสระ, เช่า/ซื้อชุดว่ายน้ำ & ผ้าขนหนู, VIP, ล็อกเกอร์ และคอร์สเรียน</p>
        </div>
        <button
          type="button"
          on:click={() => isManagerDrawerOpen.set(false)}
          class="rounded-lg bg-slate-800 px-3 py-1.5 text-xs hover:bg-rose-600 cursor-pointer"
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
            class="flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer {period === p.id
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-800 text-slate-300'}"
          >
            {p.label}
          </button>
        {/each}
      </div>

      <!-- การ์ดรายได้ครบทุกหมวดหมู่ + รายได้ส่วนอื่นๆ -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้เช่า/ซื้อชุดว่ายน้ำ & ผ้าขนหนู</div>
          <div class="text-xl font-extrabold text-pink-400 mt-1">
            {($totalRevenueSummary.swimsuitRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้ค่าเข้าสระว่ายน้ำ</div>
          <div class="text-xl font-extrabold text-cyan-400 mt-1">
            {($totalRevenueSummary.bookingRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้คอร์สเรียนว่ายน้ำ</div>
          <div class="text-xl font-extrabold text-amber-400 mt-1">
            {($totalRevenueSummary.courseRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-slate-800/80 p-4 border border-amber-500/40">
          <div class="text-xs text-amber-300">รายได้สมาชิก VIP ({$vipHistory.length} ราย)</div>
          <div class="text-xl font-extrabold text-amber-300 mt-1">
            {($totalRevenueSummary.vipRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้ค่าเช่าตู้ล็อกเกอร์</div>
          <div class="text-xl font-extrabold text-sky-300 mt-1">
            {($totalRevenueSummary.lockerRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
          <div class="text-xs text-slate-400">รายได้อื่นๆ (ค่าธรรมเนียมยกเลิก 20%)</div>
          <div class="text-xl font-extrabold text-rose-300 mt-1">
            {($totalRevenueSummary.penaltyRev * multiplier).toLocaleString()} ฿
          </div>
        </div>
        <div class="col-span-2 rounded-xl bg-emerald-950/40 p-4 border border-emerald-500/40 flex items-center justify-between">
          <div>
            <div class="text-xs text-emerald-300">รายได้รวมสุทธิทุกช่องทาง</div>
            <div class="text-[11px] text-slate-400 mt-0.5">รวมร้านค้า + รอบสระ + คอร์ส + VIP + ล็อกเกอร์ + ค่าธรรมเนียม</div>
          </div>
          <div class="text-2xl font-black text-emerald-400">
            {($totalRevenueSummary.total * multiplier).toLocaleString()} ฿
          </div>
        </div>
      </div>

      <!-- กราฟแสดงช่วงเวลาคนเข้าใช้สระเด็กและผู้ใหญ่ -->
      <div class="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-white">📈 กราฟช่วงเวลาคนเข้าใช้บริการ (สระผู้ใหญ่ vs สระเด็ก)</h3>
            <p class="text-[11px] text-slate-400">
              ช่วงเวลาหนาแน่นสูงสุด: <strong class="text-cyan-300">{peakTimeSlot.slot}</strong> ({peakTimeSlot.totalCount} คน)
            </p>
          </div>
          <div class="flex items-center gap-3 text-[11px]">
            <span class="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <span class="h-2.5 w-2.5 rounded-sm bg-cyan-400"></span> สระผู้ใหญ่/หลัก
            </span>
            <span class="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span class="h-2.5 w-2.5 rounded-sm bg-amber-400"></span> สระเด็ก
            </span>
          </div>
        </div>

        <div class="space-y-3 pt-1">
          {#each trafficChartData as row}
            {@const adultWidth = Math.max(6, Math.round((row.adultCount / maxTrafficCount) * 100))}
            {@const kidsWidth = Math.max(6, Math.round((row.kidsCount / maxTrafficCount) * 100))}
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-200">{row.slot}</span>
                <span class="text-[11px] text-slate-400">
                  ผู้ใหญ่ <strong class="text-cyan-300">{row.adultCount}</strong> • เด็ก <strong class="text-amber-300">{row.kidsCount}</strong> (รวม {row.totalCount} คน)
                </span>
              </div>
              <div class="space-y-1">
                <!-- แถบสระผู้ใหญ่ -->
                <div class="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300"
                    style="width: {adultWidth}%;"
                  ></div>
                </div>
                <!-- แถบสระเด็ก -->
                <div class="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style="width: {kidsWidth}%;"
                  ></div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- อันดับคอร์สเรียนว่ายน้ำยอดนิยม -->
      <div class="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white">🏆 อันดับคอร์สเรียนยอดนิยม (Popular Courses)</h3>
          <span class="text-[11px] text-slate-400">เรียงตามจำนวนผู้สมัครเรียน</span>
        </div>

        <div class="space-y-2.5">
          {#each popularCourses as course, index}
            <div class="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 space-y-2">
              <div class="flex items-start justify-between gap-2 text-xs">
                <div>
                  <div class="font-bold text-white flex items-center gap-1.5">
                    <span
                      class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black {index === 0
                        ? 'bg-amber-400 text-slate-950'
                        : index === 1
                          ? 'bg-slate-300 text-slate-950'
                          : 'bg-amber-700 text-white'}"
                    >
                      #{index + 1}
                    </span>
                    <span>{course.name}</span>
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    ผู้สอน: {course.instructor} • ผู้เรียน {course.totalStudents}/{course.maxStudents} คน
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="font-extrabold text-emerald-400">{course.estimatedRevenue.toLocaleString()} ฿</div>
                  <div class="text-[10px] text-cyan-300 font-semibold">ความนิยม {course.occupancyPercent}%</div>
                </div>
              </div>

              <div class="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                  style="width: {course.occupancyPercent}%;"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- ประวัติการเช่า/ซื้อชุดว่ายน้ำและผ้าขนหนูล่าสุด -->
      <div class="space-y-2">
        <h3 class="text-sm font-bold text-white">👙 รายการเช่าและซื้อชุดว่ายน้ำ & ผ้าขนหนูล่าสุด ({$swimsuitOrders.length})</h3>
        <div class="space-y-2">
          {#each $swimsuitOrders as ord}
            <div class="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-xs space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white">[{ord.queueCode}] {ord.id} • {ord.customerName}</span>
                <span class="font-bold {ord.status === 'cancelled' ? 'text-rose-400' : 'text-emerald-400'}">
                  {ord.status === 'cancelled'
                    ? `ยกเลิก (หัก ${ord.penaltyAmount}฿)`
                    : `${ord.totalAmount.toLocaleString()} ฿`}
                </span>
              </div>
              {#if ord.vipDiscountAmount > 0}
                <div class="text-amber-300 text-[11px]">ส่วนลด VIP: -{ord.vipDiscountAmount.toLocaleString()}฿</div>
              {/if}
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
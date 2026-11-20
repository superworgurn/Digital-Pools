<script lang="ts">
  import { currentUser, isLoginModalOpen, addToast } from '../stores';
  import {
    Waves,
    User,
    Lock,
    ArrowRight,
    ShieldCheck,
    UserCheck,
    X,
    CheckCircle2,
    ArrowLeft
  } from 'lucide-svelte';

  let username = '';
  let password = '';
  let errorMsg = '';

  // สถานะ Mock-up หน้า LINE Login
  let showLineMockup = false;
  let selectedLineProfile: 'member' | 'oa' = 'member';
  let mockLineName = 'Worgurn (LINE Member)';

  function closeModal() {
    errorMsg = '';
    showLineMockup = false;
    isLoginModalOpen.set(false);
  }

  function handleLogin() {
    errorMsg = '';
    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      errorMsg = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน';
      return;
    }

    if (u === 'admin' && p === 'admin123') {
      currentUser.set({
        username: 'admin',
        name: 'ผู้จัดการฝ่ายปฏิบัติการ (Admin)',
        displayName: 'ผู้จัดการฝ่ายปฏิบัติการ (Admin)',
        role: 'admin'
      });
      isLoginModalOpen.set(false);
      addToast('ยินดีต้อนรับ Admin', 'เข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบเรียบร้อย', 'success');
    } else if (u === 'user' && p === 'user123') {
      currentUser.set({
        username: 'user',
        name: 'สมาชิกสระว่ายน้ำ (Member User)',
        displayName: 'สมาชิกสระว่ายน้ำ (Member User)',
        role: 'user'
      });
      isLoginModalOpen.set(false);
      addToast('ยินดีต้อนรับ Member', 'เข้าสู่ระบบสระว่ายน้ำเรียบร้อย', 'success');
    } else {
      errorMsg = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ลองใช้ปุ่ม Quick Login ด้านล่าง)';
    }
  }

  function quickLogin(role: 'admin' | 'user') {
    if (role === 'admin') {
      username = 'admin';
      password = 'admin123';
      handleLogin();
    } else {
      username = 'user';
      password = 'user123';
      handleLogin();
    }
  }

  function openLineMockup() {
    errorMsg = '';
    selectedLineProfile = 'member';
    mockLineName = 'Worgurn (LINE Member)';
    showLineMockup = true;
  }

  function chooseLineProfile(type: 'member' | 'oa') {
    selectedLineProfile = type;
    mockLineName =
      type === 'member' ? 'Worgurn (LINE Member)' : 'สมาชิก LINE OA (@806irvzm)';
  }

  function confirmLineMockLogin() {
    const displayName = mockLineName.trim() || 'สมาชิก LINE (Digital Pools)';
    currentUser.set({
      username: 'line_user',
      name: displayName,
      displayName,
      role: 'user'
    });
    showLineMockup = false;
    isLoginModalOpen.set(false);
    addToast(
      'เข้าสู่ระบบด้วย LINE สำเร็จ!',
      `เชื่อมต่อบัญชี ${displayName} กับสายข้อมือ RFID เรียบร้อย`,
      'success'
    );
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if ($isLoginModalOpen && e.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if $isLoginModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
    <!-- Backdrop คลิกพื้นที่ว่างเพื่อปิด -->
    <button
      type="button"
      class="absolute inset-0 bg-slate-950/75 backdrop-blur-sm cursor-pointer"
      on:click={closeModal}
      aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
    ></button>

    <!-- Login Card Modal -->
    <div
      class="relative z-10 w-full max-w-md rounded-3xl bg-slate-900/95 p-6 sm:p-8 border border-cyan-500/25 shadow-2xl"
    >
      <!-- ปุ่มกากบาทปิดหน้าต่าง -->
      <button
        type="button"
        on:click|stopPropagation={closeModal}
        aria-label="ปิด"
        class="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600 border border-slate-700 grid place-items-center text-slate-300 hover:text-white transition cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>

      {#if !showLineMockup}
        <div class="flex flex-col items-center text-center mb-6">
          <div
            class="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 grid place-items-center shadow-lg shadow-cyan-500/30 mb-3"
          >
            <Waves class="w-7 h-7 text-slate-900" />
          </div>
          <h2 class="text-xl font-extrabold text-white tracking-tight">เข้าสู่ระบบ Digital Pools</h2>
          <p class="text-xs text-slate-400 mt-1">
            เข้าสู่ระบบเพื่อจัดการแดชบอร์ด หรือปิดหน้านี้เพื่อเข้าชมและใช้งานทั่วไปได้ทันที
          </p>
        </div>

        <form on:submit|preventDefault={handleLogin} class="space-y-3.5">
          <div>
            <label for="username" class="block text-xs font-semibold text-slate-300 mb-1"
              >ชื่อผู้ใช้งาน (Username)</label
            >
            <div class="relative">
              <span
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500"
              >
                <User class="w-4 h-4" />
              </span>
              <input
                id="username"
                bind:value={username}
                placeholder="admin หรือ user"
                class="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold text-slate-300 mb-1"
              >รหัสผ่าน (Password)</label
            >
            <div class="relative">
              <span
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500"
              >
                <Lock class="w-4 h-4" />
              </span>
              <input
                id="password"
                type="password"
                bind:value={password}
                placeholder="••••••••"
                class="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {#if errorMsg}
            <div
              class="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] text-center font-medium"
            >
              {errorMsg}
            </div>
          {/if}

          <button
            type="submit"
            class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-[0.98] cursor-pointer"
          >
            <span>เข้าสู่ระบบ</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </form>

        <!-- ปุ่มเข้าสู่ระบบด้วย LINE (Mock-up หน้า Login) -->
        <div class="mt-3">
          <button
            type="button"
            on:click={openLineMockup}
            class="w-full py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#06C755]/25 transition active:scale-[0.98] cursor-pointer"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
              />
            </svg>
            <span>เข้าสู่ระบบด้วย LINE</span>
          </button>
        </div>

        <div class="mt-5 pt-4 border-t border-slate-700/60 space-y-3">
          <div class="text-[10px] text-slate-400 font-medium text-center">
            ปุ่มลัดทดสอบสิทธิ์ (Demo Accounts)
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              on:click={() => quickLogin('admin')}
              class="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-amber-400/40 text-left transition cursor-pointer"
            >
              <div class="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                <ShieldCheck class="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>
              <div class="text-[9px] text-slate-400">สิทธิ์เต็ม + Dashboard</div>
            </button>

            <button
              type="button"
              on:click={() => quickLogin('user')}
              class="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-emerald-400/40 text-left transition cursor-pointer"
            >
              <div class="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                <UserCheck class="w-3.5 h-3.5" />
                <span>User</span>
              </div>
              <div class="text-[9px] text-slate-400">สิทธิ์สมาชิกทั่วไป</div>
            </button>
          </div>

          <button
            type="button"
            on:click={closeModal}
            class="w-full py-2 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
          >
            เข้าชมและใช้งานเว็บไซต์โดยไม่ต้องล็อกอิน
          </button>
        </div>
      {:else}
        <!-- ==================== Mock-up หน้า LINE Login ==================== -->
        <div class="space-y-4">
          <div class="flex flex-col items-center text-center">
            <div
              class="w-13 h-13 rounded-2xl bg-[#06C755] grid place-items-center shadow-lg shadow-[#06C755]/30 mb-3 text-white"
            >
              <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
                />
              </svg>
            </div>
            <span
              class="rounded-full bg-[#06C755]/20 border border-[#06C755]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#06C755]"
            >
              LINE Login • Mock-up OAuth
            </span>
            <h2 class="text-lg font-extrabold text-white mt-1.5">เข้าสู่ระบบผ่านบัญชี LINE</h2>
            <p class="text-[11px] text-slate-400">
              เชื่อมต่อบัญชี LINE เพื่อรับบัตรคิวและผูกสายข้อมือ RFID อัตโนมัติ
            </p>
          </div>

          <div class="space-y-2">
            <div class="text-[11px] font-semibold text-slate-300">
              เลือกบัญชี LINE จำลอง (Mock Profile)
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                on:click={() => chooseLineProfile('member')}
                class="rounded-xl p-2.5 border text-left transition cursor-pointer {selectedLineProfile === 'member'
                  ? 'border-[#06C755] bg-[#06C755]/15 text-white'
                  : 'border-slate-700 bg-slate-800/60 text-slate-300'}"
              >
                <div class="text-xs font-bold">Worgurn</div>
                <div class="text-[10px] text-[#06C755]">LINE Member</div>
              </button>
              <button
                type="button"
                on:click={() => chooseLineProfile('oa')}
                class="rounded-xl p-2.5 border text-left transition cursor-pointer {selectedLineProfile === 'oa'
                  ? 'border-[#06C755] bg-[#06C755]/15 text-white'
                  : 'border-slate-700 bg-slate-800/60 text-slate-300'}"
              >
                <div class="text-xs font-bold">LINE OA User</div>
                <div class="text-[10px] text-[#06C755]">@806irvzm</div>
              </button>
            </div>

            <div>
              <label for="mock-line-name" class="block text-[11px] text-slate-400 mb-1"
                >ชื่อโปรไฟล์ LINE ที่แสดงในระบบ</label
              >
              <input
                id="mock-line-name"
                type="text"
                bind:value={mockLineName}
                class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#06C755]"
              />
            </div>
          </div>

          <div
            class="rounded-xl border border-slate-700/80 bg-slate-800/50 p-3 space-y-1.5 text-[11px] text-slate-300"
          >
            <div class="font-bold text-white text-xs">สิทธิ์ที่ Digital Pools ขอเข้าถึง:</div>
            <div class="flex items-center gap-1.5">
              <CheckCircle2 class="w-3.5 h-3.5 text-[#06C755] shrink-0" />
              <span>ข้อมูลโปรไฟล์ LINE (ชื่อที่แสดงและรหัสสมาชิก)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <CheckCircle2 class="w-3.5 h-3.5 text-[#06C755] shrink-0" />
              <span>ผูกสายข้อมือ RFID สำหรับสแกนผ่านราวกั้นอัตโนมัติ</span>
            </div>
            <div class="flex items-center gap-1.5">
              <CheckCircle2 class="w-3.5 h-3.5 text-[#06C755] shrink-0" />
              <span>ส่งบัตรคิวและแจ้งเตือนผ่าน LINE OA (@806irvzm)</span>
            </div>
          </div>

          <div class="space-y-2 pt-1">
            <button
              type="button"
              on:click={confirmLineMockLogin}
              class="w-full py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#06C755]/25 transition cursor-pointer"
            >
              <span>อนุญาตและเข้าสู่ระบบด้วย LINE</span>
              <ArrowRight class="w-4 h-4" />
            </button>

            <button
              type="button"
              on:click={() => (showLineMockup = false)}
              class="w-full py-2 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft class="w-3.5 h-3.5" />
              <span>กลับไปหน้าเข้าสู่ระบบปกติ</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
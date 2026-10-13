<script lang="ts">
  import { currentUser, isLoginModalOpen, addToast } from '../stores';
  import { Waves, User, Lock, ArrowRight, ShieldCheck, UserCheck, X } from 'lucide-svelte';

  let username = '';
  let password = '';
  let errorMsg = '';

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
        role: 'admin'
      });
      isLoginModalOpen.set(false);
      addToast('ยินดีต้อนรับ Admin', 'เข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบเรียบร้อย', 'success');
    } else if (u === 'user' && p === 'user123') {
      currentUser.set({
        username: 'user',
        name: 'สมาชิกสระว่ายน้ำ (Member User)',
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

  function closeModal() {
    isLoginModalOpen.set(false);
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
  <!-- Backdrop -->
  <button class="absolute inset-0 bg-slate-950/75 backdrop-blur-sm cursor-default" on:click={closeModal} aria-label="Close"></button>

  <!-- Login Card Modal -->
  <div class="glass relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 border border-cyan-500/25 shadow-2xl">
    <button class="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 grid place-items-center text-slate-400 hover:text-red-300 transition cursor-pointer" on:click={closeModal}>
      <X class="w-4 h-4" />
    </button>

    <div class="flex flex-col items-center text-center mb-6">
      <div class="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 grid place-items-center shadow-lg shadow-cyan-500/30 mb-3 float-anim">
        <Waves class="w-7 h-7 text-slate-900" />
      </div>
      <h2 class="text-xl font-extrabold gradient-text tracking-tight">เข้าสู่ระบบ Digital Pools</h2>
      <p class="text-xs text-slate-400 mt-1">เข้าสู่ระบบเพื่อจองรอบ ว่ายน้ำ สมัครคอร์ส และใช้งานเต็มรูปแบบ</p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="space-y-3.5">
      <div>
        <label for="username" class="block text-xs font-semibold text-slate-300 mb-1">ชื่อผู้ใช้งาน (Username)</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
        <label for="password" class="block text-xs font-semibold text-slate-300 mb-1">รหัสผ่าน (Password)</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
        <div class="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] text-center font-medium">
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

    <div class="mt-5 pt-4 border-t border-slate-700/60">
      <div class="text-[10px] text-slate-400 font-medium text-center mb-2.5">ปุ่มลัดทดสอบสิทธิ์ (Demo Accounts)</div>
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
    </div>
  </div>
</div>

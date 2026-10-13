
<script lang="ts">
  import { toasts } from '../stores';
  import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-svelte';

  const icons = {
    success: CheckCircle2,
    danger: AlertTriangle,
    warn: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    danger: 'text-red-400 bg-red-500/10 border-red-500/30',
    warn: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  };
</script>

<div class="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-sm">
  {#each $toasts as t (t.id)}
    <div class="glass-soft border rounded-2xl p-3.5 flex items-start gap-3 w-full shadow-2xl pointer-events-auto animate-bounce-short">
      <div class="w-7 h-7 rounded-lg grid place-items-center shrink-0 border {colors[t.type]}">
        <svelte:component this={icons[t.type]} class="w-4 h-4" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-xs font-bold text-slate-100">{t.title}</div>
        <div class="text-[11px] text-slate-400 leading-snug mt-0.5">{t.msg}</div>
      </div>
    </div>
  {/each}
</div>
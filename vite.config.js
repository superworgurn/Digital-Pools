import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss()
  ],
  server: {
    host: true,
    port: 5173,
    // อนุญาตให้เข้าถึงผ่าน Cloudflare Tunnel ได้ทุก Subdomain
    allowedHosts: ['.trycloudflare.com']
  }
});

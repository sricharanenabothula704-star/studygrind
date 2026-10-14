import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

// GitHub Pages can't set response headers, so production builds carry the CSP as a <meta> tag.
// (vercel.json sets the same policy as a real header.) Dev is excluded: HMR needs inline scripts.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'"

const cspMeta = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
})

// https://vite.dev/config/
export default defineConfig({
  // set BASE_PATH=/repo-name/ for GitHub Pages project sites; '/' everywhere else
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), cspMeta()],
})

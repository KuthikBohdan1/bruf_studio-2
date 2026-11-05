import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Where Django looks for the built SPA (settings.FRONTEND_DIST). */
const OUT_DIR = fileURLToPath(new URL('../django/frontend_dist', import.meta.url))

/** Origin of the Django server during `npm run dev`. */
const DEV_API_TARGET = process.env.DEV_API_TARGET ?? 'http://127.0.0.1:8008'

/**
 * index.html doubles as a Django template: the production server renders it and
 * injects SEO tags from the database. Those `{{ ... }}`/`{% ... %}` tags are
 * meaningless to the dev server, so substitute readable placeholders instead.
 */
function djangoTemplatePlaceholders(): Plugin {
  const devValues: Record<string, string> = {
    'seo.title': 'bruf — dev',
    'seo.description': 'Development build served by Vite.',
    'seo.canonical': DEV_API_TARGET + '/',
    'seo.site_name': 'bruf',
    'seo.lang': 'uk',
    'seo.robots': 'noindex',
    'seo.locale': 'uk_UA',
    'seo.image': '',
    'seo.og_type': 'website',
    'seo.jsonld': '{}',
    'seo.url_uk': DEV_API_TARGET + '/',
    'seo.url_en': DEV_API_TARGET + '/en/',
  }

  return {
    name: 'django-template-placeholders',
    apply: 'serve',
    transformIndexHtml(html) {
      return html
        .replace(/\{%[^%]*%\}/g, '')
        .replace(/\{\{\s*([\w.]+)(?:\|[\w:"'\s]+)?\s*\}\}/g, (_, key: string) => devValues[key] ?? '')
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), djangoTemplatePlaceholders()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Django serves the bundles from STATIC_URL.
  base: '/static/',
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Keep React in its own long-lived chunk so app edits don't bust it.
        manualChunks: { react: ['react', 'react-dom'] },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: DEV_API_TARGET, changeOrigin: true },
      '/media': { target: DEV_API_TARGET, changeOrigin: true },
    },
  },
})

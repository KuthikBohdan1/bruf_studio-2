import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { greetInConsole } from '@/lib/easterEggs'
import { startAutoTheme } from '@/lib/theme'
import '@/styles.css'

// The router restores positions itself once content has rendered (lib/router.ts);
// the browser's own attempt would fire before the data arrives and miss.
history.scrollRestoration = 'manual'

// index.html applied the initial theme; keep it following the clock and the OS.
startAutoTheme()
greetInConsole()

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

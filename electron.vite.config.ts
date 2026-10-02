import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const alias = {
  '@shared': resolve(__dirname, 'src/shared')
}

export default defineConfig({
  main: {
    resolve: { alias }
  },
  preload: {
    resolve: { alias }
  },
  renderer: {
    resolve: {
      alias: { ...alias, '@renderer': resolve(__dirname, 'src/renderer') }
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          palette: resolve(__dirname, 'src/renderer/palette.html'),
          manager: resolve(__dirname, 'src/renderer/manager.html')
        }
      }
    }
  }
})

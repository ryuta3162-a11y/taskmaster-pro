import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// これが「GAS用にすべてを1枚のHTMLにまとめる」ための魔法の設定です
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    cssInlineLimit: 100000000,
    assetsInlineLimit: 100000000,
  }
})
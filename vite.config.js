import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' ทำให้ไฟล์ build เปิดได้ทั้งบน Vercel, GitHub Pages (โฟลเดอร์ย่อย) และ vite preview
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5181 },
  preview: { port: 5181 },
})

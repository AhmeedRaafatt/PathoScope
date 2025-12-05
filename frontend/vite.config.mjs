import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'  // ← This is the magic line!

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // ← Adds Tailwind automatically
  ],
})
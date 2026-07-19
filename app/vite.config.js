import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset paths relative so the build works both at
// https://roadtrip.1984drum.com/ and at the *.github.io/roadtrip/ fallback URL
export default defineConfig({
  plugins: [react()],
  base: './',
})

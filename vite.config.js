import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  include: ['react-chartjs-2', 'chart.js'],

  
  plugins: [react()],
})

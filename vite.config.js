import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: { rolldownOptions: { input: ['index.html', 'jummo-room.html'] } },
    server: {
      host: '127.0.0.1', strictPort: true, port: 5173,
      fs: { deny: ['**/.local/**', '**/.env*', '**/.git/**', '**/*.{pem,key,crt}'] },
      proxy: { '/api': env.API_PROXY_TARGET || 'http://127.0.0.1:3001' },
    },
  }
})

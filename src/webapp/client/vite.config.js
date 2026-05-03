import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-markdown': ['react-markdown'],
          'vendor-zustand':  ['zustand'],
          'vendor-axios':    ['axios'],
          'vendor-lucide':   ['lucide-react'],
          'panels-docs':     ['./src/components/document/DocumentAgentPanel.jsx'],
          'panels-research': ['./src/components/research/ResearchPanel.jsx'],
          'panels-generate': ['./src/components/GeneratePanel.jsx'],
          'panels-skills':   ['./src/components/SkillsPanel.jsx'],
          'panels-connect':  [
            './src/components/connectors/ConnectorsPanel.jsx',
            './src/components/mcp/MCPPanel.jsx'
          ],
        }
      }
    },
    chunkSizeWarningLimit: 300,
  }
});

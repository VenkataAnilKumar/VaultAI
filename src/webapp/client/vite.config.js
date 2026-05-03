import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/app/' : '/',
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime',
      'axios', 'zustand', 'lucide-react',
      'react-markdown',
      'remark-parse', 'remark-rehype', 'unified',
      'mdast-util-from-markdown', 'mdast-util-to-hast', 'mdast-util-to-string',
      'mdast-util-phrasing', 'mdast-util-to-markdown',
      'micromark', 'micromark-core-commonmark',
      'micromark-factory-destination', 'micromark-factory-label',
      'micromark-factory-space', 'micromark-factory-title',
      'micromark-factory-whitespace', 'micromark-util-character',
      'micromark-util-chunked', 'micromark-util-classify-character',
      'micromark-util-combine-extensions', 'micromark-util-decode-numeric-character-reference',
      'micromark-util-decode-string', 'micromark-util-encode',
      'micromark-util-html-tag-name', 'micromark-util-normalize-identifier',
      'micromark-util-resolve-all', 'micromark-util-sanitize-uri',
      'micromark-util-subtokenize', 'micromark-util-symbol',
      'hast-util-to-jsx-runtime', 'hast-util-whitespace',
      'unist-util-is', 'unist-util-visit', 'unist-util-visit-parents',
      'unist-util-position', 'unist-util-stringify-position',
      'property-information', 'comma-separated-tokens', 'space-separated-tokens',
      'decode-named-character-reference', 'trim-lines', 'zwitch',
      'vfile', 'vfile-message', 'is-plain-obj', 'longest-streak',
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/components/Chat.jsx',
        './src/components/FileBrowser.jsx',
        './src/components/StatusBar.jsx',
        './src/components/ModelPanel.jsx',
        './src/store/useStore.js',
        './src/api/client.js',
      ]
    },
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

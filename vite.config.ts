import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function html2canvasPatchPlugin() {
  return {
    name: 'html2canvas-patch-unsupported-colors',
    transform(code: string, id: string) {
      if (id.includes('html2canvas')) {
        let newCode = code.replace(
          /throw new Error\(\s*["']Attempting to parse an unsupported color function\s*["']\s*\+\s*value\.name\s*\+\s*["']["']\s*\);?/g,
          'return typeof pack === "function" ? pack(15, 118, 110, 1) : 0;'
        );
        newCode = newCode.replace(
          /throw new Error\(\`Attempting to parse an unsupported color function "\${value\.name}"\`\);?/g,
          'return typeof pack === "function" ? pack(15, 118, 110, 1) : 0;'
        );
        return {
          code: newCode,
          map: null,
        };
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), html2canvasPatchPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

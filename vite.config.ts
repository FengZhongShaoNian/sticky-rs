import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import * as path from "node:path";
import svgLoader from 'vite-svg-loader';
import i18nextLoader from 'vite-plugin-i18next-loader';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue(), svgLoader(), i18nextLoader({ paths: ['./locales'] })],

  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'main.html'),
        toolbar: path.resolve(__dirname, 'toolbar.html'),
      }
    }
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));

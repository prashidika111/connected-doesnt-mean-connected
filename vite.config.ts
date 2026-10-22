import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { investigatePlugin } from './server/vitePlugin';

export default defineConfig({
  plugins: [react(), investigatePlugin()],
});

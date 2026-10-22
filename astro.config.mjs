import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://yakumo-hx.github.io',
  base: '/Dammaz-Kron',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});

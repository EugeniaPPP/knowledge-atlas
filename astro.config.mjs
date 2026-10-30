import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://eugeniappp.github.io',
  base: '/knowledge-atlas',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), react()],
  devToolbar: { enabled: false },
});

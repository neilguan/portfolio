import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig, type Plugin } from 'vite';

function socialMetadata(siteUrl: string): Plugin {
  const imageUrl = new URL('og.png', siteUrl).toString();

  return {
    name: 'portfolio-social-metadata',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { property: 'og:type', content: 'website' },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:title',
            content: 'Neil Guan — Systems, Robotics, and Applied AI',
          },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:description',
            content:
              'Deterministic GPU software, robotics research, local AI infrastructure, and hands-on hardware.',
          },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: imageUrl },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: imageUrl },
          injectTo: 'head',
        },
      ];
    },
  };
}

const repository = process.env.GITHUB_REPOSITORY ?? '';
const [owner, repo] = repository.split('/');
const isUserSite = Boolean(owner && repo === `${owner}.github.io`);
const inferredSiteUrl = owner
  ? `https://${owner}.github.io/${isUserSite ? '' : `${repo}/`}`
  : 'http://localhost:4173/';
const siteUrl = process.env.VITE_SITE_URL ?? inferredSiteUrl;

export default defineConfig({
  base: './',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react(), socialMetadata(siteUrl)],
  build: {
    outDir: 'dist-pages',
    emptyOutDir: true,
  },
});

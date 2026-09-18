import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from '../app/page';
import Devblog from '../app/devblog/page';
import AudioDevblogPage from '../app/devblog/audio/page';
import PixelArtDevblogPage from '../app/devblog/pixel-art/page';
import RiggingDevblogPage from '../app/devblog/rigging/page';
import StructuresDevblogPage from '../app/devblog/structures/page';
import '../app/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Portfolio root element was not found.');
}

const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
const route = window.location.pathname.slice(basePath.length).replace(/^\/+|\/+$/g, '');
const pages: Record<string, ReactNode> = {
  devblog: <Devblog />,
  'devblog/audio': <AudioDevblogPage />,
  'devblog/pixel-art': <PixelArtDevblogPage />,
  'devblog/rigging': <RiggingDevblogPage />,
  'devblog/structures': <StructuresDevblogPage />,
};

createRoot(root).render(
  <StrictMode>
    {pages[route] ?? <Home />}
  </StrictMode>,
);

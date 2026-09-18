import type { Metadata } from 'next';
import DevblogTopicPage from '../DevblogTopicPage';
import { devblogTopics } from '../topic-data';

export const metadata: Metadata = {
  title: 'Pixel-art process — Devblog',
  description:
    'How pixel-art generation moved from code and diffusion experiments to compiled Aseprite and inspectable MCP workflows.',
};

export default function PixelArtDevblogPage() {
  return <DevblogTopicPage slug="pixelArt" topic={devblogTopics.pixelArt} />;
}

import type { Metadata } from 'next';
import DevblogTopicPage from '../DevblogTopicPage';
import { devblogTopics } from '../topic-data';

export const metadata: Metadata = {
  title: 'Audio process — Devblog',
  description:
    'How the mcgpu-v3 audio workflow moved from paid generation to local MCP experiments, AI-assisted listening, and sourced audio.',
};

export default function AudioDevblogPage() {
  return <DevblogTopicPage slug="audio" topic={devblogTopics.audio} />;
}

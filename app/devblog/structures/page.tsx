import type { Metadata } from 'next';
import DevblogTopicPage from '../DevblogTopicPage';
import { devblogTopics } from '../topic-data';

export const metadata: Metadata = {
  title: 'Structure process — Devblog',
  description:
    'How structure authoring moved from custom harnesses and GPU-friendly scripting to an exact MineBench-based workflow.',
};

export default function StructuresDevblogPage() {
  return <DevblogTopicPage slug="structures" topic={devblogTopics.structures} />;
}

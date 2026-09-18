import type { Metadata } from 'next';
import DevblogTopicPage from '../DevblogTopicPage';
import { devblogTopics } from '../topic-data';

export const metadata: Metadata = {
  title: 'Rigging process — Devblog',
  description:
    'How creature rigging moved from technical movement studies to reference-led authoring, encounter motion, and a 16-action baseline.',
};

export default function RiggingDevblogPage() {
  return <DevblogTopicPage slug="rigging" topic={devblogTopics.rigging} />;
}

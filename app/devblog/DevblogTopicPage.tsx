import type { DevblogArtifact, DevblogTopic } from './topic-data';

function Artifact({ item }: { item: DevblogArtifact }) {
  const src = item.src.startsWith('/') ? `${import.meta.env.BASE_URL}${item.src.slice(1)}` : item.src;
  return <figure className="engineering-artifact">
    <div className="engineering-media">
      {item.kind === 'audio' ? <audio controls preload="metadata" src={src} aria-label={item.label} />
        : item.kind === 'video' ? <video controls preload="metadata" playsInline src={src} aria-label={item.label} />
        : <a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${item.label}`}><img src={src} alt={item.label} loading="lazy" /></a>}
    </div>
    <figcaption><strong>{item.label}</strong><span>{item.caption}</span></figcaption>
  </figure>;
}

export function BlogHeader() {
  return <header className="site-header engineering-header"><a className="wordmark" href={import.meta.env.BASE_URL}>Neil Guan</a><nav aria-label="Main navigation"><a href={`${import.meta.env.BASE_URL}devblog/`}>Development log</a><a href={import.meta.env.BASE_URL}>Portfolio</a></nav></header>;
}

export default function DevblogTopicPage({ slug, topic }: { slug: string; topic: DevblogTopic }) {
  return <main className="engineering-blog" data-topic={slug}>
    <BlogHeader />
    <header className="engineering-title">
      <a href={`${import.meta.env.BASE_URL}devblog/`} className="engineering-back">← All development notes</a>
      <p className="engineering-eyebrow">mcgpu-v3 / {topic.label}</p>
      <h1>{topic.title}</h1><p className="engineering-dek">{topic.dek}</p>
      <p className="engineering-date">Neil Guan · {topic.updated ? `Updated ${topic.updated}` : 'September 14, 2026'}</p>
    </header>
    <div className="engineering-layout">
      <aside className="engineering-toc"><nav aria-label="Article contents"><p>Contents</p><ol>{topic.steps.map(s=><li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol><a href="#current">Where this led</a></nav></aside>
      <article>
        <p className="engineering-intro">{topic.premise}</p>
        {topic.steps.map((s,index)=><section id={s.id} className="engineering-section" key={s.id}>
          <p className="engineering-number">{String(index+1).padStart(2,'0')} / {topic.label}</p>
          <h2>{s.title}</h2>
          <div className="engineering-prose">{s.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div>
          {s.record && <aside className="engineering-record"><p className="engineering-record-label">{s.record.label}</p><p>{s.record.text}</p></aside>}
          {s.artifacts.length>0 && <div className={`engineering-artifacts ${s.artifacts.length===1?'engineering-artifacts-single':''}`}>{s.artifacts.map(a=><Artifact key={a.src} item={a}/>)}</div>}
          {s.sources.length>0 && <p className="engineering-sources"><span>Source records</span>{s.sources.map(s=><a key={s.href} href={s.href.startsWith('/') ? `${import.meta.env.BASE_URL}${s.href.slice(1)}` : s.href} target="_blank" rel="noreferrer">{s.label}</a>)}</p>}
        </section>)}
        <section id="current" className="engineering-section engineering-current"><p className="engineering-number">Where this led</p><h2>{topic.currentTitle}</h2><p>{topic.currentText}</p></section>
        <footer className="engineering-article-footer"><a href={`${import.meta.env.BASE_URL}devblog/`}>Back to development log</a></footer>
      </article>
    </div>
  </main>;
}

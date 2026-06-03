export default function SummaryPanel({ article }) {
  if (!article) {
    return (
      <section className="panel summary-panel summary-panel--empty">
        <p className="muted">Ingest an article to see its summary here.</p>
      </section>
    );
  }

  return (
    <section className="panel summary-panel" aria-labelledby="summary-heading">
      <h2 id="summary-heading">{article.title}</h2>
      <p className="meta">
        Indexed <strong>{article.chunkCount}</strong> chunks for chat
      </p>
      <div className="summary-text">{article.summary}</div>
    </section>
  );
}

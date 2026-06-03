export default function UrlForm({
  url,
  onUrlChange,
  onSubmit,
  loading,
  disabled,
  error,
}) {
  return (
    <section className="panel ingest-panel" aria-labelledby="ingest-heading">
      <h2 id="ingest-heading">Load article</h2>
      <p className="panel-hint">
        Paste an English Wikipedia URL (https://en.wikipedia.org/wiki/…)
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="wiki-url" className="sr-only">
          Wikipedia URL
        </label>
        <input
          id="wiki-url"
          type="url"
          placeholder="https://en.wikipedia.org/wiki/..."
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading || disabled || !url.trim()}>
          {loading ? 'Ingesting…' : 'Ingest'}
        </button>
      </form>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

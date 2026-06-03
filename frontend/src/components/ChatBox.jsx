import { useEffect, useRef } from 'react';

function SourceList({ sources }) {
  if (!sources?.length) {
    return null;
  }

  return (
    <details className="sources">
      <summary>Sources ({sources.length})</summary>
      <ul>
        {sources.map((source, index) => (
          <li key={`${source.section}-${index}`}>
            <span className="source-section">{source.section}</span>
            <span className="source-score">
              {(source.score * 100).toFixed(0)}% match
            </span>
            <p>{source.excerpt}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Message({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message message--${message.role}`}>
      <div className="message-label">{isUser ? 'You' : 'Assistant'}</div>
      <div className="message-body">{message.content}</div>
      {!isUser && <SourceList sources={message.sources} />}
    </div>
  );
}

export default function ChatBox({
  messages,
  input,
  onInputChange,
  onSend,
  loading,
  disabled,
  error,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <section className="panel chat-panel" aria-labelledby="chat-heading">
      <h2 id="chat-heading">Chat</h2>
      {!disabled && (
        <p className="panel-hint">Ask questions about the ingested article only.</p>
      )}

      <div
        className="messages"
        ref={scrollRef}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && !loading && (
          <p className="muted messages-empty">
            {disabled
              ? 'Ingest a Wikipedia article to start chatting.'
              : 'Send a question about the article.'}
          </p>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {loading && (
          <div className="message message--assistant message--typing">
            <div className="message-label">Assistant</div>
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Your question
        </label>
        <input
          id="chat-input"
          type="text"
          placeholder={
            disabled ? 'Ingest an article first…' : 'Ask a question…'
          }
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          disabled={disabled || loading}
        />
        <button type="submit" disabled={disabled || loading || !input.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}

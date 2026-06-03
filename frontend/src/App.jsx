import { useState } from 'react';
import { ingestArticle, sendChatMessage } from './api/client';
import UrlForm from './components/UrlForm';
import SummaryPanel from './components/SummaryPanel';
import ChatBox from './components/ChatBox';

let messageId = 0;
function nextMessageId() {
  messageId += 1;
  return messageId;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [article, setArticle] = useState(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState('');

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const chatEnabled = Boolean(article);

  async function handleIngest() {
    setIngestError('');
    setIngestLoading(true);
    setMessages([]);
    setChatInput('');
    setChatError('');

    try {
      const result = await ingestArticle(url.trim());
      setArticle(result);
    } catch (error) {
      setArticle(null);
      setIngestError(
        error instanceof Error ? error.message : 'Failed to ingest article',
      );
    } finally {
      setIngestLoading(false);
    }
  }

  async function handleSend() {
    const question = chatInput.trim();
    if (!question || !chatEnabled || chatLoading) {
      return;
    }

    setChatError('');
    setChatInput('');

    const userMessage = {
      id: nextMessageId(),
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);

    try {
      const result = await sendChatMessage(question);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: 'assistant',
          content: result.answer,
          sources: result.sources ?? [],
        },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : 'Failed to send message',
      );
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wikipedia RAG Chat</h1>
        <p className="tagline">
          Ingest a Wikipedia article, then ask questions grounded in its content.
        </p>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <UrlForm
            url={url}
            onUrlChange={setUrl}
            onSubmit={handleIngest}
            loading={ingestLoading}
            disabled={ingestLoading}
            error={ingestError}
          />
          <SummaryPanel article={article} />
        </aside>

        <main className="main">
          <ChatBox
            messages={messages}
            input={chatInput}
            onInputChange={setChatInput}
            onSend={handleSend}
            loading={chatLoading}
            disabled={!chatEnabled}
            error={chatError}
          />
        </main>
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function parseErrorResponse(response) {
  try {
    const data = await response.json();
    if (data?.error) {
      return data.error;
    }
  } catch {
    // ignore JSON parse errors
  }
  return `Request failed (${response.status})`;
}

export async function ingestArticle(url) {
  const response = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function sendChatMessage(message) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

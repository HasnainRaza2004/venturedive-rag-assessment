#!/bin/sh
set -e

export OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1:11434}"
MODELS="llama3.2:3b nomic-embed-text"

echo "Starting Ollama server at ${OLLAMA_HOST}..."
ollama serve &
SERVE_PID=$!

echo "Waiting for Ollama API..."
until ollama list >/dev/null 2>&1; do
  sleep 2
done

for model in $MODELS; do
  if ollama list 2>/dev/null | grep -q "$model"; then
    echo "Model already present: $model"
  else
    echo "Pulling model: $model (first run may take 10-20 minutes)..."
    ollama pull "$model" || {
      echo "Failed to pull $model — check network/Docker disk space"
      exit 1
    }
    echo "Finished pulling: $model"
  fi
done

echo "Ollama ready with required models."
wait $SERVE_PID

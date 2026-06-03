const articleState = {
  isIndexed: false,
  title: null,
  summary: null,
  collectionName: null,
  chunkCount: 0,
};

function resetArticleState() {
  articleState.isIndexed = false;
  articleState.title = null;
  articleState.summary = null;
  articleState.collectionName = null;
  articleState.chunkCount = 0;
}

function setArticleState(state, { title, summary, collectionName, chunkCount }) {
  state.isIndexed = true;
  state.title = title;
  state.summary = summary;
  state.collectionName = collectionName;
  state.chunkCount = chunkCount;
}

module.exports = { articleState, resetArticleState, setArticleState };

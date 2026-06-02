const WIKI_ARTICLE_HTML = `
<!DOCTYPE html>
<html lang="en">
  <body>
    <h1 id="firstHeading">VentureDive Test Article</h1>
    <div id="content">
      <div id="mw-content-text" class="mw-body-content">
        <p>Lead paragraph about the test subject.</p>
        <h2>History</h2>
        <p>The project began in 2024.</p>
        <h3>Early years</h3>
        <p>Initial development focused on RAG.</p>
        <h2>See also</h2>
        <p>Related topics appear here.</p>
      </div>
    </div>
  </body>
</html>
`.trim();

module.exports = { WIKI_ARTICLE_HTML };

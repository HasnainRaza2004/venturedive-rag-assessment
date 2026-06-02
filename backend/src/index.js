const { createApp } = require('./app');
const { env } = require('./config/env');

const app = createApp();

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

module.exports = app;

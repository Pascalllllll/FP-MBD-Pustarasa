'use strict';

const app = require('./src/app');
const env = require('./src/config/env');
const { assertConnection } = require('./src/config/db');

(async () => {
  try {
    await assertConnection();
    // eslint-disable-next-line no-console
    console.log('[db] connected to MySQL database:', env.db.database);

    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[api] PustaRasa backend running on http://localhost:${env.port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[fatal] could not start server:', err.message);
    process.exit(1);
  }
})();

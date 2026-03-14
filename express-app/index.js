'use strict';

const createApp = process.env.DATABASE_URL
  ? require('./app-pg')
  : require('./app');

const dbArg = process.env.DATABASE_URL || process.env.DB_PATH;
const { app } = createApp(dbArg);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express running at http://localhost:${PORT}`));

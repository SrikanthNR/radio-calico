'use strict';

const createApp = require('./app');

const { app } = createApp(process.env.DB_PATH);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express running at http://localhost:${PORT}`));

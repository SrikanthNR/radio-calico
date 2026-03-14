'use strict';

const createApp = require('./app');

const { app } = createApp();

const PORT = 3000;
app.listen(PORT, () => console.log(`Express running at http://localhost:${PORT}`));

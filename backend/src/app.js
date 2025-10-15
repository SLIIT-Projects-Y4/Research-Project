const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/healthz', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

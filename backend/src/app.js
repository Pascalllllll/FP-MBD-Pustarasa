'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) =>
  res.json({ success: true, service: 'pustarasa-api', time: new Date().toISOString() })
);

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

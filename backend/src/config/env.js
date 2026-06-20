'use strict';

require('dotenv').config();

/**
 * Centralised, validated environment configuration.
 * Every other module imports from here instead of reading process.env
 * directly, so misconfiguration fails fast and in one place.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pustarasa',
    connectionLimit: parseInt(process.env.DB_POOL || '10', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'pustarasa-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = env;

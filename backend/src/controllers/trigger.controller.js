'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/trigger.service');

const list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.list() });
});
const call = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.call(req.params.name, req.body) });
});

module.exports = { list, call };

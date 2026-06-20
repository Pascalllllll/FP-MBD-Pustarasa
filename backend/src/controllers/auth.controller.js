'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await service.login(username, password);
  res.json({ success: true, data: result });
});

const me = asyncHandler(async (req, res) => {
  const data = await service.profile(req.user.id);
  res.json({ success: true, data });
});

module.exports = { login, me };

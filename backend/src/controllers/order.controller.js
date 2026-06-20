'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/order.service');

const list = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.list(req.query.search) }));
const get = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.get(req.params.id) }));
const checkout = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.checkout(req.body) }));
const daily = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.daily() }));
const byType = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.byType() }));

module.exports = { list, get, checkout, daily, byType };

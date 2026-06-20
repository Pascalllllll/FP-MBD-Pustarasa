'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/food.service');

const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.list(req.query.search) });
});
const available = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.available() });
});
const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.get(req.params.id) });
});
const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req.body) });
});
const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.update(req.params.id, req.body) });
});
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ success: true, message: 'Makanan dihapus' });
});
const favorites = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.favorites() });
});

module.exports = { list, available, get, create, update, remove, favorites };

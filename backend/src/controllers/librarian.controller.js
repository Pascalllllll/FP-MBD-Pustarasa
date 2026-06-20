'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/librarian.service');

const list = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.list(req.query.search) }));
const get = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.get(req.params.nik) }));
const create = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.create(req.body) }));
const update = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.update(req.params.nik, req.body) }));
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.nik);
  res.json({ success: true, message: 'Pustakawan dihapus' });
});
const performance = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.performance() }));

module.exports = { list, get, create, update, remove, performance };

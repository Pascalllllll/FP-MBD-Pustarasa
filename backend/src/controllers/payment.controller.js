'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/payment.service');

const list = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.list() }));
const get = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.get(req.params.id) }));
const create = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.create(req.body) }));
const update = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.update(req.params.id, req.body) }));
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ success: true, message: 'Metode pembayaran dihapus' });
});
const salesByMethod = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.salesByMethod() }));

module.exports = { list, get, create, update, remove, salesByMethod };

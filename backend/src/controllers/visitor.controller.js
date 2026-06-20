'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/visitor.service');

const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.list(req.query.search) });
});
const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.get(req.params.nik) });
});
const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req.body) });
});
const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.update(req.params.nik, req.body, req.user.role) });
});
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.nik);
  res.json({ success: true, message: 'Pengunjung dihapus' });
});
const addressHistory = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.addressHistory(req.params.nik) });
});

module.exports = { list, get, create, update, remove, addressHistory };

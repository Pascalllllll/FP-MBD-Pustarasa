'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/visit.service');

const list = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.list(req.query.active === 'true') }));
const checkIn = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.checkIn(req.body.nik, req.body.waktuMasuk) }));
const checkOut = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.checkOut(req.params.id, req.body.waktuKeluar) }));
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ success: true, message: 'Data kunjungan dihapus' });
});
const daily = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.daily() }));
const peakHours = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.peakHours() }));

module.exports = { list, checkIn, checkOut, remove, daily, peakHours };

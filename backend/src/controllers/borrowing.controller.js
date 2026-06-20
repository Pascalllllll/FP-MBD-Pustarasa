'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/borrowing.service');

const list = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.list(req.query.search) }));
const get = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.get(req.params.id) }));
const create = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.create(req.body) }));
const returnBook = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.returnBook(req.params.idDpm, req.body.tanggal) }));
const outstanding = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.outstanding() }));
const daily = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.daily() }));

module.exports = { list, get, create, returnBook, outstanding, daily };

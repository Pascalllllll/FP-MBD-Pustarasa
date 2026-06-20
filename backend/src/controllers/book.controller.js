'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/book.service');

const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.list(req.query.search) });
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
  res.json({ success: true, message: 'Buku dihapus' });
});
const genres = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.genres() });
});
const popular = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.popular() });
});
const newest = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.newest() });
});

module.exports = { list, get, create, update, remove, genres, popular, newest };

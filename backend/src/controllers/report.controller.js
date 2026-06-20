'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/report.service');

const dashboard = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.dashboard() }));
const listReports = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await service.listReports() }));
const getReport = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.getReport(req.params.slug) }));
const dailyRecap = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.dailyRecap(req.query.tanggal) }));

module.exports = { dashboard, listReports, getReport, dailyRecap };

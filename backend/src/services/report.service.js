'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/report.repository');

const dashboard = () => repo.dashboardSummary();
const listReports = () => repo.listReports();

async function getReport(slug) {
  const data = await repo.getReport(slug);
  if (!data) throw ApiError.notFound('Laporan tidak ditemukan');
  return data;
}

function dailyRecap(tanggal) {
  const date = tanggal || new Date().toISOString().slice(0, 10);
  return repo.dailyRecap(date);
}

module.exports = { dashboard, listReports, getReport, dailyRecap };

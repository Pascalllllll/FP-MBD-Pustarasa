'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/report.controller');

router.get('/dashboard', ctrl.dashboard);
router.get('/daily-recap', ctrl.dailyRecap);
router.get('/', ctrl.listReports);
router.get('/:slug', ctrl.getReport);

module.exports = router;

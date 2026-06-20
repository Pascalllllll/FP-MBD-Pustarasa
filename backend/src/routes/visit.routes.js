'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/visit.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

const FRONT_DESK = requireRole('admin', 'pustakawan', 'penjual');

router.get('/', ctrl.list);
router.get('/reports/daily', ctrl.daily);
router.get('/reports/peak-hours', ctrl.peakHours);
router.post('/check-in', FRONT_DESK, v.checkIn, validate, ctrl.checkIn);
router.patch('/:id/check-out', FRONT_DESK, v.checkOut, validate, ctrl.checkOut);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;

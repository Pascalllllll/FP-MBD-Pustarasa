'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

const CANTEEN = requireRole('admin', 'penjual');

router.get('/', ctrl.list);
router.get('/reports/daily', ctrl.daily);
router.get('/reports/by-type', ctrl.byType);
router.get('/:id', ctrl.get);
router.post('/checkout', CANTEEN, v.orderCheckout, validate, ctrl.checkout);

module.exports = router;

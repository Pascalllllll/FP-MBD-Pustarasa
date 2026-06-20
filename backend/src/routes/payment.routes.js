'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/reports/by-method', ctrl.salesByMethod);
router.get('/:id', ctrl.get);
router.post('/', requireRole('admin'), v.paymentCreate, validate, ctrl.create);
router.put('/:id', requireRole('admin'), v.paymentCreate, validate, ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;

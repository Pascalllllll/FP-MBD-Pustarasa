'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/seller.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/reports/sales', ctrl.sales);
router.get('/:nik', ctrl.get);
router.post('/', requireRole('admin'), v.sellerCreate, validate, ctrl.create);
router.put('/:nik', requireRole('admin'), v.sellerCreate, validate, ctrl.update);
router.delete('/:nik', requireRole('admin'), ctrl.remove);

module.exports = router;

'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/visitor.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

const FRONT_DESK = requireRole('admin', 'pustakawan', 'penjual');

router.get('/', ctrl.list);
router.get('/:nik', ctrl.get);
router.post('/', FRONT_DESK, v.visitorCreate, validate, ctrl.create);
router.put('/:nik', FRONT_DESK, v.visitorUpdate, validate, ctrl.update);
router.delete('/:nik', requireRole('admin'), ctrl.remove);

module.exports = router;

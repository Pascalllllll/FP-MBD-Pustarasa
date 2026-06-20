'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/food.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

const CANTEEN = requireRole('admin', 'penjual');

router.get('/', ctrl.list);
router.get('/available', ctrl.available);
router.get('/reports/favorites', ctrl.favorites);
router.get('/:id', ctrl.get);
router.post('/', CANTEEN, v.foodCreate, validate, ctrl.create);
router.put('/:id', CANTEEN, v.foodCreate, validate, ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;

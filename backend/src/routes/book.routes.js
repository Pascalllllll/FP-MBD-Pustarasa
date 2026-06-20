'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/book.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

const LIBRARY = requireRole('admin', 'pustakawan');

router.get('/', ctrl.list);
router.get('/meta/genres', ctrl.genres);
router.get('/reports/popular', ctrl.popular);
router.get('/reports/newest', ctrl.newest);
router.get('/:id', ctrl.get);
router.post('/', LIBRARY, v.bookCreate, validate, ctrl.create);
router.put('/:id', LIBRARY, v.bookCreate, validate, ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;

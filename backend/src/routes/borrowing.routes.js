'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/borrowing.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

const LIBRARY = requireRole('admin', 'pustakawan');

router.get('/', ctrl.list);
router.get('/reports/daily', ctrl.daily);
router.get('/reports/outstanding', ctrl.outstanding);
router.get('/reports/returned', ctrl.returned);
router.get('/:id', ctrl.get);
router.post('/', LIBRARY, v.borrowingCreate, validate, ctrl.create);
router.patch('/lines/:idDpm/return', LIBRARY, ctrl.returnBook);

module.exports = router;

'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/librarian.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/reports/performance', ctrl.performance);
router.get('/:nik', ctrl.get);
router.post('/', requireRole('admin'), v.librarianCreate, validate, ctrl.create);
router.put('/:nik', requireRole('admin'), v.librarianCreate, validate, ctrl.update);
router.delete('/:nik', requireRole('admin'), ctrl.remove);

module.exports = router;

'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/trigger.controller');
const { requireRole } = require('../middleware/auth');

router.get('/', ctrl.list);
router.post('/:name', requireRole('admin'), ctrl.call);

module.exports = router;

'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/function.controller');

router.get('/', ctrl.list);
router.get('/:name', ctrl.call);

module.exports = router;

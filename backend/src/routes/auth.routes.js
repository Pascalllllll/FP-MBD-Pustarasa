'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/login', v.login, validate, ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;

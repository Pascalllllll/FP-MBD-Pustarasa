'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

const authRoutes = require('./auth.routes');
const visitorRoutes = require('./visitor.routes');
const bookRoutes = require('./book.routes');
const foodRoutes = require('./food.routes');
const librarianRoutes = require('./librarian.routes');
const sellerRoutes = require('./seller.routes');
const paymentRoutes = require('./payment.routes');
const visitRoutes = require('./visit.routes');
const borrowingRoutes = require('./borrowing.routes');
const orderRoutes = require('./order.routes');
const reportRoutes = require('./report.routes');

// Public
router.use('/auth', authRoutes);

// Everything below requires a valid JWT
router.use(authenticate);

router.use('/pengunjung', visitorRoutes);
router.use('/buku', bookRoutes);
router.use('/makanan', foodRoutes);
router.use('/pustakawan', librarianRoutes);
router.use('/penjual', sellerRoutes);
router.use('/metode-pembayaran', paymentRoutes);
router.use('/kunjungan', visitRoutes);
router.use('/peminjaman', borrowingRoutes);
router.use('/pemesanan', orderRoutes);
router.use('/laporan', reportRoutes);

module.exports = router;

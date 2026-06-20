'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const authRepo = require('../repositories/auth.repository');

async function login(username, password) {
  const account = await authRepo.findByUsername(username);
  if (!account) throw ApiError.unauthorized('Username atau kata sandi salah');

  const ok = await bcrypt.compare(password, account.password_hash);
  if (!ok) throw ApiError.unauthorized('Username atau kata sandi salah');

  const token = jwt.sign(
    { username: account.username, role: account.role, staffNik: account.staff_nik },
    env.jwt.secret,
    { subject: String(account.id), expiresIn: env.jwt.expiresIn }
  );

  return {
    token,
    user: {
      id: account.id,
      username: account.username,
      fullName: account.full_name,
      role: account.role,
      staffNik: account.staff_nik,
    },
  };
}

async function profile(id) {
  const acc = await authRepo.findProfileById(id);
  if (!acc) throw ApiError.notFound('Akun tidak ditemukan');
  return {
    id: acc.id,
    username: acc.username,
    fullName: acc.full_name,
    role: acc.role,
    staffNik: acc.staff_nik,
    createdAt: acc.created_at,
  };
}

module.exports = { login, profile };

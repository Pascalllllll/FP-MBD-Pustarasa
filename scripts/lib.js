'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function setEnvValue(filePath, key, value) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let found = false;
  const next = lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) next.push(`${key}=${value}`);
  fs.writeFileSync(filePath, next.join('\n'));
}

/** Copies .env.example -> .env if missing; returns true if it created one. */
function ensureEnvFile(dir) {
  const target = path.join(dir, '.env');
  const example = path.join(dir, '.env.example');
  if (fs.existsSync(target) || !fs.existsSync(example)) return false;
  fs.copyFileSync(example, target);
  return true;
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} keluar dengan kode ${result.status}`);
  }
  return result;
}

const KEY_ENTER = [10, 13];
const KEY_CTRL_C = 3;
const KEY_CTRL_D = 4;
const KEY_BACKSPACE = [8, 127];

/** Reads a line of input without echoing it back to the terminal (falls back to plain input if not a TTY). */
function promptHidden(question) {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
  }

  return new Promise((resolve) => {
    process.stdout.write(question);
    let value = '';

    const onData = (chunk) => {
      const code = chunk[0];
      if (KEY_ENTER.includes(code) || code === KEY_CTRL_D) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
        return;
      }
      if (code === KEY_CTRL_C) {
        process.stdout.write('\n');
        process.exit(1);
      }
      if (KEY_BACKSPACE.includes(code)) {
        if (value.length) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }
      value += chunk.toString('utf8');
      process.stdout.write('*');
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

module.exports = { readEnvFile, setEnvValue, ensureEnvFile, run, promptHidden };

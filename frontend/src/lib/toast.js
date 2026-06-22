// Minimal pub/sub so non-React modules (api/client.js) can push toasts.
let nextId = 1;
const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify({ message, type = 'info' }) {
  const toast = { id: nextId++, message, type };
  listeners.forEach((fn) => fn(toast));
  return toast.id;
}

export const toast = {
  trigger: (message) => notify({ message, type: 'trigger' }),
  error: (message) => notify({ message, type: 'error' }),
  success: (message) => notify({ message, type: 'success' }),
};

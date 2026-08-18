const KEY = 'historykaz-device-lock-v1';
export const LOCK_MS = 60 * 60 * 1000;
export const DOUBLE_MARK_MSG = 'Сіз сабаққа екі рет тіркеле алмайсыз';

interface DeviceLock {
  lastLoginAt: number;
  lastQrAt: number;
}

function read(): DeviceLock {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DeviceLock;
  } catch {
    /* ignore */
  }
  return { lastLoginAt: 0, lastQrAt: 0 };
}

function write(lock: DeviceLock): void {
  localStorage.setItem(KEY, JSON.stringify(lock));
}

export function isWithinHour(ts: number): boolean {
  return ts > 0 && Date.now() - ts < LOCK_MS;
}

export function assertCanLogin(): void {
  const lock = read();
  if (isWithinHour(lock.lastLoginAt)) {
    throw new Error(DOUBLE_MARK_MSG);
  }
}

export function markLogin(): void {
  const lock = read();
  lock.lastLoginAt = Date.now();
  write(lock);
}

export function assertCanScanQr(): void {
  if (isWithinHour(read().lastQrAt)) {
    throw new Error(DOUBLE_MARK_MSG);
  }
}

export function markQrScan(): void {
  const lock = read();
  lock.lastQrAt = Date.now();
  write(lock);
}

export function isQrBlocked(): boolean {
  return isWithinHour(read().lastQrAt);
}

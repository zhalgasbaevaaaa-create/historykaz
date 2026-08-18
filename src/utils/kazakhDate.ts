export const KAZAKH_MONTHS = [
  'қаңтар',
  'ақпан',
  'наурыз',
  'сәуір',
  'мамыр',
  'маусым',
  'шілде',
  'тамыз',
  'қыркүйек',
  'қазан',
  'қараша',
  'желтоқсан'
];

export const KAZAKH_DAYS = [
  'Жексенбі',
  'Дүйсенбі',
  'Сейсенбі',
  'Сәрсенбі',
  'Бейсенбі',
  'Жұма',
  'Сенбі'
];

export function formatKazakhDate(date: Date = new Date()): string {
  const day = date.getDate();
  const monthName = KAZAKH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${monthName} ${year} жыл`;
}

export function formatKazakhDayMonth(date: Date = new Date()): string {
  const day = date.getDate();
  const monthName = KAZAKH_MONTHS[date.getMonth()];
  return `${day} ${monthName}`;
}

export function formatKazakhDateShort(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function formatKazakhTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatKazakhDayOfWeek(date: Date = new Date()): string {
  return KAZAKH_DAYS[date.getDay()];
}

export function formatSecondsToTimer(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

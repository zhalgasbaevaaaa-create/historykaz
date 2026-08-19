export const SHEET_ID = '1Gpyy1fjJJzycEJAYk0CT9p6UnAHL3MiujmnMX8VFOeQ';
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
export const DEFAULT_WEBHOOK =
  'https://script.google.com/macros/s/AKfycbxCedUDeUl_Njbrwm5gmymX0D2RLALcx_ygUNQ-0fYQ7IOaOukk-UvMtYmefGnMWrR-sg/exec';
const WEBHOOK_KEY = 'historykaz-sheets-webhook';
const OPENSHEET = `https://opensheet.elk.sh/${SHEET_ID}/1`;

export function getSheetsWebhook(): string {
  try {
    return (localStorage.getItem(WEBHOOK_KEY) || DEFAULT_WEBHOOK).trim();
  } catch {
    return DEFAULT_WEBHOOK;
  }
}

export function setSheetsWebhook(url: string): void {
  localStorage.setItem(WEBHOOK_KEY, url.trim());
}

export interface SheetAttendance {
  studentName: string;
  group: string;
  date: string;
  time: string;
  subject: string;
  status: string;
  timestamp?: string | number;
}

function safeCell(value: string): string {
  const t = String(value || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200);
  if (/^[=+\-@]/.test(t)) return `'${t}`;
  return t;
}

export async function pushAttendanceToSheet(row: SheetAttendance): Promise<void> {
  const webhook = getSheetsWebhook();
  if (webhook) {
    const payload: SheetAttendance = {
      studentName: safeCell(row.studentName),
      group: safeCell(row.group || 'HC-2026-2027'),
      date: safeCell(row.date),
      time: safeCell(row.time),
      subject: safeCell(row.subject),
      status: 'Қатысты',
      timestamp: row.timestamp
    };
    await fetch(webhook, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return;
  }

  // Fallback: cannot write without Apps Script webhook
  throw new Error('NO_WEBHOOK');
}

function mapRow(raw: Record<string, any>): SheetAttendance | null {
  const name =
    raw['Аты-жөні'] || raw.studentName || raw.Name || raw.name || raw['Full Name'] || '';
  if (!name) return null;
  return {
    studentName: String(name),
    group: String(raw['Топ'] || raw.group || 'HC-2026-2027'),
    date: String(raw['Күні'] || raw.date || ''),
    time: String(raw['Уақыт'] || raw.time || ''),
    subject: String(raw['Пән'] || raw.subject || 'Сабақ'),
    status: String(raw['Статус'] || raw.status || 'Қатысты'),
    timestamp: raw.Timestamp || raw.timestamp
  };
}

export async function fetchAttendanceFromSheet(): Promise<SheetAttendance[]> {
  const webhook = getSheetsWebhook();
  if (webhook) {
    try {
      const res = await fetch(webhook);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((r) => mapRow(r)).filter(Boolean) as SheetAttendance[];
        }
      }
    } catch {
      /* fall through */
    }
  }

  const res = await fetch(OPENSHEET);
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((r) => mapRow(r)).filter(Boolean) as SheetAttendance[];
}

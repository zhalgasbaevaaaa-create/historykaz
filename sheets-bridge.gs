function doPost(e) {
  const ss = SpreadsheetApp.openById('1Gpyy1fjJJzycEJAYk0CT9p6UnAHL3MiujmnMX8VFOeQ');
  const sh = ss.getSheets()[0];
  ensureHeader_(sh);
  const data = JSON.parse(e.postData.contents || '{}');
  sh.appendRow([
    data.studentName || '',
    data.group || 'HC-2026-2027',
    data.date || '',
    data.time || '',
    data.subject || 'Сабақ',
    data.status || 'Қатысты',
    data.timestamp || Date.now()
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const ss = SpreadsheetApp.openById('1Gpyy1fjJJzycEJAYk0CT9p6UnAHL3MiujmnMX8VFOeQ');
  const sh = ss.getSheets()[0];
  ensureHeader_(sh);
  const values = sh.getDataRange().getValues();
  const header = values.shift() || [];
  const rows = values
    .filter((r) => r[0])
    .map((r) => ({
      studentName: String(r[0] || ''),
      group: String(r[1] || ''),
      date: String(r[2] || ''),
      time: String(r[3] || ''),
      subject: String(r[4] || ''),
      status: String(r[5] || 'Қатысты'),
      timestamp: r[6] || ''
    }));
  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeader_(sh) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Аты-жөні', 'Топ', 'Күні', 'Уақыт', 'Пән', 'Статус', 'Timestamp']);
  }
}

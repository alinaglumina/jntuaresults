import XLSX from 'xlsx';
// Hall-ticket column header, e.g. "Hall Ticket No", "HTNO", "Roll No", "Regd No"
export const HT_RE = /hall\s*-?\s*ticket|^\s*h\.?\s*t\.?\s*no|roll\s*(no|number)|regd?\.?\s*(no|number)|registration\s*(no|number)/i;
export const normKey = (v) => String(v ?? '').toUpperCase().replace(/\s+/g, '');
const MAX_ROWS = 200000;

// Reads an uploaded .xlsx/.xls/.csv and returns [{ name, headers, keyCol, rows }].
// Throws an Error with a message that is safe to show to the admin.
export function parseWorkbook(buffer) {
  let wb;
  try { wb = XLSX.read(buffer, { type: 'buffer', cellDates: true }); } catch { throw new Error('Could not read this file. Is it a valid Excel or CSV file?'); }
  const sheets = [];
  let total = 0;
  for (const name of wb.SheetNames) {
    const all = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '', blankrows: false });
    let h = -1, keyCol = -1;
    for (let i = 0; i < Math.min(10, all.length) && h < 0; i++) {
      const c = all[i].findIndex((x) => HT_RE.test(String(x)));
      if (c >= 0) { h = i; keyCol = c; }
    }
    if (h < 0) continue; // sheets without a hall-ticket column (e.g. a summary tab) are skipped
    const headers = all[h].map((x) => String(x).trim());
    const rows = all.slice(h + 1).filter((r) => normKey(r[keyCol])).map((r) => headers.map((_, i) => String(r[i] ?? '').trim()));
    total += rows.length;
    if (total > MAX_ROWS) throw new Error(`Too many rows (limit ${MAX_ROWS.toLocaleString()})`);
    if (rows.length) sheets.push({ name, headers, keyCol, rows });
  }
  if (!sheets.length) throw new Error('No hall-ticket column found. The first rows of the sheet must have a column titled like "Hall Ticket No" (or "Roll No" / "Regd No"), with students listed under it.');
  return sheets;
}

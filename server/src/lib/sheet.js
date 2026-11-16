import XLSX from 'xlsx';
// Hall-ticket column header, e.g. "Hall Ticket No", "HTNO", "Roll No", "Regd No"
export const HT_RE = /hall\s*-?\s*ticket|^\s*h\.?\s*t\.?\s*no|roll\s*(no|number)|regd?\.?\s*(no|number)|registration\s*(no|number)/i;
export const normKey = (v) => String(v ?? '').toUpperCase().replace(/\s+/g, '');
const MAX_ROWS = 200000;

// External-marks codes: -1 = Absent, -2 = Withheld, -4 = Malpractice.
// For these rows the Total Marks is the Internal Marks (the negative code is NOT subtracted).
// status/grade = what to show in Result Status / Grade columns (edit here to change the rules).
export const EXT_CODES = {
  '-1': { ext: 'AB', status: 'F', grade: 'F' },
  '-2': { ext: 'WL', status: 'WL', grade: 'WL' },
  '-4': { ext: 'MP', status: 'MP', grade: 'F' },
};
const colOf = (headers, re) => headers.findIndex((h) => re.test(h));

export function applyMarksRules(headers, rows) {
  const ext = colOf(headers, /^\s*external/i);
  if (ext < 0) return rows;
  const internal = colOf(headers, /^\s*internal(?!.*moderation)/i);
  const total = colOf(headers, /^\s*total/i);
  const status = colOf(headers, /result\s*status|^\s*result\s*$/i);
  const grade = colOf(headers, /^\s*grade/i);
  const credits = colOf(headers, /^\s*credits?/i);
  for (const r of rows) {
    const v = String(r[ext]).trim();
    const n = /^-?\d+(\.0+)?$/.test(v) ? String(parseInt(v, 10)) : v;
    const rule = EXT_CODES[n];
    if (!rule) continue;
    r[ext] = rule.ext;
    if (total >= 0 && internal >= 0) r[total] = r[internal];
    if (status >= 0) r[status] = rule.status;
    if (grade >= 0) r[grade] = rule.grade;
    if (credits >= 0) r[credits] = '0';
  }
  return rows;
}

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
    const rows = applyMarksRules(headers, all.slice(h + 1).filter((r) => normKey(r[keyCol])).map((r) => headers.map((_, i) => String(r[i] ?? '').trim())));
    total += rows.length;
    if (total > MAX_ROWS) throw new Error(`Too many rows (limit ${MAX_ROWS.toLocaleString()})`);
    if (rows.length) sheets.push({ name, headers, keyCol, rows });
  }
  if (!sheets.length) throw new Error('No hall-ticket column found. The first rows of the sheet must have a column titled like "Hall Ticket No" (or "Roll No" / "Regd No"), with students listed under it.');
  return sheets;
}

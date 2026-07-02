// Converts our synthetic "col_N" keys (assigned by n8n's Google Sheets "Get
// Row(s)" node because the sheet's real header cells are blank/merged) into
// an explicit A1-notation cell reference, so writes target an exact cell
// instead of relying on n8n's write-time auto-mapping (which isn't
// guaranteed to line up with the read-time column naming).

const SHEET_TAB_NAME = process.env.SHEET_TAB_NAME ?? "July2026";

function columnIndexToLetter(index: number): string {
  let n = index;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

export function buildCellRange(column: string, rowNumber: number): string {
  const match = /^col_(\d+)$/.exec(column);
  if (!match) {
    throw new Error(`Unexpected column key "${column}"`);
  }
  const columnIndex = Number(match[1]);
  const columnLetter = columnIndexToLetter(columnIndex);
  return `${SHEET_TAB_NAME}!${columnLetter}${rowNumber}`;
}

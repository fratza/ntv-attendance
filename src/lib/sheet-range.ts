// Converts our synthetic "col_N" keys (assigned by n8n's Google Sheets "Get
// Row(s)" node because the sheet's real header cells are blank/merged) into
// a Sheets API GridRange, so writes target an exact cell instead of relying
// on n8n's write-time auto-mapping (which isn't guaranteed to line up with
// the read-time column naming).
//
// GridRange (used by the `batchUpdate` "updateCells" request) needs the
// numeric sheet tab ID (gid) plus 0-based row/column indices — unlike the
// Values API's `range` string, this lets a single request set both the
// cell's value AND its note together.

const SHEET_GID = Number(process.env.SHEET_GID ?? 0);

export function parseColumnIndex(column: string): number {
  const match = /^col_(\d+)$/.exec(column);
  if (!match) {
    throw new Error(`Unexpected column key "${column}"`);
  }
  return Number(match[1]); // 1-based spreadsheet column
}

export function buildGridRange(column: string, rowNumber: number) {
  const columnIndex = parseColumnIndex(column);
  return {
    sheetId: SHEET_GID,
    startRowIndex: rowNumber - 1,
    endRowIndex: rowNumber,
    startColumnIndex: columnIndex - 1,
    endColumnIndex: columnIndex,
  };
}

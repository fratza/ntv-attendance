// Parses the flat row export from the "NTV360_Attendance Sheet" Google Sheet
// (via the n8n `fetch-department` webhook) into per-department rosters.
//
// The sheet has no stable column layout across department blocks — each
// block's own "#" header row declares which columns hold which dates, so
// column-to-date mapping must be read per block rather than assumed fixed.
//
// `rowNumber` and `column` are kept on each entry so a save can write back
// to the exact sheet cell via a `row_number`-matched Google Sheets update
// (see src/server/save-attendance.ts).

const FIRST_COL_KEY = "Employee Attendance Monitoring Sheet\n\nJULY 2026";

export type StaffMember = {
  name: string;
  role: "TL" | "Staff";
  rowNumber: number;
  attendance: Record<string, string>; // date string ("7/1/2026") -> status code
};

export type DepartmentRoster = {
  sheetLabel: string;
  teamLead: string | null;
  dates: string[];
  dateColumns: Record<string, string>; // date string -> sheet column key (e.g. "col_4")
  staff: StaffMember[];
};

export const DEPARTMENT_LABEL_TO_SHEET: Record<string, string> = {
  Frontend: "FE",
  Backend: "BE",
  IoT: "IOT",
  RnD: "R&D",
  QA: "QA",
  Design: "DESIGN",
  "UI/UX": "UI/UX",
  "Admin/HR": "Admin/HR",
};

export function parseSheetRows(rows: Record<string, unknown>[]): DepartmentRoster[] {
  const blocks: DepartmentRoster[] = [];
  let current: DepartmentRoster | null = null;
  let dateColKeys: string[] = [];

  for (const row of rows) {
    const first = row[FIRST_COL_KEY];

    if (first === "Dept. Name") {
      current = {
        sheetLabel: String(row.col_2 ?? "").trim(),
        teamLead: null,
        dates: [],
        dateColumns: {},
        staff: [],
      };
      blocks.push(current);
      dateColKeys = [];
      continue;
    }
    if (!current) continue;

    if (first === "Team Lead") {
      current.teamLead = String(row.col_2 ?? "").trim() || null;
      continue;
    }

    if (first === "#") {
      dateColKeys = [];
      current.dates = [];
      current.dateColumns = {};
      for (const key of Object.keys(row)) {
        if (key === FIRST_COL_KEY || key === "col_2" || key === "row_number") continue;
        const value = row[key];
        if (typeof value === "string" && value.trim()) {
          const date = value.trim();
          dateColKeys.push(key);
          current.dates.push(date);
          current.dateColumns[date] = key;
        }
      }
      continue;
    }

    if (first === "TL" || typeof first === "number") {
      const name = String(row.col_2 ?? "").trim();
      const rowNumber = Number(row.row_number);
      if (!name || !Number.isFinite(rowNumber)) continue;
      const attendance: Record<string, string> = {};
      dateColKeys.forEach((key, i) => {
        const code = row[key];
        if (typeof code === "string" && code.trim() && code.trim().toLowerCase() !== "weekend") {
          attendance[current!.dates[i]] = code.trim();
        }
      });
      current.staff.push({ name, role: first === "TL" ? "TL" : "Staff", rowNumber, attendance });
      continue;
    }
  }

  return blocks;
}

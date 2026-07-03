import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  DEPARTMENT_LABEL_TO_SHEET,
  parseSheetRows,
  type DepartmentRoster,
} from "@/lib/department-roster";

const N8N_FETCH_DEPARTMENT_URL =
  process.env.N8N_FETCH_DEPARTMENT_URL ??
  "https://n8n.n-compass.online/webhook/fetch-department";

type FetchDepartmentResponse =
  | Record<string, unknown>[] // old shape: bare array of sheet rows
  | { rows: Record<string, unknown>[]; notesGrid?: string[][] };

export const fetchDepartmentRoster = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ department: z.string() }).parse(data))
  .handler(async ({ data }): Promise<DepartmentRoster | null> => {
    const sheetLabel = DEPARTMENT_LABEL_TO_SHEET[data.department];
    if (!sheetLabel) return null;

    const response = await fetch(N8N_FETCH_DEPARTMENT_URL);
    if (!response.ok) {
      throw new Error(`n8n webhook responded with ${response.status}`);
    }

    const payload = (await response.json()) as FetchDepartmentResponse;
    const rows = Array.isArray(payload) ? payload : payload.rows;
    const notesGrid = Array.isArray(payload) ? undefined : payload.notesGrid;

    const blocks = parseSheetRows(rows, notesGrid);
    return blocks.find((block) => block.sheetLabel === sheetLabel) ?? null;
  });

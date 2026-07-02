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

export const fetchDepartmentRoster = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ department: z.string() }).parse(data))
  .handler(async ({ data }): Promise<DepartmentRoster | null> => {
    const sheetLabel = DEPARTMENT_LABEL_TO_SHEET[data.department];
    if (!sheetLabel) return null;

    const response = await fetch(N8N_FETCH_DEPARTMENT_URL);
    if (!response.ok) {
      throw new Error(`n8n webhook responded with ${response.status}`);
    }

    const rows = (await response.json()) as Record<string, unknown>[];
    const blocks = parseSheetRows(rows);
    return blocks.find((block) => block.sheetLabel === sheetLabel) ?? null;
  });

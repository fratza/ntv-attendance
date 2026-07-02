import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildCellRange } from "@/lib/sheet-range";

const N8N_UPDATE_ATTENDANCE_URL =
  process.env.N8N_UPDATE_ATTENDANCE_URL ??
  "https://n8n.n-compass.online/webhook/update-attendance";

const entrySchema = z.object({
  rowNumber: z.number(),
  column: z.string(),
  code: z.string(),
});

const inputSchema = z.object({
  entries: z.array(entrySchema),
});

export const saveAttendance = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const updates = data.entries.map((entry) => ({
      range: buildCellRange(entry.column, entry.rowNumber),
      code: entry.code,
    }));

    const response = await fetch(N8N_UPDATE_ATTENDANCE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`n8n update webhook responded with ${response.status}`);
    }

    return { success: true };
  });

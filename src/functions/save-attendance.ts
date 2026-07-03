import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildGridRange } from "@/lib/sheet-range";

const N8N_UPDATE_ATTENDANCE_URL =
  process.env.N8N_UPDATE_ATTENDANCE_URL ??
  "https://n8n.n-compass.online/webhook/update-attendance";

const entrySchema = z.object({
  rowNumber: z.number(),
  column: z.string(),
  code: z.string(),
  reason: z.string().optional(),
});

const inputSchema = z.object({
  entries: z.array(entrySchema),
});

export const saveAttendance = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    // A single Sheets API batchUpdate request per cell: sets the status
    // code as the cell's value and the reason as the cell's note in one
    // shot (the plain Values API used for reads can't touch notes at all).
    const requests = data.entries.map((entry) => ({
      updateCells: {
        range: buildGridRange(entry.column, entry.rowNumber),
        rows: [
          {
            values: [
              {
                userEnteredValue: { stringValue: entry.code },
                note: entry.reason ?? "",
              },
            ],
          },
        ],
        fields: "userEnteredValue,note",
      },
    }));

    const response = await fetch(N8N_UPDATE_ATTENDANCE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      throw new Error(`n8n update webhook responded with ${response.status}`);
    }

    return { success: true };
  });

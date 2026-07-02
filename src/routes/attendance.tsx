import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Attendance Tracker" },
      { name: "description", content: "Mark daily attendance for your team with clear status codes." },
      { property: "og:title", content: "Attendance Tracker" },
      { property: "og:description", content: "Mark daily attendance for your team with clear status codes." },
    ],
  }),
  component: Index,
});

const STATUSES = [
  { code: "P", label: "Present" },
  { code: "L", label: "Late" },
  { code: "A", label: "Absent" },
  { code: "WFH", label: "Work From Home" },
  { code: "AL", label: "Annual Leave" },
  { code: "HL", label: "Half-day Leave" },
  { code: "SL", label: "Sick Leave" },
  { code: "EL", label: "Emergency Leave" },
] as const;

const NAMES = [
  "Ava Bennett",
  "Liam Carter",
  "Sofia Diaz",
  "Noah Edwards",
  "Mia Foster",
  "Ethan Gray",
  "Olivia Hayes",
  "James Ito",
  "Chloe Jensen",
  "Lucas Kim",
];

function Index() {
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUSES) counts[s.code] = 0;
    Object.values(attendance).forEach((c) => {
      if (counts[c] !== undefined) counts[c]++;
    });
    return counts;
  }, [attendance]);

  const marked = Object.keys(attendance).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
              <p className="text-sm text-primary-foreground/70">Mark today's team status</p>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                <CalendarIcon />
                {format(date, "EEEE, PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {STATUSES.map((s) => (
            <Card key={s.code} className="p-3 flex flex-col items-start gap-1">
              <span className="text-xs font-semibold text-secondary bg-primary rounded px-2 py-0.5">
                {s.code}
              </span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-lg font-semibold text-foreground">{summary[s.code]}</span>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/40">
            <h2 className="font-semibold text-foreground">Team roster</h2>
            <p className="text-sm text-muted-foreground">
              {marked} of {NAMES.length} marked
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                  <th className="text-left font-medium px-6 py-3 sticky left-0 bg-muted/30">Name</th>
                  {STATUSES.map((s) => (
                    <th key={s.code} className="px-2 py-3 text-center font-medium">
                      {s.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NAMES.map((name, idx) => {
                  const selected = attendance[name];
                  return (
                    <tr
                      key={name}
                      className={cn(
                        "border-t transition-colors hover:bg-secondary/10",
                        idx % 2 === 1 && "bg-muted/10",
                      )}
                    >
                      <td className="px-6 py-3 font-medium text-foreground sticky left-0 bg-inherit">
                        {name}
                      </td>
                      {STATUSES.map((s) => {
                        const active = selected === s.code;
                        return (
                          <td key={s.code} className="px-2 py-3 text-center">
                            <label className="inline-flex cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={active}
                                onChange={() =>
                                  setAttendance((prev) => {
                                    const next = { ...prev };
                                    if (active) delete next[name];
                                    else next[name] = s.code;
                                    return next;
                                  })
                                }
                              />
                              <span
                                className={cn(
                                  "h-6 w-6 rounded-md border-2 flex items-center justify-center text-[10px] font-bold transition-all",
                                  active
                                    ? "bg-secondary border-secondary text-primary shadow-sm scale-105"
                                    : "border-border text-transparent hover:border-secondary/60",
                                )}
                              >
                                ✓
                              </span>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/20">
            <Button variant="outline" onClick={() => setAttendance({})}>
              Clear
            </Button>
            <Button
              className="bg-secondary text-primary hover:bg-secondary/90"
              onClick={() =>
                alert(
                  `Attendance for ${format(date, "PPP")}:\n\n` +
                    NAMES.map((n) => `${n}: ${attendance[n] ?? "—"}`).join("\n"),
                )
              }
            >
              Save attendance
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

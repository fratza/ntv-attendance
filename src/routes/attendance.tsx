import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { CalendarIcon, Users, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEPARTMENT_LABEL_TO_SHEET } from "@/lib/department-roster";
import { fetchDepartmentRoster } from "@/functions/fetch-department-roster";
import { saveAttendance } from "@/functions/save-attendance";

export const Route = createFileRoute("/attendance")({
  validateSearch: z.object({ department: z.string().optional() }),
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

const CODES_REQUIRING_REASON = new Set(["L", "A", "WFH", "AL", "HL", "SL", "EL"]);

function Index() {
  const { department } = Route.useSearch();
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const dateKey = format(date, "M/d/yyyy");
  const isMappedDepartment = Boolean(department && DEPARTMENT_LABEL_TO_SHEET[department]);

  const queryClient = useQueryClient();
  const getRoster = useServerFn(fetchDepartmentRoster);
  const {
    data: roster,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["department-roster", department],
    queryFn: () => getRoster({ data: { department: department! } }),
    enabled: isMappedDepartment,
  });

  const names = useMemo(() => roster?.staff.map((s) => s.name) ?? [], [roster]);
  const dateColumn = roster?.dateColumns[dateKey];

  const saveRoster = useServerFn(saveAttendance);
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!roster || !dateColumn) {
        throw new Error("This date isn't tracked in the sheet for this department yet.");
      }
      const entries = roster.staff.map((member) => ({
        rowNumber: member.rowNumber,
        column: dateColumn,
        code: attendance[member.name] ?? "",
        reason: reasons[member.name] ?? "",
      }));
      return saveRoster({ data: { entries } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-roster", department] });
    },
  });

  useEffect(() => {
    if (!roster) {
      setAttendance({});
      setReasons({});
      return;
    }
    const nextAttendance: Record<string, string> = {};
    const nextReasons: Record<string, string> = {};
    for (const member of roster.staff) {
      const code = member.attendance[dateKey];
      if (code) nextAttendance[member.name] = code;
      const note = member.notes[dateKey];
      if (note) nextReasons[member.name] = note;
    }
    setAttendance(nextAttendance);
    setReasons(nextReasons);
  }, [roster, dateKey]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUSES) counts[s.code] = 0;
    Object.values(attendance).forEach((c) => {
      if (counts[c] !== undefined) counts[c]++;
    });
    return counts;
  }, [attendance]);

  const marked = Object.keys(attendance).length;
  const showReasonColumn = Object.values(attendance).some((code) => CODES_REQUIRING_REASON.has(code));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="h-10 w-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition"
              aria-label="Change department"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
              <p className="text-sm text-primary-foreground/70">
                {department ? `${department} · ` : ""}Mark today's team status
              </p>
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
            <div>
              <h2 className="font-semibold text-foreground">Team roster</h2>
              {roster?.teamLead && (
                <p className="text-xs text-muted-foreground">Team Lead: {roster.teamLead}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {names.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {marked} of {names.length} marked
                </p>
              )}
              <a
                href="https://docs.google.com/spreadsheets/d/10kUmMmPJc551vuQA1YRTWVVBr7FZA44jyODT_-oB2Hc/edit?gid=0#gid=0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-secondary underline underline-offset-2 hover:text-secondary/80"
              >
                Open in Google Sheets
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {!department ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No department selected.{" "}
              <Link to="/" className="text-secondary underline underline-offset-2">
                Choose a department
              </Link>{" "}
              to load its roster.
            </div>
          ) : !isMappedDepartment ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No roster data is mapped for "{department}" yet.
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading roster…
            </div>
          ) : isError ? (
            <div className="px-6 py-10 text-center text-sm text-destructive">
              Couldn't load the roster: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : names.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No staff found for "{department}" in the sheet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground">
                      <th className="text-left font-medium px-6 py-3 sticky left-0 bg-muted/30">
                        Name
                      </th>
                      {STATUSES.map((s) => (
                        <th key={s.code} className="px-2 py-3 text-center font-medium">
                          {s.code}
                        </th>
                      ))}
                      {showReasonColumn && (
                        <th className="text-left font-medium px-4 py-3">Reason</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {roster?.staff.map((member, idx) => {
                      const name = member.name;
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
                            {member.role === "TL" && (
                              <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                TL
                              </span>
                            )}
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
                                        const nextCode = active ? undefined : s.code;
                                        if (nextCode) next[name] = nextCode;
                                        else delete next[name];
                                        if (!nextCode || !CODES_REQUIRING_REASON.has(nextCode)) {
                                          setReasons((prevReasons) => {
                                            if (!(name in prevReasons)) return prevReasons;
                                            const nextReasons = { ...prevReasons };
                                            delete nextReasons[name];
                                            return nextReasons;
                                          });
                                        }
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
                          {showReasonColumn && (
                            <td className="px-4 py-3">
                              <Input
                                value={reasons[name] ?? ""}
                                onChange={(e) =>
                                  setReasons((prev) => ({ ...prev, [name]: e.target.value }))
                                }
                                disabled={!selected || !CODES_REQUIRING_REASON.has(selected)}
                                placeholder={
                                  selected && CODES_REQUIRING_REASON.has(selected)
                                    ? "Reason (saved as a sheet note)"
                                    : "—"
                                }
                                className="h-8 min-w-[200px] text-xs"
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t bg-muted/20">
                {!dateColumn ? (
                  <p className="mr-auto text-xs text-muted-foreground">
                    This date isn't tracked in the sheet for this department yet — saving is
                    disabled.
                  </p>
                ) : saveMutation.isError ? (
                  <p className="mr-auto text-xs text-destructive">
                    Couldn't save:{" "}
                    {saveMutation.error instanceof Error
                      ? saveMutation.error.message
                      : "Unknown error"}
                  </p>
                ) : saveMutation.isSuccess ? (
                  <p className="mr-auto text-xs text-secondary">Saved to the sheet.</p>
                ) : null}
                <Button variant="outline" onClick={() => setAttendance({})}>
                  Clear
                </Button>
                <Button
                  className="bg-secondary text-primary hover:bg-secondary/90"
                  disabled={!dateColumn || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Save attendance
                </Button>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}

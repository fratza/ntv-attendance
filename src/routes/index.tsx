import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Select Department — Attendance" },
      { name: "description", content: "Choose your department to begin marking attendance." },
      { property: "og:title", content: "Select Department — Attendance" },
      { property: "og:description", content: "Choose your department to begin marking attendance." },
    ],
  }),
  component: DepartmentPage,
});

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
];

function DepartmentPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("");
  const [custom, setCustom] = useState("");

  const chosen = selected === "__other" ? custom.trim() : selected;

  const submit = () => {
    if (!chosen) return;
    navigate({ to: "/attendance", search: { department: chosen } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Which department are you?
          </h1>
          <p className="text-muted-foreground mt-2">
            Select a department to begin marking today's attendance.
          </p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEPARTMENTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                className={cn(
                  "rounded-lg border-2 px-3 py-3 text-sm font-medium text-left transition-all",
                  selected === d
                    ? "border-secondary bg-secondary/10 text-foreground"
                    : "border-border hover:border-secondary/50 text-foreground",
                )}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected("__other")}
              className={cn(
                "rounded-lg border-2 px-3 py-3 text-sm font-medium text-left transition-all",
                selected === "__other"
                  ? "border-secondary bg-secondary/10 text-foreground"
                  : "border-border hover:border-secondary/50 text-foreground",
              )}
            >
              Other…
            </button>
          </div>

          {selected === "__other" && (
            <Input
              autoFocus
              placeholder="Enter department name"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          )}

          <Button
            className="w-full bg-secondary text-primary hover:bg-secondary/90"
            disabled={!chosen}
            onClick={submit}
          >
            Continue
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/features/projects/types";

interface ProjectSelectorProps {
  projects: Project[];
  loading: boolean;
  selectedProjectId: string | null;
  onChange: (projectId: string) => void;
}

export function ProjectSelector({
  projects,
  loading,
  selectedProjectId,
  onChange,
}: ProjectSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-navy text-white">
        <Building2 className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground">Active Project</span>
        <Select
          value={selectedProjectId ?? undefined}
          onValueChange={onChange}
          disabled={loading || projects.length === 0}
        >
          <SelectTrigger className="h-8 min-w-[280px] border-none bg-transparent p-0 text-sm font-bold text-brand-navy shadow-none focus:ring-0">
            <SelectValue placeholder={loading ? "Loading projects..." : "Select a project"} />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

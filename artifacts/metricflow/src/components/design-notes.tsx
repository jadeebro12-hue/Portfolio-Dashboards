import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { Eye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DesignNotesContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const DesignNotesContext = createContext<DesignNotesContextValue | undefined>(undefined);
const storageKey = "metricflow-design-notes-enabled";

export function DesignNotesProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    setEnabledState(window.localStorage.getItem(storageKey) === "true");
  }, []);

  const setEnabled = (nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    window.localStorage.setItem(storageKey, String(nextEnabled));
  };

  return <DesignNotesContext.Provider value={{ enabled, setEnabled }}>{children}</DesignNotesContext.Provider>;
}

function useDesignNotes() {
  const context = useContext(DesignNotesContext);
  if (!context) throw new Error("useDesignNotes must be used within DesignNotesProvider.");
  return context;
}

export function DesignNotesToggle() {
  const { enabled, setEnabled } = useDesignNotes();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`fixed bottom-5 right-5 z-40 gap-2 border-border/80 bg-card/95 shadow-md backdrop-blur-sm ${enabled ? "border-primary/50 bg-primary/10 text-primary" : ""}`}
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label={`${enabled ? "Hide" : "Show"} design notes`}
    >
      <Eye className="h-3.5 w-3.5" />
      Design Notes
      <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-primary" : "bg-muted-foreground/60"}`} aria-hidden="true" />
    </Button>
  );
}

type DesignNoteProps = {
  number: number;
  title: string;
  rationale: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
};

export function DesignNote({ number, title, rationale, className = "", side = "top" }: DesignNoteProps) {
  const { enabled } = useDesignNotes();

  if (!enabled) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`design-note-marker absolute z-20 inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-card text-[10px] font-bold text-primary shadow-sm outline-none transition hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${className}`}
          aria-label={`Open design note ${number}: ${title}`}
        >
          {number}
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-72 border-primary/20 p-4">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary">DESIGN NOTE {String(number).padStart(2, "0")}</p>
            <h3 className="mt-1 text-sm font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{rationale}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
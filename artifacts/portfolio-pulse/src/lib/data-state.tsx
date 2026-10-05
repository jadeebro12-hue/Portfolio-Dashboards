import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Portfolio Pulse runs on in-memory mock data, so there is no real network
 * request to wait on. This provider simulates one so every data view can
 * show its loading, empty and error treatment. The calculations themselves
 * are untouched: this only decides *whether* a section renders its data.
 *
 * "live" is the normal experience (a short first load, then data).
 * The other modes can be chosen from the sidebar's "Data state" control or
 * with a ?state=loading|empty|error query param, to demo each treatment.
 */
export type DataMode = "live" | "loading" | "empty" | "error"

const MODES: DataMode[] = ["live", "loading", "empty", "error"]
const SIMULATED_LATENCY_MS = 650

export type DataStatus = "loading" | "error" | "empty" | "ready"

interface DataStateValue {
  status: DataStatus
  mode: DataMode
  setMode: (mode: DataMode) => void
  retry: () => void
}

const DataStateContext = React.createContext<DataStateValue | null>(null)

function initialMode(): DataMode {
  if (typeof window === "undefined") return "live"
  const param = new URLSearchParams(window.location.search).get("state")
  return MODES.includes(param as DataMode) ? (param as DataMode) : "live"
}

export function DataStateProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<DataMode>(initialMode)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["portfolio-data", mode],
    queryFn: async (): Promise<"ready" | "empty"> => {
      if (mode === "loading") return new Promise(() => {}) // never resolves
      await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS))
      if (mode === "error") throw new Error("Couldn't reach the portfolio service.")
      return mode === "empty" ? "empty" : "ready"
    },
    staleTime: Infinity,
    retry: false,
  })

  const status: DataStatus = query.isPending
    ? "loading"
    : query.isError
      ? "error"
      : (query.data ?? "ready")

  const retry = React.useCallback(() => {
    // In the error demo, "Try again" recovers to the live experience.
    queryClient.removeQueries({ queryKey: ["portfolio-data", "live"] })
    setMode("live")
  }, [queryClient])

  const value = React.useMemo(
    () => ({ status, mode, setMode, retry }),
    [status, mode, retry],
  )

  return (
    <DataStateContext.Provider value={value}>{children}</DataStateContext.Provider>
  )
}

export function useDataState() {
  const ctx = React.useContext(DataStateContext)
  if (!ctx) throw new Error("useDataState must be used inside DataStateProvider")
  return ctx
}

export const dataModeLabels: Record<DataMode, string> = {
  live: "Live data",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
}

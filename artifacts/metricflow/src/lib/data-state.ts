export type DataState = "ready" | "loading" | "empty" | "error";

const validStates = new Set<DataState>(["loading", "empty", "error"]);

/**
 * Mock-data state seam for previewing asynchronous UI states.
 * Example: /analytics?funnelState=error
 */
export function getDataState(scope: string): DataState {
  if (typeof window === "undefined") return "ready";

  const params = new URLSearchParams(window.location.search);
  const value = params.get(`${scope}State`) ?? params.get("state");
  return value && validStates.has(value as DataState) ? (value as DataState) : "ready";
}

export function retryDataState(scope: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete(`${scope}State`);
  url.searchParams.delete("state");
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}
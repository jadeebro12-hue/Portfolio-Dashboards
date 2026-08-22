/**
 * MetricFlow design tokens — approved system
 *
 * This is the source contract for MetricFlow's dark SaaS console. CSS custom
 * properties and Tailwind theme aliases map to these values across the app.
 *
 * New UI should consume these semantic roles rather than literal palettes.
 */

export const metricFlowDesignTokens = {
  color: {
    /**
     * Instrument-panel palette: cool, low-glare surfaces support sustained
     * revenue monitoring. "Signal" blue is the only routine interactive color.
     */
    primary: {
      signal: "#5A8DEE",
      signalHover: "#77A4FF",
      signalMuted: "#1B3157",
      onSignal: "#F8FBFF",
    },
    neutral: {
      ink950: "#08111F",
      ink900: "#0D1A2B",
      ink800: "#15243A",
      ink700: "#243650",
      ink500: "#7788A1",
      ink100: "#E7EEF8",
    },
    status: {
      success: "#2CB67D",
      warning: "#F0A654",
      danger: "#EF6461",
    },
    /**
     * Reserved for a single focused data series, selected account, or a
     * high-value callout — never a second primary action.
     */
    accent: {
      violet: "#A78BFA",
      violetMuted: "#312754",
    },
    chart: {
      axis: "#7788A1",
      grid: "#243650",
      labelOnStatus: "#08111F",
      heatmap: ["#172C38", "#1C4B4A", "#247066", "#2C967A", "#36B88A", "#69D9A8"],
    },
  },

  typography: {
    /**
     * Plus Jakarta Sans supplies a confident, compact voice for navigation,
     * labels and headings. Inter is deliberately used for dense body copy,
     * controls, tables, and data, where its small-size readability matters.
     */
    family: {
      display: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      body: '"Inter", ui-sans-serif, system-ui, sans-serif',
      mono: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    },
    scale: {
      display: { fontSize: "2rem", lineHeight: "2.5rem", fontWeight: 700, letterSpacing: "-0.03em" },
      pageTitle: { fontSize: "1.5rem", lineHeight: "2rem", fontWeight: 700, letterSpacing: "-0.025em" },
      sectionTitle: { fontSize: "1.125rem", lineHeight: "1.5rem", fontWeight: 700, letterSpacing: "-0.015em" },
      metric: { fontSize: "1.5rem", lineHeight: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em" },
      body: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 400, letterSpacing: "0" },
      bodyStrong: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 600, letterSpacing: "0" },
      label: { fontSize: "0.75rem", lineHeight: "1rem", fontWeight: 600, letterSpacing: "0.025em" },
      caption: { fontSize: "0.6875rem", lineHeight: "0.875rem", fontWeight: 500, letterSpacing: "0.02em" },
    },
    data: {
      fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
      fontVariantNumeric: "tabular-nums slashed-zero",
      fontFeatureSettings: '"tnum" 1, "zero" 1',
    },
  },

  spacing: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
  },

  radius: {
    control: "0.375rem",
    card: "0.625rem",
    modal: "0.75rem",
    pill: "9999px",
  },

  elevation: {
    card: "0 1px 2px rgba(0, 0, 0, 0.24), 0 8px 24px rgba(0, 0, 0, 0.12)",
    dropdown: "0 8px 20px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.18)",
    modal: "0 20px 48px rgba(0, 0, 0, 0.48), 0 4px 12px rgba(0, 0, 0, 0.24)",
  },

  semantic: {
    surface: {
      app: "neutral.ink950",
      sidebar: "neutral.ink950",
      card: "neutral.ink900",
      raised: "neutral.ink800",
      hover: "neutral.ink700",
    },
    text: {
      primary: "neutral.ink100",
      secondary: "neutral.ink500",
      link: "primary.signalHover",
    },
    health: {
      good: "status.success",
      warning: "status.warning",
      critical: "status.danger",
    },
  },
} as const;

export type MetricFlowDesignTokens = typeof metricFlowDesignTokens;
export const MOCK_TRANSACTIONS = [
  { id: "INV-1001", vendor: "Amazon Web Services", amount: 12450.00, date: "2023-10-15", status: "paid", department: "Engineering" },
  { id: "INV-1002", vendor: "Salesforce", amount: 89750.00, date: "2023-10-16", status: "pending", department: "Sales" },
  { id: "INV-1003", vendor: "Stripe", amount: 3420.50, date: "2023-10-17", status: "paid", department: "Finance" },
  { id: "INV-1004", vendor: "Slack", amount: 4500.00, date: "2023-10-18", status: "overdue", department: "Operations" },
  { id: "INV-1005", vendor: "Adobe", amount: 1200.00, date: "2023-10-19", status: "flagged", department: "Marketing" },
  { id: "INV-1006", vendor: "Google Cloud", amount: 45000.00, date: "2023-10-19", status: "pending", department: "Engineering" },
  { id: "INV-1007", vendor: "Datadog", amount: 12500.00, date: "2023-10-20", status: "paid", department: "Engineering" },
  { id: "INV-1008", vendor: "Zendesk", amount: 5600.00, date: "2023-10-20", status: "paid", department: "Operations" },
  { id: "INV-1009", vendor: "HubSpot", amount: 18000.00, date: "2023-10-21", status: "approved", department: "Sales" },
  { id: "INV-1010", vendor: "Figma", amount: 950.00, date: "2023-10-22", status: "paid", department: "Marketing" },
  { id: "INV-1011", vendor: "Notion", amount: 1200.00, date: "2023-10-22", status: "paid", department: "Operations" },
  { id: "INV-1012", vendor: "Asana", amount: 4200.00, date: "2023-10-23", status: "pending", department: "Marketing" },
  { id: "INV-1013", vendor: "Twilio", amount: 8900.00, date: "2023-10-23", status: "overdue", department: "Sales" },
  { id: "INV-1014", vendor: "Zoom", amount: 2300.00, date: "2023-10-24", status: "paid", department: "Operations" },
  { id: "INV-1015", vendor: "GitHub", amount: 1800.00, date: "2023-10-24", status: "paid", department: "Engineering" },
  { id: "INV-1016", vendor: "LinkedIn", amount: 3500.00, date: "2023-10-25", status: "paid", department: "Engineering" },
  { id: "INV-1017", vendor: "Vercel", amount: 850.00, date: "2023-10-25", status: "flagged", department: "Engineering" },
  { id: "INV-1018", vendor: "Intercom", amount: 14000.00, date: "2023-10-26", status: "approved", department: "Marketing" },
  { id: "INV-1019", vendor: "Snowflake", amount: 22000.00, date: "2023-10-26", status: "pending", department: "Engineering" },
  { id: "INV-1020", vendor: "Gusto", amount: 7500.00, date: "2023-10-27", status: "paid", department: "Operations" },
];

export const MOCK_CASH_FLOW = [
  { month: "Jan", revenue: 400000, expenses: 240000 },
  { month: "Feb", revenue: 450000, expenses: 260000 },
  { month: "Mar", revenue: 420000, expenses: 280000 },
  { month: "Apr", revenue: 500000, expenses: 310000 },
  { month: "May", revenue: 550000, expenses: 320000 },
  { month: "Jun", revenue: 600000, expenses: 350000 },
  { month: "Jul", revenue: 620000, expenses: 370000 },
  { month: "Aug", revenue: 650000, expenses: 390000 },
  { month: "Sep", revenue: 700000, expenses: 410000 },
  { month: "Oct", revenue: 750000, expenses: 430000 },
];

export const MOCK_DEPARTMENTS = [
  { name: "Engineering", spend: 450000, budget: 500000, color: "#1e293b" },
  { name: "Sales", spend: 320000, budget: 350000, color: "#334155" },
  { name: "Marketing", spend: 180000, budget: 200000, color: "#475569" },
  { name: "Operations", spend: 120000, budget: 150000, color: "#64748b" },
  { name: "Finance", spend: 80000, budget: 100000, color: "#94a3b8" },
];

export const MOCK_AUDIT_LOGS = [
  { id: "AUD-001", user: "Sarah Jenkins", action: "approved", resource: "INV-1002 (Salesforce)", timestamp: "2023-10-27T09:41:00Z" },
  { id: "AUD-002", user: "Michael Chen", action: "rejected", resource: "INV-1017 (Vercel)", timestamp: "2023-10-27T08:22:00Z" },
  { id: "AUD-003", user: "System", action: "flagged", resource: "INV-1005 (Adobe)", timestamp: "2023-10-26T23:15:00Z" },
  { id: "AUD-004", user: "David Wright", action: "edited", resource: "Vendor Profile (AWS)", timestamp: "2023-10-26T14:30:00Z" },
  { id: "AUD-005", user: "Sarah Jenkins", action: "approved", resource: "INV-1009 (HubSpot)", timestamp: "2023-10-25T11:05:00Z" },
];

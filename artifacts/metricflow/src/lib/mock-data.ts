export const mockAccounts = [
  { id: '1', name: 'Acme Corp', status: 'active', arr: 125000, csm: 'Sarah Jenkins', health: 92, lastActivity: '2 hours ago', plan: 'Enterprise', users: 145 },
  { id: '2', name: 'Global Tech', status: 'at-risk', arr: 85000, csm: 'Mike Ross', health: 45, lastActivity: '1 day ago', plan: 'Growth', users: 42 },
  { id: '3', name: 'Stark Industries', status: 'active', arr: 250000, csm: 'Sarah Jenkins', health: 88, lastActivity: '4 hours ago', plan: 'Enterprise', users: 310 },
  { id: '4', name: 'Wayne Enterprises', status: 'churned', arr: 0, csm: 'Mike Ross', health: 12, lastActivity: '2 weeks ago', plan: 'Growth', users: 15 },
  { id: '5', name: 'Cyberdyne Systems', status: 'trial', arr: 45000, csm: 'Alex Chen', health: 75, lastActivity: '5 mins ago', plan: 'Starter', users: 8 },
  { id: '6', name: 'Initech', status: 'active', arr: 65000, csm: 'Sarah Jenkins', health: 95, lastActivity: '1 hour ago', plan: 'Growth', users: 24 },
  { id: '7', name: 'Massive Dynamic', status: 'active', arr: 180000, csm: 'Alex Chen', health: 82, lastActivity: '3 hours ago', plan: 'Enterprise', users: 205 },
  { id: '8', name: 'Umbrella Corp', status: 'at-risk', arr: 120000, csm: 'Mike Ross', health: 58, lastActivity: '3 days ago', plan: 'Enterprise', users: 115 },
  { id: '9', name: 'Soylent Corp', status: 'active', arr: 55000, csm: 'Sarah Jenkins', health: 89, lastActivity: '15 mins ago', plan: 'Growth', users: 33 },
  { id: '10', name: 'Gringotts', status: 'trial', arr: 25000, csm: 'Alex Chen', health: 65, lastActivity: '12 hours ago', plan: 'Starter', users: 5 },
  { id: '11', name: 'Oscorp', status: 'active', arr: 420000, csm: 'Mike Ross', health: 91, lastActivity: '10 mins ago', plan: 'Enterprise Plus', users: 540 },
  { id: '12', name: 'Tyrell Corp', status: 'active', arr: 75000, csm: 'Sarah Jenkins', health: 84, lastActivity: '2 days ago', plan: 'Growth', users: 48 },
  { id: '13', name: 'Weyland-Yutani', status: 'active', arr: 310000, csm: 'Alex Chen', health: 96, lastActivity: '1 min ago', plan: 'Enterprise', users: 412 },
  { id: '14', name: 'Omni Consumer', status: 'churned', arr: 0, csm: 'Mike Ross', health: 22, lastActivity: '1 month ago', plan: 'Growth', users: 0 },
  { id: '15', name: 'Virtucon', status: 'at-risk', arr: 45000, csm: 'Sarah Jenkins', health: 38, lastActivity: '4 days ago', plan: 'Growth', users: 18 },
  { id: '16', name: 'GeneCo', status: 'trial', arr: 15000, csm: 'Alex Chen', health: 72, lastActivity: '6 hours ago', plan: 'Starter', users: 3 },
  { id: '17', name: 'Buy n Large', status: 'active', arr: 195000, csm: 'Mike Ross', health: 87, lastActivity: '2 hours ago', plan: 'Enterprise', users: 185 },
  { id: '18', name: 'Aperture Science', status: 'active', arr: 280000, csm: 'Sarah Jenkins', health: 93, lastActivity: '20 mins ago', plan: 'Enterprise', users: 290 },
  { id: '19', name: 'Trek', status: 'active', arr: 85000, csm: 'Alex Chen', health: 81, lastActivity: '1 day ago', plan: 'Growth', users: 55 },
  { id: '20', name: 'LexCorp', status: 'at-risk', arr: 160000, csm: 'Mike Ross', health: 49, lastActivity: '5 days ago', plan: 'Enterprise', users: 95 }
];

export const mockRevenueData = [
  { month: 'Jan', mrr: 125000, target: 130000 },
  { month: 'Feb', mrr: 132000, target: 135000 },
  { month: 'Mar', mrr: 141000, target: 140000 },
  { month: 'Apr', mrr: 155000, target: 150000 },
  { month: 'May', mrr: 168000, target: 160000 },
  { month: 'Jun', mrr: 182000, target: 175000 },
];

export const mockAccountGrowth = [
  { month: 'Jan', active: 145, churned: 2 },
  { month: 'Feb', active: 152, churned: 3 },
  { month: 'Mar', active: 168, churned: 1 },
  { month: 'Apr', active: 180, churned: 4 },
  { month: 'May', active: 195, churned: 2 },
  { month: 'Jun', active: 215, churned: 2 },
];

export const mockNotifications = [
  { id: 1, type: 'alert', message: 'Global Tech health score dropped below 50', time: '10 mins ago', read: false },
  { id: 2, type: 'task', message: 'Quarterly review with Stark Industries', time: '1 hour ago', read: false },
  { id: 3, type: 'mention', message: 'Alex Chen mentioned you in Acme Corp notes', time: '2 hours ago', read: true },
  { id: 4, type: 'alert', message: 'Wayne Enterprises subscription cancelled', time: '1 day ago', read: true },
  { id: 5, type: 'task', message: 'Onboard new admin for Cyberdyne Systems', time: '1 day ago', read: true },
];

export const mockActivityFeed = [
  { id: 1, user: 'Sarah Jenkins', action: 'completed onboarding for', target: 'Initech', time: '2 hours ago' },
  { id: 2, user: 'Mike Ross', action: 'logged a call with', target: 'LexCorp', time: '4 hours ago' },
  { id: 3, user: 'System', action: 'generated automated health report for', target: 'All Enterprise Accounts', time: '12 hours ago' },
  { id: 4, user: 'Alex Chen', action: 'escalated support ticket for', target: 'Massive Dynamic', time: '1 day ago' },
];

export const getStatusColor = (status: string) => {
  switch(status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'at-risk': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'churned': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'trial': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

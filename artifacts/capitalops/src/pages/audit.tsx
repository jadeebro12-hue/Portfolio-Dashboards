import { MOCK_AUDIT_LOGS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Audit() {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-600';
      case 'rejected': return 'bg-red-500/10 text-red-600';
      case 'flagged': return 'bg-orange-500/10 text-orange-600';
      case 'edited': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Audit Trail</h2>
          <p className="text-sm text-muted-foreground">Chronological log of all financial operations and access.</p>
        </div>
        <Button variant="outline" size="sm">Export Logs</Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search user, action, or resource ID..." className="pl-9 bg-background" />
          </div>
          <Button variant="outline" size="sm" className="bg-background">
            <Filter className="h-4 w-4 mr-2" />
            Filter Events
          </Button>
        </div>

        <div className="p-0">
          {MOCK_AUDIT_LOGS.map((log, i) => (
            <div key={log.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors ${i !== MOCK_AUDIT_LOGS.length - 1 ? 'border-b' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <Badge variant="outline" className={`capitalize border-0 ${getActionColor(log.action)}`}>
                    {log.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    <span className="text-foreground">{log.user}</span> performed <span className="font-semibold">{log.action}</span> on <span className="text-foreground">{log.resource}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Event ID: {log.id}</p>
                </div>
              </div>
              <div className="text-right whitespace-nowrap">
                <p className="text-sm text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

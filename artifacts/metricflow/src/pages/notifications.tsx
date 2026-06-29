import { useState } from "react";
import { mockNotifications } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertTriangle, CheckSquare, MessageSquare, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'task': return <CheckSquare className="h-4 w-4 text-amber-500" />;
      case 'mention': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const renderList = (filterType: string) => {
    const filtered = filterType === 'all' ? notifications : notifications.filter(n => n.type === filterType);

    if (filtered.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 mb-4 text-muted/30" />
          <p>You're all caught up!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        {filtered.map(n => (
          <Card key={n.id} className={`transition-colors ${!n.read ? 'bg-primary/5 border-primary/20' : ''}`}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-full ${!n.read ? 'bg-background' : 'bg-secondary'}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
              </div>
              {!n.read && (
                <Button variant="ghost" size="sm" onClick={() => markRead(n.id)} className="h-8 w-8 p-0 shrink-0">
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on account health and team activities.</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark all as read
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
          <TabsTrigger value="mention">Mentions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">{renderList('all')}</TabsContent>
        <TabsContent value="alert">{renderList('alert')}</TabsContent>
        <TabsContent value="task">{renderList('task')}</TabsContent>
        <TabsContent value="mention">{renderList('mention')}</TabsContent>
      </Tabs>
    </div>
  );
}
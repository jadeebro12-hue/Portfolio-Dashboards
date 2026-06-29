import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your workspace and personal preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-row md:flex-col h-auto justify-start bg-transparent p-0 w-full md:w-48 overflow-x-auto shrink-0">
          <TabsTrigger value="profile" className="justify-start data-[state=active]:bg-secondary px-4 py-2 w-full">Profile</TabsTrigger>
          <TabsTrigger value="team" className="justify-start data-[state=active]:bg-secondary px-4 py-2 w-full">Team</TabsTrigger>
          <TabsTrigger value="billing" className="justify-start data-[state=active]:bg-secondary px-4 py-2 w-full">Billing</TabsTrigger>
          <TabsTrigger value="integrations" className="justify-start data-[state=active]:bg-secondary px-4 py-2 w-full">Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="justify-start data-[state=active]:bg-secondary px-4 py-2 w-full">Notifications</TabsTrigger>
        </TabsList>
        
        <div className="flex-1">
          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="jane@metricflow.app" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive daily summaries via email.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Health Score Drops</Label>
                    <p className="text-sm text-muted-foreground">Immediate alert when account health drops below 50.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New Ticket Escalations</Label>
                    <p className="text-sm text-muted-foreground">Notify me when high-priority tickets are created.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-0">
             <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Invite and manage workspace members.</CardDescription>
              </CardHeader>
              <CardContent className="py-12 text-center text-muted-foreground border-t">
                Team management features are available on the Enterprise plan.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-0">
             <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your MetricFlow subscription.</CardDescription>
              </CardHeader>
              <CardContent className="py-12 text-center text-muted-foreground border-t">
                Billing information will appear here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0">
             <Card>
              <CardHeader>
                <CardTitle>Connected Apps</CardTitle>
                <CardDescription>Link MetricFlow with your existing tools.</CardDescription>
              </CardHeader>
              <CardContent className="py-12 text-center text-muted-foreground border-t">
                Integration directory coming soon.
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
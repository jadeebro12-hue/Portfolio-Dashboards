import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Platform Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace configuration and operational rules.</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="team">Team & Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing & Limits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Legal entity details for compliance and invoicing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" defaultValue="CapitalOps Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID (EIN)</Label>
                  <Input id="taxId" defaultValue="XX-XXXXXXX" type="password" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Registered Address</Label>
                  <Input id="address" defaultValue="100 Financial District Blvd, New York NY" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control when and how your team receives alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Approval Requests</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts when items require your approval.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Risk Flags</Label>
                    <p className="text-sm text-muted-foreground">Immediate alerts for compliance or budget flags.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Summary report of spend and pending items.</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Placeholder for others */}
        <TabsContent value="team"><Card><CardContent className="py-10 text-center text-muted-foreground">Team management configuration goes here.</CardContent></Card></TabsContent>
        <TabsContent value="billing"><Card><CardContent className="py-10 text-center text-muted-foreground">Billing and limits configuration goes here.</CardContent></Card></TabsContent>

      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { mockAccounts, getStatusColor } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreHorizontal, Download, Building2, FilterX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AccountListSkeleton, DataEmptyState, DataErrorState } from "@/components/data-states";
import { getDataState, retryDataState } from "@/lib/data-state";
import { DesignNote } from "@/components/design-notes";

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, setLocation] = useLocation();
  const accountsState = getDataState("accounts");

  const filteredAccounts = mockAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          account.csm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">Manage and monitor all your customer accounts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Link href="/onboarding">
            <Button size="sm">Add Account</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts or CSMs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {accountsState === "loading" ? (
            <AccountListSkeleton />
          ) : accountsState === "error" ? (
            <DataErrorState
              title="Couldn't load accounts"
              description="Check your billing source connection, then retry to restore account health scores."
              onRetry={() => retryDataState("accounts")}
            />
          ) : accountsState === "empty" ? (
            <DataEmptyState
              icon={Building2}
              title="No accounts are tracking yet"
              description="Add your first account to start monitoring health scores, ARR, and customer activity."
              action={{ label: "Add Account", onClick: () => setLocation("/onboarding") }}
            />
          ) : filteredAccounts.length === 0 ? (
            <DataEmptyState
              icon={FilterX}
              title="No accounts match these filters"
              description="Clear the search or status filter to see the accounts your team is tracking."
              action={{ label: "Clear Filters", onClick: () => { setSearchTerm(""); setStatusFilter("all"); } }}
            />
          ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="relative">
                    Health
                    <DesignNote
                      number={3}
                      title="Health is a fast scan"
                      rationale="I pair the health score with a semantic progress bar so a CSM can scan account risk across the list before opening a detail view."
                      className="left-14 top-2"
                      side="bottom"
                    />
                  </TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>CSM</TableHead>
                  <TableHead className="text-right">ARR</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                    <TableRow key={account.id} className="group">
                      <TableCell className="font-medium">
                        <Link href={`/accounts/${account.id}`} className="hover:underline text-primary">
                          {account.name}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">Last active {account.lastActivity}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize transition-colors duration-150 ${getStatusColor(account.status)}`}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-[width,background-color] duration-150 ease-out ${account.health > 80 ? 'bg-success' : account.health > 50 ? 'bg-warning' : 'bg-destructive'}`} 
                              style={{ width: `${account.health}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-6">{account.health}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{account.plan}</TableCell>
                      <TableCell className="text-sm">{account.users}</TableCell>
                      <TableCell className="text-sm">{account.csm}</TableCell>
                      <TableCell className="text-right font-medium">${account.arr.toLocaleString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/accounts/${account.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Log Activity</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-warning">Flag at Risk</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          )}
          <div className="text-xs text-muted-foreground mt-4 text-right">
            Showing {filteredAccounts.length} of {mockAccounts.length} accounts
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
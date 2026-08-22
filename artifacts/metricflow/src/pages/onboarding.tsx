import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ChevronRight, Check, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DataEmptyState, DataErrorState, WizardSkeleton } from "@/components/data-states";
import { getDataState, retryDataState } from "@/lib/data-state";
import { DesignNote } from "@/components/design-notes";

const steps = [
  { id: 1, name: "Company" },
  { id: 2, name: "Plan" },
  { id: 3, name: "Team" },
  { id: 4, name: "Config" },
  { id: 5, name: "Review" }
];

const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  website: z.string().url("Must be a valid URL"),
  industry: z.string().min(1, "Industry is required")
});

const planSchema = z.object({
  planType: z.string().min(1, "Plan selection is required"),
  billingCycle: z.enum(["monthly", "annual"]),
  seats: z.coerce.number().min(1, "At least 1 seat required")
});

const teamSchema = z.object({
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Valid email required"),
});

const configSchema = z.object({
  crm: z.string().min(1, "CRM selection required"),
  syncFrequency: z.string().min(1, "Sync frequency required"),
  enableAlerts: z.boolean().default(true)
});

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [formData, setFormData] = useState<any>({});
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState(false);
  const [, setLocation] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const onboardingState = getDataState("onboarding");
  const provisioningState = getDataState("provisioning");

  const companyForm = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "", website: "", industry: "" }
  });

  const planForm = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: { planType: "", billingCycle: "monthly", seats: 1 }
  });

  const teamForm = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: { adminName: "", adminEmail: "" }
  });

  const configForm = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: { crm: "", syncFrequency: "daily", enableAlerts: true }
  });

  const handleNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = () => {
    setProvisionError(false);
    setIsProvisioning(true);
    window.setTimeout(() => {
      setIsProvisioning(false);
      if (provisioningState === "error") {
        setProvisionError(true);
        return;
      }
      setIsComplete(true);
    }, 450);
  };

  if (onboardingState === "loading" || isProvisioning) {
    return <WizardSkeleton />;
  }

  if (onboardingState === "error") {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <DataErrorState
          title="Couldn't load provisioning setup"
          description="Check the provisioning connection, then retry to load account plans and integration options."
          onRetry={() => retryDataState("onboarding")}
        />
      </div>
    );
  }

  if (onboardingState === "empty") {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <DataEmptyState
          icon={CreditCard}
          title="No provisioning templates are available"
          description="Add a billing plan before provisioning a new account for your team."
          action={{ label: "Go to Settings", onClick: () => setLocation("/settings") }}
        />
      </div>
    );
  }

  if (provisionError) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <DataErrorState
          title="Couldn't provision this account"
          description="Check the billing and integration details, then retry provisioning the account."
          onRetry={handleComplete}
        />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Account Provisioned Successfully</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          {formData.name} has been set up with a {formData.planType} plan. The initial admin ({formData.adminName}) will receive an invitation email shortly.
        </p>
        <div className="pt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => { setIsComplete(false); setCurrentStep(1); setFormData({}); }}>
            Provision Another
          </Button>
          <Button onClick={() => setLocation("/")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-center">New Account Provisioning</h2>
        <p className="text-muted-foreground text-center mt-1">Complete the steps below to onboard a new customer.</p>
      </div>

      <div className="relative">
        <DesignNote
          number={6}
          title="Progress keeps its context"
          rationale="I use a persistent stepper and directional transitions so the provisioning flow feels ordered while preserving the context of what came before and what remains."
          className="-right-3 -top-3"
          side="left"
        />
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-secondary -z-10" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-500" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} 
        />
        
        <div className="flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                ${currentStep > step.id ? 'bg-primary border-primary text-primary-foreground' : 
                  currentStep === step.id ? 'bg-background border-primary text-primary' : 
                  'bg-background border-muted text-muted-foreground'}`}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span className={`text-xs font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="mt-8 border-primary/20 shadow-lg shadow-primary/5">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            variants={{
              enter: (travel: number) => ({
                opacity: shouldReduceMotion ? 1 : 0,
                x: shouldReduceMotion ? 0 : travel > 0 ? 18 : -18,
              }),
              center: { opacity: 1, x: 0 },
              exit: (travel: number) => ({
                opacity: shouldReduceMotion ? 1 : 0,
                x: shouldReduceMotion ? 0 : travel > 0 ? -18 : 18,
              }),
            }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
          >
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Company Information"}
            {currentStep === 2 && "Plan & Billing"}
            {currentStep === 3 && "Team Setup"}
            {currentStep === 4 && "Integration Configuration"}
            {currentStep === 5 && "Review & Confirm"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Basic details about the new customer."}
            {currentStep === 2 && "Select subscription tier and billing preferences."}
            {currentStep === 3 && "Configure initial admin accounts."}
            {currentStep === 4 && "Setup required third-party connections."}
            {currentStep === 5 && "Verify all details before provisioning."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(handleNext)} className="space-y-4">
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input placeholder="Acme Corp" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl><Input placeholder="https://acme.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tech">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit">Next Step <ChevronRight className="ml-2 w-4 h-4"/></Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 2 && (
            <Form {...planForm}>
              <form onSubmit={planForm.handleSubmit(handleNext)} className="space-y-4">
                <FormField
                  control={planForm.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Tier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={planForm.control}
                    name="billingCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual (20% off)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="seats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Seats</FormLabel>
                        <FormControl><Input type="number" min={1} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                  <Button type="submit">Next Step <ChevronRight className="ml-2 w-4 h-4"/></Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 3 && (
            <Form {...teamForm}>
              <form onSubmit={teamForm.handleSubmit(handleNext)} className="space-y-4">
                <FormField
                  control={teamForm.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Admin Name</FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={teamForm.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Admin Email</FormLabel>
                      <FormControl><Input type="email" placeholder="jane@company.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                  <Button type="submit">Next Step <ChevronRight className="ml-2 w-4 h-4"/></Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 4 && (
            <Form {...configForm}>
              <form onSubmit={configForm.handleSubmit(handleNext)} className="space-y-4">
                <FormField
                  control={configForm.control}
                  name="crm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRM Integration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CRM system" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="salesforce">Salesforce</SelectItem>
                          <SelectItem value="hubspot">HubSpot</SelectItem>
                          <SelectItem value="pipedrive">Pipedrive</SelectItem>
                          <SelectItem value="none">None / Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="syncFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Sync Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sync frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time (Webhooks)</SelectItem>
                          <SelectItem value="hourly">Hourly Batch</SelectItem>
                          <SelectItem value="daily">Daily Batch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="enableAlerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable System Alerts</FormLabel>
                        <FormDescription>
                          Automatically notify admins of sync failures.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                  <Button type="submit">Review Details <ChevronRight className="ml-2 w-4 h-4"/></Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="rounded-md border p-4 bg-secondary/20">
                <h3 className="font-semibold text-lg mb-4">Summary</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Company</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Website</dt>
                    <dd className="font-medium">{formData.website}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Plan Tier</dt>
                    <dd className="font-medium capitalize">{formData.planType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Seats</dt>
                    <dd className="font-medium">{formData.seats}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Admin</dt>
                    <dd className="font-medium">{formData.adminName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">CRM</dt>
                    <dd className="font-medium capitalize">{formData.crm}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleComplete} className="bg-success hover:bg-success/90 text-background">
                  <CheckCircle2 className="mr-2 w-4 h-4"/> Provision Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
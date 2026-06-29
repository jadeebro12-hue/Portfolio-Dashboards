import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronRight, Building2, CreditCard, ShieldCheck, Settings2, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";

const STEPS = [
  { id: 1, name: "Vendor Details", icon: Building2 },
  { id: 2, name: "Banking Info", icon: CreditCard },
  { id: 3, name: "Compliance", icon: ShieldCheck },
  { id: 4, name: "Controls", icon: Settings2 },
  { id: 5, name: "Review", icon: FileText }
];

const vendorSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  legalName: z.string().min(2, "Legal name is required"),
  address: z.string().min(5, "Full address is required"),
  routingNumber: z.string().length(9, "Routing number must be exactly 9 digits").regex(/^\d+$/, "Must contain only numbers"),
  accountNumber: z.string().min(8, "Account number must be at least 8 digits").regex(/^\d+$/, "Must contain only numbers"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  ein: z.string().regex(/^\d{2}-\d{7}$/, "EIN must be in XX-XXXXXXX format"),
  w9Status: z.string().min(1, "W-9 status is required"),
  spendLimit: z.coerce.number().min(1, "Spend limit must be greater than 0"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export function Approvals() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      companyName: "",
      legalName: "",
      address: "",
      routingNumber: "",
      accountNumber: "",
      paymentMethod: "",
      ein: "",
      w9Status: "pending",
      spendLimit: 0,
      paymentTerms: "",
    },
    mode: "onChange",
  });

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof VendorFormValues)[] = [];
    switch (step) {
      case 1:
        fieldsToValidate = ["companyName", "legalName", "address"];
        break;
      case 2:
        fieldsToValidate = ["routingNumber", "accountNumber", "paymentMethod"];
        break;
      case 3:
        fieldsToValidate = ["ein", "w9Status"];
        break;
      case 4:
        fieldsToValidate = ["spendLimit", "paymentTerms"];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(Math.min(5, currentStep + 1));
    }
  };

  const handleBack = () => setCurrentStep(Math.max(1, currentStep - 1));
  
  const onSubmit = (data: VendorFormValues) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center max-w-md mx-auto py-20 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
          <Check className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Your vendor is being verified</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The onboarding request for {form.getValues("companyName")} has been submitted to the compliance team. You will be notified once the vendor is active and ready for transactions.
          </p>
        </div>
        <div className="pt-6 w-full">
          <Button className="w-full" onClick={() => setLocation("/")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Vendor Onboarding</h2>
        <p className="text-sm text-muted-foreground mt-1">Complete the multi-step approval workflow for new vendors.</p>
      </div>

      {/* Progress Bar */}
      <div className="relative pt-2 pb-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        ></div>
        
        <div className="relative z-10 flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background
                  ${isCompleted ? 'border-primary text-primary bg-primary/5' : isCurrent ? 'border-primary text-primary shadow-sm ring-4 ring-primary/10' : 'border-muted text-muted-foreground'}
                `}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-3 font-medium transition-colors ${isCurrent ? 'text-foreground' : isCompleted ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="mt-8 shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>Please provide the required information below to proceed.</CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="legalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Entity Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Corporation Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headquarters Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business Rd, Suite 100, San Francisco, CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormField
                    control={form.control}
                    name="routingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routing Number</FormLabel>
                        <FormControl>
                          <Input placeholder="9 digit routing number" {...field} maxLength={9} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ach">ACH Transfer</SelectItem>
                            <SelectItem value="wire">Wire Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormField
                    control={form.control}
                    name="ein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Identification Number (EIN)</FormLabel>
                        <FormControl>
                          <Input placeholder="XX-XXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="w9Status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>W-9 Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select W-9 status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending Upload</SelectItem>
                            <SelectItem value="uploaded">Uploaded</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-2 mt-4">
                    <Label>Tax Documents</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Click to upload W-9</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF or Image up to 5MB</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormField
                    control={form.control}
                    name="spendLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Spend Limit</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                            <Input className="pl-7" placeholder="10000" type="number" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="net30">Net 30</SelectItem>
                            <SelectItem value="net45">Net 45</SelectItem>
                            <SelectItem value="net60">Net 60</SelectItem>
                            <SelectItem value="due_receipt">Due on Receipt</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-lg border bg-card overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" /> Vendor Information
                      </h3>
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={()=>setCurrentStep(1)}>Edit</Button>
                    </div>
                    <div className="p-4 grid gap-4">
                      <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground">Company Name</span>
                        <span className="font-medium">{form.getValues("companyName")}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground">Legal Name</span>
                        <span className="font-medium">{form.getValues("legalName")}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground">Address</span>
                        <span className="font-medium">{form.getValues("address")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border bg-card overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" /> Financial Setup
                      </h3>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={()=>setCurrentStep(2)}>Edit Bank</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={()=>setCurrentStep(4)}>Edit Limits</Button>
                      </div>
                    </div>
                    <div className="p-4 grid gap-4">
                      <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium capitalize">{form.getValues("paymentMethod")}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground">Routing Number</span>
                        <span className="font-medium">••••{form.getValues("routingNumber").slice(-4)}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground">Spend Limit</span>
                        <span className="font-medium">${Number(form.getValues("spendLimit")).toLocaleString()} / month</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground">Terms</span>
                        <span className="font-medium">{form.getValues("paymentTerms") === 'due_receipt' ? 'Due on Receipt' : 'Net ' + form.getValues("paymentTerms").replace('net', '')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
              <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1}>Back</Button>
              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext}>Next Step <ChevronRight className="w-4 h-4 ml-2" /></Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                  {isSubmitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

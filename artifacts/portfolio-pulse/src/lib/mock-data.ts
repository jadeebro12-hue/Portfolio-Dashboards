import { addDays, subMonths, startOfMonth, format, subDays, addMonths, isBefore, isAfter } from 'date-fns';

const TODAY = new Date();

export type FundingSource = "9% LIHTC" | "4% LIHTC + Tax-Exempt Bonds" | "HOME" | "HUD Section 8" | "State Trust Fund";

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  totalUnits: number;
  fundingSources: FundingSource[];
  placedInServiceDate: string;
  compliancePeriodEndDate: string;
  affordabilitySetAsides: string[];
  currentOccupancyPct: number;
  statusHealthScore: number;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  amiTier: number;
  currentRent: number;
  maxAllowableRent: number;
  occupancyStatus: "occupied" | "vacant" | "notice";
  tenantName: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
}

export interface FinancialRecord {
  id: string;
  propertyId: string;
  month: string; // YYYY-MM
  rentalIncome: { actual: number; budget: number };
  vacancyLoss: { actual: number; budget: number };
  otherIncome: { actual: number; budget: number };
  operatingExpenses: { actual: number; budget: number };
  debtService: { actual: number; budget: number };
  reserveDeposit: { actual: number; budget: number };
}

export interface ComplianceEvent {
  id: string;
  propertyId: string;
  eventType: "Annual Tenant Income Recertification" | "Tenant Income Certification (TIC)" | "HUD REAC Inspection" | "State Agency Compliance Monitoring" | "Annual Owner Certification" | "Physical Inspection" | "Utility Allowance Update";
  dueDate: string;
  status: "completed" | "upcoming" | "due-this-week" | "overdue";
}

export interface Investor {
  id: string;
  name: string;
  entityType: "LIHTC Syndicator" | "Lender" | "HUD" | "State Housing Finance Agency";
  properties: string[]; // property IDs
  reportingFrequency: "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";
  nextReportDueDate: string;
  lastReportDate: string;
}

// 18 Mock Properties
export const properties: Property[] = [
  { id: "p1", name: "Riverside Commons", address: "100 River Way", city: "Portland", state: "OR", totalUnits: 120, fundingSources: ["9% LIHTC", "HOME"], placedInServiceDate: "2015-06-15", compliancePeriodEndDate: "2030-12-31", affordabilitySetAsides: ["60% AMI", "50% AMI"], currentOccupancyPct: 0.98, statusHealthScore: 95 },
  { id: "p2", name: "Maple Grove Estates", address: "450 Maple St", city: "Columbus", state: "OH", totalUnits: 85, fundingSources: ["4% LIHTC + Tax-Exempt Bonds"], placedInServiceDate: "2018-09-01", compliancePeriodEndDate: "2033-12-31", affordabilitySetAsides: ["60% AMI"], currentOccupancyPct: 0.94, statusHealthScore: 82 },
  { id: "p3", name: "Cedarwood Terrace", address: "1200 Cedar Ln", city: "Austin", state: "TX", totalUnits: 200, fundingSources: ["9% LIHTC", "HUD Section 8"], placedInServiceDate: "2012-03-10", compliancePeriodEndDate: "2027-12-31", affordabilitySetAsides: ["50% AMI", "30% AMI"], currentOccupancyPct: 0.99, statusHealthScore: 91 },
  { id: "p4", name: "Pinecrest Apartments", address: "88 Pine Ave", city: "Denver", state: "CO", totalUnits: 64, fundingSources: ["9% LIHTC"], placedInServiceDate: "2020-11-20", compliancePeriodEndDate: "2035-12-31", affordabilitySetAsides: ["60% AMI"], currentOccupancyPct: 0.91, statusHealthScore: 78 },
  { id: "p5", name: "Elm Street Family Housing", address: "500 Elm St", city: "Chicago", state: "IL", totalUnits: 150, fundingSources: ["4% LIHTC + Tax-Exempt Bonds", "HOME"], placedInServiceDate: "2010-05-01", compliancePeriodEndDate: "2025-12-31", affordabilitySetAsides: ["60% AMI", "50% AMI", "40% AMI"], currentOccupancyPct: 0.96, statusHealthScore: 88 },
  { id: "p6", name: "Oak Hill Senior Living", address: "220 Oak Hill Dr", city: "Atlanta", state: "GA", totalUnits: 90, fundingSources: ["9% LIHTC"], placedInServiceDate: "2016-08-15", compliancePeriodEndDate: "2031-12-31", affordabilitySetAsides: ["60% AMI", "50% AMI"], currentOccupancyPct: 1.0, statusHealthScore: 98 },
  { id: "p7", name: "Willow Creek Homes", address: "70 Willow Creek Rd", city: "Seattle", state: "WA", totalUnits: 110, fundingSources: ["4% LIHTC + Tax-Exempt Bonds", "State Trust Fund"], placedInServiceDate: "2019-02-28", compliancePeriodEndDate: "2034-12-31", affordabilitySetAsides: ["60% AMI", "30% AMI"], currentOccupancyPct: 0.97, statusHealthScore: 92 },
  { id: "p8", name: "Sunnyside Meadows", address: "340 Sunnyside Ave", city: "Phoenix", state: "AZ", totalUnits: 140, fundingSources: ["9% LIHTC"], placedInServiceDate: "2014-10-10", compliancePeriodEndDate: "2029-12-31", affordabilitySetAsides: ["60% AMI", "50% AMI"], currentOccupancyPct: 0.93, statusHealthScore: 85 },
  { id: "p9", name: "Horizon View Towers", address: "900 Horizon Blvd", city: "Miami", state: "FL", totalUnits: 250, fundingSources: ["4% LIHTC + Tax-Exempt Bonds", "HUD Section 8"], placedInServiceDate: "2008-12-01", compliancePeriodEndDate: "2023-12-31", affordabilitySetAsides: ["60% AMI", "50% AMI"], currentOccupancyPct: 0.89, statusHealthScore: 72 }, // Over compliance period end, lower health
  { id: "p10", name: "Beacon Hill Residences", address: "15 Beacon St", city: "Boston", state: "MA", totalUnits: 55, fundingSources: ["9% LIHTC", "State Trust Fund"], placedInServiceDate: "2021-04-15", compliancePeriodEndDate: "2036-12-31", affordabilitySetAsides: ["60% AMI", "30% AMI"], currentOccupancyPct: 0.98, statusHealthScore: 96 },
  { id: "p11", name: "Valley Forge Gardens", address: "400 Valley Rd", city: "Philadelphia", state: "PA", totalUnits: 130, fundingSources: ["4% LIHTC + Tax-Exempt Bonds"], placedInServiceDate: "2017-07-20", compliancePeriodEndDate: "2032-12-31", affordabilitySetAsides: ["60% AMI"], currentOccupancyPct: 0.95, statusHealthScore: 89 },
  { id: "p12", name: "Lakefront Commons", address: "10 Lakefront Dr", city: "Detroit", state: "MI", totalUnits: 175, fundingSources: ["9% LIHTC", "HOME"], placedInServiceDate: "2011-09-30", compliancePeriodEndDate: "2026-12-31", affordabilitySetAsides: ["60% AMI", "50% AMI"], currentOccupancyPct: 0.92, statusHealthScore: 84 },
  { id: "p13", name: "Heritage Park", address: "55 Heritage Way", city: "Nashville", state: "TN", totalUnits: 80, fundingSources: ["9% LIHTC"], placedInServiceDate: "2013-11-15", compliancePeriodEndDate: "2028-12-31", affordabilitySetAsides: ["60% AMI"], currentOccupancyPct: 0.99, statusHealthScore: 94 },
  { id: "p14", name: "Summit Ridge Apartments", address: "800 Summit Ave", city: "Salt Lake City", state: "UT", totalUnits: 105, fundingSources: ["4% LIHTC + Tax-Exempt Bonds", "HUD Section 8"], placedInServiceDate: "2019-06-01", compliancePeriodEndDate: "2034-12-31", affordabilitySetAsides: ["50% AMI", "30% AMI"], currentOccupancyPct: 0.96, statusHealthScore: 90 },
  { id: "p15", name: "Pioneer Square Housing", address: "200 Pioneer Sq", city: "Portland", state: "OR", totalUnits: 60, fundingSources: ["9% LIHTC", "State Trust Fund"], placedInServiceDate: "2022-01-10", compliancePeriodEndDate: "2037-12-31", affordabilitySetAsides: ["60% AMI", "40% AMI"], currentOccupancyPct: 0.97, statusHealthScore: 97 },
  { id: "p16", name: "Magnolia Trace", address: "330 Magnolia Ln", city: "Charlotte", state: "NC", totalUnits: 160, fundingSources: ["4% LIHTC + Tax-Exempt Bonds"], placedInServiceDate: "2015-03-25", compliancePeriodEndDate: "2030-12-31", affordabilitySetAsides: ["60% AMI"], currentOccupancyPct: 0.94, statusHealthScore: 86 },
  { id: "p17", name: "Liberty Heights", address: "1776 Liberty Blvd", city: "Richmond", state: "VA", totalUnits: 95, fundingSources: ["9% LIHTC", "HOME"], placedInServiceDate: "2010-10-31", compliancePeriodEndDate: "2025-12-31", affordabilitySetAsides: ["60% AMI", "50% AMI", "40% AMI"], currentOccupancyPct: 0.91, statusHealthScore: 81 },
  { id: "p18", name: "Evergreen Community", address: "40 Evergreen Pl", city: "Minneapolis", state: "MN", totalUnits: 115, fundingSources: ["9% LIHTC", "HUD Section 8"], placedInServiceDate: "2018-05-15", compliancePeriodEndDate: "2033-12-31", affordabilitySetAsides: ["50% AMI"], currentOccupancyPct: 0.98, statusHealthScore: 93 }
];

// Helper for generating deterministic random numbers
const mulberry32 = (a: number) => {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
const rand = mulberry32(12345);

const names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];

export const generateUnits = (): Unit[] => {
  const units: Unit[] = [];
  let unitIdCounter = 1;
  let violationsCreated = 0;
  
  for (const property of properties) {
    for (let i = 1; i <= property.totalUnits; i++) {
      const isVacant = rand() > property.currentOccupancyPct;
      const bedrooms = Math.floor(rand() * 4); // 0 to 3
      const amiTier = property.affordabilitySetAsides.length > 0 
        ? parseInt(property.affordabilitySetAsides[Math.floor(rand() * property.affordabilitySetAsides.length)].replace('% AMI', '')) 
        : 60;
      
      const maxAllowableRent = 600 + (bedrooms * 200) + ((amiTier - 30) * 10);
      let currentRent = maxAllowableRent;
      
      // Force 3 violations globally across all properties
      const isViolation = !isVacant && violationsCreated < 3 && rand() > 0.95;
      if (isViolation) {
        currentRent = maxAllowableRent + Math.floor(rand() * 150) + 50;
        violationsCreated++;
      } else if (!isVacant) {
        currentRent = maxAllowableRent - Math.floor(rand() * 50); // Usually a bit under max
      }

      units.push({
        id: `u${unitIdCounter++}`,
        propertyId: property.id,
        unitNumber: `${Math.floor(i / 10) + 1}${String(i % 10).padStart(2, '0')}`,
        bedrooms,
        amiTier,
        currentRent: isVacant ? 0 : currentRent,
        maxAllowableRent,
        occupancyStatus: isVacant ? "vacant" : (rand() > 0.95 ? "notice" : "occupied"),
        tenantName: isVacant ? null : `${firstNames[Math.floor(rand()*firstNames.length)]} ${names[Math.floor(rand()*names.length)]}`,
        leaseStartDate: isVacant ? null : format(subDays(TODAY, Math.floor(rand() * 700) + 30), 'yyyy-MM-dd'),
        leaseEndDate: isVacant ? null : format(addDays(TODAY, Math.floor(rand() * 300) - 60), 'yyyy-MM-dd'),
      });
    }
  }
  return units;
};

export const units = generateUnits();

export const generateFinancials = (): FinancialRecord[] => {
  const records: FinancialRecord[] = [];
  
  for (const property of properties) {
    const propertyUnits = units.filter(u => u.propertyId === property.id);
    const maxPotentialRent = propertyUnits.reduce((acc, u) => acc + u.maxAllowableRent, 0);
    
    // Generate 12 months of history
    for (let i = 11; i >= 0; i--) {
      const monthDate = startOfMonth(subMonths(TODAY, i));
      const isRecentMonths = i < 3;
      
      // Budget basics
      const budgetRent = maxPotentialRent * 0.95; 
      const budgetVacancy = maxPotentialRent * 0.05;
      const budgetExpenses = budgetRent * 0.4;
      const budgetDebt = budgetRent * 0.45;
      const budgetReserve = budgetRent * 0.05;

      // Actuals variance
      const rentVariance = (rand() * 0.06) - 0.03; // -3% to +3%
      let expenseVariance = (rand() * 0.1) - 0.02; // -2% to +8%
      
      // Force some specific properties to have negative NOI variance
      if (property.id === "p9" || property.id === "p4") {
        expenseVariance = (rand() * 0.15) + 0.1; // Big expense overage
      }

      const actualRent = budgetRent * (1 + rentVariance);
      const actualVacancy = maxPotentialRent - actualRent;
      
      records.push({
        id: `f_${property.id}_${i}`,
        propertyId: property.id,
        month: format(monthDate, 'yyyy-MM'),
        rentalIncome: { actual: actualRent, budget: budgetRent },
        vacancyLoss: { actual: actualVacancy, budget: budgetVacancy },
        otherIncome: { actual: budgetRent * 0.02 * (1 + (rand() * 0.1 - 0.05)), budget: budgetRent * 0.02 },
        operatingExpenses: { actual: budgetExpenses * (1 + expenseVariance), budget: budgetExpenses },
        debtService: { actual: budgetDebt, budget: budgetDebt },
        reserveDeposit: { actual: budgetReserve, budget: budgetReserve }
      });
    }
  }
  return records;
};

export const financials = generateFinancials();

export const generateComplianceEvents = (): ComplianceEvent[] => {
  const events: ComplianceEvent[] = [];
  let eventId = 1;
  const eventTypes: ComplianceEvent['eventType'][] = [
    "Annual Tenant Income Recertification",
    "Tenant Income Certification (TIC)",
    "HUD REAC Inspection",
    "State Agency Compliance Monitoring",
    "Annual Owner Certification",
    "Physical Inspection",
    "Utility Allowance Update"
  ];
  
  let overdueCount = 0;
  let dueThisWeekCount = 0;

  for (const property of properties) {
    const numEvents = Math.floor(rand() * 3) + 1; // 1 to 3 events per property
    for (let i = 0; i < numEvents; i++) {
      const type = eventTypes[Math.floor(rand() * eventTypes.length)];
      let dueDate: Date;
      let status: ComplianceEvent['status'];
      
      const r = rand();
      if (r < 0.15 && overdueCount < 4) { // Force ~4 overdue
        dueDate = subDays(TODAY, Math.floor(rand() * 14) + 1);
        status = "overdue";
        overdueCount++;
      } else if (r < 0.35 && dueThisWeekCount < 6) { // Force ~6 due this week
        dueDate = addDays(TODAY, Math.floor(rand() * 7));
        status = "due-this-week";
        dueThisWeekCount++;
      } else if (r < 0.7) {
        dueDate = addDays(TODAY, Math.floor(rand() * 60) + 8);
        status = "upcoming";
      } else {
        dueDate = subDays(TODAY, Math.floor(rand() * 30) + 15);
        status = "completed";
      }

      events.push({
        id: `ce_${eventId++}`,
        propertyId: property.id,
        eventType: type,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        status
      });
    }
  }
  
  // Sort by date mostly
  return events.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

export const complianceEvents = generateComplianceEvents();

export const investors: Investor[] = [
  { id: "inv1", name: "Crestwood Capital Partners", entityType: "LIHTC Syndicator", properties: ["p1", "p3", "p4", "p6", "p8", "p10", "p12", "p13", "p15", "p17", "p18"], reportingFrequency: "Quarterly", nextReportDueDate: format(addDays(TODAY, 15), 'yyyy-MM-dd'), lastReportDate: format(subDays(TODAY, 75), 'yyyy-MM-dd') },
  { id: "inv2", name: "Meridian Housing Fund", entityType: "LIHTC Syndicator", properties: ["p2", "p5", "p7", "p9", "p11", "p14", "p16"], reportingFrequency: "Quarterly", nextReportDueDate: format(addDays(TODAY, 20), 'yyyy-MM-dd'), lastReportDate: format(subDays(TODAY, 70), 'yyyy-MM-dd') },
  { id: "inv3", name: "HUD Office of Multifamily Housing", entityType: "HUD", properties: ["p3", "p9", "p14", "p18"], reportingFrequency: "Annual", nextReportDueDate: format(addDays(TODAY, 120), 'yyyy-MM-dd'), lastReportDate: format(subDays(TODAY, 245), 'yyyy-MM-dd') },
  { id: "inv4", name: "Lakeside Community Development", entityType: "Lender", properties: ["p1", "p5", "p12", "p17"], reportingFrequency: "Semi-Annual", nextReportDueDate: format(addDays(TODAY, 45), 'yyyy-MM-dd'), lastReportDate: format(subDays(TODAY, 135), 'yyyy-MM-dd') },
  { id: "inv5", name: "State Housing Finance Agency", entityType: "State Housing Finance Agency", properties: ["p7", "p10", "p15"], reportingFrequency: "Annual", nextReportDueDate: format(addDays(TODAY, 10), 'yyyy-MM-dd'), lastReportDate: format(subDays(TODAY, 355), 'yyyy-MM-dd') },
  { id: "inv6", name: "Apex Housing Investors", entityType: "Lender", properties: ["p2", "p11", "p16"], reportingFrequency: "Quarterly", nextReportDueDate: format(addDays(TODAY, 5), 'yyyy-MM-dd'), lastReportDate: format(subDays(TODAY, 85), 'yyyy-MM-dd') },
];

export const getOverRentUnits = () => units.filter(u => u.currentRent > u.maxAllowableRent);
export const getOverdueCompliance = () => complianceEvents.filter(e => e.status === "overdue");
export const getDueThisWeekCompliance = () => complianceEvents.filter(e => e.status === "due-this-week");
export const getNegativeNOIProperties = () => {
  const lastMonth = financials.filter(f => f.month === format(subMonths(TODAY, 1), 'yyyy-MM'));
  const res: { property: Property, variance: number, variancePct: number }[] = [];
  
  for (const f of lastMonth) {
    const totalIncomeActual = f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual;
    const totalIncomeBudget = f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget;
    const noiActual = totalIncomeActual - f.operatingExpenses.actual;
    const noiBudget = totalIncomeBudget - f.operatingExpenses.budget;
    
    if (noiActual < noiBudget * 0.95) { // more than 5% negative variance
      const property = properties.find(p => p.id === f.propertyId)!;
      res.push({ property, variance: noiActual - noiBudget, variancePct: (noiActual - noiBudget) / noiBudget });
    }
  }
  return res.sort((a, b) => a.variance - b.variance); // Most negative first
};

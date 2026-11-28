import {
  DEFAULT_TAX_YEAR,
  TAX_YEAR_CONFIGS,
  getOldRegimeSlabs,
  type AgeGroup,
  type BusinessTaxMode,
  type ResidencyStatus,
  type TaxSlab,
  type TaxYearConfig,
  type TaxYearKey,
} from "./income-tax-rules";

export interface IncomeTaxInput {
  taxYear: TaxYearKey;
  ageGroup: AgeGroup;
  residency: ResidencyStatus;

  // Income Sources
  salary: number;
  rentalIncome: number; // Gross annual rent received (let-out property)
  homeLoanInterestLetOut: number; // Sec 24(b) on let-out property
  homeLoanInterestSelfOccupied: number; // Sec 24(b) on self-occupied property (Old Regime max 2L)
  otherIncome: number; // Interest, dividends, etc.

  // Business / Profession
  businessMode: BusinessTaxMode;
  professionalIncome: number; // Gross receipts / turnover
  businessExpenses: number; // Used in "regular" books mode

  // Capital Gains
  stcgEquity: number; // Sec 111A @ 20%
  ltcgEquity: number; // Sec 112A @ 12.5% above 1.25L
  stcgOther: number; // Non-equity STCG — taxed at normal slab rates
  ltcgOther: number; // Sec 112 @ 12.5% (or 20% if grandfathered property w/ indexation)
  ltcgOtherUseIndexation?: boolean;

  // HRA (Old Regime — applies only when salary > 0)
  useHraAssistant: boolean;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  isMetro: boolean;
  manualHraExemption: number;

  // Deductions
  employerNps80CCD2: number; // Allowed in BOTH New (up to 14%) & Old (up to 10%)
  deduction80C: number;
  deduction80D: number; // Self & family (25k <60, 50k 60+)
  deduction80DParents: number; // Parents (25k non-senior, 50k senior)
  parentsSenior: boolean;
  deductionNPS80CCD1B: number; // Additional NPS u/s 80CCD(1B) (50k Old)
  savingsInterestDeduction: number; // 80TTA (10k <60) or 80TTB (50k 60+)
  deduction80E: number; // Education loan interest (Old)
  deduction80G: number; // Eligible charitable donations (Old)
  otherDeductions: number; // Any other Chapter VI-A (Old)

  // Compliance & Prepaid Taxes
  taxPaid: number; // TDS + Advance Tax + Self-Assessment Tax already paid
  monthsDelay234A: number;
  monthsDelay234B: number;
}

export interface SlabBreakdownRow {
  slab: string;
  tax: number;
}

export interface RegimeComputation {
  regime: "Old Regime" | "New Regime";
  grossIncome: number;
  standardDeduction: number;
  hraExemption: number;
  employerNpsAllowed: number;
  chapterVIADeductions: number;
  housePropertyNet: number;
  totalDeductions: number;
  normalTaxableIncome: number;
  specialCapitalGainsIncome: number;
  totalTaxableIncome: number; // Rounded to nearest Rs. 10 u/s 288A
  slabTaxBeforeRebate: number;
  rebate87A: number;
  rebateMarginalRelief: number;
  normalTaxAfterRebate: number;
  stcg111ATax: number;
  ltcg112ATax: number;
  ltcg112Tax: number;
  totalSpecialCgTax: number;
  belOffsetAppliedToCg: number;
  taxBeforeSurcharge: number;
  surchargeBeforeRelief: number;
  surchargeMarginalRelief: number;
  surcharge: number;
  cess: number;
  totalTax: number; // Rounded to nearest Rs. 10 u/s 288B
  effectiveTaxRatePct: number;
  breakdown: SlabBreakdownRow[];
}

export interface AdvanceTaxSchedule {
  applicable: boolean;
  exemptReason: string | null;
  isPresumptiveSingleInstallment: boolean;
  installments: Array<{
    dueDate: string;
    percentageLabel: string;
    cumulativeAmount: number;
  }>;
}

export interface IncomeTaxResult {
  config: TaxYearConfig;
  netSalaryOld: number;
  netSalaryNew: number;
  netBusinessIncome: number;
  hraComputed: number;
  grossTotalIncome: number;
  oldRegime: RegimeComputation;
  newRegime: RegimeComputation;
  betterRegime: "New Regime" | "Old Regime";
  savings: number;
  activeTax: number;
  interest234A: number;
  interest234B: number;
  lateFee234F: number;
  totalInterestAndFees: number;
  taxPaid: number;
  netPayable: number; // >= 0 (after subtracting taxPaid)
  refundDue: number; // >= 0 (if taxPaid > activeTax + interest)
  annualTakeHome: number;
  monthlyTakeHome: number;
  advanceTax: AdvanceTaxSchedule;
  deductionBreakdownOld: Array<{ label: string; section: string; claimed: number; limit: string; allowed: number }>;
  deductionBreakdownNew: Array<{ label: string; section: string; claimed: number; limit: string; allowed: number }>;
}

const nonNeg = (v: number | undefined): number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;

/** Section 288A / 288B statutory rounding to nearest Rs. 10 */
export function roundToNearest10(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount / 10) * 10;
}

/** Rule 119A rounding down to nearest multiple of Rs. 100 for interest base */
export function floorTo100(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount / 100) * 100;
}

function computeProgressiveSlabs(income: number, slabs: TaxSlab[]): { tax: number; rows: SlabBreakdownRow[] } {
  let remaining = Math.max(0, income);
  let total = 0;
  const rows: SlabBreakdownRow[] = [];

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const taxableInSlab = slab.width === Infinity ? remaining : Math.min(remaining, slab.width);
    const slabTax = taxableInSlab * slab.rate;
    if (slabTax > 0) {
      rows.push({ slab: slab.label, tax: Math.round(slabTax) });
    }
    total += slabTax;
    remaining -= taxableInSlab;
  }

  return { tax: total, rows };
}

interface CoreTaxBeforeSurcharge {
  slabTaxBeforeRebate: number;
  rebate87A: number;
  rebateMarginalRelief: number;
  normalTaxAfterRebate: number;
  stcg111ATax: number;
  ltcg112ATax: number;
  ltcg112Tax: number;
  totalSpecialCgTax: number;
  belOffsetAppliedToCg: number;
  taxBeforeSurcharge: number;
  slabRows: SlabBreakdownRow[];
}

function computeCoreTax(params: {
  regime: "old" | "new";
  normalTaxable: number;
  stcgEquity: number;
  ltcgEquity: number;
  ltcgOther: number;
  ltcgOtherUseIndexation: boolean;
  ageGroup: AgeGroup;
  residency: ResidencyStatus;
  config: TaxYearConfig;
}): CoreTaxBeforeSurcharge {
  const {
    regime,
    normalTaxable,
    stcgEquity,
    ltcgEquity,
    ltcgOther,
    ltcgOtherUseIndexation,
    ageGroup,
    residency,
    config,
  } = params;

  const slabs = regime === "new" ? config.newSlabs : getOldRegimeSlabs(ageGroup);
  const bel = regime === "new" ? config.newBasicExemption : config.oldBasicExemption[ageGroup];

  // Step 1: Normal slab tax
  const { tax: slabTaxBeforeRebate, rows: slabRows } = computeProgressiveSlabs(normalTaxable, slabs);

  // Step 2: Unexhausted BEL set-off against special-rate CG (Resident individuals only)
  let unusedBel = residency === "resident" ? Math.max(0, bel - normalTaxable) : 0;
  const initialUnusedBel = unusedBel;

  const ltcgOtherRate =
    ltcgOtherUseIndexation && residency === "resident"
      ? config.capitalGains.ltcgOtherIndexedRate
      : config.capitalGains.ltcgOtherRate;

  // Apply unused BEL to highest-rate special CG first for taxpayer-optimal statutory computation
  let adjStcg111A = stcgEquity;
  let adjLtcgOther = ltcgOther;
  let adjLtcg112A = ltcgEquity;

  if (unusedBel > 0 && adjStcg111A > 0) {
    const used = Math.min(unusedBel, adjStcg111A);
    adjStcg111A -= used;
    unusedBel -= used;
  }
  if (unusedBel > 0 && adjLtcgOther > 0) {
    const used = Math.min(unusedBel, adjLtcgOther);
    adjLtcgOther -= used;
    unusedBel -= used;
  }
  if (unusedBel > 0 && adjLtcg112A > 0) {
    const used = Math.min(unusedBel, adjLtcg112A);
    adjLtcg112A -= used;
    unusedBel -= used;
  }
  const belOffsetAppliedToCg = initialUnusedBel - unusedBel;

  const stcg111ATax = adjStcg111A * config.capitalGains.stcgEquityRate;
  const ltcg112ATax =
    Math.max(0, adjLtcg112A - config.capitalGains.ltcgEquityExemption) *
    config.capitalGains.ltcgEquityRate;
  const ltcg112Tax = adjLtcgOther * ltcgOtherRate;

  // Step 3: Resident Rebate u/s 87A (1961 Act) / Sec 156 (2025 Act)
  let rebate87A = 0;
  let rebateMarginalRelief = 0;
  let normalTaxAfterRebate = slabTaxBeforeRebate;
  let effectiveStcg111ATax = stcg111ATax;
  let effectiveLtcg112Tax = ltcg112Tax;

  const totalTaxable = normalTaxable + stcgEquity + ltcgEquity + ltcgOther;

  if (residency === "resident") {
    if (regime === "new") {
      // Finance Act 2025 & CBDT rules: 87A/156 rebate and marginal relief apply strictly to normal slab-rate income
      const { threshold, maxRebate, marginalRelief } = config.newRebate;
      if (normalTaxable <= threshold) {
        rebate87A = Math.min(slabTaxBeforeRebate, maxRebate);
        normalTaxAfterRebate = Math.max(0, slabTaxBeforeRebate - rebate87A);
      } else if (marginalRelief) {
        const excessIncome = normalTaxable - threshold;
        if (slabTaxBeforeRebate > excessIncome) {
          rebateMarginalRelief = slabTaxBeforeRebate - excessIncome;
          normalTaxAfterRebate = excessIncome;
        }
      }
    } else {
      // Old Regime: Resident total income <= Rs. 5,00,000 gets rebate up to Rs. 12,500
      // Cannot offset Sec 112A LTCG tax (Sec 112A(6)); no marginal relief above Rs. 5L
      if (totalTaxable <= config.oldRebate.threshold) {
        let remainingRebate = config.oldRebate.maxRebate;
        const onNormal = Math.min(normalTaxAfterRebate, remainingRebate);
        normalTaxAfterRebate -= onNormal;
        remainingRebate -= onNormal;
        rebate87A += onNormal;

        if (remainingRebate > 0 && effectiveStcg111ATax > 0) {
          const onStcg = Math.min(effectiveStcg111ATax, remainingRebate);
          effectiveStcg111ATax -= onStcg;
          remainingRebate -= onStcg;
          rebate87A += onStcg;
        }
        if (remainingRebate > 0 && effectiveLtcg112Tax > 0) {
          const onLtcg112 = Math.min(effectiveLtcg112Tax, remainingRebate);
          effectiveLtcg112Tax -= onLtcg112;
          rebate87A += onLtcg112;
        }
      }
    }
  }

  const totalSpecialCgTax = effectiveStcg111ATax + ltcg112ATax + effectiveLtcg112Tax;
  const taxBeforeSurcharge = normalTaxAfterRebate + totalSpecialCgTax;

  return {
    slabTaxBeforeRebate,
    rebate87A,
    rebateMarginalRelief,
    normalTaxAfterRebate,
    stcg111ATax: effectiveStcg111ATax,
    ltcg112ATax,
    ltcg112Tax: effectiveLtcg112Tax,
    totalSpecialCgTax,
    belOffsetAppliedToCg,
    taxBeforeSurcharge,
    slabRows,
  };
}

/**
 * Statutory surcharge rates under Finance Act proviso:
 * - 10% if total income > 50L up to 1Cr
 * - 15% if total income > 1Cr up to 2Cr
 * - 25% on normal income ONLY if normal income (excl. 111A/112A/112 CG) > 2Cr (else 15%)
 * - 37% on normal income ONLY under Old Regime if normal income > 5Cr (New Regime capped at 25%)
 * - Special CG (111A, 112A, 112) surcharge ALWAYS capped at 15%
 */
function computeRawSurcharge(params: {
  regime: "old" | "new";
  normalTaxable: number;
  specialCgTotal: number;
  normalTax: number;
  specialCgTax: number;
  cgCap: number;
}): { surcharge: number; threshold: number } {
  const { regime, normalTaxable, specialCgTotal, normalTax, specialCgTax, cgCap } = params;
  const totalIncome = normalTaxable + specialCgTotal;

  if (totalIncome <= 5000000) {
    return { surcharge: 0, threshold: 0 };
  }
  if (totalIncome <= 10000000) {
    return { surcharge: (normalTax + specialCgTax) * 0.1, threshold: 5000000 };
  }
  if (totalIncome <= 20000000) {
    return { surcharge: (normalTax + specialCgTax) * 0.15, threshold: 10000000 };
  }
  if (totalIncome <= 50000000) {
    const normalRate = normalTaxable > 20000000 ? 0.25 : 0.15;
    const cgRate = Math.min(0.15, cgCap);
    return {
      surcharge: normalTax * normalRate + specialCgTax * cgRate,
      threshold: normalTaxable > 20000000 ? 20000000 : 10000000,
    };
  }
  // > 5 Crore
  let normalRate = 0.15;
  let threshold = 10000000;
  if (normalTaxable > 50000000) {
    normalRate = regime === "new" ? 0.25 : 0.37;
    threshold = regime === "new" ? 20000000 : 50000000;
  } else if (normalTaxable > 20000000) {
    normalRate = 0.25;
    threshold = 20000000;
  }
  const cgRate = Math.min(0.15, cgCap);
  return {
    surcharge: normalTax * normalRate + specialCgTax * cgRate,
    threshold,
  };
}

function computeSurchargeWithMarginalRelief(params: {
  regime: "old" | "new";
  normalTaxable: number;
  stcgEquity: number;
  ltcgEquity: number;
  ltcgOther: number;
  ltcgOtherUseIndexation: boolean;
  core: CoreTaxBeforeSurcharge;
  ageGroup: AgeGroup;
  residency: ResidencyStatus;
  config: TaxYearConfig;
}): { surchargeBeforeRelief: number; marginalRelief: number; finalSurcharge: number } {
  const {
    regime,
    normalTaxable,
    stcgEquity,
    ltcgEquity,
    ltcgOther,
    ltcgOtherUseIndexation,
    core,
    ageGroup,
    residency,
    config,
  } = params;

  const specialCgTotal = stcgEquity + ltcgEquity + ltcgOther;
  const totalIncome = normalTaxable + specialCgTotal;

  const { surcharge: rawSurcharge, threshold } = computeRawSurcharge({
    regime,
    normalTaxable,
    specialCgTotal,
    normalTax: core.normalTaxAfterRebate,
    specialCgTax: core.totalSpecialCgTax,
    cgCap: config.surchargeCapCapitalGains,
  });

  if (rawSurcharge <= 0 || threshold <= 0 || totalIncome <= threshold) {
    return { surchargeBeforeRelief: 0, marginalRelief: 0, finalSurcharge: 0 };
  }

  // Compute exact tax + surcharge at the threshold K (trim excess from normal income first, then special CG)
  let excessToTrim = totalIncome - threshold;
  let threshNormal = normalTaxable;
  let threshStcgEq = stcgEquity;
  let threshLtcgOther = ltcgOther;
  let threshLtcgEq = ltcgEquity;

  const trimNormal = Math.min(threshNormal, excessToTrim);
  threshNormal -= trimNormal;
  excessToTrim -= trimNormal;

  if (excessToTrim > 0) {
    const trimStcg = Math.min(threshStcgEq, excessToTrim);
    threshStcgEq -= trimStcg;
    excessToTrim -= trimStcg;
  }
  if (excessToTrim > 0) {
    const trimLtcgOther = Math.min(threshLtcgOther, excessToTrim);
    threshLtcgOther -= trimLtcgOther;
    excessToTrim -= trimLtcgOther;
  }
  if (excessToTrim > 0) {
    const trimLtcgEq = Math.min(threshLtcgEq, excessToTrim);
    threshLtcgEq -= trimLtcgEq;
  }

  const coreAtThreshold = computeCoreTax({
    regime,
    normalTaxable: threshNormal,
    stcgEquity: threshStcgEq,
    ltcgEquity: threshLtcgEq,
    ltcgOther: threshLtcgOther,
    ltcgOtherUseIndexation,
    ageGroup,
    residency,
    config,
  });

  const { surcharge: surchargeAtThreshold } = computeRawSurcharge({
    regime,
    normalTaxable: threshNormal,
    specialCgTotal: threshStcgEq + threshLtcgEq + threshLtcgOther,
    normalTax: coreAtThreshold.normalTaxAfterRebate,
    specialCgTax: coreAtThreshold.totalSpecialCgTax,
    cgCap: config.surchargeCapCapitalGains,
  });

  const taxAndSurchargeAtThreshold = coreAtThreshold.taxBeforeSurcharge + surchargeAtThreshold;
  const currentTaxAndSurcharge = core.taxBeforeSurcharge + rawSurcharge;
  const maxPermittedTaxAndSurcharge = taxAndSurchargeAtThreshold + (totalIncome - threshold);

  let marginalRelief = 0;
  let finalSurcharge = rawSurcharge;

  if (currentTaxAndSurcharge > maxPermittedTaxAndSurcharge) {
    marginalRelief = currentTaxAndSurcharge - maxPermittedTaxAndSurcharge;
    finalSurcharge = Math.max(0, rawSurcharge - marginalRelief);
  }

  return {
    surchargeBeforeRelief: rawSurcharge,
    marginalRelief,
    finalSurcharge,
  };
}

export function computeIncomeTax(raw: IncomeTaxInput): IncomeTaxResult {
  const config = TAX_YEAR_CONFIGS[raw.taxYear] || TAX_YEAR_CONFIGS[DEFAULT_TAX_YEAR];
  const ageGroup: AgeGroup = raw.ageGroup || "citizen";
  const residency: ResidencyStatus = raw.residency || "resident";

  // Sanitize all inputs >= 0
  const salary = nonNeg(raw.salary);
  const rentalIncome = nonNeg(raw.rentalIncome);
  const homeLoanInterestLetOut = nonNeg(raw.homeLoanInterestLetOut);
  const homeLoanInterestSelfOccupied = nonNeg(raw.homeLoanInterestSelfOccupied);
  const otherIncome = nonNeg(raw.otherIncome);
  const professionalIncome = nonNeg(raw.professionalIncome);
  const businessExpenses = nonNeg(raw.businessExpenses);

  const stcgEquity = nonNeg(raw.stcgEquity);
  const ltcgEquity = nonNeg(raw.ltcgEquity);
  const stcgOther = nonNeg(raw.stcgOther);
  const ltcgOther = nonNeg(raw.ltcgOther);
  const ltcgOtherUseIndexation = Boolean(raw.ltcgOtherUseIndexation);

  const basicSalary = nonNeg(raw.basicSalary);
  const hraReceived = nonNeg(raw.hraReceived);
  const rentPaid = nonNeg(raw.rentPaid);
  const manualHraExemption = nonNeg(raw.manualHraExemption);

  const employerNps80CCD2 = nonNeg(raw.employerNps80CCD2);
  const deduction80C = nonNeg(raw.deduction80C);
  const deduction80D = nonNeg(raw.deduction80D);
  const deduction80DParents = nonNeg(raw.deduction80DParents);
  const deductionNPS80CCD1B = nonNeg(raw.deductionNPS80CCD1B);
  const savingsInterestDeduction = nonNeg(raw.savingsInterestDeduction);
  const deduction80E = nonNeg(raw.deduction80E);
  const deduction80G = nonNeg(raw.deduction80G);
  const otherDeductions = nonNeg(raw.otherDeductions);

  const taxPaid = nonNeg(raw.taxPaid);
  const monthsDelay234A = Math.floor(nonNeg(raw.monthsDelay234A));
  const monthsDelay234B = Math.floor(nonNeg(raw.monthsDelay234B));

  // 1. Business / Profession Income (Regular vs Presumptive 44ADA/44AD)
  let netBusinessIncome = 0;
  if (professionalIncome > 0) {
    if (raw.businessMode === "44ada") {
      netBusinessIncome = Math.round(professionalIncome * 0.5);
    } else if (raw.businessMode === "44ad_digital") {
      netBusinessIncome = Math.round(professionalIncome * 0.06);
    } else if (raw.businessMode === "44ad_cash") {
      netBusinessIncome = Math.round(professionalIncome * 0.08);
    } else {
      netBusinessIncome = Math.max(0, professionalIncome - businessExpenses);
    }
  }
  const hasBusinessIncome = netBusinessIncome > 0;
  const isPresumptiveBusiness = raw.businessMode !== "regular" && professionalIncome > 0;

  // 2. Salary Standard Deduction (strictly capped at salary!) & HRA Exemption (Old Regime, salary > 0)
  const stdDedNew = Math.min(salary, config.standardDeductionNew);
  const stdDedOld = Math.min(salary, config.standardDeductionOld);

  const computedHraFromAssistant =
    salary > 0
      ? Math.max(
          0,
          Math.min(
            hraReceived,
            basicSalary * (raw.isMetro ? 0.5 : 0.4),
            Math.max(0, rentPaid - basicSalary * 0.1)
          )
        )
      : 0;

  const hraComputed =
    salary > 0
      ? Math.min(salary, raw.useHraAssistant ? computedHraFromAssistant : manualHraExemption)
      : 0;

  const netSalaryNew = Math.max(0, salary - stdDedNew);
  const netSalaryOld = Math.max(0, salary - stdDedOld - hraComputed);

  // 3. House Property Head (Sec 24(a) 30% std ded on let-out + Sec 24(b) interest)
  const netRentalAfter30 = rentalIncome * 0.7;
  // New Regime: Let-out interest deductible up to net rental income (no HP loss set-off); self-occupied = 0
  const housePropertyNew = Math.max(0, netRentalAfter30 - homeLoanInterestLetOut);
  // Old Regime: Let-out interest uncapped + self-occupied capped at 2L; net HP loss capped at -2L u/s 71(3A)
  const selfOccInterestAllowedOld = Math.min(
    homeLoanInterestSelfOccupied,
    config.deductionCaps.sec24bSelfOccupied
  );
  const rawHpOld = netRentalAfter30 - homeLoanInterestLetOut - selfOccInterestAllowedOld;
  const housePropertyOld = Math.max(-config.deductionCaps.sec71HousePropertyLossCap, rawHpOld);

  // 4. Gross Total Income (for display & comparisons — includes all heads + capital gains)
  const specialCgTotal = stcgEquity + ltcgEquity + ltcgOther;
  const grossTotalIncome = Math.round(
    salary + netRentalAfter30 + otherIncome + netBusinessIncome + stcgOther + specialCgTotal
  );

  // 5. Employer NPS u/s 80CCD(2) (allowed in BOTH New @ 14% and Old @ 10% for salaried individuals)
  const employerNpsCapNew = salary > 0 ? Math.round(salary * config.employerNpsCapNewPct) : 0;
  const employerNpsCapOld = salary > 0 ? Math.round(salary * config.employerNpsCapOldPct) : 0;
  const employerNpsAllowedNew = Math.min(employerNps80CCD2, employerNpsCapNew);
  const employerNpsAllowedOld = Math.min(employerNps80CCD2, employerNpsCapOld);

  // 6. Chapter VI-A Deductions (Old Regime)
  const cap80D =
    ageGroup === "citizen"
      ? config.deductionCaps.sec80DSelfNonSenior
      : config.deductionCaps.sec80DSelfSenior;
  const cap80DParents = raw.parentsSenior
    ? config.deductionCaps.sec80DParentsSenior
    : config.deductionCaps.sec80DParentsNonSenior;
  const capSavingsInterest =
    ageGroup === "citizen" ? config.deductionCaps.sec80TTA : config.deductionCaps.sec80TTB;

  const allowed80C = Math.min(deduction80C, config.deductionCaps.sec80C);
  const allowed80D = Math.min(deduction80D, cap80D);
  const allowed80DParents = Math.min(deduction80DParents, cap80DParents);
  const allowed80CCD1B = Math.min(deductionNPS80CCD1B, config.deductionCaps.sec80CCD1B);
  const allowedSavingsInterest = Math.min(savingsInterestDeduction, capSavingsInterest);

  const chapterVIAOld =
    allowed80C +
    allowed80D +
    allowed80DParents +
    allowed80CCD1B +
    employerNpsAllowedOld +
    allowedSavingsInterest +
    deduction80E +
    deduction80G +
    otherDeductions;

  // 7. Taxable Income per Regime (rounded to nearest Rs. 10 u/s 288A)
  const normalIncomeNewBeforeRound = Math.max(
    0,
    netSalaryNew + housePropertyNew + otherIncome + netBusinessIncome + stcgOther - employerNpsAllowedNew
  );
  const normalTaxableNew = roundToNearest10(normalIncomeNewBeforeRound);
  const totalTaxableNew = roundToNearest10(normalTaxableNew + specialCgTotal);

  const normalIncomeOldBeforeRound = Math.max(
    0,
    netSalaryOld + housePropertyOld + otherIncome + netBusinessIncome + stcgOther - chapterVIAOld
  );
  const normalTaxableOld = roundToNearest10(normalIncomeOldBeforeRound);
  const totalTaxableOld = roundToNearest10(normalTaxableOld + specialCgTotal);

  // 8. Build Regime Computation helper
  const buildRegime = (
    regimeKey: "old" | "new",
    normalTaxable: number,
    totalTaxable: number,
    stdDed: number,
    hra: number,
    empNps: number,
    chapVIA: number,
    hpNet: number
  ): RegimeComputation => {
    const core = computeCoreTax({
      regime: regimeKey,
      normalTaxable,
      stcgEquity,
      ltcgEquity,
      ltcgOther,
      ltcgOtherUseIndexation,
      ageGroup,
      residency,
      config,
    });

    const { surchargeBeforeRelief, marginalRelief, finalSurcharge } =
      computeSurchargeWithMarginalRelief({
        regime: regimeKey,
        normalTaxable,
        stcgEquity,
        ltcgEquity,
        ltcgOther,
        ltcgOtherUseIndexation,
        core,
        ageGroup,
        residency,
        config,
      });

    const cess = Math.round((core.taxBeforeSurcharge + finalSurcharge) * config.cessRate);
    const totalTax = roundToNearest10(core.taxBeforeSurcharge + finalSurcharge + cess);

    const breakdown: SlabBreakdownRow[] = [...core.slabRows];
    if (breakdown.length === 0 && normalTaxable > 0) {
      breakdown.push({ slab: "Within Basic Exemption Limit (0%)", tax: 0 });
    }
    if (core.rebate87A > 0) {
      breakdown.push({ slab: `Less: Rebate u/s ${config.sections.rebate}`, tax: -Math.round(core.rebate87A) });
    }
    if (core.rebateMarginalRelief > 0) {
      breakdown.push({
        slab: `Less: Marginal Relief u/s ${config.sections.rebate}`,
        tax: -Math.round(core.rebateMarginalRelief),
      });
    }
    if (core.stcg111ATax > 0) {
      breakdown.push({ slab: `STCG Equity (${config.sections.stcgEquity} @ 20%)`, tax: Math.round(core.stcg111ATax) });
    }
    if (core.ltcg112ATax > 0) {
      breakdown.push({
        slab: `LTCG Equity (${config.sections.ltcgEquity} @ 12.5% above ₹1.25L)`,
        tax: Math.round(core.ltcg112ATax),
      });
    }
    if (core.ltcg112Tax > 0) {
      const ratePct = ltcgOtherUseIndexation && residency === "resident" ? "20% indexed" : "12.5%";
      breakdown.push({
        slab: `LTCG Other Assets (${config.sections.ltcgOther} @ ${ratePct})`,
        tax: Math.round(core.ltcg112Tax),
      });
    }

    const hpDeductionEffect =
      regimeKey === "old"
        ? Math.max(0, netRentalAfter30 - hpNet)
        : Math.max(0, netRentalAfter30 - hpNet);
    const totalDeductions = Math.round(stdDed + hra + hpDeductionEffect + (regimeKey === "old" ? chapVIA : empNps));
    const effectiveTaxRatePct =
      grossTotalIncome > 0 ? Math.round((totalTax / grossTotalIncome) * 1000) / 10 : 0;

    return {
      regime: regimeKey === "new" ? "New Regime" : "Old Regime",
      grossIncome: grossTotalIncome,
      standardDeduction: stdDed,
      hraExemption: hra,
      employerNpsAllowed: empNps,
      chapterVIADeductions: chapVIA,
      housePropertyNet: hpNet,
      totalDeductions,
      normalTaxableIncome: normalTaxable,
      specialCapitalGainsIncome: specialCgTotal,
      totalTaxableIncome: totalTaxable,
      slabTaxBeforeRebate: Math.round(core.slabTaxBeforeRebate),
      rebate87A: Math.round(core.rebate87A),
      rebateMarginalRelief: Math.round(core.rebateMarginalRelief),
      normalTaxAfterRebate: Math.round(core.normalTaxAfterRebate),
      stcg111ATax: Math.round(core.stcg111ATax),
      ltcg112ATax: Math.round(core.ltcg112ATax),
      ltcg112Tax: Math.round(core.ltcg112Tax),
      totalSpecialCgTax: Math.round(core.totalSpecialCgTax),
      belOffsetAppliedToCg: Math.round(core.belOffsetAppliedToCg),
      taxBeforeSurcharge: Math.round(core.taxBeforeSurcharge),
      surchargeBeforeRelief: Math.round(surchargeBeforeRelief),
      surchargeMarginalRelief: Math.round(marginalRelief),
      surcharge: Math.round(finalSurcharge),
      cess,
      totalTax,
      effectiveTaxRatePct,
      breakdown,
    };
  };

  const newRegime = buildRegime(
    "new",
    normalTaxableNew,
    totalTaxableNew,
    stdDedNew,
    0,
    employerNpsAllowedNew,
    employerNpsAllowedNew,
    housePropertyNew
  );

  const oldRegime = buildRegime(
    "old",
    normalTaxableOld,
    totalTaxableOld,
    stdDedOld,
    hraComputed,
    employerNpsAllowedOld,
    chapterVIAOld,
    housePropertyOld
  );

  // Tie-breaker: New Regime is the statutory default regime
  const betterRegime: "New Regime" | "Old Regime" =
    newRegime.totalTax <= oldRegime.totalTax ? "New Regime" : "Old Regime";
  const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);
  const activeComputation = betterRegime === "New Regime" ? newRegime : oldRegime;
  const activeTax = activeComputation.totalTax;

  // 9. Advance Tax, Section 234A / 234B / 234F & Refund
  const isSeniorAdvanceTaxExempt =
    residency === "resident" && ageGroup !== "citizen" && !hasBusinessIncome;

  const isAdvanceTaxApplicable =
    !isSeniorAdvanceTaxExempt && activeTax >= config.advanceTaxThreshold;

  const shortfall234ABase = floorTo100(Math.max(0, activeTax - taxPaid));
  const interest234A =
    monthsDelay234A > 0 && shortfall234ABase > 0
      ? Math.round(shortfall234ABase * 0.01 * monthsDelay234A)
      : 0;

  // Statutory Sec 234B: Triggered ONLY if advance tax applicable AND paid < 90% of assessed tax.
  // Once triggered, 1%/month applies on FULL (100% assessedTax - paid), floored to Rs. 100 u/r 119A!
  let interest234B = 0;
  if (isAdvanceTaxApplicable && monthsDelay234B > 0 && taxPaid < activeTax * 0.9) {
    const shortfall234BBase = floorTo100(Math.max(0, activeTax - taxPaid));
    interest234B = Math.round(shortfall234BBase * 0.01 * monthsDelay234B);
  }

  // Statutory Sec 234F late filing fee (when return is delayed & taxable income exceeds BEL)
  const activeBel =
    betterRegime === "New Regime"
      ? config.newBasicExemption
      : config.oldBasicExemption[ageGroup];
  let lateFee234F = 0;
  if (monthsDelay234A > 0 && activeComputation.totalTaxableIncome > activeBel) {
    lateFee234F = activeComputation.totalTaxableIncome > 500000 ? 5000 : 1000;
  }

  const totalInterestAndFees = interest234A + interest234B + lateFee234F;
  const rawBalance = activeTax + totalInterestAndFees - taxPaid;
  const netPayable = rawBalance > 0 ? roundToNearest10(rawBalance) : 0;
  const refundDue = rawBalance < 0 ? roundToNearest10(Math.abs(rawBalance)) : 0;

  const annualTakeHome = Math.max(0, grossTotalIncome - activeTax - totalInterestAndFees);
  const monthlyTakeHome = Math.round(annualTakeHome / 12);

  // Advance Tax Schedule
  let exemptReason: string | null = null;
  if (isSeniorAdvanceTaxExempt) {
    exemptReason =
      "Exempt u/s 207(2): Resident Senior Citizens (60+) with no business/profession income are exempt from Advance Tax.";
  } else if (activeTax < config.advanceTaxThreshold) {
    exemptReason =
      "Exempt u/s 208: Advance Tax is not payable when net tax liability is below ₹10,000.";
  }

  const advanceTax: AdvanceTaxSchedule = {
    applicable: isAdvanceTaxApplicable,
    exemptReason,
    isPresumptiveSingleInstallment: isPresumptiveBusiness,
    installments: !isAdvanceTaxApplicable
      ? []
      : isPresumptiveBusiness
        ? [
            {
              dueDate: "On or before 15th March",
              percentageLabel: "100% Single Installment (Sec 44AD/44ADA)",
              cumulativeAmount: activeTax,
            },
          ]
        : [
            { dueDate: "On or before 15th June", percentageLabel: "15% Cumulative", cumulativeAmount: Math.round(activeTax * 0.15) },
            { dueDate: "On or before 15th September", percentageLabel: "45% Cumulative", cumulativeAmount: Math.round(activeTax * 0.45) },
            { dueDate: "On or before 15th December", percentageLabel: "75% Cumulative", cumulativeAmount: Math.round(activeTax * 0.75) },
            { dueDate: "On or before 15th March", percentageLabel: "100% Cumulative", cumulativeAmount: activeTax },
          ],
  };

  // Structured Deduction Tables (shared by UI, PDF & Excel)
  const deductionBreakdownOld = [
    { label: "Standard Deduction (Salary/Pension)", section: config.sections.standardDeduction, claimed: salary > 0 ? config.standardDeductionOld : 0, limit: "₹50,000 (Salary only)", allowed: stdDedOld },
    { label: "HRA Exemption", section: "Sec 10(13A)", claimed: hraComputed, limit: "Computed", allowed: hraComputed },
    { label: "Home Loan Interest (Self-Occupied)", section: "Sec 24(b)", claimed: homeLoanInterestSelfOccupied, limit: "₹2,00,000", allowed: selfOccInterestAllowedOld },
    { label: "PPF, EPF, ELSS, LIC, Term Life", section: "Sec 80C", claimed: deduction80C, limit: "₹1,50,000", allowed: allowed80C },
    { label: `Health Insurance — Self (${ageGroup === "citizen" ? "<60" : "60+"})`, section: "Sec 80D", claimed: deduction80D, limit: ageGroup === "citizen" ? "₹25,000" : "₹50,000", allowed: allowed80D },
    { label: `Health Insurance — Parents (${raw.parentsSenior ? "Senior" : "<60"})`, section: "Sec 80D", claimed: deduction80DParents, limit: raw.parentsSenior ? "₹50,000" : "₹25,000", allowed: allowed80DParents },
    { label: "Additional NPS Contribution", section: "Sec 80CCD(1B)", claimed: deductionNPS80CCD1B, limit: "₹50,000", allowed: allowed80CCD1B },
    { label: "Employer NPS Contribution", section: config.sections.employerNps, claimed: employerNps80CCD2, limit: "10% of Salary (Old)", allowed: employerNpsAllowedOld },
    { label: ageGroup === "citizen" ? "Savings Bank Interest" : "Savings & FD Interest (Senior)", section: ageGroup === "citizen" ? "Sec 80TTA" : "Sec 80TTB", claimed: savingsInterestDeduction, limit: ageGroup === "citizen" ? "₹10,000" : "₹50,000", allowed: allowedSavingsInterest },
    { label: "Education Loan Interest", section: "Sec 80E", claimed: deduction80E, limit: "No upper cap", allowed: deduction80E },
    { label: "Charitable Donations (Eligible)", section: "Sec 80G", claimed: deduction80G, limit: "As eligible", allowed: deduction80G },
    { label: "Other Chapter VI-A Deductions", section: "Chapter VI-A", claimed: otherDeductions, limit: "As eligible", allowed: otherDeductions },
  ];

  const deductionBreakdownNew = [
    { label: "Standard Deduction (Salary/Pension)", section: config.sections.standardDeduction, claimed: salary > 0 ? config.standardDeductionNew : 0, limit: "₹75,000 (Salary only)", allowed: stdDedNew },
    { label: "Employer NPS Contribution", section: config.sections.employerNps, claimed: employerNps80CCD2, limit: "14% of Salary (New)", allowed: employerNpsAllowedNew },
    ...(homeLoanInterestLetOut > 0 && rentalIncome > 0
      ? [{ label: "Let-out Property Interest (up to net rent)", section: "Sec 24(b)", claimed: homeLoanInterestLetOut, limit: "Up to Net Rent", allowed: Math.min(homeLoanInterestLetOut, Math.round(netRentalAfter30)) }]
      : []),
  ];

  return {
    config,
    netSalaryOld,
    netSalaryNew,
    netBusinessIncome,
    hraComputed,
    grossTotalIncome,
    oldRegime,
    newRegime,
    betterRegime,
    savings,
    activeTax,
    interest234A,
    interest234B,
    lateFee234F,
    totalInterestAndFees,
    taxPaid,
    netPayable,
    refundDue,
    annualTakeHome,
    monthlyTakeHome,
    advanceTax,
    deductionBreakdownOld,
    deductionBreakdownNew,
  };
}


export type TaxYearKey = "2026-27" | "2025-26" | "2024-25";
export type AgeGroup = "citizen" | "senior" | "super-senior";
export type ResidencyStatus = "resident" | "nri";
export type BusinessTaxMode = "regular" | "44ada" | "44ad_digital" | "44ad_cash";

export interface TaxSlab {
  label: string;
  /** Width of the slab in INR, or Infinity for the top open-ended slab */
  width: number;
  rate: number;
}

export interface TaxYearConfig {
  key: TaxYearKey;
  shortLabel: string;
  periodLabel: string;
  assessmentLabel: string;
  actName: string;
  badgeText: string;
  isNewAct: boolean;
  sections: {
    newRegime: string;
    rebate: string;
    standardDeduction: string;
    employerNps: string;
    stcgEquity: string;
    ltcgEquity: string;
    ltcgOther: string;
    interest234A: string;
    interest234B: string;
    interest234C: string;
    lateFee234F: string;
  };
  standardDeductionNew: number;
  standardDeductionOld: number;
  employerNpsCapNewPct: number;
  employerNpsCapOldPct: number;
  newBasicExemption: number;
  oldBasicExemption: Record<AgeGroup, number>;
  newSlabs: TaxSlab[];
  newRebate: {
    threshold: number;
    maxRebate: number;
    marginalRelief: boolean;
  };
  oldRebate: {
    threshold: number;
    maxRebate: number;
  };
  capitalGains: {
    stcgEquityRate: number;
    ltcgEquityRate: number;
    ltcgEquityExemption: number;
    ltcgOtherRate: number;
    ltcgOtherIndexedRate: number;
  };
  deductionCaps: {
    sec80C: number;
    sec80DSelfNonSenior: number;
    sec80DSelfSenior: number;
    sec80DParentsNonSenior: number;
    sec80DParentsSenior: number;
    sec80CCD1B: number;
    sec80TTA: number;
    sec80TTB: number;
    sec24bSelfOccupied: number;
    sec71HousePropertyLossCap: number;
  };
  cessRate: number;
  advanceTaxThreshold: number;
  surchargeCapCapitalGains: number;
}

export const DEFAULT_TAX_YEAR: TaxYearKey = "2026-27";

export const TAX_YEAR_ORDER: TaxYearKey[] = ["2026-27", "2025-26", "2024-25"];

const COMMON_OLD_BEL: Record<AgeGroup, number> = {
  citizen: 250000,
  senior: 300000,
  "super-senior": 500000,
};

const COMMON_DEDUCTION_CAPS = {
  sec80C: 150000,
  sec80DSelfNonSenior: 25000,
  sec80DSelfSenior: 50000,
  sec80DParentsNonSenior: 25000,
  sec80DParentsSenior: 50000,
  sec80CCD1B: 50000,
  sec80TTA: 10000,
  sec80TTB: 50000,
  sec24bSelfOccupied: 200000,
  sec71HousePropertyLossCap: 200000,
};

const COMMON_CAPITAL_GAINS = {
  stcgEquityRate: 0.2,
  ltcgEquityRate: 0.125,
  ltcgEquityExemption: 125000,
  ltcgOtherRate: 0.125,
  ltcgOtherIndexedRate: 0.2,
};

const FINANCE_ACT_2025_NEW_SLABS: TaxSlab[] = [
  { label: "₹0 – ₹4 Lakhs (0%)", width: 400000, rate: 0 },
  { label: "₹4 – ₹8 Lakhs (5%)", width: 400000, rate: 0.05 },
  { label: "₹8 – ₹12 Lakhs (10%)", width: 400000, rate: 0.1 },
  { label: "₹12 – ₹16 Lakhs (15%)", width: 400000, rate: 0.15 },
  { label: "₹16 – ₹20 Lakhs (20%)", width: 400000, rate: 0.2 },
  { label: "₹20 – ₹24 Lakhs (25%)", width: 400000, rate: 0.25 },
  { label: "Above ₹24 Lakhs (30%)", width: Infinity, rate: 0.3 },
];

const FINANCE_ACT_2024_NEW_SLABS: TaxSlab[] = [
  { label: "₹0 – ₹3 Lakhs (0%)", width: 300000, rate: 0 },
  { label: "₹3 – ₹7 Lakhs (5%)", width: 400000, rate: 0.05 },
  { label: "₹7 – ₹10 Lakhs (10%)", width: 300000, rate: 0.1 },
  { label: "₹10 – ₹12 Lakhs (15%)", width: 200000, rate: 0.15 },
  { label: "₹12 – ₹15 Lakhs (20%)", width: 300000, rate: 0.2 },
  { label: "Above ₹15 Lakhs (30%)", width: Infinity, rate: 0.3 },
];

export const TAX_YEAR_CONFIGS: Record<TaxYearKey, TaxYearConfig> = {
  "2026-27": {
    key: "2026-27",
    shortLabel: "TY 2026-27",
    periodLabel: "Tax Year 2026-27",
    assessmentLabel: "Tax Year 2026-27 (Income-tax Act, 2025)",
    actName: "Income-tax Act, 2025",
    badgeText: "Income-tax Act, 2025 • Tax Year 2026-27 (Active)",
    isNewAct: true,
    sections: {
      newRegime: "Sec 202 (IT Act 2025)",
      rebate: "Sec 156 (IT Act 2025)",
      standardDeduction: "Sec 19 (IT Act 2025)",
      employerNps: "Sec 124 / 80CCD(2)",
      stcgEquity: "Sec 196 (111A)",
      ltcgEquity: "Sec 198 (112A)",
      ltcgOther: "Sec 197 (112)",
      interest234A: "Sec 423 (234A)",
      interest234B: "Sec 424 (234B)",
      interest234C: "Sec 425 (234C)",
      lateFee234F: "Sec 428 (234F)",
    },
    standardDeductionNew: 75000,
    standardDeductionOld: 50000,
    employerNpsCapNewPct: 0.14,
    employerNpsCapOldPct: 0.1,
    newBasicExemption: 400000,
    oldBasicExemption: COMMON_OLD_BEL,
    newSlabs: FINANCE_ACT_2025_NEW_SLABS,
    newRebate: {
      threshold: 1200000,
      maxRebate: 60000,
      marginalRelief: true,
    },
    oldRebate: {
      threshold: 500000,
      maxRebate: 12500,
    },
    capitalGains: COMMON_CAPITAL_GAINS,
    deductionCaps: COMMON_DEDUCTION_CAPS,
    cessRate: 0.04,
    advanceTaxThreshold: 10000,
    surchargeCapCapitalGains: 0.15,
  },
  "2025-26": {
    key: "2025-26",
    shortLabel: "FY 2025-26",
    periodLabel: "FY 2025-26 (AY 2026-27)",
    assessmentLabel: "AY 2026-27 (Finance Act, 2025)",
    actName: "Income-tax Act, 1961",
    badgeText: "Finance Act, 2025 • FY 2025-26 (AY 2026-27)",
    isNewAct: false,
    sections: {
      newRegime: "Sec 115BAC(1A)",
      rebate: "Sec 87A",
      standardDeduction: "Sec 16(ia)",
      employerNps: "Sec 80CCD(2)",
      stcgEquity: "Sec 111A",
      ltcgEquity: "Sec 112A",
      ltcgOther: "Sec 112",
      interest234A: "Sec 234A",
      interest234B: "Sec 234B",
      interest234C: "Sec 234C",
      lateFee234F: "Sec 234F",
    },
    standardDeductionNew: 75000,
    standardDeductionOld: 50000,
    employerNpsCapNewPct: 0.14,
    employerNpsCapOldPct: 0.1,
    newBasicExemption: 400000,
    oldBasicExemption: COMMON_OLD_BEL,
    newSlabs: FINANCE_ACT_2025_NEW_SLABS,
    newRebate: {
      threshold: 1200000,
      maxRebate: 60000,
      marginalRelief: true,
    },
    oldRebate: {
      threshold: 500000,
      maxRebate: 12500,
    },
    capitalGains: COMMON_CAPITAL_GAINS,
    deductionCaps: COMMON_DEDUCTION_CAPS,
    cessRate: 0.04,
    advanceTaxThreshold: 10000,
    surchargeCapCapitalGains: 0.15,
  },
  "2024-25": {
    key: "2024-25",
    shortLabel: "FY 2024-25",
    periodLabel: "FY 2024-25 (AY 2025-26)",
    assessmentLabel: "AY 2025-26 (Finance (No. 2) Act, 2024)",
    actName: "Income-tax Act, 1961",
    badgeText: "Finance (No. 2) Act, 2024 • FY 2024-25 (AY 2025-26)",
    isNewAct: false,
    sections: {
      newRegime: "Sec 115BAC(1A)",
      rebate: "Sec 87A",
      standardDeduction: "Sec 16(ia)",
      employerNps: "Sec 80CCD(2)",
      stcgEquity: "Sec 111A",
      ltcgEquity: "Sec 112A",
      ltcgOther: "Sec 112",
      interest234A: "Sec 234A",
      interest234B: "Sec 234B",
      interest234C: "Sec 234C",
      lateFee234F: "Sec 234F",
    },
    standardDeductionNew: 75000,
    standardDeductionOld: 50000,
    employerNpsCapNewPct: 0.14,
    employerNpsCapOldPct: 0.1,
    newBasicExemption: 300000,
    oldBasicExemption: COMMON_OLD_BEL,
    newSlabs: FINANCE_ACT_2024_NEW_SLABS,
    newRebate: {
      threshold: 700000,
      maxRebate: 25000,
      marginalRelief: true,
    },
    oldRebate: {
      threshold: 500000,
      maxRebate: 12500,
    },
    capitalGains: COMMON_CAPITAL_GAINS,
    deductionCaps: COMMON_DEDUCTION_CAPS,
    cessRate: 0.04,
    advanceTaxThreshold: 10000,
    surchargeCapCapitalGains: 0.15,
  },
};

export function getOldRegimeSlabs(ageGroup: AgeGroup): TaxSlab[] {
  if (ageGroup === "super-senior") {
    return [
      { label: "₹0 – ₹5 Lakhs (0%)", width: 500000, rate: 0 },
      { label: "₹5 – ₹10 Lakhs (20%)", width: 500000, rate: 0.2 },
      { label: "Above ₹10 Lakhs (30%)", width: Infinity, rate: 0.3 },
    ];
  }
  if (ageGroup === "senior") {
    return [
      { label: "₹0 – ₹3 Lakhs (0%)", width: 300000, rate: 0 },
      { label: "₹3 – ₹5 Lakhs (5%)", width: 200000, rate: 0.05 },
      { label: "₹5 – ₹10 Lakhs (20%)", width: 500000, rate: 0.2 },
      { label: "Above ₹10 Lakhs (30%)", width: Infinity, rate: 0.3 },
    ];
  }
  return [
    { label: "₹0 – ₹2.5 Lakhs (0%)", width: 250000, rate: 0 },
    { label: "₹2.5 – ₹5 Lakhs (5%)", width: 250000, rate: 0.05 },
    { label: "₹5 – ₹10 Lakhs (20%)", width: 500000, rate: 0.2 },
    { label: "Above ₹10 Lakhs (30%)", width: Infinity, rate: 0.3 },
  ];
}


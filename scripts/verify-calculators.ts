import assert from "node:assert/strict";
import { computeIncomeTax, type IncomeTaxInput } from "../lib/calculators/income-tax-engine";
import { computeGstInvoice, computeQuickGst, computeRule88A } from "../lib/calculators/gst-engine";
import { GST_2_HSN_PRESETS, GST_2_SAC_PRESETS } from "../lib/calculators/gst-rules";

function baseTaxInput(overrides: Partial<IncomeTaxInput> = {}): IncomeTaxInput {
  return {
    taxYear: "2026-27",
    ageGroup: "citizen",
    residency: "resident",
    salary: 0,
    rentalIncome: 0,
    homeLoanInterestLetOut: 0,
    homeLoanInterestSelfOccupied: 0,
    otherIncome: 0,
    businessMode: "regular",
    professionalIncome: 0,
    businessExpenses: 0,
    stcgEquity: 0,
    ltcgEquity: 0,
    stcgOther: 0,
    ltcgOther: 0,
    ltcgOtherUseIndexation: false,
    useHraAssistant: false,
    basicSalary: 0,
    hraReceived: 0,
    rentPaid: 0,
    isMetro: true,
    manualHraExemption: 0,
    employerNps80CCD2: 0,
    deduction80C: 0,
    deduction80D: 0,
    deduction80DParents: 0,
    parentsSenior: false,
    deductionNPS80CCD1B: 0,
    savingsInterestDeduction: 0,
    deduction80E: 0,
    deduction80G: 0,
    otherDeductions: 0,
    taxPaid: 0,
    monthsDelay234A: 0,
    monthsDelay234B: 0,
    ...overrides,
  };
}

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    throw err;
  }
}

console.log("=== INCOME TAX STATUTORY TESTS (IT ACT 1961 & IT ACT 2025) ===");

test("1. TY 2026-27 Salaried ₹12,00,000 => ₹0 tax under New Regime (Sec 202 / Sec 156)", () => {
  const res = computeIncomeTax(baseTaxInput({ taxYear: "2026-27", salary: 1200000 }));
  assert.equal(res.config.actName, "Income-tax Act, 2025");
  assert.equal(res.newRegime.standardDeduction, 75000);
  assert.equal(res.newRegime.totalTaxableIncome, 1125000);
  assert.equal(res.newRegime.totalTax, 0);
  assert.equal(res.betterRegime, "New Regime");
});

test("2. TY 2026-27 Salaried ₹12,75,000 => ₹0 tax under New Regime (exact ₹12L threshold)", () => {
  const res = computeIncomeTax(baseTaxInput({ taxYear: "2026-27", salary: 1275000 }));
  assert.equal(res.newRegime.totalTaxableIncome, 1200000);
  assert.equal(res.newRegime.slabTaxBeforeRebate, 60000);
  assert.equal(res.newRegime.rebate87A, 60000);
  assert.equal(res.newRegime.totalTax, 0);
});

test("3. FY 2025-26 Salaried ₹12,85,000 (₹12.10L taxable) => Marginal Relief caps base tax at ₹10,000 (+4% cess = ₹10,400)", () => {
  const res = computeIncomeTax(baseTaxInput({ taxYear: "2025-26", salary: 1285000 }));
  assert.equal(res.newRegime.totalTaxableIncome, 1210000);
  assert.equal(res.newRegime.slabTaxBeforeRebate, 61500);
  assert.equal(res.newRegime.rebateMarginalRelief, 51500);
  assert.equal(res.newRegime.normalTaxAfterRebate, 10000);
  assert.equal(res.newRegime.totalTax, 10400);
});

test("4. FY 2025-26 Salaried ₹25,00,000 => Exact Finance Act 2025 tax ₹3,19,800 (not ₹4,34,200)", () => {
  const res = computeIncomeTax(baseTaxInput({ taxYear: "2025-26", salary: 2500000 }));
  // Taxable = 24,25,000 -> 0-4(0) + 4-8(20k) + 8-12(40k) + 12-16(60k) + 16-20(80k) + 20-24(100k) + 25k@30%(7,500) = 3,07,500
  // + 4% cess (12,300) = 3,19,800
  assert.equal(res.newRegime.totalTaxableIncome, 2425000);
  assert.equal(res.newRegime.taxBeforeSurcharge, 307500);
  assert.equal(res.newRegime.cess, 12300);
  assert.equal(res.newRegime.totalTax, 319800);
});

test("5. FY 2024-25 Salaried ₹7,75,000 => ₹75,000 std deduction (Finance (No.2) Act 2024) + ₹0 tax", () => {
  const res = computeIncomeTax(baseTaxInput({ taxYear: "2024-25", salary: 775000 }));
  assert.equal(res.newRegime.standardDeduction, 75000);
  assert.equal(res.newRegime.totalTaxableIncome, 700000);
  assert.equal(res.newRegime.totalTax, 0);
});

test("6. FY 2024-25 Salaried ₹7,85,000 (₹7.10L taxable) => Marginal Relief caps base tax at ₹10,000 (+4% cess = ₹10,400)", () => {
  const res = computeIncomeTax(baseTaxInput({ taxYear: "2024-25", salary: 785000 }));
  assert.equal(res.newRegime.normalTaxAfterRebate, 10000);
  assert.equal(res.newRegime.totalTax, 10400);
});

test("7. Standard Deduction strictly ₹0 for Non-Salaried Freelancer (₹10L business income, ₹0 salary)", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 0, professionalIncome: 1000000, businessExpenses: 0 }));
  assert.equal(res.newRegime.standardDeduction, 0);
  assert.equal(res.oldRegime.standardDeduction, 0);
  assert.equal(res.newRegime.totalTaxableIncome, 1000000);
});

test("8. NRI ₹10,00,000 salary => NO Sec 87A/156 rebate (must pay slab tax)", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 1000000, residency: "nri" }));
  // Taxable = 9,25,000 -> 4-8L (20,000) + 8-9.25L (12,500) = 32,500 -> +4% cess = 33,800
  assert.equal(res.newRegime.rebate87A, 0);
  assert.equal(res.newRegime.totalTax, 33800);
});

test("9. Special-rate Capital Gains NEVER get Sec 87A/156 rebate in New Regime (₹10L salary + ₹2L STCG 111A)", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 1000000, stcgEquity: 200000 }));
  // Normal taxable = 9,25,000 (<= 12L -> normal tax = 0 via rebate)
  // STCG 111A = 2,00,000 @ 20% = 40,000 -> +4% cess = 41,600
  assert.equal(res.newRegime.normalTaxAfterRebate, 0);
  assert.equal(res.newRegime.stcg111ATax, 40000);
  assert.equal(res.newRegime.totalTax, 41600);
});

test("10. Resident Unexhausted BEL set-off against STCG 111A (₹2L other income + ₹3L STCG 111A under New Regime BEL ₹4L)", () => {
  const res = computeIncomeTax(baseTaxInput({ otherIncome: 200000, stcgEquity: 300000 }));
  // Unused BEL = 4L - 2L = 2L -> reduces STCG 111A from 3L to 1L -> 1L @ 20% = 20,000 + 4% cess = 20,800
  assert.equal(res.newRegime.belOffsetAppliedToCg, 200000);
  assert.equal(res.newRegime.stcg111ATax, 20000);
  assert.equal(res.newRegime.totalTax, 20800);
});

test("11. Non-equity STCG taxed at slab rate & Non-equity LTCG taxed at 12.5% u/s 112", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 1500000, stcgOther: 200000, ltcgOther: 200000 }));
  // Normal taxable = 14,25,000 + 2,00,000 = 16,25,000
  // LTCG 112 = 2,00,000 @ 12.5% = 25,000
  assert.equal(res.newRegime.normalTaxableIncome, 1625000);
  assert.equal(res.newRegime.ltcg112Tax, 25000);
});

test("12. Surcharge Marginal Relief at ₹50,10,000 taxable (₹50,85,000 salary, TY 2026-27 New)", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 5085000 }));
  // Taxable = 50,10,000 -> Tax at 50L = 10,80,000; Tax at 50.1L = 10,83,000; Raw surcharge 10% = 1,08,300
  // Marginal relief caps tax+surcharge at 10,80,000 + 10,000 = 10,90,000 -> Surcharge = 7,000, MR = 1,01,300
  // + 4% cess (43,600) = 11,33,600
  assert.equal(res.newRegime.surchargeBeforeRelief, 108300);
  assert.equal(res.newRegime.surchargeMarginalRelief, 101300);
  assert.equal(res.newRegime.surcharge, 7000);
  assert.equal(res.newRegime.totalTax, 1133600);
});

test("13. 15% Surcharge Cap on Sec 112A LTCG even when total income > ₹2 Cr (₹2.5Cr salary + ₹50L LTCG 112A)", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 25075000, ltcgEquity: 5000000 }));
  // Normal taxable = 2,50,00,000 (>2Cr -> 25% surcharge on normal)
  // LTCG 112A = (50L - 1.25L) * 12.5% = 6,09,375 -> CAPPED at 15% surcharge (= 91,406.25), NOT 25% (= 1,52,343.75)
  const expectedNormalTax = 300000 + (25000000 - 2400000) * 0.3; // 70,80,000
  const expectedSurcharge = Math.round(expectedNormalTax * 0.25 + 609375 * 0.15); // 17,70,000 + 91,406.25 = 18,61,406
  assert.equal(res.newRegime.surcharge, expectedSurcharge);
});

test("14. Employer NPS u/s 80CCD(2): 14% allowed in New Regime, 10% in Old Regime", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 2000000, employerNps80CCD2: 300000 }));
  assert.equal(res.newRegime.employerNpsAllowed, 280000); // 14% of 20L
  assert.equal(res.oldRegime.employerNpsAllowed, 200000); // 10% of 20L
});

test("15. Senior Citizen: 80D Self = ₹50k, 80TTB = ₹50k, and Exempt from Advance Tax & 234B u/s 207(2)", () => {
  const res = computeIncomeTax(
    baseTaxInput({
      ageGroup: "senior",
      salary: 1800000,
      deduction80D: 50000,
      savingsInterestDeduction: 50000,
      monthsDelay234B: 6,
    })
  );
  const d80d = res.deductionBreakdownOld.find((d) => d.section === "Sec 80D" && d.label.includes("Self"));
  const d80ttb = res.deductionBreakdownOld.find((d) => d.section === "Sec 80TTB");
  assert.equal(d80d?.allowed, 50000);
  assert.equal(d80ttb?.allowed, 50000);
  assert.equal(res.advanceTax.applicable, false);
  assert.equal(res.interest234B, 0);
});

test("16. Presumptive Sec 44ADA (50% profit) + Single 15th March Advance Tax Installment", () => {
  const res = computeIncomeTax(
    baseTaxInput({
      professionalIncome: 4000000,
      businessMode: "44ada",
    })
  );
  assert.equal(res.netBusinessIncome, 2000000);
  assert.equal(res.advanceTax.applicable, true);
  assert.equal(res.advanceTax.isPresumptiveSingleInstallment, true);
  assert.equal(res.advanceTax.installments.length, 1);
  assert.equal(res.advanceTax.installments[0].dueDate, "On or before 15th March");
});

test("17. Sec 234B 90% Cliff + 100% Shortfall Base (Rule 119A ₹100 floor)", () => {
  // Tax on 25L salary = 3,19,800. Paid = 2,00,000 (< 90% of 3,19,800 = 2,87,820)
  // Statutory 234B base = floor100(3,19,800 - 2,00,000) = 1,19,800 -> 4 months @ 1% = 4,792
  const res = computeIncomeTax(baseTaxInput({ salary: 2500000, taxPaid: 200000, monthsDelay234B: 4 }));
  assert.equal(res.interest234B, 4792);
  // If paid = 2,90,000 (>= 90%), 234B MUST be 0!
  const resNo234B = computeIncomeTax(baseTaxInput({ salary: 2500000, taxPaid: 290000, monthsDelay234B: 4 }));
  assert.equal(resNo234B.interest234B, 0);
});

test("18. Prepaid Tax Subtracted from Net Payable & Excess Triggers Refund Due", () => {
  const resExact = computeIncomeTax(baseTaxInput({ salary: 2500000, taxPaid: 319800 }));
  assert.equal(resExact.netPayable, 0);
  assert.equal(resExact.refundDue, 0);

  const resRefund = computeIncomeTax(baseTaxInput({ salary: 2500000, taxPaid: 350000 }));
  assert.equal(resRefund.netPayable, 0);
  assert.equal(resRefund.refundDue, 30200);
});

test("19. Old Regime Sec 87A fails if Total Income (including LTCG) > ₹5L", () => {
  const res = computeIncomeTax(baseTaxInput({ salary: 450000, ltcgEquity: 200000 }));
  // Old taxable = 4,00,000 normal + 2,00,000 LTCG = 6,00,000 (> 5L -> NO 87A rebate in Old Regime!)
  assert.equal(res.oldRegime.rebate87A, 0);
  assert.ok(res.oldRegime.normalTaxAfterRebate > 0);
});

console.log("\n=== GST 2.0 & CGST ACT STATUTORY TESTS ===");

test("20. Quick GST Inclusive ₹10,000 @ 18% => Exact paise sum (8474.58 + 762.71 + 762.71 = 10000.00)", () => {
  const res = computeQuickGst({ amount: 10000, gstRate: 18, mode: "inclusive", placeOfSupply: "intra" });
  assert.equal(res.baseAmount, 8474.58);
  assert.equal(res.totalGst, 1525.42);
  assert.equal(res.cgst, 762.71);
  assert.equal(res.sgst, 762.71);
  assert.equal(Math.round((res.baseAmount + res.cgst + res.sgst) * 100) / 100, 10000);
});

test("21. Quick GST Exclusive ₹100 @ 5% => CGST ₹2.50 + SGST ₹2.50 = ₹5.00 (no ₹3+₹3 rounding corruption)", () => {
  const res = computeQuickGst({ amount: 100, gstRate: 5, mode: "exclusive", placeOfSupply: "intra" });
  assert.equal(res.cgst, 2.5);
  assert.equal(res.sgst, 2.5);
  assert.equal(res.grossTotal, 105);
});

test("22. GST 2.0 HSN & SAC Presets Verified (Cement 18%, Cars 18%/40%, Tobacco 40%, Insurance 0%, Salons 5%, Garments ₹2,500 split)", () => {
  const cement = GST_2_HSN_PRESETS.find((p) => p.hsn === "2523");
  const smallCar = GST_2_HSN_PRESETS.find((p) => p.hsn === "8703" && p.desc.includes("Small"));
  const luxCar = GST_2_HSN_PRESETS.find((p) => p.hsn === "8703" && p.desc.includes("Luxury"));
  const cigarettes = GST_2_HSN_PRESETS.find((p) => p.hsn === "2402");
  const garmentMerit = GST_2_HSN_PRESETS.find((p) => p.hsn === "6101" && p.desc.includes("≤ ₹2,500"));
  const garmentStd = GST_2_HSN_PRESETS.find((p) => p.hsn === "6101" && p.desc.includes("> ₹2,500"));
  const insurance = GST_2_SAC_PRESETS.find((p) => p.desc.includes("Insurance"));
  const salons = GST_2_SAC_PRESETS.find((p) => p.hsn === "9997");
  const restaurant = GST_2_SAC_PRESETS.find((p) => p.hsn === "9963" && p.desc.includes("Restaurant"));
  const gaming = GST_2_SAC_PRESETS.find((p) => p.hsn === "9996" && p.desc.includes("Gaming"));
  assert.equal(cement?.rate, 18);
  assert.equal(smallCar?.rate, 18);
  assert.equal(luxCar?.rate, 40);
  assert.equal(cigarettes?.rate, 40);
  assert.equal(garmentMerit?.rate, 5);
  assert.equal(garmentStd?.rate, 18);
  assert.equal(insurance?.rate, 0);
  assert.equal(salons?.rate, 5);
  assert.equal(restaurant?.rate, 5);
  assert.equal(gaming?.rate, 40);
});

test("23. Section 10 Composition Bill of Supply (1% / 5% / 6%): ₹0 GST on invoice, tax on turnover only, no ITC, Intra-State locked", () => {
  const res = computeGstInvoice({
    items: [{ id: "1", name: "Goods", unitPrice: 100000, quantity: 1, gstRate: 18, cessRate: 0, discount: 0 }],
    calcMode: "exclusive",
    placeOfSupply: "inter", // Illegal under Sec 10(2)(c) -> must lock to intra & warn
    taxScheme: "composition",
    compositionCategory: "trader_manufacturer",
    isRcm: false,
    showMarginMode: false,
    marginPct: 0,
    itc: { igst: 5000, cgst: 5000, sgst: 5000, cess: 0 },
  });
  assert.equal(res.documentType, "BILL_OF_SUPPLY");
  assert.equal(res.effectivePlaceOfSupply, "intra");
  assert.ok(res.compositionWarning);
  assert.equal(res.totalGst, 0);
  assert.equal(res.grandTotalExact, 100000); // NOT 118000!
  assert.equal(res.compositionTax, 1000); // 1% of 100000 (NOT 1% of 118000!)
  assert.equal(res.compositionCgst, 500);
  assert.equal(res.compositionSgst, 500);
  assert.equal(res.supplierCashLiabilityExact, 1000);
  assert.equal(res.rule88A.utilized.totalUtilized, 0);

  // Restaurant 5%
  const rest = computeGstInvoice({
    items: [{ id: "1", name: "Dining", unitPrice: 10000, quantity: 1, gstRate: 18, cessRate: 0, discount: 0 }],
    calcMode: "exclusive",
    placeOfSupply: "intra",
    taxScheme: "composition",
    compositionCategory: "restaurant",
    isRcm: false,
    showMarginMode: false,
    marginPct: 0,
    itc: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
  });
  assert.equal(rest.compositionRate, 5);
  assert.equal(rest.compositionTax, 500);
});

test("24. Rule 88A ITC Utilization: IGST exhausted first; CGST NEVER offsets SGST; Excess carries forward", () => {
  // Output: CGST 1000, SGST 1000, IGST 0. Available ITC: IGST 500, CGST 1200, SGST 0.
  // Step 1 (IGST first): 500 IGST -> CGST (rem CGST = 500, rem SGST = 1000)
  // Step 2 (CGST): 500 CGST -> CGST (rem CGST = 0; remaining CGST ITC = 700 CANNOT pay SGST!)
  // Cash payable: SGST 1000! Carry forward: CGST ITC 700!
  const u = computeRule88A(
    { igst: 0, cgst: 1000, sgst: 1000, cess: 0 },
    { igst: 500, cgst: 1200, sgst: 0, cess: 0 }
  );
  assert.equal(u.utilized.igstOnCgst, 500);
  assert.equal(u.utilized.cgstOnCgst, 500);
  assert.equal(u.cashPayable.cgst, 0);
  assert.equal(u.cashPayable.sgst, 1000);
  assert.equal(u.carryForward.cgst, 700);
});

test("25. Compensation Cess Strictly Separated from CGST/SGST/IGST ITC", () => {
  const res = computeGstInvoice({
    items: [{ id: "1", name: "Cess Item", unitPrice: 100000, quantity: 1, gstRate: 28, cessRate: 12, discount: 0 }],
    calcMode: "exclusive",
    placeOfSupply: "inter",
    taxScheme: "regular",
    compositionCategory: "trader_manufacturer",
    isRcm: false,
    showMarginMode: false,
    marginPct: 0,
    itc: { igst: 50000, cgst: 0, sgst: 0, cess: 0 }, // Huge IGST ITC cannot offset 12,000 Cess!
  });
  assert.equal(res.totalGst, 28000);
  assert.equal(res.totalCess, 12000);
  assert.equal(res.rule88A.cashPayable.igst, 0);
  assert.equal(res.rule88A.cashPayable.cess, 12000);
  assert.equal(res.supplierCashLiabilityExact, 12000);
  assert.equal(res.rule88A.carryForward.igst, 22000);
});

test("26. RCM u/s 9(3) & 49(4): Supplier cash = ₹0, Recipient mandatory 100% cash (no ITC offset)", () => {
  const res = computeGstInvoice({
    items: [{ id: "1", name: "GTA / Legal Service", unitPrice: 50000, quantity: 1, gstRate: 18, cessRate: 0, discount: 0 }],
    calcMode: "exclusive",
    placeOfSupply: "intra",
    taxScheme: "regular",
    compositionCategory: "trader_manufacturer",
    isRcm: true,
    showMarginMode: false,
    marginPct: 0,
    itc: { igst: 20000, cgst: 20000, sgst: 20000, cess: 0 },
  });
  assert.equal(res.documentType, "RCM_INVOICE");
  assert.equal(res.supplierCashLiabilityExact, 0);
  assert.equal(res.recipientRcmCashLiabilityExact, 9000);
});

test("27. Input Clamping: Discount >100% & Negative Values Never Produce Negative GST", () => {
  const res = computeGstInvoice({
    items: [{ id: "1", name: "Test", unitPrice: 1000, quantity: -5, gstRate: 18, cessRate: -10, discount: 150 }],
    calcMode: "exclusive",
    placeOfSupply: "intra",
    taxScheme: "regular",
    compositionCategory: "trader_manufacturer",
    isRcm: false,
    showMarginMode: false,
    marginPct: 0,
    itc: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
  });
  assert.equal(res.items[0].discount, 100);
  assert.equal(res.items[0].quantity, 1);
  assert.equal(res.items[0].cessRate, 0);
  assert.equal(res.totalGst, 0);
  assert.equal(res.grandTotalExact, 0);
});

test("28. Markup Margin Profit Exact Math: 20% markup on ₹10,000 cost => ₹12,000 subTotal, ₹2,000 profit (not ₹2,400)", () => {
  const res = computeGstInvoice({
    items: [{ id: "1", name: "Product", unitPrice: 10000, quantity: 1, gstRate: 18, cessRate: 0, discount: 0 }],
    calcMode: "exclusive",
    placeOfSupply: "intra",
    taxScheme: "regular",
    compositionCategory: "trader_manufacturer",
    isRcm: false,
    showMarginMode: true,
    marginPct: 20,
    itc: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
  });
  assert.equal(res.subTotal, 12000);
  assert.equal(res.estimatedMarginProfit, 2000);
});

console.log(`\nALL ${passed} STATUTORY GOLDEN TESTS PASSED!`);

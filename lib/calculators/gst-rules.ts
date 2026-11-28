export type GstCalcMode = "exclusive" | "inclusive";
export type GstPlaceOfSupply = "intra" | "inter";
export type GstTaxScheme = "regular" | "composition";
export type CompositionCategory = "trader_manufacturer" | "restaurant" | "service_provider";

export interface GstSlabOption {
  rate: number;
  label: string;
  sublabel: string;
  isLegacy?: boolean;
}

/**
 * GST 2.0 Active Rate Architecture (56th GST Council Reforms, effective 22 Sept 2025)
 */
export const GST_2_ACTIVE_SLABS: GstSlabOption[] = [
  { rate: 0, label: "0%", sublabel: "Exempt / Nil" },
  { rate: 3, label: "3%", sublabel: "Gold & Bullion" },
  { rate: 5, label: "5%", sublabel: "Merit / Essentials" },
  { rate: 18, label: "18%", sublabel: "Standard Rate" },
  { rate: 40, label: "40%", sublabel: "Luxury / De-merit" },
];

/**
 * Legacy / Special Transitional Rates (Pre-22 Sept 2025 invoices, rough diamonds, or transitional cess items)
 */
export const GST_LEGACY_SLABS: GstSlabOption[] = [
  { rate: 0.25, label: "0.25%", sublabel: "Rough Diamonds", isLegacy: false },
  { rate: 12, label: "12%", sublabel: "Legacy (Pre-Sept 25)", isLegacy: true },
  { rate: 28, label: "28%", sublabel: "Legacy / Transitional", isLegacy: true },
];

export const ALL_GST_RATES: number[] = [0, 0.25, 3, 5, 12, 18, 28, 40];

export interface CompositionOption {
  id: CompositionCategory;
  label: string;
  rate: number;
  cgstRate: number;
  sgstRate: number;
  section: string;
  turnoverCap: string;
}

export const COMPOSITION_CATEGORIES: Record<CompositionCategory, CompositionOption> = {
  trader_manufacturer: {
    id: "trader_manufacturer",
    label: "Traders & Manufacturers (1%)",
    rate: 1,
    cgstRate: 0.5,
    sgstRate: 0.5,
    section: "Sec 10(1) CGST Act",
    turnoverCap: "Up to ₹1.5 Cr (₹75L special states)",
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurants (Non-Alcohol) (5%)",
    rate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    section: "Sec 10(1) CGST Act",
    turnoverCap: "Up to ₹1.5 Cr (₹75L special states)",
  },
  service_provider: {
    id: "service_provider",
    label: "Service Providers / Mixed (6%)",
    rate: 6,
    cgstRate: 3,
    sgstRate: 3,
    section: "Sec 10(2A) CGST Act",
    turnoverCap: "Up to ₹50 Lakhs aggregate turnover",
  },
};

export interface HsnPreset {
  hsn: string;
  desc: string;
  rate: number;
  category: string;
  note?: string;
}

/**
 * Post-56th GST Council (GST 2.0 — eff. 22 Sept 2025) & Notification 19/2025-CT(R) (eff. 1 Feb 2026)
 * Comprehensive HSN Goods Presets across all active GST 2.0 slabs (0%, 0.25%, 3%, 5%, 18%, 40%)
 */
export const GST_2_HSN_PRESETS: HsnPreset[] = [
  // 0% — Exempt / Nil-Rated Essentials
  { hsn: "0101", desc: "Live Animals & Farm Livestock", rate: 0, category: "Agriculture" },
  { hsn: "0701", desc: "Fresh Vegetables, Fruits & Unprocessed Produce", rate: 0, category: "Agriculture" },
  { hsn: "1001", desc: "Unbranded Wheat, Rice & Food Grains", rate: 0, category: "Agriculture" },
  { hsn: "0401", desc: "Fresh / UHT Milk & Unpackaged Paneer", rate: 0, category: "Dairy" },
  { hsn: "3004", desc: "Life-Saving Cancer & Rare Disease Drugs", rate: 0, category: "Pharma", note: "GST 2.0 Exempt" },
  { hsn: "4901", desc: "Printed Books, Newspapers & Exercise Notebooks", rate: 0, category: "Education" },
  { hsn: "9619", desc: "Sanitary Napkins & Menstrual Hygiene Pads", rate: 0, category: "Healthcare" },

  // 0.25% — Special Precious Stones Slab
  { hsn: "7102", desc: "Rough / Uncut Diamonds & Precious Stones", rate: 0.25, category: "Precious Stones" },

  // 3% — Precious Metals & Jewellery Slab
  { hsn: "7108", desc: "Gold & Silver Bullion", rate: 3, category: "Precious Metals" },
  { hsn: "7113", desc: "Gold, Silver & Diamond Jewellery", rate: 3, category: "Precious Metals" },

  // 5% — GST 2.0 Merit / Essentials Slab
  { hsn: "0405", desc: "Butter, Ghee, Cheese & Packaged Paneer", rate: 5, category: "Dairy", note: "Reduced from 12%" },
  { hsn: "1902", desc: "Pasta, Noodles, Biscuits & Packaged Namkeen", rate: 5, category: "Food", note: "Reduced from 12%/18%" },
  { hsn: "3004", desc: "Essential Medicaments & Medical Supplies", rate: 5, category: "Pharma" },
  { hsn: "3305", desc: "Hair Oil, Shampoos & Oral Care / Toothpaste", rate: 5, category: "FMCG", note: "Reduced from 18%" },
  { hsn: "3401", desc: "Toilet Soaps & Daily Hygiene Bars", rate: 5, category: "FMCG", note: "Reduced from 18%" },
  { hsn: "3808", desc: "Agricultural Inputs, Biopesticides & Fertilizers", rate: 5, category: "Agri Inputs" },
  { hsn: "6101", desc: "Readymade Garments & Apparel (≤ ₹2,500/pc)", rate: 5, category: "Textiles", note: "Threshold doubled to ₹2,500" },
  { hsn: "6403", desc: "Footwear (≤ ₹2,500/pair)", rate: 5, category: "Footwear", note: "Threshold doubled to ₹2,500" },
  { hsn: "8432", desc: "Tractors, Farm Machinery & Drip Irrigation", rate: 5, category: "Agriculture" },
  { hsn: "8541", desc: "Solar Panels, Modules & Renewable Devices", rate: 5, category: "Clean Energy" },
  { hsn: "8712", desc: "Bicycles & Non-Motorized Cycles", rate: 5, category: "Transport" },
  { hsn: "9503", desc: "Toys, Tricycles & Educational Games", rate: 5, category: "Consumer" },

  // 18% — GST 2.0 Standard Slab
  { hsn: "2106", desc: "Processed Food Preparations & Concentrates", rate: 18, category: "Food" },
  { hsn: "2201", desc: "Packaged Drinking Water", rate: 18, category: "Beverages" },
  { hsn: "2523", desc: "Portland Cement (GST 2.0 Reduced from 28%)", rate: 18, category: "Construction" },
  { hsn: "6101", desc: "Readymade Garments & Apparel (> ₹2,500/pc)", rate: 18, category: "Textiles" },
  { hsn: "6403", desc: "Premium Footwear (> ₹2,500/pair)", rate: 18, category: "Footwear" },
  { hsn: "7208", desc: "Iron, Steel & Structural Metal Products", rate: 18, category: "Industrial" },
  { hsn: "8415", desc: "Air Conditioners (ACs) & Dishwashers", rate: 18, category: "Appliances", note: "Reduced from 28%" },
  { hsn: "8418", desc: "Refrigerators & Washing Machines", rate: 18, category: "Appliances" },
  { hsn: "8471", desc: "Laptops, Servers & Computing Hardware", rate: 18, category: "Electronics" },
  { hsn: "8517", desc: "Mobile Phones & Telecom Equipment", rate: 18, category: "Electronics" },
  { hsn: "8528", desc: "Smart TVs & Monitors (All Sizes)", rate: 18, category: "Electronics", note: ">32\" reduced from 28%" },
  { hsn: "8703", desc: "Small Cars (≤1200cc Petrol / ≤1500cc Diesel, ≤4m)", rate: 18, category: "Automobiles", note: "Reduced from 28%" },
  { hsn: "8711", desc: "Motorcycles & Two-Wheelers (≤350cc)", rate: 18, category: "Automobiles", note: "Reduced from 28%" },
  { hsn: "9403", desc: "Home & Commercial Office Furniture", rate: 18, category: "Furniture" },
  { hsn: "2403", desc: "Bidis / Biris (Separate Carve-out)", rate: 18, category: "Tobacco" },

  // 40% — GST 2.0 Special Luxury & De-Merit Slab
  { hsn: "2202", desc: "Aerated, Carbonated, Caffeinated & Energy Drinks", rate: 40, category: "De-merit" },
  { hsn: "2106", desc: "Pan Masala (RSP Rule 31D, eff. 1 Feb 2026)", rate: 40, category: "De-merit" },
  { hsn: "2401", desc: "Unmanufactured Tobacco (Excl. Leaves, RSP Rule 31D)", rate: 40, category: "De-merit" },
  { hsn: "2402", desc: "Cigarettes, Cigars & Manufactured Tobacco (RSP)", rate: 40, category: "De-merit" },
  { hsn: "8703", desc: "Luxury Cars & Large SUVs (>1200cc / >1500cc / >4m)", rate: 40, category: "Luxury Auto" },
  { hsn: "8711", desc: "Premium Motorcycles (>350cc)", rate: 40, category: "Luxury Auto" },
  { hsn: "8903", desc: "Yachts, Pleasure Vessels & Personal Aircraft", rate: 40, category: "Luxury" },
];

/**
 * Post-56th GST Council (GST 2.0 — eff. 22 Sept 2025)
 * Comprehensive SAC Services Presets across all major Indian SAC Chapters (9954–9997)
 */
export const GST_2_SAC_PRESETS: HsnPreset[] = [
  // 0% — Exempt Services
  { hsn: "9971", desc: "Individual Life & Health Insurance Policies (Exempt)", rate: 0, category: "Insurance", note: "GST 2.0 Exempt" },
  { hsn: "9993", desc: "Healthcare, Hospital & Clinical Services", rate: 0, category: "Healthcare" },
  { hsn: "9992", desc: "Formal School, College & Recognized Education", rate: 0, category: "Education" },
  { hsn: "9972", desc: "Residential Dwelling Rent (Personal Residence)", rate: 0, category: "Real Estate" },

  // 5% — Merit / Concessional Services (No / Restricted ITC)
  { hsn: "9963", desc: "Standalone Restaurant & Food Delivery (No ITC)", rate: 5, category: "Food & Dining" },
  { hsn: "9963", desc: "Hotel Accommodation (≤ ₹7,500/unit/day, No ITC)", rate: 5, category: "Hospitality", note: "Reduced from 12%" },
  { hsn: "9964", desc: "Passenger Transport (Cabs, Economy Air, AC Rail)", rate: 5, category: "Transport" },
  { hsn: "9965", desc: "Goods Transport Agency / GTA Freight (No ITC / RCM)", rate: 5, category: "Logistics" },
  { hsn: "9988", desc: "Job Work Services (Textiles, Pharma, Printing)", rate: 5, category: "Manufacturing" },
  { hsn: "9997", desc: "Beauty Salons, Gyms, Spas & Wellness (No ITC)", rate: 5, category: "Wellness", note: "Reduced from 18%" },

  // 18% — Standard Services (Full ITC Eligible)
  { hsn: "9954", desc: "Construction & Commercial Works Contract", rate: 18, category: "Construction" },
  { hsn: "9963", desc: "Luxury Hotel Stay (> ₹7,500/day) & Specified Premises", rate: 18, category: "Hospitality" },
  { hsn: "9965", desc: "Goods Transport Agency / GTA Freight (Forward Charge, ITC)", rate: 18, category: "Logistics" },
  { hsn: "9967", desc: "Warehousing, Cold Storage & Cargo Handling", rate: 18, category: "Logistics" },
  { hsn: "9971", desc: "Banking, Stockbroking & Financial Services", rate: 18, category: "Finance" },
  { hsn: "9972", desc: "Commercial Property Renting & Real Estate Brokerage", rate: 18, category: "Real Estate" },
  { hsn: "9982", desc: "CA, Legal, Audit & Tax Advisory Services", rate: 18, category: "Professional" },
  { hsn: "9983", desc: "Software, SaaS, Cloud & IT Services", rate: 18, category: "IT & SaaS" },
  { hsn: "9983", desc: "Digital Marketing, Advertising & Architecture", rate: 18, category: "Business Services" },
  { hsn: "9984", desc: "Telecom, Broadband & ISP Services", rate: 18, category: "Telecom" },
  { hsn: "9985", desc: "Manpower Supply, Security & Facility Management", rate: 18, category: "Support Services" },
  { hsn: "9987", desc: "Equipment AMC, Repair & Maintenance", rate: 18, category: "Maintenance" },
  { hsn: "9988", desc: "General Industrial Manufacturing & Job Work", rate: 18, category: "Manufacturing" },
  { hsn: "9992", desc: "Private Coaching, EdTech & Corporate Training", rate: 18, category: "Education" },
  { hsn: "9996", desc: "Cinema Tickets (> ₹100) & Event Management", rate: 18, category: "Entertainment" },

  // 40% — Special De-Merit Services
  { hsn: "9996", desc: "Casinos, Betting, Horse Racing & Online Money Gaming", rate: 40, category: "De-merit Gaming" },
];


// frontend/lib/questionBank.ts
export type QuestionType = "text" | "number" | "select" | "checkbox";

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select/checkbox
}

export interface SurveyDefinition {
  role: string;
  country?: string;
  questions: Question[];
}

const common: Question[] = [
  { id: "annual_turnover_usd", label: "Annual Turnover (USD)", type: "number", required: true, placeholder: "e.g., 1500000" },
  { id: "trade_corridors", label: "Primary Trade Corridors", type: "text", required: false, placeholder: "e.g., India↔UAE, India↔EU" },
];

const retailerIndia: Question[] = [
  { id: "monthly_orders", label: "Average Monthly Orders", type: "number", required: true },
  { id: "preferred_payment", label: "Preferred Payment Instrument", type: "select", required: true, options: ["LC", "Advance", "Open Account", "Escrow"] },
  { id: "gst_registered", label: "GST Registered", type: "select", required: true, options: ["Yes", "No"] },
  { id: "compliance_pain", label: "Top Compliance Pain Point", type: "select", options: ["HSN mapping", "E-invoicing", "Returns", "Other"] },
];

const sellerIndia: Question[] = [
  { id: "export_share", label: "Share of Revenue from Exports (%)", type: "number", required: true },
  { id: "doc_stack", label: "Documents You Generate Today", type: "checkbox", options: ["Invoice", "Packing List", "COO", "BL/AWB", "LC docs", "E-Way Bill"] },
  { id: "financing_need", label: "Working Capital Need (USD)", type: "number" },
];

export function getSurvey(role: string, country?: string): SurveyDefinition {
  const r = role.toLowerCase();
  const c = (country || "").toLowerCase();

  if (r === "retailer" && c === "india") {
    return { role, country, questions: [...retailerIndia, ...common] };
  }
  if (r === "seller" && c === "india") {
    return { role, country, questions: [...sellerIndia, ...common] };
  }

  // default fallback
  return {
    role, country,
    questions: [
      { id: "ops_headcount", label: "Ops/Compliance Headcount", type: "number", required: false },
      ...common
    ],
  };
}

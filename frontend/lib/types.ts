// frontend/lib/types.ts

export type QuestionMode = "single" | "multi" | "ranking" | "likert" | "open";

export type QuestionBase = {
  id: string;
  type: "mcq" | "open";
  prompt: string;
  helpText?: string;
};

export type MCQOption = {
  id: string;
  label: string;
  // optional numeric weight for "weighted multi" (1..5 or any number)
  weight?: number;
};

export type QuestionMCQ = QuestionBase & {
  type: "mcq";
  mode: "single" | "multi" | "ranking" | "likert";
  options: MCQOption[];
  // for likert: 5 or 7 etc.; for weighted: max weight value
  scale?: number;
};

export type QuestionOpen = QuestionBase & {
  type: "open";
  placeholder?: string;
  maxLen?: number;
};

export type Question = QuestionMCQ | QuestionOpen;

export type SurveySession = {
  _id?: any;
  email?: string;
  role?: string;
  country?: string;
  status: "in_progress" | "done";
  startedAt: Date;
  questions: Question[];
  // answers: flexible:
  // - single: string (option id)
  // - multi: string[] (selected option ids)
  // - ranking: string[] (ordered option ids, top->bottom)
  // - likert: number (1..scale)
  // - open: string
  answers: Array<{ qid: string; value: string | string[] | number }>;
};

// Shared Simulation type for results rendering
export interface Simulation {
  savingsEstimate?: {
    shortTermPct?: number;
    midTermPct?: number;
    longTermPct?: number;
  };
  // Extend with more fields as needed
}

// frontend/lib/types.ts

export type MCQQuestion = {
  id: string;
  type: "mcq";
  prompt: string;
  options: string[];
  scale?: "likert-5" | "likert-7";
};

export type OpenQuestion = {
  id: string;
  type: "open";
  prompt: string;
  hint?: string;
};

export type Question = MCQQuestion | OpenQuestion;

export type AnswerRecord = {
  id: string;             // unique ID for answer
  questionId: string;     // which question this maps to
  value: any;             // the chosen option(s) or free text
  ts: Date;               // timestamp of when it was answered
};

export type SurveySession = {
  _id?: any;              // MongoDB ObjectId
  email: string;
  role: string;
  country: string;
  company?: string;
  status: "in_progress" | "completed";
  startedAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  questions?: Question[]; // generated question set
  answers: AnswerRecord[];
  lastSimulation?: any;   // AI-generated simulation result
};

export type LikertQ = { type: "likert"; min: number; max: number };
export type MCQQ = { type: "mcq"; options: string[]; multi?: boolean };
export type ShortTextQ = { type: "short_text" };
export type QuestionMeta = (LikertQ | MCQQ | ShortTextQ) & { id: string; prompt: string };

export type AnswerRecord = {
  qid: string;
  prompt: string;
  meta: Omit<QuestionMeta, "id" | "prompt">;
  options?: string[];           // keep original options if mcq
  response: string | string[];  // user’s answer
  aiNotes?: string;             // per-answer AI note
  createdAt: Date;
};

export type SurveySession = {
  _id?: any;
  role: string;
  participant: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    country?: string;
  };
  seed?: string;
  status: "active" | "completed" | "abandoned";
  startedAt: Date;
  completedAt?: Date;
  currentBatch: QuestionMeta[]; // what’s currently shown to user
  answers: AnswerRecord[];      // all answers so far
  summary?: string;             // rolling summary for you (internal)
};

export type LikertQ = { type: "likert"; min: number; max: number };
export type MCQQ = { type: "mcq"; options: string[]; multi?: boolean };
export type ShortTextQ = { type: "short_text" };
export type QuestionMeta = (LikertQ | MCQQ | ShortTextQ) & { id: string; prompt: string };

export type AnswerRecord = {
  questionId: string;   // <-- add this
  value: any;
  meta?: any;
};

export type SurveySession = {
  _id?: any;
  email?: string;     // ✅ add this
  role?: string;
  country?: string;
  status?: "in_progress" | "completed";
  startedAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
  answers?: any[];
  questions?: any[];
};
  seed?: string;
  status: "active" | "completed" | "abandoned";
  startedAt: Date;
  completedAt?: Date;
  currentBatch: QuestionMeta[]; // what’s currently shown to user
  answers: AnswerRecord[];      // all answers so far
  summary?: string;             // rolling summary for you (internal)
};

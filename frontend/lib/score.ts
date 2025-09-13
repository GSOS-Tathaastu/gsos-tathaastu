export function computeScore(answers: Record<string, string|number>) {
  const likertVals = Object.values(answers).filter(v => typeof v === "number") as number[];
  if (!likertVals.length) return 50;
  const avg = likertVals.reduce((a,b)=>a+b,0)/likertVals.length;
  return Math.round((avg-1) * (100/4));
}

export function mapBlueprint(painArea: string) {
  const modules: string[] = [];
  if (/working capital|capital/i.test(painArea)) modules.push("Escrow & Trade Finance");
  if (/stockout|inventory/i.test(painArea)) modules.push("Inventory OS");
  if (/compliance|kyc|gst|docs/i.test(painArea)) modules.push("Document OS & Compliance");
  if (!modules.length) modules.push("Core GSOS Onboarding");
  return { modules, notes: "Suggested based on primary pain area." };
}

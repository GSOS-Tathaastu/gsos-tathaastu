// frontend/app/investors/page.tsx
export default function InvestorsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Investor Portal</h1>
      <p className="text-gray-700">
        Welcome to the private investor area. Add pitch decks, KPIs, traction charts, and updates here.
      </p>
      <ul className="list-disc pl-6 text-gray-700">
        <li>Confidential metrics (MRR, GMV, cohort)</li>
        <li>Roadmap & milestones</li>
        <li>Data room links</li>
        <li>Changelog / updates</li>
      </ul>
    </div>
  );
}

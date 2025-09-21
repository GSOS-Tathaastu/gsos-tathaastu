/* Investors dashboard: AI Q&A + Survey Analytics */
import InvestorQA from "@/components/InvestorQA";
import SurveyAnalytics from "@/components/SurveyAnalytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function InvestorsDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Investor Console</h1>
          <p className="text-gray-600">
            Ask questions about GSOS and review live survey analytics.
          </p>
        </header>

        {/* AI Q&A */}
        <section className="rounded-2xl border bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold mb-3">Q&A — Ask GSOS</h2>
          <InvestorQA />
        </section>

        {/* Survey Analytics */}
        <section className="rounded-2xl border bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold mb-4">Survey Analytics</h2>
          <SurveyAnalytics />
        </section>
      </div>
    </main>
  );
}

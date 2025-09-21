/* Investors landing: deck + details + Q&A + negotiator */
import InvestorDetailsForm from "@/components/InvestorDetailsForm";
import InvestorQA from "@/components/InvestorQA";
import DealNegotiator from "@/components/DealNegotiator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">GSOS — Investor Brief</h1>
          <p className="text-gray-600">
            Fast overview of the opportunity, strategy, and product. Submit your
            interest, ask questions, and run a quick deal scenario.
          </p>
        </header>

        {/* Investor Deck */}
        <section className="rounded-2xl border bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold mb-4">Investor Deck</h2>
          <div
            className="w-full"
            dangerouslySetInnerHTML={{
              __html: `<div id="1758478963466" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;">
                <iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/qGqtoReMFY" scrolling="no"></iframe>
              </div>`,
            }}
          />
        </section>

        {/* Investor Details */}
        <section className="rounded-2xl border bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold mb-4">Your Interest</h2>
          <InvestorDetailsForm />
        </section>

        {/* Q&A */}
        <section className="rounded-2xl border bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold mb-3">Q&A — Ask GSOS</h2>
          <InvestorQA />
        </section>

        {/* Deal Negotiator */}
        <section className="rounded-2xl border bg-white shadow-sm p-5">
          <h2 className="text-xl font-semibold mb-3">Deal Negotiator</h2>
          <DealNegotiator />
        </section>
      </div>
    </main>
  );
}

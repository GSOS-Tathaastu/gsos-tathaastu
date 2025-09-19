// frontend/app/investors/page.tsx
import InvestorForms from "@/components/InvestorForms";

export default function InvestorsPage({
  searchParams,
}: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const ACCESS_KEY = process.env.NEXT_PUBLIC_INVESTOR_ACCESS_KEY;
  const IFRAME_URL = process.env.NEXT_PUBLIC_INVESTOR_PRESENTATION_URL;
  const key = (searchParams?.key as string | undefined)?.trim();

  if (!ACCESS_KEY) {
    return <div className="p-6">Missing NEXT_PUBLIC_INVESTOR_ACCESS_KEY</div>;
  }
  if (!key || key !== ACCESS_KEY) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-semibold">Private Investor Room</h1>
        <p className="opacity-70 mt-2">
          Access denied. Append <code>?key=YOUR_KEY</code> to the URL.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">GSOS — Investor Overview</h1>

      {IFRAME_URL ? (
        <div className="aspect-video w-full border rounded-2xl overflow-hidden">
          <iframe
            src={IFRAME_URL}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            title="Investor Presentation"
          />
        </div>
      ) : (
        <div className="text-amber-600 text-sm">
          Set NEXT_PUBLIC_INVESTOR_PRESENTATION_URL to render the deck.
        </div>
      )}

      <InvestorForms />
      <p className="text-sm opacity-70">
        Voice-over for the deck can be added later (client-side audio overlay / timed captions).
      </p>
    </div>
  );
}

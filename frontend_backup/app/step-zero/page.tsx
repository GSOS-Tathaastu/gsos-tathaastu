import dynamic from "next/dynamic";
const StepZeroCompany = dynamic(() => import("@/components/StepZeroCompany"), { ssr: false });

export default function StepZeroPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Welcome — Let’s Get You Set Up</h1>
      <StepZeroCompany />
    </div>
  );
}

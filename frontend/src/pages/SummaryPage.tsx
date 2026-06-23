import { SectionLabel } from "../components/ui";

export function SummaryPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-screen w-full bg-[#fafafa] font-sans overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4 bg-white border-b border-neutral-200">
        <div>
          <SectionLabel>Operations</SectionLabel>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">Summary</h1>
        </div>
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          ← Back to dispatch
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pt-20 pb-12 px-8">
        <div className="max-w-5xl mx-auto py-6">
          <div className="rounded-2xl ring-1 ring-black/5 bg-white px-6 py-16 text-center">
            <SectionLabel>No data yet</SectionLabel>
            <p className="mt-2 text-sm text-neutral-500">
              Summary analytics will appear here once connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

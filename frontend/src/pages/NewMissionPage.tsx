type NewMissionPageProps = {
  onBack: () => void;
};

export function NewMissionPage({ onBack }: NewMissionPageProps) {
  return (
    <div className="flex h-screen w-full bg-[#fafafa] text-neutral-900 antialiased font-sans items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">New Mission</h1>
        <p className="text-[11px] uppercase tracking-widest text-neutral-400">Coming soon</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-full text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          ← Back to dispatch
        </button>
      </div>
    </div>
  );
}

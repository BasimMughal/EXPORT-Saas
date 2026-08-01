export function DemoModeBanner() {
  return (
    <div className="rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
      <p className="font-semibold">Demo mode with sample garment export data</p>
      <p className="mt-1 text-amber-900/75">
        Browse the full product experience offline. Connect MongoDB later for live persistence.
      </p>
    </div>
  );
}

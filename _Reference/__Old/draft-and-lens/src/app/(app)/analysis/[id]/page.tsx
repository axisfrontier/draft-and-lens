/**
 * Stage 0 scaffold — analysis detail placeholder.
 */
export default function AnalysisPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-paper p-8">
      <p className="text-ink-soft">Analysis {params.id} — Stage 4.</p>
    </main>
  );
}

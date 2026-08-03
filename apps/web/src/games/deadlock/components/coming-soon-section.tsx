interface ComingSoonSectionProps {
  title: string;
}

export function ComingSoonSection({ title }: ComingSoonSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm text-zinc-500">Coming Soon</p>
    </section>
  );
}

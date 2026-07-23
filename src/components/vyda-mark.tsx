type VydaMarkProps = { inverse?: boolean; compact?: boolean };

export function VydaMark({ inverse = false, compact = false }: VydaMarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${inverse ? "text-white" : "text-[#102d28]"}`} aria-label="VYDA SA">
      <span className={`font-display font-semibold tracking-[-0.06em] ${compact ? "text-xl" : "text-2xl"}`}>VYDA</span>
      <span className={`rounded-full border px-2 py-1 text-[0.48rem] font-extrabold uppercase tracking-[0.16em] ${inverse ? "border-white/20 text-[#b9f1dd]" : "border-[#176654]/20 text-[#176654]"}`}>SA</span>
    </span>
  );
}

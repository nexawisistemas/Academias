export function PageTitle({ eyebrow, title, description, badge }: { eyebrow: string; title: string; description: string; badge?: string }) {
  return <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="text-[10px] font-bold tracking-[.16em] text-emerald-300">{eyebrow}</span><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">{title}</h1><p className="mt-2 max-w-2xl text-sm text-emerald-50/40">{description}</p></div>{badge&&<span className="w-fit rounded-full border border-emerald-300/15 px-3 py-2 text-[10px] font-bold text-emerald-300">{badge}</span>}</header>;
}
export const inputClass = "rounded-xl border border-emerald-100/10 bg-black/15 px-3 py-3 text-sm text-emerald-50 outline-none placeholder:text-emerald-50/25 focus:border-emerald-300/50";
export const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-bold text-emerald-950 transition hover:bg-emerald-200";

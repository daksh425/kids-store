import { inr } from "@/lib/format";

type Day = { day: string; revenue: number; orders: number };

function shortDate(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

function niceMax(n: number) {
  if (n <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(n));
  return Math.ceil(n / pow) * pow;
}

/** Daily revenue columns, single series, with a hover tooltip per day and a table fallback. */
export function RevenueChart({ data }: { data: Day[] }) {
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const ticks = [max, max / 2, 0];
  return (
    <div>
      <div className="relative h-52 pl-12">
        {ticks.map((t) => (
          <div key={t} className="absolute right-0 left-12 border-t border-line" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -top-2 -left-12 w-10 text-right text-[11px] text-muted tabular-nums">{inr(t)}</span>
          </div>
        ))}
        <div className="absolute inset-0 left-12 flex items-end gap-0.5">
          {data.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0} aria-label={`${shortDate(d.day)}: ${inr(d.revenue)}, ${d.orders} orders`}>
              <div
                className="w-full max-w-6 rounded-t-[4px] bg-primary transition group-hover:bg-primary-dark group-focus:bg-primary-dark"
                style={{ height: d.revenue ? `max(${(d.revenue / max) * 100}%, 3px)` : 0 }}
              />
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-xl bg-navy px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg group-hover:block group-focus:block">
                <p className="font-bold">{shortDate(d.day)}</p>
                <p className="tabular-nums">
                  {inr(d.revenue)} · {d.orders} order{d.orders === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-0.5 pl-12">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center text-[11px] text-muted">
            {i % 2 === data.length % 2 ? shortDate(d.day) : ""}
          </span>
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-bold text-primary">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-muted uppercase">
            <tr>
              <th className="py-1">Day</th>
              <th className="py-1 text-right">Orders</th>
              <th className="py-1 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="py-1">{shortDate(d.day)}</td>
                <td className="py-1 text-right">{d.orders}</td>
                <td className="py-1 text-right">{inr(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Funnel as a ranked bar list: each step's width is relative to the first step. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        // Downloads can outnumber orders (one order, several files), so a rate over 100% isn't a conversion.
        const rate = prev && s.value <= prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-bold">{s.label}</span>
              <span className="text-muted tabular-nums">
                <strong className="text-navy">{s.value.toLocaleString("en-IN")}</strong>
                {rate != null ? ` · ${rate}% of previous` : ""}
              </span>
            </div>
            <div className="h-3 rounded-full bg-cream">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${Math.min(100, (s.value / top) * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

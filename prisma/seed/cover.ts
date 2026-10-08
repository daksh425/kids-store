// SVG cover thumbnails for seeded products (600×800, 3:4).

const NAVY = "#25253A";
const CONFETTI = ["#5B4BDB", "#4DA3FF", "#FFD95A", "#72D6B1", "#FF7B6B"];

function escapeXml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}

function wrapByChars(text: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function coverSvg(opts: {
  title: string;
  categoryLabel: string;
  ageLabel: string;
  emoji: string;
  color: string;
  tint: string;
  ink: string;
  free?: boolean;
}) {
  const rand = seeded(opts.title);
  const confetti = Array.from({ length: 22 }, (_, i) => {
    const x = Math.round(rand() * 600);
    const y = Math.round(rand() * 420);
    const r = Math.round(5 + rand() * 12);
    const c = CONFETTI[i % CONFETTI.length];
    return i % 3 === 0
      ? `<rect x="${x}" y="${y}" width="${r * 1.6}" height="${r * 1.6}" rx="4" fill="${c}" opacity=".5" transform="rotate(${Math.round(rand() * 90)} ${x} ${y})"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".45"/>`;
  }).join("");

  const lines = wrapByChars(opts.title, 16).slice(0, 4);
  const size = lines.length > 3 ? 40 : 46;
  const titleY = 560 - (lines.length - 1) * (size + 6);
  const title = lines
    .map((l, i) => `<text x="44" y="${titleY + i * (size + 8)}" font-size="${size}" font-weight="800" fill="${NAVY}">${escapeXml(l)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opts.tint}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="${opts.ink}" flood-opacity=".22"/></filter>
</defs>
<rect width="600" height="800" fill="url(#g)"/>
<path d="M0 0 H600 V330 C 470 390 150 300 0 370 Z" fill="${opts.color}" opacity=".9"/>
${confetti}
<g font-family="'Fredoka','Nunito','Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif">
<rect x="44" y="44" rx="20" height="40" width="${opts.categoryLabel.length * 13 + 40}" fill="#FFFFFF"/>
<text x="64" y="72" font-size="20" font-weight="700" fill="${opts.ink}">${escapeXml(opts.categoryLabel)}</text>
${opts.free ? `<rect x="452" y="44" rx="20" height="40" width="104" fill="${NAVY}"/><text x="474" y="72" font-size="20" font-weight="800" fill="#FFD95A">FREE</text>` : ""}
<circle cx="300" cy="275" r="118" fill="#FFFFFF" filter="url(#s)"/>
<text x="300" y="318" font-size="120" text-anchor="middle">${opts.emoji}</text>
${title}
<rect x="44" y="${titleY + lines.length * (size + 8) + 4}" rx="18" height="38" width="${opts.ageLabel.length * 12 + 36}" fill="${opts.color}" opacity=".95"/>
<text x="62" y="${titleY + lines.length * (size + 8) + 30}" font-size="19" font-weight="700" fill="${opts.color === "#FFD95A" || opts.color === "#72D6B1" ? NAVY : "#FFFFFF"}">${escapeXml(opts.ageLabel)}</text>
</g>
</svg>`;
}

import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";

// A vintage nautical chart of the world. Real country/continent outlines come
// from Natural Earth (world-atlas, 110m — public domain, keyless), drawn with
// an equirectangular projection — the classic rectangular portolan look. The
// chart is dressed in aged-parchment tones with a graticule, degree ticks,
// radiating rhumb lines, a compass rose and a double chart frame.
//
// Props:
//   latlng   - [lat, lng] to place a marker (optional).
//   label    - name shown next to the marker (optional).
//   highlight- country name to tint gold on the map (optional).
//   size     - "auto" (fills width; default) or "tall".
//   className- extra wrapper classes.

const W = 1000;
const H = 500;
const PAD = 14; // space reserved for the frame + degree labels

// Decode the TopoJSON once at module load (pure, static, cheap).
const countries = feature(worldTopo, worldTopo.objects.countries).features;

// Equirectangular world — 2:1, fits the chart frame, keeps shapes recognisable.
const projection = geoEquirectangular().fitExtent(
  [
    [PAD, PAD],
    [W - PAD, H - PAD],
  ],
  { type: "FeatureCollection", features: countries }
);
const path = geoPath(projection);

// Normalise a country name for the highlight match ("United States" ==
// "United States of America" via startsWith, so territories still map well).
const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function matchesName(featureName, want) {
  if (!featureName || !want) return false;
  const a = normalize(featureName);
  const b = normalize(want);
  return (
    a === b ||
    a.startsWith(b) ||
    b.startsWith(a) ||
    a.includes(b) ||
    b.includes(a)
  );
}

// ----- Nautical decoration helpers -----

// A compass rose: two stacked stars (main + diagonals) plus N/E/S/W letters.
function CompassRose({ cx, cy, r = 26 }) {
  const star = (R, rr, rot) => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = ((rot + i * 45) * Math.PI) / 180;
      const rad = i % 2 === 0 ? R : rr;
      pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const letters = [
    ["N", -90],
    ["E", 0],
    ["S", 90],
    ["W", 180],
  ];
  return (
    <g className="cq-compass">
      <polygon points={star(r, r * 0.28, 0)} className="cq-compass-petal" />
      <polygon points={star(r * 0.62, r * 0.16, 45)} className="cq-compass-petal-sub" />
      <circle cx={cx} cy={cy} r={r * 0.95} className="cq-compass-ring" />
      <circle cx={cx} cy={cy} r={r * 0.12} className="cq-compass-hub" />
      {letters.map(([ch, deg]) => {
        const a = (deg * Math.PI) / 180;
        const x = cx + Math.sin(a) * (r + 6);
        const y = cy - Math.cos(a) * (r + 6);
        return (
          <text
            key={ch}
            x={x}
            y={y + 2.5}
            textAnchor="middle"
            className={ch === "N" ? "cq-compass-n" : "cq-compass-letter"}
          >
            {ch}
          </text>
        );
      })}
    </g>
  );
}

// Radiating rhumb lines from a couple of compass points, clipped to the map.
function RhumbLines() {
  const centers = [
    [W * 0.5, H * 0.5],
    [W * 0.24, H * 0.66],
    [W * 0.78, H * 0.34],
  ];
  const lines = [];
  centers.forEach(([cx, cy], i) => {
    for (let a = 0; a < 360; a += 30) {
      const rad = (a * Math.PI) / 180;
      const R = Math.max(W, H) * 1.5;
      lines.push(
        <line
          key={`${i}-${a}`}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(rad) * R}
          y2={cy + Math.sin(rad) * R}
          className="cq-rhumb"
        />
      );
    }
  });
  return <g className="cq-rhumb-group">{lines}</g>;
}

// Degree ticks + labels along the frame edges (longitudes top/bottom,
// latitudes left/right) — a proper sea-chart border.
function DegreeBorder() {
  const lngs = [];
  for (let l = -180; l <= 180; l += 30) lngs.push(l);
  const lats = [];
  for (let la = -60; la <= 60; la += 30) lats.push(la);

  const lngTicks = [];
  for (let l = -180; l <= 180; l += 15) lngTicks.push(l);
  const latTicks = [];
  for (let la = -75; la <= 75; la += 15) latTicks.push(la);

  const fmt = (v, isLat) => {
    if (v === 0) return "0°";
    const abs = Math.abs(v);
    const hemi = isLat ? (v > 0 ? "N" : "S") : v > 0 ? "E" : "W";
    return `${abs}°${hemi}`;
  };

  return (
    <g className="cq-degrees">
      {/* ticks along top and bottom */}
      {lngTicks.map((l) => {
        const x = projection([l, 0])[0];
        return (
          <g key={`tl-${l}`}>
            <line x1={x} y1={PAD - 5} x2={x} y2={PAD - 1.5} className="cq-tick" />
            <line x1={x} y1={H - PAD + 1.5} x2={x} y2={H - PAD + 5} className="cq-tick" />
          </g>
        );
      })}
      {lngs.map((l) => (
        <g key={`lng-${l}`}>
          <text x={projection([l, 0])[0]} y={PAD - 8} textAnchor="middle" className="cq-degree">
            {fmt(l, false)}
          </text>
          <text x={projection([l, 0])[0]} y={H - PAD + 14} textAnchor="middle" className="cq-degree">
            {fmt(l, false)}
          </text>
        </g>
      ))}
      {/* ticks along left and right */}
      {latTicks.map((la) => {
        const y = projection([0, la])[1];
        return (
          <g key={`tl-${la}`}>
            <line x1={PAD - 5} y1={y} x2={PAD - 1.5} y2={y} className="cq-tick" />
            <line x1={W - PAD + 1.5} y1={y} x2={W - PAD + 5} y2={y} className="cq-tick" />
          </g>
        );
      })}
      {lats.map((la) => (
        <g key={`lat-${la}`}>
          <text x={PAD - 10} y={projection([0, la])[1] + 2.5} textAnchor="end" className="cq-degree">
            {fmt(la, true)}
          </text>
          <text x={W - PAD + 12} y={projection([0, la])[1] + 2.5} textAnchor="start" className="cq-degree">
            {fmt(la, true)}
          </text>
        </g>
      ))}
    </g>
  );
}

// The chart frame: double hairline border with corner ticks.
function ChartFrame() {
  return (
    <g className="cq-frame">
      <rect x={PAD - 7} y={PAD - 7} width={W - 2 * (PAD - 7)} height={H - 2 * (PAD - 7)} className="cq-frame-outer" />
      <rect x={PAD - 3} y={PAD - 3} width={W - 2 * (PAD - 3)} height={H - 2 * (PAD - 3)} className="cq-frame-inner" />
    </g>
  );
}

export default function WorldMap({ latlng, label, highlight, size = "auto", className = "" }) {
  // A chosen country, highlighted gold on the chart.
  const hlIndex = highlight
    ? countries.findIndex((f) => matchesName(f.properties && f.properties.name, highlight))
    : -1;

  const marker = latlng
    ? (() => {
        const [x, y] = projection([latlng[1], latlng[0]]);
        return (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
          >
            <span
              className="block h-[7px] w-[7px] rounded-full bg-cq-primary ring-2 ring-white/90 shadow"
              title={label}
            />
          </div>
        );
      })()
    : null;

  return (
    <div className={`w-full ${className}`} style={size === "tall" ? { aspectRatio: `${W}/${H}` } : undefined}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto w-full"
          role="img"
          aria-label="Vintage nautical chart of the world"
        >
          <defs>
            <clipPath id="cq-map-clip">
              <rect x={0} y={0} width={W} height={H} />
            </clipPath>
          </defs>

          {/* aged sea */}
          <rect x={0} y={0} width={W} height={H} className="cq-sea" />

          {/* graticule */}
          <g className="cq-graticule">
            <path d={path(geoGraticule10())} />
          </g>

          {/* rhumb lines, clipped to the canvas */}
          <g clipPath="url(#cq-map-clip)">
            <RhumbLines />
          </g>

          {/* real country outlines */}
          <g>
            {countries.map((f) => (
              <path
                key={f.id}
                d={path(f)}
                className={hlIndex >= 0 && f.id === countries[hlIndex].id ? "cq-land cq-land-hl" : "cq-land"}
              />
            ))}
          </g>

          {/* chart border + degree ticks */}
          <DegreeBorder />
          <ChartFrame />
          <CompassRose cx={W - 62} cy={H - 58} r={24} />
        </svg>

        {/* age stains + vignette over the whole chart */}
        <div className="cq-map-age pointer-events-none absolute inset-0" />

        {marker}
      </div>
    </div>
  );
}

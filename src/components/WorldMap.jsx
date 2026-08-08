import { useState } from "react";

// A decorative, keyless world map in three theme-coloured styles. Each page
// load picks one at random. Optionally shows a marker at a country's latlng
// (equirectangular projection → x,y) to indicate where it is in the world.
//
// Styles:
//   "solid"   – a themed world silhouette.
//   "dotted"  – abstract dotted-continent pattern.
//   "vignette"– a compass/globe illustration.
//
// Props:
//   latlng   - [lat, lng] to place a marker (optional).
//   label    - name shown next to the marker (optional).
//   className- extra wrapper classes.

const W = 200;
const H = 100;

// Map a lat/lng to SVG x/y on an equirectangular projection.
function project(lat, lng) {
  const x = (lng + 180) / 360 * W;
  const y = (90 - lat) / 180 * H;
  return { x: Math.max(0, Math.min(W, x)), y: Math.max(0, Math.min(H, y)) };
}

// A simplified, recognisable world-map path (equirectangular-ish, public-domain
// style). Covers the main land masses so the silhouette reads as a world map.
const WORLD_PATH =
  "M5 38 C 12 32 16 34 22 36 C 28 34 32 30 34 25 C 42 26 46 32 44 37 " +
  "C 50 40 54 36 58 33 C 62 24 58 18 60 12 C 66 16 70 20 66 26 " +
  "C 76 30 86 28 88 34 C 96 34 100 40 96 46 C 100 52 94 58 86 60 " +
  "C 84 68 92 74 86 80 C 78 78 74 72 70 68 C 66 72 60 76 54 74 " +
  "C 50 80 44 84 38 82 C 34 78 36 72 34 66 C 28 62 22 62 18 56 " +
  "C 12 56 6 52 4 46 C 6 42 4 40 5 38 Z " +
  "M 104 26 C 112 22 118 24 124 30 C 132 28 138 32 140 38 C 148 40 152 46 150 52 " +
  "C 156 56 154 62 146 64 C 144 70 138 72 132 70 C 126 74 120 74 116 70 " +
  "C 110 72 104 72 102 66 C 100 60 100 52 96 46 C 96 40 102 34 104 26 Z " +
  "M 152 16 C 156 12 162 12 166 16 C 168 22 168 28 164 34 C 158 38 152 36 150 30 " +
  "C 150 24 152 18 152 16 Z " +
  "M 180 30 C 184 30 186 32 186 34 C 186 38 184 40 180 40 C 176 40 174 38 174 34 " +
  "C 174 32 176 30 180 30 Z " +
  "M 170 50 C 172 50 174 52 174 54 C 174 56 172 58 170 58 C 168 58 166 56 166 54 " +
  "C 166 52 168 50 170 50 Z";

// Dense continent "dots" for the dotted style (x,y pairs, 0-200 x 0-100).
const DOT_POINTS = [
  // North America / Greenland
  [30,22],[34,18],[38,20],[42,24],[40,29],[34,26],[28,26],[36,16],[44,26],[46,30],
  // Central America
  [52,40],[54,44],[56,48],
  // South America
  [52,52],[56,55],[60,52],[58,60],[56,66],[54,72],[52,62],[58,70],[60,58],
  // Europe / Britain / Scandinavia
  [72,18],[76,20],[80,18],[84,22],[80,26],[76,16],[82,16],[78,28],[86,30],
  // Africa
  [80,40],[84,42],[88,40],[86,48],[84,56],[80,52],[90,46],[82,60],[88,34],[84,34],[76,44],
  // Middle East / India
  [96,38],[98,42],[102,40],[100,46],[104,48],[108,46],[104,52],
  // SE Asia / Indonesian arc
  [112,50],[116,50],[118,56],[122,54],[128,52],[126,58],[132,56],
  // Australia / NZ
  [140,66],[146,64],[148,70],[142,72],[138,68],[152,66],[150,72],[156,70],[155,75],
  // NE Asia / Japan / Siberia
  [120,24],[124,28],[126,32],[120,30],[130,30],[128,26],
];

// The three named styles.
function SolidMap({ marker }) {
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="World map">
        <circle cx={W / 2} cy={H / 2} r={46} fill="none" stroke="#e6dccb" strokeWidth="0.5" opacity="0.6" />
        <path d={WORLD_PATH} fill="currentColor" opacity="0.85" />
      </svg>
      {marker}
    </div>
  );
}

function DottedMap({ marker }) {
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="World map (dotted)">
        <circle cx={W / 2} cy={H / 2} r={46} fill="none" stroke="#e6dccb" strokeWidth="0.5" opacity="0.6" />
        {DOT_POINTS.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.1" fill="currentColor" opacity="0.9" />
        ))}
      </svg>
      {marker}
    </div>
  );
}

function VignetteMap({ marker }) {
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Globe illustration">
        <defs>
          <radialGradient id="globe-shade" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        <circle cx={W / 2} cy={H / 2} r={40} fill="url(#globe-shade)" />
        <circle cx={W / 2} cy={H / 2} r={40} fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        {/* latitude / longitude graticule */}
        <ellipse cx={W / 2} cy={H / 2} rx={40} ry={16} fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
        <ellipse cx={W / 2} cy={H / 2} rx={26} ry={40} fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
        <path d={WORLD_PATH} fill="currentColor" opacity="0.25" />
      </svg>
      {marker}
    </div>
  );
}

export default function WorldMap({ latlng, label, className = "" }) {
  // Pick a style once per mount (random on each page load).
  const [style] = useState(() => {
    const opts = ["solid", "dotted", "vignette"];
    return opts[Math.floor(Math.random() * opts.length)];
  });

  const marker = latlng
    ? (() => {
        const { x, y } = project(latlng[0], latlng[1]);
        return (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
          >
            <span
              className="block h-2.5 w-2.5 rounded-full bg-cq-primary ring-2 ring-white/80 shadow"
              title={label}
            />
          </div>
        );
      })()
    : null;

  const inner = {
    solid: <SolidMap marker={marker} />,
    dotted: <DottedMap marker={marker} />,
    vignette: <VignetteMap marker={marker} />,
  }[style];

  const colour =
    style === "vignette"
      ? "text-cq-secondary dark:text-cq-darkRing"
      : "text-cq-primary/80 dark:text-cq-ring/80";

  return <div className={`w-full ${colour} ${className}`}>{inner}</div>;
}

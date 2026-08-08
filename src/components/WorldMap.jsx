import { useState } from "react";

// A decorative, keyless world map drawn as a nautical chart. Each page load
// may pick one of two treatments — a hand-inked "nautical chart" or a spare
// "dotted" choropleth — both using accurate equirectangular land shapes so it
// actually reads as the world. Optionally shows a marker at a country's latlng
// (equirectangular projection → x,y) to indicate where it is in the world.
//
// Props:
//   latlng   - [lat, lng] to place a marker (optional).
//   label    - name shown next to the marker (optional).
//   size     - "auto" (fills width; default) or "tall" (fills the right column).
//   className- extra wrapper classes.

const W = 200;
const H = 100;
const SEA_STEP = 8; // ~15° longitude spacing for the meridian graticule

// Map a lat/lng to SVG x/y on an equirectangular projection.
function project(lat, lng) {
  const x = (lng + 180) / 360 * W;
  const y = (90 - lat) / 180 * H;
  return { x: Math.max(0, Math.min(W, x)), y: Math.max(0, Math.min(H, y)) };
}

// Realistic equirectangular land mask (0-200 x 0-100). Several closed sub-paths
// per continent so the silhouette is recognisably the real world.
const CONTINENTS = [
  // ---- North America + Central America ----
  "M7 14 C3 16 2 21 4 27 C5 32 7 36 8 42 C8 47 6 52 8 56 " +
  "C9 60 10 55 11 50 C12 46 12 42 13 38 C15 42 17 44 18 49 " +
  "C20 53 21 58 23 63 C22 67 21 69 23 70 C26 69 28 66 28 61 " +
  "C27 56 26 51 27 46 C29 42 31 40 34 39 C37 38 40 39 42 42 " +
  "C45 46 47 50 49 52 C52 49 54 45 57 43 C59 40 62 40 65 42 " +
  "C66 38 63 34 63 31 C63 27 65 24 68 22 C71 20 75 21 77 24 " +
  "C81 28 84 30 88 30 C90 26 90 22 92 19 C94 15 97 13 100 13 " +
  "C100 11 96 10 93 9 C90 8 88 6 87 3 C84 2 80 2 77 3 C74 6 71 8 67 9 " +
  "C62 10 57 10 53 9 C49 8 46 6 44 3 C40 2 36 2 33 3 " +
  "C30 6 28 9 25 12 C21 10 18 9 15 11 C12 13 9 13 7 14 Z",
  // Greenland
  "M52 3 C55 2 59 2 62 3 C64 5 63 7 61 9 C59 11 55 12 53 10 C51 8 51 5 52 3 Z",

  // ---- South America ----
  "M57 44 C60 42 64 42 68 44 C71 46 73 48 76 50 " +
  "C76 46 74 43 74 40 C75 37 77 35 81 34 C83 37 84 41 84 45 " +
  "C87 48 88 52 88 56 C88 60 85 63 83 67 C82 71 80 74 80 77 " +
  "C78 80 74 82 73 85 C71 86 69 86 68 85 C67 88 66 89 65 88 " +
  "C63 85 63 82 63 79 C61 77 59 75 59 72 C57 68 56 64 55 60 " +
  "C55 54 55 49 57 44 Z",

  // ---- Europe ----
  "M96 19 C94 17 92 14 94 12 C96 10 99 11 101 13 " +
  "C104 10 107 9 110 11 C113 12 115 14 118 13 " +
  "C121 12 124 13 127 15 C129 18 128 21 125 23 " +
  "C122 25 119 24 117 22 C115 24 113 25 112 28 " +
  "C110 26 108 24 105 23 C103 25 101 27 99 28 " +
  "C96 27 94 26 92 24 C91 22 93 20 96 19 Z",

  // ---- Africa ----
  "M99 22 C103 21 106 23 108 26 C110 24 112 24 114 25 " +
  "C117 26 118 29 117 32 C120 33 121 37 120 40 " +
  "C123 42 124 46 122 50 C124 53 123 57 120 60 " +
  "C119 63 117 66 114 68 C112 68 111 66 111 64 " +
  "C108 66 106 67 104 66 C101 64 101 61 100 59 " +
  "C97 60 95 59 94 56 C92 54 93 51 95 50 " +
  "C93 46 93 43 95 40 C94 37 95 34 97 32 C96 28 97 25 99 22 Z",

  // ---- Asia (Middle East, India, Siberia, SE Asia, China, Japan) ----
  "M115 14 C118 13 121 14 124 16 C126 14 128 12 131 12 " +
  "C135 12 138 14 141 16 C144 18 143 22 140 24 " +
  "C139 25 137 24 136 22 C135 26 136 30 135 33 " +
  "C137 35 140 36 140 40 C140 43 138 45 135 46 " +
  "C134 49 132 52 129 54 C126 53 124 50 124 47 " +
  "C122 49 121 52 119 54 C117 53 116 51 116 48 " +
  "C114 50 113 53 112 55 C109 54 108 51 109 48 " +
  "C108 46 106 44 105 41 C104 38 105 35 107 33 " +
  "C106 29 106 25 108 21 C106 18 104 16 103 14 " +
  "C106 14 111 14 115 14 Z " +
  "M143 17 C145 15 148 14 151 14 C153 17 153 20 151 22 " +
  "C148 16 145 16 143 17 Z", // Japan (small island arc)

  // ---- Oceania (Australia + NZ) ----
  "M158 55 C162 54 166 55 169 57 C172 59 173 62 172 65 " +
  "C171 68 168 70 166 71 C165 68 165 66 163 64 " +
  "C161 62 159 61 157 60 C155 58 156 56 158 55 Z " +
  "M176 64 C178 64 180 65 180 67 C180 69 178 70 176 70 C174 70 173 68 174 66 Z",
];

// Dense continent "dots" for the dotted style (x,y pairs sampled from the land)
const DOT_POINTS = [
  // North America / Greenland
  [10,20],[14,16],[20,14],[24,18],[22,24],[18,28],[12,26],[16,22],[28,22],[34,18],[38,20],[36,26],[42,30],[46,34],[48,26],[44,22],
  // Central America
  [52,40],[54,44],[56,47],
  // South America
  [60,45],[66,46],[70,50],[74,52],[78,50],[80,55],[80,60],[78,66],[74,72],[72,78],[68,78],[66,72],[64,66],[62,58],[60,52],
  // Europe
  [96,20],[99,23],[103,22],[107,24],[109,22],[113,21],[117,20],[120,23],[124,22],
  // Africa
  [100,25],[105,25],[110,24],[115,25],[118,30],[118,35],[124,37],[123,42],[121,48],[119,58],[116,62],[111,62],[108,60],[105,62],[102,58],[100,52],[103,55],
  // Asia / Middle East / India
  [118,22],[121,24],[124,24],[129,24],[133,22],[138,22],[143,20],[143,26],[140,30],[135,32],[137,40],[133,42],[130,46],[128,52],[123,48],[130,28],[135,26],
  // SE Asia / Japan
  [114,52],[120,52],[126,50],[111,50],[116,48],
  // Australia / NZ
  [162,58],[166,60],[168,64],[166,68],[162,68],[159,64],[158,60],[175,66],[178,67],
];

// ----- Nautical decoration helpers -----

// Meridian (longitude) graticule lines.
function Meridians() {
  const lines = [];
  for (let x = SEA_STEP; x < W; x += SEA_STEP) {
    lines.push(<line key={`m${x}`} x1={x} y1={0} x2={x} y2={H} />);
  }
  return <g className="cq-graticule">{lines}</g>;
}

// Parallel (latitude) graticule lines.
function Parallels() {
  const lines = [];
  for (let y = 11; y < H; y += 11.11) {
    lines.push(<line key={`p${y}`} x1={0} y1={y} x2={W} y2={y} />);
  }
  return <g className="cq-graticule">{lines}</g>;
}

// Rhumb lines radiating from a couple of "compass points" (classic portolan
// feature) plus the equator/edge ticks.
function RhumbLines() {
  const points = [
    [52, 40],
    [120, 46],
    [150, 32],
  ];
  const segs = [];
  points.forEach(([cx, cy], i) => {
    for (let a = 0; a < 360; a += 30) {
      const rad = (a * Math.PI) / 180;
      const R = Math.max(W, H) * 1.4;
      const x = cx + Math.cos(rad) * R;
      const y = cy + Math.sin(rad) * R;
      segs.push(
        <line
          key={`${i}-${a}`}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          className="cq-rhumb"
        />
      );
    }
  });
  return <g className="cq-graticule">{segs}</g>;
}

// A compass rose drawn in the lower-left corner.
function CompassRose() {
  const cx = 22;
  const cy = 84;
  return (
    <g className="cq-compass">
      {[0, 90, 180, 270].map((ang, i) => {
        const r = ang * (Math.PI / 180);
        const x2 = cx + Math.sin(r) * 12;
        const y2 = cy - Math.cos(r) * 12;
        const x4 = cx + Math.sin(r) * 17;
        const y4 = cy - Math.cos(r) * 17;
        return (
          <g key={ang}>
            <path d={`M${cx} ${cy} L${x2} ${y2} L${x4} ${y4}`} className="cq-compass-petal" />
            <text
              x={x4 + Math.sin(r) * 3}
              y={y4 - Math.cos(r) * 3 + 1.5}
              className="cq-compass-n"
              textAnchor="middle"
            >
              {["N", "E", "S", "W"][i]}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Drawing of the land mass (kept as one group so it can be filled once).
function Land() {
  return (
    <g>
      {CONTINENTS.map((d, i) => (
        <path key={i} d={d} className="cq-land" />
      ))}
    </g>
  );
}

// The primary nautical chart.
function NauticalChart({ marker, style }) {
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        role="img"
        aria-label="Nautical chart of the world"
      >
        {style === "chart" && (
          <>
            <rect x="0" y="0" width={W} height={H} className="cq-sea" />
            <Meridians />
            <Parallels />
            <RhumbLines />
            <Land />
            <CompassRose />
            <g className="cq-frame">
              <rect x="1" y="1" width={W - 2} height={H - 2} fill="none" />
              <rect x="2.5" y="2.5" width={W - 5} height={H - 5} fill="none" />
            </g>
          </>
        )}
        {style === "dotted" && (
          <>
            <circle cx={W / 2} cy={H / 2} r={46} fill="none" strokeWidth="0.4" opacity="0.5" />
            {DOT_POINTS.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="1" className="cq-land" />
            ))}
          </>
        )}
      </svg>
      {marker}
    </div>
  );
}

export default function WorldMap({ latlng, label, size = "auto", className = "" }) {
  // Pick a treatment once per mount (random on each page load).
  const [style] = useState(() =>
    Math.random() < 0.5 ? "chart" : "dotted"
  );

  const marker = latlng
    ? (() => {
        const { x, y } = project(latlng[0], latlng[1]);
        return (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
          >
            <span
              className="block h-3 w-3 rounded-full bg-cq-primary shadow ring-2 ring-white/90"
              title={label}
            />
          </div>
        );
      })()
    : null;

  const colour =
    style === "chart"
      ? "text-cq-primary dark:text-cq-darkRing"
      : "text-cq-secondary/90 dark:text-cq-darkMuted";

  return (
    <div
      className={`w-full ${colour} ${className}`}
      style={size === "tall" ? { aspectRatio: `${W}/${H}` } : undefined}
    >
      <NauticalChart marker={marker} style={style} />
    </div>
  );
}

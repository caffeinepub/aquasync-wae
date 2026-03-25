import { motion } from "motion/react";

interface TDSZone {
  min: number;
  max: number | null;
  label: string;
  color: string;
  bgColor: string;
  weight: number;
}

const TDS_ZONES: TDSZone[] = [
  {
    min: 0,
    max: 50,
    label: "Error",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.7)",
    weight: 1,
  },
  {
    min: 50,
    max: 150,
    label: "Excellent",
    color: "#22D3EE",
    bgColor: "rgba(34,211,238,0.8)",
    weight: 3,
  },
  {
    min: 150,
    max: 300,
    label: "Good",
    color: "#818CF8",
    bgColor: "rgba(129,140,248,0.8)",
    weight: 4,
  },
  {
    min: 300,
    max: null,
    label: "Service Required",
    color: "#FB7185",
    bgColor: "rgba(251,113,133,0.8)",
    weight: 1,
  },
];

const TOTAL_WEIGHT = TDS_ZONES.reduce((s, z) => s + z.weight, 0);
const MAX_DISPLAY_TDS = 500;

function getTDSZone(tds: number): TDSZone {
  for (const zone of TDS_ZONES) {
    if (zone.max === null || tds < zone.max) return zone;
  }
  return TDS_ZONES[TDS_ZONES.length - 1];
}

function tdsToBarPosition(tds: number): number {
  const clamped = Math.min(tds, MAX_DISPLAY_TDS);
  let acc = 0;
  for (const zone of TDS_ZONES) {
    const end = zone.max ?? MAX_DISPLAY_TDS;
    const start = zone.min;
    const zoneSpan = end - start;
    const barSpan = zone.weight / TOTAL_WEIGHT;
    if (clamped <= end) {
      const fraction = (clamped - start) / zoneSpan;
      return acc + fraction * barSpan;
    }
    acc += barSpan;
  }
  return 1;
}

export function TDSPurificationLevel({ tds }: { tds: number }) {
  const zone = getTDSZone(tds);
  const pointerPos = tdsToBarPosition(tds);

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      data-ocid="dashboard.tds_level.card"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">💧</span>
          <span className="text-sm font-semibold text-white">
            TDS Purification Level
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={tds}
            className="text-2xl font-bold leading-none"
            style={{ color: zone.color }}
            initial={{ opacity: 0.4, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            {tds}
          </motion.span>
          <span className="text-xs font-medium" style={{ color: "#A7B2C6" }}>
            ppm
          </span>
        </div>
      </div>

      {/* Quality label badge */}
      <div className="flex items-center gap-2 mb-4">
        <motion.span
          key={zone.label}
          className="px-3 py-1 rounded-full text-xs font-bold tracking-wide"
          style={{
            background: `${zone.color}22`,
            border: `1px solid ${zone.color}55`,
            color: zone.color,
          }}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {zone.label}
        </motion.span>
        <span className="text-xs" style={{ color: "#A7B2C6" }}>
          {tds >= 300
            ? "High TDS — maintenance needed"
            : tds >= 150
              ? "Suitable for drinking"
              : tds >= 50
                ? "Ideal range"
                : "Sensor error or no signal"}
        </span>
      </div>

      {/* Color bar */}
      <div className="relative mb-3">
        <div
          className="flex h-3 rounded-full overflow-hidden w-full"
          style={{ gap: "2px" }}
        >
          {TDS_ZONES.map((z) => (
            <div
              key={z.label}
              className="h-full"
              style={{
                flex: z.weight,
                background: z.bgColor,
                opacity: 0.85,
              }}
            />
          ))}
        </div>

        {/* Pointer */}
        <motion.div
          className="absolute -top-1"
          animate={{ left: `calc(${pointerPos * 100}% - 6px)` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <div className="w-3 h-5 flex flex-col items-center">
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `6px solid ${zone.color}`,
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Zone labels */}
      <div className="flex w-full mb-3" style={{ gap: "2px" }}>
        {TDS_ZONES.map((z) => (
          <div key={z.label} className="text-center" style={{ flex: z.weight }}>
            <span
              className="text-[9px] font-medium leading-none"
              style={{
                color:
                  zone.label === z.label ? z.color : "rgba(167,178,198,0.5)",
                fontWeight: zone.label === z.label ? 700 : 400,
              }}
            >
              {z.label}
            </span>
          </div>
        ))}
      </div>

      {/* Reference note */}
      <div
        className="flex items-center gap-1.5 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="text-[10px]"
          style={{ color: "rgba(167,178,198,0.6)" }}
        >
          ℹ️
        </span>
        <span
          className="text-[10px]"
          style={{ color: "rgba(167,178,198,0.6)" }}
        >
          Optimal: 75–150 ppm&nbsp;·&nbsp;BIS Limit: 300 ppm&nbsp;·&nbsp;RO
          Ideal: 75–150 ppm
        </span>
      </div>
    </motion.div>
  );
}

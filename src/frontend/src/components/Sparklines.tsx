import { motion } from "motion/react";
import { getWaterInsight } from "../lib/insights";

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

function Sparkline({ data, color, width = 200, height = 48 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height * 0.85 - height * 0.075,
  }));

  // Build smooth cubic bezier path
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Area fill path
  const last = points[points.length - 1];
  const fillPath = `${d} L ${last.x},${height} L ${points[0].x},${height} Z`;
  const colorKey = color.replace("#", "");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fill-${colorKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={fillPath} fill={`url(#fill-${colorKey})`} />
      {/* Line */}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
      {/* Latest value dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </svg>
  );
}

interface SparklinesProps {
  tds: number;
  ph: number;
  tdsHistory: number[];
  phHistory: number[];
}

export function Sparklines({
  tds,
  ph,
  tdsHistory,
  phHistory,
}: SparklinesProps) {
  const insight = getWaterInsight(tds, ph);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* TDS Card */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: "#A7B2C6" }}>
            TDS
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: "rgba(34,211,238,0.12)",
              color: "#22D3EE",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            PPM
          </span>
        </div>
        <div className="text-3xl font-bold text-white leading-none mb-1">
          {tds}
          <span
            className="text-sm font-medium ml-1"
            style={{ color: "#A7B2C6" }}
          >
            ppm
          </span>
        </div>
        <div className="mt-2 mb-1">
          <Sparkline data={tdsHistory} color="#22D3EE" height={44} />
        </div>
        <p className="text-[11px] font-medium" style={{ color: "#22D3EE" }}>
          {insight.tdsLabel}
        </p>
      </motion.div>

      {/* pH Card */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: "#A7B2C6" }}>
            pH Level
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: "rgba(52,211,153,0.12)",
              color: "#34D399",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            pH
          </span>
        </div>
        <div className="text-3xl font-bold text-white leading-none mb-1">
          {ph}
          <span
            className="text-sm font-medium ml-1"
            style={{ color: "#A7B2C6" }}
          >
            pH
          </span>
        </div>
        <div className="mt-2 mb-1">
          <Sparkline data={phHistory} color="#34D399" height={44} />
        </div>
        <p className="text-[11px] font-medium" style={{ color: "#34D399" }}>
          {insight.phLabel}
        </p>
      </motion.div>
    </div>
  );
}

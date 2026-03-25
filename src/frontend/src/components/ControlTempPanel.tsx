import { AnimatePresence, motion } from "motion/react";
import type { Mode } from "../types/dispenser";

const MODE_CONFIG: Record<
  Mode,
  { emoji: string; label: string; color: string; rgb: string }
> = {
  COLD: {
    emoji: "❄️",
    label: "Cold Water",
    color: "#22D3EE",
    rgb: "34,211,238",
  },
  AMBIENT: {
    emoji: "🌿",
    label: "Ambient",
    color: "#34D399",
    rgb: "52,211,153",
  },
  HOT: {
    emoji: "🔥",
    label: "Hot Water",
    color: "#FB7185",
    rgb: "251,113,133",
  },
};

interface ControlTempPanelProps {
  mode: Mode;
  isDispensing: boolean;
  dispenseProgress: number;
  liveTemp: number;
  btSensorActive?: boolean;
}

export function ControlTempPanel({
  mode,
  isDispensing,
  dispenseProgress,
  liveTemp,
  btSensorActive = false,
}: ControlTempPanelProps) {
  const cfg = MODE_CONFIG[mode];

  return (
    <AnimatePresence>
      {isDispensing && (
        <motion.div
          key="control-temp-panel"
          className="glass-card p-4 mt-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          data-ocid="control.temp_panel.card"
          style={{
            boxShadow: `0 0 24px rgba(${cfg.rgb},0.15)`,
            border: `1px solid rgba(${cfg.rgb},0.25)`,
          }}
        >
          {/* Dispensing banner */}
          <div
            className="flex items-center justify-center gap-2 mb-3 py-2 rounded-xl"
            style={{
              background: `rgba(${cfg.rgb},0.1)`,
              border: `1px solid rgba(${cfg.rgb},0.3)`,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
              className="text-sm font-semibold"
              style={{ color: cfg.color }}
            >
              💧 Dispensing {cfg.label}...
            </motion.span>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-1.5 rounded-full mb-5 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: cfg.color, width: `${dispenseProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Single selected-mode temperature display */}
          <div className="flex flex-col items-center py-4">
            <motion.span
              className="text-4xl mb-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2.5,
                ease: "easeInOut",
              }}
            >
              {cfg.emoji}
            </motion.span>

            <motion.p
              key={liveTemp}
              initial={{ opacity: 0.6, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold leading-none mb-1"
              style={{ color: cfg.color }}
            >
              {liveTemp.toFixed(1)}°C
            </motion.p>

            <p
              className="text-xs font-medium mb-3"
              style={{ color: "#A7B2C6" }}
            >
              {cfg.label}
            </p>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <motion.span
                className="w-2 h-2 rounded-full block"
                style={{ background: "#34D399" }}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
              />
              <span
                className="text-[11px] font-semibold"
                style={{ color: "#34D399" }}
              >
                {btSensorActive ? "Live from BT Sensor" : "Live"}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

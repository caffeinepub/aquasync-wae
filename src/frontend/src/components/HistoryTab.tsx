import { AnimatePresence, motion } from "motion/react";
import type { DispenseLog } from "../types/dispenser";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

const MODE_CONFIG = {
  HOT: {
    color: "#FB7185",
    bg: "rgba(251,113,133,0.12)",
    border: "rgba(251,113,133,0.25)",
    icon: "🔥",
    label: "Hot",
  },
  COLD: {
    color: "#22D3EE",
    bg: "rgba(34,211,238,0.12)",
    border: "rgba(34,211,238,0.25)",
    icon: "❄️",
    label: "Cold",
  },
  AMBIENT: {
    color: "#34D399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    icon: "💧",
    label: "Ambient",
  },
};

interface HistoryTabProps {
  logs: DispenseLog[];
}

export function HistoryTab({ logs }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Dispense History</h2>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            background: "rgba(34,211,238,0.1)",
            color: "#22D3EE",
            border: "1px solid rgba(34,211,238,0.2)",
          }}
        >
          {logs.length} events
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {logs.length === 0 ? (
          <motion.div
            key="empty"
            data-ocid="history.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-10 flex flex-col items-center justify-center gap-3"
          >
            <span className="text-5xl">🌊</span>
            <p className="text-white font-semibold">No dispense events yet</p>
            <p className="text-sm" style={{ color: "#A7B2C6" }}>
              Your dispense history will appear here.
            </p>
          </motion.div>
        ) : (
          logs.map((log, idx) => {
            const cfg = MODE_CONFIG[log.mode];
            return (
              <motion.div
                key={log.timestamp}
                data-ocid={`history.item.${idx + 1}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                {/* Mode icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {cfg.icon}
                </div>

                {/* Center info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {log.volume}ml
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#A7B2C6" }}>
                    {timeAgo(log.timestamp)}
                  </p>
                </div>

                {/* Right: TDS/pH */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs" style={{ color: "#22D3EE" }}>
                    TDS: {log.tds} ppm
                  </div>
                  <div className="text-xs" style={{ color: "#34D399" }}>
                    pH: {log.ph}
                  </div>
                  <div
                    className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full"
                    style={{
                      background:
                        log.connectionMode === "bluetooth"
                          ? "rgba(34,211,238,0.1)"
                          : "rgba(234,179,8,0.1)",
                      color:
                        log.connectionMode === "bluetooth"
                          ? "#22D3EE"
                          : "#FBBF24",
                      border: `1px solid ${log.connectionMode === "bluetooth" ? "rgba(34,211,238,0.2)" : "rgba(234,179,8,0.2)"}`,
                    }}
                  >
                    {log.connectionMode === "bluetooth" ? "BT" : "SIM"}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}

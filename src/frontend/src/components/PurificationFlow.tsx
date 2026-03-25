import { motion } from "motion/react";

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  status: string;
  color: string;
  borderColor: string;
  glowColor: string;
  dotColor: string;
  icon: React.ReactNode;
}

const stages: Stage[] = [
  {
    id: "pre-filter",
    label: "Pre-Filter",
    sublabel: "Sediment removal",
    status: "Active",
    color: "#22D3EE",
    borderColor: "rgba(34,211,238,0.4)",
    glowColor: "rgba(34,211,238,0.15)",
    dotColor: "#22D3EE",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="1.8"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "carbon",
    label: "Carbon Block",
    sublabel: "Chlorine removal",
    status: "Filtering",
    color: "#2EE6FF",
    borderColor: "rgba(46,230,255,0.38)",
    glowColor: "rgba(46,230,255,0.12)",
    dotColor: "#2EE6FF",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2EE6FF"
        strokeWidth="1.8"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
  },
  {
    id: "ro",
    label: "RO Membrane",
    sublabel: "99.9% TDS removal",
    status: "Purifying",
    color: "#34D399",
    borderColor: "rgba(52,211,153,0.4)",
    glowColor: "rgba(52,211,153,0.15)",
    dotColor: "#34D399",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#34D399"
        strokeWidth="1.8"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "uv",
    label: "UV Sterilization",
    sublabel: "Pathogen elimination",
    status: "Sterilizing",
    color: "#FB7185",
    borderColor: "rgba(251,113,133,0.4)",
    glowColor: "rgba(251,113,133,0.15)",
    dotColor: "#FB7185",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FB7185"
        strokeWidth="1.8"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
];

export function PurificationFlow() {
  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-base font-semibold text-white">
          Water Purification Flow
        </span>
        <span
          className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(34,211,238,0.12)",
            color: "#22D3EE",
            border: "1px solid rgba(34,211,238,0.25)",
          }}
        >
          All Stages Active
        </span>
      </div>

      {/* Stages row — 2x2 on mobile, 4 columns on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
        {stages.map((stage, idx) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative flex flex-col items-center rounded-2xl p-3 sm:p-4"
            style={{
              background: stage.glowColor,
              border: `1px solid ${stage.borderColor}`,
              boxShadow: `0 0 18px ${stage.glowColor}`,
            }}
          >
            {/* Connector arrow (not on last) */}
            {idx < stages.length - 1 && (
              <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <svg
                  width="20"
                  height="10"
                  viewBox="0 0 20 10"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id={`arrow-grad-${idx}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        stopColor={stage.color}
                        stopOpacity="0.8"
                      />
                      <stop
                        offset="100%"
                        stopColor={stages[idx + 1].color}
                        stopOpacity="0.8"
                      />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0"
                    y1="5"
                    x2="14"
                    y2="5"
                    stroke={`url(#arrow-grad-${idx})`}
                    strokeWidth="2"
                    strokeDasharray="3 2"
                    style={{ animation: "flowTravel 1.5s linear infinite" }}
                  />
                  <polygon
                    points="14,2 20,5 14,8"
                    fill={stages[idx + 1].color}
                    opacity="0.9"
                  />
                </svg>
              </div>
            )}

            {/* Icon */}
            <div className="mb-2">{stage.icon}</div>

            {/* Label */}
            <span className="text-xs font-semibold text-white text-center leading-tight">
              {stage.label}
            </span>
            <span
              className="text-[10px] mt-0.5 text-center"
              style={{ color: "#A7B2C6" }}
            >
              {stage.sublabel}
            </span>

            {/* Status dot */}
            <div className="flex items-center gap-1 mt-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: stage.dotColor,
                  boxShadow: `0 0 6px ${stage.dotColor}`,
                  animation: "pulseGlow 2s ease-in-out infinite",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: stage.dotColor }}
              >
                {stage.status}
              </span>
            </div>

            {/* Animated water fill bar */}
            <div
              className="w-full h-1 rounded-full mt-2 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})`,
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1.8 + idx * 0.3,
                  ease: "linear",
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

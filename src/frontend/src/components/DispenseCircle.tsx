import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import type { Mode, Volume } from "../types/dispenser";

interface DispenseCircleProps {
  mode: Mode;
  volume: Volume;
  isHotLocked: boolean;
  hotUnlockProgress: number;
  hotRelockCountdown: number;
  isDispensing: boolean;
  dispenseProgress: number;
  onSetMode: (m: Mode) => void;
  onSetVolume: (v: Volume) => void;
  onStartHotUnlock: () => void;
  onCancelHotUnlock: () => void;
  onStartDispense: () => void;
  onStopDispense: () => void;
}

const MODES: {
  id: Mode;
  label: string;
  color: string;
  bg: string;
  icon: string;
}[] = [
  {
    id: "HOT",
    label: "HOT",
    color: "#FB7185",
    bg: "rgba(251,113,133,0.15)",
    icon: "🔥",
  },
  {
    id: "COLD",
    label: "COLD",
    color: "#22D3EE",
    bg: "rgba(34,211,238,0.15)",
    icon: "❄️",
  },
  {
    id: "AMBIENT",
    label: "AMBIENT",
    color: "#34D399",
    bg: "rgba(52,211,153,0.15)",
    icon: "💧",
  },
];

const VOLUMES: Volume[] = [150, 300, 500, 1000];

const SIZE = 260;
const R = 110;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function DispenseCircle({
  mode,
  volume,
  isHotLocked,
  hotUnlockProgress,
  hotRelockCountdown,
  isDispensing,
  dispenseProgress,
  onSetMode,
  onSetVolume,
  onStartHotUnlock,
  onCancelHotUnlock,
  onStartDispense,
  onStopDispense,
}: DispenseCircleProps) {
  const holdActive = useRef(false);

  const modeColor = MODES.find((m) => m.id === mode)?.color ?? "#22D3EE";
  const isHotAndLocked = mode === "HOT" && isHotLocked;

  const ringProgress = isHotAndLocked
    ? hotUnlockProgress
    : isDispensing
      ? dispenseProgress
      : 0;

  const dashOffset = CIRCUMFERENCE - (ringProgress / 100) * CIRCUMFERENCE;

  const handlePointerDown = () => {
    if (isHotAndLocked) {
      holdActive.current = true;
      onStartHotUnlock();
    } else if (!isDispensing) {
      onStartDispense();
    }
  };

  const handlePointerUp = () => {
    if (isHotAndLocked && holdActive.current) {
      holdActive.current = false;
      onCancelHotUnlock();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode selector */}
      <div
        className="flex gap-2 p-1 rounded-full"
        style={{
          background: "rgba(10,20,45,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {MODES.map((m) => (
          <button
            type="button"
            key={m.id}
            data-ocid={`dispense.${m.id.toLowerCase()}_tab`}
            onClick={() => onSetMode(m.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={
              mode === m.id
                ? {
                    background: m.bg,
                    color: m.color,
                    border: `1px solid ${m.color}40`,
                    boxShadow: `0 0 12px ${m.color}30`,
                  }
                : { color: "#A7B2C6", border: "1px solid transparent" }
            }
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Main dispense circle */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Subtle rotating outer halo */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${modeColor}00, ${modeColor}30, ${modeColor}00)`,
            animation: "rotateRing 4s linear infinite",
          }}
        />

        {/* SVG progress ring */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          {/* Track ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={modeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.1s linear",
              filter: `drop-shadow(0 0 8px ${modeColor}80)`,
            }}
          />
        </svg>

        {/* Inner glass circle button */}
        <motion.button
          type="button"
          data-ocid="dispense.primary_button"
          className="relative z-10 rounded-full flex flex-col items-center justify-center select-none cursor-pointer"
          style={{
            width: SIZE - 48,
            height: SIZE - 48,
            background: "rgba(10,20,45,0.80)",
            border: `2px solid ${modeColor}40`,
            boxShadow: `0 0 30px ${modeColor}20, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
          whileTap={{ scale: 0.96 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <AnimatePresence mode="wait">
            {isHotAndLocked ? (
              <motion.div
                key="locked"
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <span className="text-4xl">🔒</span>
                <span
                  className="text-xs font-medium text-center px-4"
                  style={{ color: "#FB7185" }}
                >
                  Hold to unlock
                </span>
                <span className="text-[10px]" style={{ color: "#A7B2C6" }}>
                  hot water
                </span>
              </motion.div>
            ) : mode === "HOT" && !isHotLocked ? (
              <motion.div
                key="unlocked"
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <span className="text-3xl">🔓</span>
                <span
                  className="text-xl font-bold"
                  style={{ color: "#FB7185" }}
                >
                  {hotRelockCountdown}s
                </span>
                <span className="text-[10px]" style={{ color: "#A7B2C6" }}>
                  tap to dispense
                </span>
              </motion.div>
            ) : isDispensing ? (
              <motion.div
                key="dispensing"
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  className="text-4xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 0.8,
                    ease: "easeInOut",
                  }}
                >
                  💧
                </motion.span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: modeColor }}
                >
                  DISPENSING
                </span>
                <span className="text-xs" style={{ color: "#A7B2C6" }}>
                  {Math.round(dispenseProgress)}%
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.span
                  className="text-4xl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                >
                  💧
                </motion.span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: modeColor }}
                >
                  START DISPENSING
                </span>
                <span className="text-[10px]" style={{ color: "#A7B2C6" }}>
                  {volume}ml · {mode}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Volume selector */}
      <div className="flex gap-2">
        {VOLUMES.map((v) => (
          <button
            type="button"
            key={v}
            data-ocid={`dispense.volume_${v}_button`}
            onClick={() => onSetVolume(v)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={
              volume === v
                ? {
                    background: "rgba(34,211,238,0.2)",
                    color: "#22D3EE",
                    border: "1px solid rgba(34,211,238,0.45)",
                    boxShadow: "0 0 8px rgba(34,211,238,0.2)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    color: "#A7B2C6",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }
            }
          >
            {v}ml
          </button>
        ))}
      </div>

      {/* Stop button (only while dispensing) */}
      <AnimatePresence>
        {isDispensing && (
          <motion.button
            type="button"
            data-ocid="dispense.stop_button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={onStopDispense}
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{
              background: "rgba(251,113,133,0.15)",
              color: "#FB7185",
              border: "1px solid rgba(251,113,133,0.3)",
            }}
          >
            ⛔ Stop Dispense
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

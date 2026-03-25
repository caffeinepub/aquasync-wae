import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ConnectionMode } from "../types/dispenser";
import { PurificationFlow } from "./PurificationFlow";

interface SettingsTabProps {
  userId: string;
  connectionMode: ConnectionMode;
  bluetoothDeviceName?: string;
  simulationLog: string[];
  onConnect: () => void;
  onDisconnect: () => void;
  onClearSimLog: () => void;
  commandInput: string;
  onCommandChange: (v: string) => void;
  onCommandSubmit: () => void;
}

const STATUS_CONFIG: Record<
  ConnectionMode,
  { label: string; color: string; bg: string }
> = {
  bluetooth: {
    label: "Connected",
    color: "#34D399",
    bg: "rgba(52,211,153,0.12)",
  },
  simulation: {
    label: "Simulation Mode",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.12)",
  },
  disconnected: {
    label: "Disconnected",
    color: "#FB7185",
    bg: "rgba(251,113,133,0.12)",
  },
};

export function SettingsTab({
  userId,
  connectionMode,
  bluetoothDeviceName,
  simulationLog,
  onConnect,
  onDisconnect,
  onClearSimLog,
  commandInput,
  onCommandChange,
  onCommandSubmit,
}: SettingsTabProps) {
  const consoleRef = useRef<HTMLDivElement>(null);
  const status = STATUS_CONFIG[connectionMode];

  // Auto-scroll simulation console when log updates
  // biome-ignore lint/correctness/useExhaustiveDependencies: consoleRef is a stable ref, not a reactive value
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [simulationLog]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Settings</h2>

      {/* Purification Flow Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <p
          className="text-xs font-semibold mb-2 flex items-center gap-1.5"
          style={{ color: "#A7B2C6" }}
        >
          <span>💧</span> Water Purification Flow
        </p>
        <PurificationFlow />
      </motion.div>

      {/* Auth Section */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>🔐</span> Authentication
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#34D399", boxShadow: "0 0 6px #34D399" }}
          />
          <span className="text-sm" style={{ color: "#A7B2C6" }}>
            Signed in anonymously
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: "#7F8AA3" }}>
          UID: {userId.slice(0, 16)}…
        </p>
        <button
          type="button"
          data-ocid="settings.google_signin_button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium w-full justify-center transition-all hover:opacity-90"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "white",
          }}
          onClick={() =>
            toast.info("Google Sign-In coming soon!", { icon: "🔜" })
          }
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
        <p
          className="text-[11px] mt-2 text-center"
          style={{ color: "#7F8AA3" }}
        >
          Your data is secured by Firebase Security Rules
        </p>
      </motion.div>

      {/* Hardware Section */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>📡</span> Bluetooth Hardware
        </h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: "#A7B2C6" }}>
            Status
          </span>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.color}30`,
            }}
          >
            {status.label}
          </span>
        </div>
        {connectionMode === "bluetooth" && bluetoothDeviceName && (
          <p className="text-xs mb-3" style={{ color: "#A7B2C6" }}>
            Device: {bluetoothDeviceName}
          </p>
        )}
        <div className="flex gap-2">
          {connectionMode !== "bluetooth" ? (
            <button
              type="button"
              data-ocid="settings.bluetooth_connect_button"
              onClick={onConnect}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "rgba(34,211,238,0.15)",
                color: "#22D3EE",
                border: "1px solid rgba(34,211,238,0.3)",
              }}
            >
              📶 Pair HC-05/HM-10
            </button>
          ) : (
            <button
              type="button"
              data-ocid="settings.bluetooth_disconnect_button"
              onClick={onDisconnect}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "rgba(251,113,133,0.15)",
                color: "#FB7185",
                border: "1px solid rgba(251,113,133,0.3)",
              }}
            >
              Disconnect
            </button>
          )}
        </div>
        <p className="text-[11px] mt-3" style={{ color: "#7F8AA3" }}>
          Pair with HC-05 (classic BT) or HM-10 (BLE) module. Requires Web
          Bluetooth supported browser (Chrome/Edge). AT commands use the UART
          service UUID 0xFFE0.
        </p>
      </motion.div>

      {/* Simulation Console */}
      {(connectionMode === "simulation" || simulationLog.length > 0) && (
        <motion.div
          className="terminal-bg p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          data-ocid="settings.sim_console_panel"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#34D399",
                  animation: "pulseGlow 1s ease-in-out infinite",
                }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: "#34D399" }}
              >
                Virtual Serial Console
              </span>
            </div>
            <button
              type="button"
              data-ocid="settings.clear_console_button"
              onClick={onClearSimLog}
              className="text-[11px] px-2 py-0.5 rounded"
              style={{
                color: "#7F8AA3",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Clear
            </button>
          </div>
          <div
            ref={consoleRef}
            className="overflow-y-auto space-y-0.5"
            style={{ maxHeight: 160 }}
          >
            {simulationLog.length === 0 ? (
              <p className="text-xs" style={{ color: "#7F8AA3" }}>
                No commands sent yet.
              </p>
            ) : (
              simulationLog.map((line, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: log lines are append-only, index is stable
                <p key={i} className="text-xs" style={{ color: "#22D3EE" }}>
                  {line}
                </p>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Keyword Command */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>⌨️</span> Text Command
        </h3>
        <div className="flex gap-2">
          <input
            data-ocid="settings.command_input"
            value={commandInput}
            onChange={(e) => onCommandChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCommandSubmit()}
            placeholder="e.g. cold bottle, hot cup…"
            className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent outline-none"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
            }}
          />
          <button
            type="button"
            data-ocid="settings.command_submit_button"
            onClick={onCommandSubmit}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(34,211,238,0.15)",
              color: "#22D3EE",
              border: "1px solid rgba(34,211,238,0.3)",
            }}
          >
            Send
          </button>
        </div>
      </motion.div>

      {/* WAE Logo — footer branding */}
      <div className="flex justify-center mt-6 pb-2">
        <img
          src="/assets/uploads/wae-logo_hd_white-019d234d-4858-7738-8435-dd85271554ee-1.png"
          alt="WAE Logo"
          style={{
            maxWidth: 140,
            height: "auto",
            display: "block",
            opacity: 0.45,
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}

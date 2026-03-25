import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { DispenseCircle } from "./components/DispenseCircle";
import { HistoryTab } from "./components/HistoryTab";
import { SettingsTab } from "./components/SettingsTab";
import { Sparklines } from "./components/Sparklines";
import { useDispenser } from "./hooks/useDispenser";
import { getWaterInsight } from "./lib/insights";

// Starfield background — purely decorative
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 97) + 1.5,
  y: ((i * 53 + 7) % 93) + 2,
  size: (i % 3) * 0.7 + 0.6,
  dur: 2 + (i % 5) * 0.7,
}));

function Starfield() {
  return (
    <div className="starfield">
      {STARS.map((s) => (
        <div
          key={s.id}
          className="star"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              "--dur": `${s.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function AppHeader() {
  return (
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* WAE Logo */}
      <div className="flex justify-center mb-3">
        <img
          src="/assets/uploads/wae-logo_hd_white-019d234d-4858-7738-8435-dd85271554ee-1.png"
          alt="WAE Logo"
          style={{
            maxWidth: 160,
            height: "auto",
            display: "block",
            opacity: 0.92,
            mixBlendMode: "screen",
          }}
        />
      </div>
      {/* Company name */}
      <p
        className="text-xs font-bold tracking-[0.25em] uppercase mb-1"
        style={{ color: "#A7B2C6" }}
      >
        WAE
      </p>
      {/* Application name */}
      <h1
        className="text-3xl font-extrabold tracking-tight leading-none"
        style={{
          background:
            "linear-gradient(135deg, #22D3EE 0%, #818CF8 60%, #FB7185 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        AquaSync
      </h1>
      {/* Tagline */}
      <p
        className="text-[11px] font-medium tracking-[0.18em] uppercase mt-1"
        style={{ color: "rgba(167,178,198,0.7)" }}
      >
        Hydration Intelligent Solution
      </p>
      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <div
          className="h-px w-16"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(34,211,238,0.4))",
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "rgba(34,211,238,0.6)" }}
        />
        <div
          className="h-px w-16"
          style={{
            background:
              "linear-gradient(to left, transparent, rgba(34,211,238,0.4))",
          }}
        />
      </div>
    </motion.div>
  );
}

type TempMode = "cold" | "hot";

function TempSelector() {
  const [tempMode, setTempMode] = useState<TempMode>("cold");
  const isCold = tempMode === "cold";

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      data-ocid="dashboard.temp_selector.card"
    >
      <p className="text-xs font-semibold mb-3" style={{ color: "#A7B2C6" }}>
        🌡️ Temperature Mode
      </p>
      <div className="flex gap-3 mb-4">
        {/* Cold Button */}
        <button
          type="button"
          data-ocid="dashboard.temp_cold.toggle"
          onClick={() => setTempMode("cold")}
          className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-300 flex flex-col items-center gap-1"
          style={{
            background: isCold
              ? "rgba(34,211,238,0.18)"
              : "rgba(255,255,255,0.05)",
            border: isCold
              ? "1.5px solid rgba(34,211,238,0.6)"
              : "1.5px solid rgba(255,255,255,0.1)",
            color: isCold ? "#22D3EE" : "#A7B2C6",
            boxShadow: isCold ? "0 0 18px rgba(34,211,238,0.25)" : "none",
          }}
        >
          <span className="text-2xl">❄️</span>
          <span>Cold</span>
        </button>

        {/* Hot Button */}
        <button
          type="button"
          data-ocid="dashboard.temp_hot.toggle"
          onClick={() => setTempMode("hot")}
          className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-300 flex flex-col items-center gap-1"
          style={{
            background: !isCold
              ? "rgba(251,113,133,0.18)"
              : "rgba(255,255,255,0.05)",
            border: !isCold
              ? "1.5px solid rgba(251,113,133,0.6)"
              : "1.5px solid rgba(255,255,255,0.1)",
            color: !isCold ? "#FB7185" : "#A7B2C6",
            boxShadow: !isCold ? "0 0 18px rgba(251,113,133,0.25)" : "none",
          }}
        >
          <span className="text-2xl">🔥</span>
          <span>Hot</span>
        </button>
      </div>

      {/* Temperature display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tempMode}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-3 py-3 rounded-2xl"
          style={{
            background: isCold
              ? "rgba(34,211,238,0.08)"
              : "rgba(251,113,133,0.08)",
            border: `1px solid ${
              isCold ? "rgba(34,211,238,0.2)" : "rgba(251,113,133,0.2)"
            }`,
          }}
        >
          <span className="text-3xl">{isCold ? "❄️" : "🔥"}</span>
          <div>
            <p
              className="text-3xl font-bold leading-none"
              style={{ color: isCold ? "#22D3EE" : "#FB7185" }}
            >
              {isCold ? "~ 10°C" : "~ 85°C"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#A7B2C6" }}>
              {isCold ? "Chilled water" : "Hot water"}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default function App() {
  const state = useDispenser();
  const insight = getWaterInsight(state.tds, state.ph);

  return (
    <div className="relative min-h-screen">
      <Starfield />

      {/* Main scroll container with bottom nav padding */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-28">
        {/* Branding header — always visible */}
        <AppHeader />

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {state.activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
              data-ocid="dashboard.section"
            >
              <Sparklines
                tds={state.tds}
                ph={state.ph}
                tdsHistory={state.tdsHistory}
                phHistory={state.phHistory}
              />

              {/* Hot & Cold Temperature Selector */}
              <TempSelector />

              {/* Water Quality Insight card */}
              <motion.div
                className="glass-card-rose p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">✨</span>
                  <span className="text-sm font-semibold text-white">
                    Water Quality Insight
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: "#FB7185" }}
                  >
                    {insight.purityPercent}%
                  </span>
                  <span
                    className="text-sm font-medium mb-1"
                    style={{ color: "#A7B2C6" }}
                  >
                    Pure
                  </span>
                </div>
                <p
                  className="text-sm mt-2"
                  style={{ color: "#F4F7FF", opacity: 0.85 }}
                >
                  {insight.combined}
                </p>
              </motion.div>

              {/* Keyword command input */}
              <div className="glass-card p-4">
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: "#A7B2C6" }}
                >
                  Quick Command
                </p>
                <div className="flex gap-2">
                  <input
                    data-ocid="dashboard.command_input"
                    value={state.commandInput}
                    onChange={(e) => state.setCommandInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && state.submitCommand()
                    }
                    placeholder="Try: cold bottle, hot cup, ambient large…"
                    className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent outline-none"
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="dashboard.command_submit_button"
                    onClick={state.submitCommand}
                    className="px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: "rgba(34,211,238,0.15)",
                      color: "#22D3EE",
                      border: "1px solid rgba(34,211,238,0.3)",
                    }}
                  >
                    Go
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {state.activeTab === "control" && (
            <motion.div
              key="control"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              data-ocid="control.section"
            >
              <div className="glass-card p-6 flex flex-col items-center">
                <h2 className="text-base font-semibold text-white mb-6">
                  Dispense Water
                </h2>
                <DispenseCircle
                  mode={state.mode}
                  volume={state.volume}
                  isHotLocked={state.isHotLocked}
                  hotUnlockProgress={state.hotUnlockProgress}
                  hotRelockCountdown={state.hotRelockCountdown}
                  isDispensing={state.isDispensing}
                  dispenseProgress={state.dispenseProgress}
                  onSetMode={state.setMode}
                  onSetVolume={(v) => state.setVolume(v)}
                  onStartHotUnlock={state.startHotUnlock}
                  onCancelHotUnlock={state.cancelHotUnlock}
                  onStartDispense={state.startDispense}
                  onStopDispense={state.stopDispense}
                />
              </div>

              {/* Connection status */}
              <div className="mt-4 flex justify-center">
                <span
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background:
                      state.connectionMode === "bluetooth"
                        ? "rgba(52,211,153,0.12)"
                        : state.connectionMode === "simulation"
                          ? "rgba(251,191,36,0.12)"
                          : "rgba(251,113,133,0.12)",
                    color:
                      state.connectionMode === "bluetooth"
                        ? "#34D399"
                        : state.connectionMode === "simulation"
                          ? "#FBBF24"
                          : "#FB7185",
                    border: `1px solid ${
                      state.connectionMode === "bluetooth"
                        ? "rgba(52,211,153,0.25)"
                        : state.connectionMode === "simulation"
                          ? "rgba(251,191,36,0.25)"
                          : "rgba(251,113,133,0.25)"
                    }`,
                  }}
                >
                  {state.connectionMode === "bluetooth"
                    ? "🔵 Bluetooth Connected"
                    : state.connectionMode === "simulation"
                      ? "🟡 Simulation Mode"
                      : "⭕ Disconnected"}
                </span>
              </div>
            </motion.div>
          )}

          {state.activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              data-ocid="history.section"
            >
              <HistoryTab logs={state.logs} />
            </motion.div>
          )}

          {state.activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              data-ocid="settings.section"
            >
              <SettingsTab
                userId={state.userId}
                connectionMode={state.connectionMode}
                bluetoothDeviceName={state.bluetoothDevice?.name}
                simulationLog={state.simulationLog}
                onConnect={state.connectBT}
                onDisconnect={state.disconnectBT}
                onClearSimLog={() => state.setSimulationLog([])}
                commandInput={state.commandInput}
                onCommandChange={state.setCommandInput}
                onCommandSubmit={state.submitCommand}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav active={state.activeTab} onChange={state.setActiveTab} />

      {/* Footer */}
      <footer
        className="relative z-10 text-center pb-6"
        style={{ color: "#7F8AA3" }}
      >
        <p className="text-[11px]">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(10,20,45,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
          },
        }}
      />
    </div>
  );
}

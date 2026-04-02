import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { DispenseCircle } from "./components/DispenseCircle";
import { HistoryTab } from "./components/HistoryTab";
import { SettingsTab } from "./components/SettingsTab";
import { Sparklines } from "./components/Sparklines";
import { TDSPurificationLevel } from "./components/TDSPurificationLevel";
import { useDispenser } from "./hooks/useDispenser";
import { getWaterInsight } from "./lib/insights";
import type { ConnectionMode } from "./types/dispenser";

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
      {/* WAE brand name */}
      <p
        className="text-xs font-bold tracking-[0.3em] uppercase mb-1"
        style={{ color: "rgba(167,178,198,0.6)" }}
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

interface TempSelectorProps {
  isDispensing: boolean;
  dispenseProgress: number;
  connectionMode: ConnectionMode;
  coldTemp: number;
  ambientTemp: number;
  hotTemp: number;
}

function TempSelector({
  isDispensing,
  dispenseProgress,
  connectionMode,
  coldTemp,
  ambientTemp,
  hotTemp,
}: TempSelectorProps) {
  const [btTempSync, setBtTempSync] = useState(false);

  // Cards config in Hot → Cold → Ambient order
  const cards = [
    {
      key: "hot",
      emoji: "🔥",
      image: "/assets/uploads/hot-019d24c7-e025-7070-b013-9345c044a9e9-3.png" as
        | string
        | undefined,
      label: "Hot",
      color: "#FB7185",
      rgb: "251,113,133",
      defaultTemp: "85°C",
      liveTemp: `${hotTemp.toFixed(1)}°C`,
    },
    {
      key: "cold",
      emoji: "❄️",
      image:
        "/assets/uploads/cold-019d24c7-dffe-717f-a196-f063216b7ab4-1.png" as
          | string
          | undefined,
      label: "Cold",
      color: "#22D3EE",
      rgb: "34,211,238",
      defaultTemp: "10°C",
      liveTemp: `${coldTemp.toFixed(1)}°C`,
    },
    {
      key: "ambient",
      emoji: undefined as string | undefined,
      image:
        "/assets/uploads/ambient-019d24c7-e030-7114-afd6-d9c117af4edf-2.png",
      label: "Ambient",
      color: "#34D399",
      rgb: "52,211,153",
      defaultTemp: "25°C",
      liveTemp: `${ambientTemp.toFixed(1)}°C`,
    },
  ];

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

      {/* Dispensing progress bar */}
      {isDispensing && (
        <div
          className="w-full h-1 rounded-full mb-3 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, #FB7185, #22D3EE, #34D399)",
              width: `${dispenseProgress}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Three temperature cards: Hot → Cold → Ambient */}
      <div className="flex gap-2">
        {cards.map((card) => {
          const displayTemp = isDispensing ? card.liveTemp : card.defaultTemp;
          return (
            <div
              key={card.key}
              className="flex-1 flex flex-col items-center py-3 px-1 rounded-2xl"
              style={{
                background: `rgba(${card.rgb},0.10)`,
                border: `1.5px solid rgba(${card.rgb},0.35)`,
              }}
            >
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.label}
                  className="w-8 h-8 mb-1 object-contain"
                />
              ) : (
                <span className="text-2xl mb-1">{card.emoji}</span>
              )}
              <p
                className="text-[11px] font-semibold mb-1"
                style={{ color: "#A7B2C6" }}
              >
                {card.label}
              </p>
              <motion.p
                key={displayTemp}
                initial={{ opacity: 0.6, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-base font-bold leading-none"
                style={{ color: card.color }}
              >
                {displayTemp}
              </motion.p>
              {isDispensing && (
                <div className="flex items-center gap-1 mt-1.5">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full block"
                    style={{ background: card.color }}
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.5, 1] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.2,
                    }}
                  />
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: card.color }}
                  >
                    Live
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bluetooth temperature sync toggle */}
      <div
        className="flex items-center justify-between mt-4 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🔵</span>
          <span className="text-xs font-medium" style={{ color: "#A7B2C6" }}>
            Sync Temp from BT Sensor
          </span>
        </div>
        <button
          type="button"
          data-ocid="dashboard.bt_temp_sync.toggle"
          onClick={() => setBtTempSync((v) => !v)}
          className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300"
          style={{
            background: btTempSync
              ? "rgba(52,211,153,0.18)"
              : "rgba(255,255,255,0.07)",
            border: btTempSync
              ? "1px solid rgba(52,211,153,0.5)"
              : "1px solid rgba(255,255,255,0.14)",
            color: btTempSync ? "#34D399" : "#7F8AA3",
          }}
        >
          {btTempSync ? "Live from Sensor" : "Manual"}
        </button>
      </div>

      {btTempSync && connectionMode === "bluetooth" && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-[11px] mt-2 flex items-center gap-1"
          style={{ color: "#34D399" }}
        >
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
          >
            ●
          </motion.span>
          Temperature updating live from Bluetooth sensor
        </motion.p>
      )}
      {btTempSync && connectionMode !== "bluetooth" && (
        <p className="text-[11px] mt-2" style={{ color: "#FBBF24" }}>
          ⚠️ Connect Bluetooth sensor to enable live sync
        </p>
      )}
    </motion.div>
  );
}

export default function App() {
  const state = useDispenser();
  const insight = getWaterInsight(state.tds, state.ph);

  const controlLiveTemp =
    state.mode === "HOT"
      ? state.hotTemp
      : state.mode === "COLD"
        ? state.coldTemp
        : state.ambientTemp;

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

              {/* TDS Purification Level */}
              <TDSPurificationLevel tds={state.tds} />

              {/* Hot & Cold Temperature Selector */}
              <TempSelector
                isDispensing={state.isDispensing}
                dispenseProgress={state.dispenseProgress}
                connectionMode={state.connectionMode}
                coldTemp={state.coldTemp}
                ambientTemp={state.ambientTemp}
                hotTemp={state.hotTemp}
              />

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
                  liveTemp={controlLiveTemp}
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
        <p className="text-[11px]">© {new Date().getFullYear()}. By Janmejay</p>
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

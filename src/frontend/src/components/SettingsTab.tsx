import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ConnectionMode } from "../types/dispenser";
import { MachineRegister } from "./MachineRegister";
import { PurificationFlow } from "./PurificationFlow";

const SPEC_CONTENT = `# AquaSync | WAE — Android App Developer Specification

**Version:** 1.0
**Date:** March 2026
**Product:** AquaSync — Intelligent Water Dispenser Controller
**Brand:** WAE (WAE Limited, HQ- H18 Sector 63, NOIDA, INDIA)
**Prepared by:** [Your Name / Team]
**Contact:** [your@email.com]

---

## 1. Overview

AquaSync is a smart water dispenser controller application for Android. It connects to WAE dispenser hardware via Bluetooth Low Energy (BLE), provides real-time water quality monitoring (TDS, pH, temperature), supports safe hot water dispensing, logs dispense history to Firebase Firestore, and provides rule-based water quality insights.

### 1.1 Target Platform
- **OS:** Android 10+ (API 29+)
- **BLE:** Bluetooth 4.0+
- **Architecture:** MVVM with Repository pattern recommended
- **Language:** Kotlin (preferred) or Java

---

## 2. Branding & Visual Design

### 2.1 Theme
- **Style:** Glassmorphism, dark background
- **Background:** Deep navy/dark (#0A1420 base)
- **Fonts:** Plus Jakarta Sans (primary), JetBrains Mono (monospace)

### 2.2 Color Palette
- Accent Cyan #22D3EE — Cold water, primary CTA
- Accent Purple #818CF8 — Brand gradient
- Accent Rose #FB7185 — Hot water, alerts
- Accent Green #34D399 — Ambient, connected, good
- Accent Amber #FBBF24 — Warnings, simulation mode
- Text Primary #F4F7FF
- Text Secondary #A7B2C6
- Text Muted #7F8AA3

### 2.3 Branding Rules
- Show WAE (small, muted) above AquaSync on Home screen only
- AquaSync gradient: #22D3EE → #818CF8 → #FB7185
- Tagline: "Hydration Intelligent Solution"
- Settings footer: WAE Limited, HQ- H18 Sector 63 NOIDA INDIA

---

## 3. Navigation Structure

Bottom navigation bar with 4 tabs:
- Dashboard (💧) — Home / data overview
- Control (⚡) — Dispense water
- History (📋) — Dispense log
- Settings (⚙️) — App configuration

---

## 4. Screens & Features

### 4.1 Dashboard (Home)
- Header: WAE label + AquaSync gradient text + tagline
- Sparklines Card: TDS (ppm) and pH mini line charts, last ~20 readings
- TDS Purification Level Card: horizontal bar with 4 zones (Error 0-50ppm red, Excellent 50-150ppm cyan, Good 150-300ppm green, Service Required 300+ppm amber), animated pointer, simulation drifts 55-290ppm
- Temperature Mode Section: 3 cards Hot/Cold/Ambient in sequence, each shows name + temperature, no selection buttons; during dispensing only selected mode updates live with LIVE indicator
- Water Quality Insight Card: purity %, combined TDS+pH insight, rule-based only
- Quick Command Input: keyword parser (cold bottle, hot cup, etc.)

### 4.2 Control Screen
- Mode Selector: Hot, Cold, Ambient (Hot requires unlock)
- Volume Selector: 250ml Cup, 500ml Bottle, 1000ml Large
- Dispense Circle states:
  - Idle Cold/Ambient: water drop + "Hold to dispense"
  - Idle Hot Locked: 🔒 + "Hold 2s to unlock", animated ring on hold
  - Hot Unlocked: 🔓 + "Tap to dispense"
  - Dispensing Cold/Ambient: animated flow, live temp inside circle, pulsing LIVE badge
  - Dispensing Hot: 🔥 inside circle, live temp, pulsing LIVE badge
- During dispensing: all 3 temperature cards shown, only selected mode updates live
- Connection Status Badge: 🔵 Bluetooth / 🟡 Simulation / ⭕ Disconnected

### 4.3 History Screen
- List of dispense events: timestamp, mode, volume, TDS, pH
- Stored in Firebase Firestore, most recent first

### 4.4 Settings Screen
Sections:
1. Water Purification Flow (animated: Input→Sediment→Carbon→RO→UV→Output)
2. Authentication (Firebase anonymous, Google Sign-In placeholder)
3. Machine Register
4. Simulation Console (simulation mode only)
5. Text Command (keyword parser)
6. Developer Spec
7. Footer: WAE Limited, HQ- H18 Sector 63 NOIDA INDIA

#### 4.4.3 Machine Register
- Pairing options: Bluetooth (manual UUID) or QR Code
- Default UUID: 0000ffe2-0000-1000-8000-00805f9b34fb
- Random machine names: VAR 100, AquaTap, AquaSync, Annon, HydraUnit, ClearFlow, PureStream, NovaDrop, AquaVault, HydraMax
- User can edit or shuffle name
- Registered machines list: name, UUID, serial, pairing method; tap X to remove

---

## 5. Bluetooth / BLE Integration

- Default Service UUID: 0000ffe2-0000-1000-8000-00805f9b34fb
- TDS Characteristic: Notify/Read — float ppm
- Temperature Characteristic: Notify/Read — float °C per mode
- pH Characteristic: Notify/Read — float
- Dispense Control Characteristic: Write — command bytes

Connection Flow:
1. Open Machine Register → Bluetooth
2. Scan or enter UUID manually
3. Connect, discover services
4. Save to local storage as active machine
5. Stream sensor data via BLE notifications

Dispense Command Format (suggested): HOT:250, COLD:500, AMB:1000

Simulation Mode: auto-activates when no BLE device connected, TDS drifts 55-290ppm

---

## 6. Firebase Integration

Services: Firebase Auth (anonymous), Cloud Firestore (dispense history)

Firestore Schema:
Collection: dispense_logs
  userId: string
  mode: "HOT" | "COLD" | "AMBIENT"
  volume: number (ml)
  tds: number (ppm)
  ph: number
  timestamp: Timestamp
  duration: number (ms)

Security Rules: Users can only read/write their own documents

---

## 7. Hot Water Safety Lock

- Locked: 🔒 shown. Hold 2s to unlock. Ring animates during hold.
- Released early: Ring resets, stays locked.
- Unlocked: 🔓 shown. Tap to dispense. 30s silent auto re-lock starts.
- Auto re-locked: Lock re-engages after 30s. No countdown shown.
- Dispensing: 🔥 + live temp + LIVE badge inside circle.

---

## 8. Rule-Based Insights Engine

TDS Rules:
  < 50 ppm    → "Error: water may lack essential minerals."
  50–150 ppm  → "Excellent: ideal mineral balance."
  150–300 ppm → "Good: safe and within acceptable standards."
  > 300 ppm   → "Service Required: TDS too high, inspect filter."

pH Rules:
  < 6.5  → "Slightly acidic. Check filter."
  6.5–8.5 → "pH balanced — ideal drinking range."
  > 8.5  → "Slightly alkaline. Monitor levels."

Purity % = (tdsScore × 0.7) + (phScore × 0.3)
  TDS scores: <50=20, 50-150=100, 150-300=80, >300=20
  pH scores: <6.5=70, 6.5-8.5=100, >8.5=70

---

## 9. Keyword Command Parser

cold/cool/chilled → Mode = COLD
hot/warm/boiled   → Mode = HOT
ambient/normal/room → Mode = AMBIENT
cup/small/250     → Volume = 250 ml
bottle/medium/500 → Volume = 500 ml
large/big/1000/1l → Volume = 1000 ml

---

## 10. Dispensing Flow

1. Select mode + volume on Control tab
2. For Hot: hold unlock 2s → unlocked
3. Tap/hold dispense button
4. Send BLE command (or simulate)
5. Progress ring animates; live temp shown inside circle with LIVE badge
6. On complete: log to Firestore, show toast
7. For Hot: auto re-lock after 30s

Estimated durations: 250ml ≈ 5s, 500ml ≈ 10s, 1000ml ≈ 20s

---

## 11. Deliverables Checklist

[ ] Android APK / AAB
[ ] Glassmorphic dark UI
[ ] BLE connectivity (confirmed UUIDs)
[ ] Simulation mode
[ ] Hot water 2-second safety lock + auto re-lock
[ ] TDS + pH sparklines
[ ] TDS Purification Level bar (4 zones)
[ ] Temperature Mode section (Hot/Cold/Ambient cards)
[ ] Dispense circle with live temp inside
[ ] Rule-based insights engine
[ ] Keyword command parser
[ ] Firebase Auth + Firestore history logging
[ ] Machine Register (BT + QR, manual UUID, random names)
[ ] Water Purification Flow animation
[ ] Company info footer in Settings
[ ] Spec document accessible in app

---

## 12. Developer Notes

- Actual BLE UUIDs must be confirmed with WAE hardware team before integration.
- Firebase project credentials will be provided separately.
- "Google Sign-In" is a placeholder for future implementation.
- All insight logic is deterministic — no external AI/ML.
- Contact: [Please fill in before sharing]

---

*End of AquaSync WAE Android Developer Specification v1.0*`;

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
  const [specOpen, setSpecOpen] = useState(false);

  // Auto-scroll simulation console when log updates
  // biome-ignore lint/correctness/useExhaustiveDependencies: consoleRef is a stable ref, not a reactive value
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [simulationLog]);

  function handleCopySpec() {
    navigator.clipboard.writeText(SPEC_CONTENT).then(
      () => toast.success("Spec copied to clipboard!", { icon: "📋" }),
      () => toast.error("Copy failed. Please select and copy manually."),
    );
  }

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

      {/* Machine Register Section — replaces Bluetooth Hardware */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        data-ocid="settings.machine_register_panel"
      >
        <MachineRegister
          connectionMode={connectionMode}
          bluetoothDeviceName={bluetoothDeviceName}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
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

      {/* Developer Spec */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>📄</span> Developer Spec
        </h3>
        <p className="text-xs mb-4" style={{ color: "#A7B2C6" }}>
          Full Android developer specification for AquaSync WAE.
        </p>
        <button
          type="button"
          data-ocid="settings.view_spec_button"
          onClick={() => setSpecOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold w-full transition-all hover:opacity-90"
          style={{
            background: "rgba(34,211,238,0.12)",
            border: "1px solid rgba(34,211,238,0.3)",
            color: "#22D3EE",
          }}
        >
          <span>📋</span> View Developer Spec
        </button>
      </motion.div>

      {/* Spec Dialog */}
      <Dialog open={specOpen} onOpenChange={setSpecOpen}>
        <DialogContent
          className="max-w-full w-full h-[100dvh] max-h-[100dvh] p-0 border-0 rounded-none flex flex-col"
          style={{
            background: "rgba(10,20,32,0.97)",
            backdropFilter: "blur(24px)",
          }}
          data-ocid="settings.spec_dialog"
        >
          <DialogHeader
            className="flex-shrink-0 flex flex-row items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "rgba(34,211,238,0.15)" }}
          >
            <DialogTitle
              className="text-base font-semibold"
              style={{ color: "#22D3EE" }}
            >
              📄 Android Developer Spec
            </DialogTitle>
            <button
              type="button"
              data-ocid="settings.copy_spec_button"
              onClick={handleCopySpec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{
                background: "rgba(34,211,238,0.15)",
                border: "1px solid rgba(34,211,238,0.3)",
                color: "#22D3EE",
              }}
            >
              <span>📋</span> Copy
            </button>
          </DialogHeader>
          <ScrollArea className="flex-1 px-5 py-4">
            <pre
              className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono"
              style={{ color: "#A7B2C6" }}
            >
              {SPEC_CONTENT}
            </pre>
          </ScrollArea>
          <div
            className="flex-shrink-0 flex justify-end px-5 py-3 border-t"
            style={{ borderColor: "rgba(34,211,238,0.1)" }}
          >
            <button
              type="button"
              data-ocid="settings.close_spec_button"
              onClick={() => setSpecOpen(false)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#A7B2C6",
              }}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company Info Footer */}
      <motion.div
        className="pt-2 pb-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="border-t pt-4"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#A7B2C6" }}>
            WAE Limited
          </p>
          <p className="text-xs mt-1" style={{ color: "#7F8AA3" }}>
            HQ- H18 Sector 63 NOIDA INDIA
          </p>
        </div>
      </motion.div>
    </div>
  );
}

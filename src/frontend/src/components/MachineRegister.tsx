import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useQRScanner } from "../qr-code/useQRScanner";
import type { ConnectionMode } from "../types/dispenser";

const MACHINE_NAMES = [
  "VAR 100",
  "AquaTap",
  "AquaSync",
  "Annon",
  "HydroVAR",
  "ClearTap",
  "PureSync",
  "AquaNode",
  "FlowMaster",
  "NanoTap",
  "CoolStream",
  "PureFlow",
];

function randomMachineName(): string {
  return MACHINE_NAMES[Math.floor(Math.random() * MACHINE_NAMES.length)];
}

function randomSerial(): string {
  return `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export interface RegisteredMachine {
  id: string;
  name: string;
  uuid: string;
  serial: string;
  pairedAt: number;
  method: "bluetooth" | "qr";
}

interface MachineRegisterProps {
  connectionMode: ConnectionMode;
  bluetoothDeviceName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

type PairStep = "choose" | "bluetooth" | "qr" | "done";

export function MachineRegister({
  connectionMode,
  onConnect,
  onDisconnect,
}: MachineRegisterProps) {
  const [machines, setMachines] = useState<RegisteredMachine[]>([]);
  const [step, setStep] = useState<PairStep>("choose");
  const [manualUUID, setManualUUID] = useState("");
  const [machineName, setMachineName] = useState(randomMachineName());
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    null,
  );

  const {
    qrResults,
    isScanning,
    isSupported,
    error: qrError,
    isLoading: qrLoading,
    startScanning,
    stopScanning,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 200,
    maxResults: 3,
  });

  const registerMachine = useCallback(
    (uuid: string, method: "bluetooth" | "qr") => {
      if (!uuid) {
        toast.error("UUID cannot be empty");
        return;
      }
      const newMachine: RegisteredMachine = {
        id: crypto.randomUUID(),
        name: machineName,
        uuid,
        serial: randomSerial(),
        pairedAt: Date.now(),
        method,
      };
      setMachines((prev) => [newMachine, ...prev]);
      setSelectedMachineId(newMachine.id);
      toast.success(`${newMachine.name} registered!`, { icon: "✅" });
      setStep("done");
      clearResults();
      setMachineName(randomMachineName());
    },
    [machineName, clearResults],
  );

  // Handle QR scan result — treat scanned data as UUID
  useEffect(() => {
    if (step === "qr" && qrResults.length > 0) {
      const scanned = qrResults[0].data.trim();
      stopScanning();
      registerMachine(scanned, "qr");
    }
  }, [qrResults, step, stopScanning, registerMachine]);

  function handleBluetoothPair() {
    const uuid = manualUUID.trim() || "0000ffe2-0000-1000-8000-00805f9b34fb";
    onConnect();
    registerMachine(uuid, "bluetooth");
  }

  function startQRScan() {
    clearResults();
    setStep("qr");
    startScanning();
  }

  function cancelPairing() {
    stopScanning();
    clearResults();
    setStep("choose");
    setManualUUID("");
  }

  function removeMachine(id: string) {
    setMachines((prev) => prev.filter((m) => m.id !== id));
    if (selectedMachineId === id) setSelectedMachineId(null);
    toast.info("Machine removed");
  }

  const isConnected = connectionMode === "bluetooth";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: "white" }}
        >
          <span>🖥️</span> Machine Register
        </h3>
        {step !== "choose" && step !== "done" && (
          <button
            type="button"
            onClick={cancelPairing}
            className="text-xs px-3 py-1 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#A7B2C6",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ✕ Cancel
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Choose pairing method ── */}
        {step === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Machine name row */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(34,211,238,0.05)",
                border: "1px solid rgba(34,211,238,0.15)",
              }}
            >
              <p className="text-xs mb-2" style={{ color: "#A7B2C6" }}>
                Machine Name
              </p>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    id="machine-name-input"
                    className="flex-1 px-3 py-1.5 rounded-xl text-sm bg-transparent outline-none"
                    style={{
                      border: "1px solid rgba(34,211,238,0.35)",
                      color: "white",
                    }}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter machine name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && nameInput.trim()) {
                        setMachineName(nameInput.trim());
                        setEditingName(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (nameInput.trim()) setMachineName(nameInput.trim());
                      setEditingName(false);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{
                      background: "rgba(34,211,238,0.15)",
                      color: "#22D3EE",
                      border: "1px solid rgba(34,211,238,0.3)",
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className="text-base font-bold"
                    style={{ color: "#22D3EE" }}
                  >
                    {machineName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(machineName);
                      setEditingName(true);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-lg"
                    style={{
                      color: "#7F8AA3",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMachineName(randomMachineName())}
                    className="text-[11px] px-2 py-0.5 rounded-lg"
                    style={{
                      color: "#7F8AA3",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    🔀 Random
                  </button>
                </div>
              )}
            </div>

            {/* Pair options */}
            <p className="text-xs font-medium" style={{ color: "#A7B2C6" }}>
              Choose pairing method:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep("bluetooth")}
                className="flex flex-col items-center gap-2 py-5 rounded-2xl transition-all"
                style={{
                  background: "rgba(129,140,248,0.1)",
                  border: "1.5px solid rgba(129,140,248,0.3)",
                  color: "#818CF8",
                }}
              >
                <span className="text-2xl">📶</span>
                <span className="text-xs font-bold">Bluetooth</span>
                <span className="text-[10px] opacity-70">Pair via BLE</span>
              </button>
              <button
                type="button"
                onClick={startQRScan}
                className="flex flex-col items-center gap-2 py-5 rounded-2xl transition-all"
                style={{
                  background: "rgba(52,211,153,0.1)",
                  border: "1.5px solid rgba(52,211,153,0.3)",
                  color: "#34D399",
                }}
              >
                <span className="text-2xl">📷</span>
                <span className="text-xs font-bold">QR Code</span>
                <span className="text-[10px] opacity-70">Scan device QR</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Bluetooth pairing ── */}
        {step === "bluetooth" && (
          <motion.div
            key="bluetooth"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{
                background: "rgba(129,140,248,0.07)",
                border: "1px solid rgba(129,140,248,0.2)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "#818CF8" }}>
                📶 Bluetooth Pairing
              </p>

              {/* Manual UUID input */}
              <div>
                <p className="text-xs mb-1" style={{ color: "#A7B2C6" }}>
                  Device Service UUID{" "}
                  <span style={{ color: "#7F8AA3" }}>
                    (optional — leave blank for default)
                  </span>
                </p>
                <input
                  className="w-full px-3 py-2 rounded-xl text-xs bg-transparent outline-none font-mono"
                  style={{
                    border: "1px solid rgba(129,140,248,0.3)",
                    color: "white",
                    background: "rgba(255,255,255,0.04)",
                  }}
                  value={manualUUID}
                  onChange={(e) => setManualUUID(e.target.value)}
                  placeholder="e.g. 0000ffe2-0000-1000-8000-00805f9b34fb"
                />
                <p className="text-[11px] mt-1" style={{ color: "#7F8AA3" }}>
                  Default:{" "}
                  <span style={{ color: "rgba(129,140,248,0.7)" }}>
                    0000ffe2-0000-1000-8000-00805f9b34fb
                  </span>
                </p>
              </div>

              {/* Pair now */}
              <button
                type="button"
                onClick={handleBluetoothPair}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{
                  background: "rgba(129,140,248,0.18)",
                  color: "#818CF8",
                  border: "1.5px solid rgba(129,140,248,0.4)",
                }}
              >
                Pair {machineName} via Bluetooth
              </button>
              <p
                className="text-[11px] text-center"
                style={{ color: "#7F8AA3" }}
              >
                Requires Chrome or Edge with Web Bluetooth support
              </p>
            </div>
          </motion.div>
        )}

        {/* ── QR Code scan ── */}
        {step === "qr" && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1.5px solid rgba(52,211,153,0.3)" }}
            >
              {/* Camera viewfinder */}
              <div className="relative" style={{ background: "#000" }}>
                <video
                  ref={videoRef}
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                {/* Scan frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-36 h-36 rounded-xl"
                    style={{
                      border: "2px solid rgba(52,211,153,0.7)",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                    }}
                  />
                </div>
                {qrLoading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                  >
                    <span className="text-xs" style={{ color: "#34D399" }}>
                      Initializing camera…
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                {isSupported === false ? (
                  <p
                    className="text-xs text-center"
                    style={{ color: "#FB7185" }}
                  >
                    Camera not supported on this device
                  </p>
                ) : qrError ? (
                  <p
                    className="text-xs text-center"
                    style={{ color: "#FB7185" }}
                  >
                    {qrError.message}
                  </p>
                ) : (
                  <p
                    className="text-xs text-center"
                    style={{ color: "#A7B2C6" }}
                  >
                    {isScanning
                      ? "Point camera at dispenser QR code…"
                      : "Starting camera…"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Done / registered ── */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4 space-y-3"
          >
            <div className="text-4xl">✅</div>
            <p className="text-sm font-semibold" style={{ color: "white" }}>
              Machine registered!
            </p>
            {selectedMachineId &&
              (() => {
                const m = machines.find((x) => x.id === selectedMachineId);
                if (!m) return null;
                return (
                  <div
                    className="text-left rounded-2xl p-4 mx-4"
                    style={{
                      background: "rgba(34,211,238,0.07)",
                      border: "1px solid rgba(34,211,238,0.2)",
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: "#22D3EE" }}>
                      {m.method === "bluetooth" ? "📶" : "📷"} Paired via{" "}
                      {m.method === "bluetooth" ? "Bluetooth" : "QR Code"}
                    </p>
                    <p className="text-sm font-bold" style={{ color: "white" }}>
                      {m.name}
                    </p>
                    <p
                      className="text-[11px] font-mono mt-1"
                      style={{ color: "#7F8AA3" }}
                    >
                      UUID: {m.uuid}
                    </p>
                    <p className="text-[11px]" style={{ color: "#7F8AA3" }}>
                      Serial: {m.serial}
                    </p>
                  </div>
                );
              })()}
            <button
              type="button"
              onClick={() => {
                setStep("choose");
                setManualUUID("");
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "rgba(34,211,238,0.12)",
                color: "#22D3EE",
                border: "1px solid rgba(34,211,238,0.3)",
              }}
            >
              + Register Another Machine
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registered machines list */}
      {machines.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <p className="text-xs font-semibold" style={{ color: "#A7B2C6" }}>
            Registered Machines ({machines.length})
          </p>
          {machines.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background:
                  selectedMachineId === m.id
                    ? "rgba(34,211,238,0.09)"
                    : "rgba(255,255,255,0.04)",
                border:
                  selectedMachineId === m.id
                    ? "1px solid rgba(34,211,238,0.25)"
                    : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span className="text-lg">
                {m.method === "bluetooth" ? "📶" : "📷"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "white" }}>
                  {m.name}
                </p>
                <p
                  className="text-[11px] truncate font-mono"
                  style={{ color: "#7F8AA3" }}
                >
                  {m.uuid}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {connectionMode === "bluetooth" &&
                  selectedMachineId === m.id && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: "rgba(52,211,153,0.15)",
                        color: "#34D399",
                        border: "1px solid rgba(52,211,153,0.3)",
                      }}
                    >
                      Active
                    </span>
                  )}
                <button
                  type="button"
                  onClick={() => removeMachine(m.id)}
                  className="text-xs px-2 py-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                  style={{
                    color: "#FB7185",
                    border: "1px solid rgba(251,113,133,0.2)",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Disconnect if connected */}
          {isConnected && (
            <button
              type="button"
              onClick={onDisconnect}
              className="w-full py-2 rounded-xl text-sm font-semibold mt-1 transition-all hover:opacity-90"
              style={{
                background: "rgba(251,113,133,0.12)",
                color: "#FB7185",
                border: "1px solid rgba(251,113,133,0.25)",
              }}
            >
              Disconnect Hardware
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

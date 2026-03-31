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

type PairStep = "choose" | "bluetooth" | "qr" | "bt-confirm" | "done";

const DEFAULT_UUID = "0000ffe2-0000-1000-8000-00805f9b34fb";

interface DiscoveredDevice {
  name: string;
  uuids: string[];
}

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
  const [btScanning, setBtScanning] = useState(false);
  const [discoveredDevice, setDiscoveredDevice] =
    useState<DiscoveredDevice | null>(null);
  const [selectedUUID, setSelectedUUID] = useState("");

  const webBluetoothSupported =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

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
      setDiscoveredDevice(null);
      setSelectedUUID("");
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
    const uuid = manualUUID.trim() || DEFAULT_UUID;
    onConnect();
    registerMachine(uuid, "bluetooth");
  }

  async function handleDeviceBluetoothScan() {
    if (!webBluetoothSupported) {
      toast.error("Web Bluetooth is not supported in this browser.");
      return;
    }
    setBtScanning(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [DEFAULT_UUID],
      });

      const deviceName = device.name || "Unknown Device";
      let uuids: string[] = [];

      // Try to connect to GATT and discover services
      if (device.gatt) {
        try {
          const server = await device.gatt.connect();
          // @ts-ignore — getPrimaryServices() returns all services
          const services = await server.getPrimaryServices();
          uuids = services.map((s: any) => s.uuid as string);
          device.gatt.disconnect();
        } catch {
          // GATT connection failed — fall back to DEFAULT_UUID
          uuids = [];
        }
      }

      if (uuids.length === 0) {
        uuids = [DEFAULT_UUID];
      }

      // Pre-fill machine name with BLE device name if it looks useful
      if (device.name?.trim()) {
        setMachineName(device.name.trim());
        setNameInput(device.name.trim());
      }

      setDiscoveredDevice({ name: deviceName, uuids });
      setSelectedUUID(uuids[0]);
      setStep("bt-confirm");
    } catch (err: any) {
      if (err?.name === "NotFoundError" || err?.code === 8) {
        toast.info("Bluetooth scan cancelled.");
      } else {
        toast.error(err?.message || "Bluetooth scan failed.");
      }
    } finally {
      setBtScanning(false);
    }
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
    setDiscoveredDevice(null);
    setSelectedUUID("");
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
              className="rounded-2xl p-4 space-y-4"
              style={{
                background: "rgba(129,140,248,0.07)",
                border: "1px solid rgba(129,140,248,0.2)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "#818CF8" }}>
                📶 Bluetooth Pairing
              </p>

              {/* ── Option 1: Manual UUID ── */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#A7B2C6" }}
                >
                  Option 1 — Enter UUID Manually
                </p>
                <div>
                  <p className="text-xs mb-1" style={{ color: "#A7B2C6" }}>
                    Device Service UUID{" "}
                    <span style={{ color: "#7F8AA3" }}>
                      (optional — leave blank for default)
                    </span>
                  </p>
                  <input
                    data-ocid="machine.uuid.input"
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
                      {DEFAULT_UUID}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="machine.primary_button"
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
              </div>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(129,140,248,0.2)" }}
                />
                <span
                  className="text-xs font-semibold px-2"
                  style={{ color: "rgba(129,140,248,0.6)" }}
                >
                  or
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(129,140,248,0.2)" }}
                />
              </div>

              {/* ── Option 2: Device Bluetooth Prompt ── */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#A7B2C6" }}
                >
                  Option 2 — Device Bluetooth Selector
                </p>
                <p className="text-[11px]" style={{ color: "#7F8AA3" }}>
                  Opens your device's Bluetooth selector. Requires Chrome or
                  Edge.
                </p>
                <button
                  type="button"
                  data-ocid="machine.secondary_button"
                  onClick={handleDeviceBluetoothScan}
                  disabled={!webBluetoothSupported || btScanning}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: webBluetoothSupported
                      ? "rgba(129,140,248,0.12)"
                      : "rgba(255,255,255,0.05)",
                    color: webBluetoothSupported ? "#818CF8" : "#7F8AA3",
                    border: `1.5px solid ${
                      webBluetoothSupported
                        ? "rgba(129,140,248,0.35)"
                        : "rgba(255,255,255,0.1)"
                    }`,
                  }}
                  title={
                    !webBluetoothSupported
                      ? "Web Bluetooth not supported in this browser. Use Chrome or Edge."
                      : undefined
                  }
                >
                  {btScanning ? (
                    <>
                      <span
                        className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                          borderColor: "#818CF8",
                          borderTopColor: "transparent",
                        }}
                      />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Scan via Device Bluetooth
                    </>
                  )}
                </button>
                {!webBluetoothSupported && (
                  <p
                    className="text-[11px] text-center"
                    style={{ color: "#FB7185" }}
                  >
                    ⚠️ Web Bluetooth not available — use Chrome or Edge on
                    Android/Desktop
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── BT Confirm: show discovered device info ── */}
        {step === "bt-confirm" && discoveredDevice && (
          <motion.div
            key="bt-confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div
              className="rounded-2xl p-4 space-y-4"
              style={{
                background: "rgba(129,140,248,0.07)",
                border: "1px solid rgba(129,140,248,0.25)",
              }}
            >
              {/* Device found banner */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(129,140,248,0.15)" }}
                >
                  📶
                </div>
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(129,140,248,0.7)" }}
                  >
                    Device Found
                  </p>
                  <p
                    className="text-base font-bold leading-tight"
                    style={{ color: "white" }}
                  >
                    {discoveredDevice.name}
                  </p>
                </div>
              </div>

              {/* Machine name (pre-filled, editable) */}
              <div className="space-y-1">
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#A7B2C6" }}
                >
                  Register as
                </p>
                <div className="flex gap-2">
                  <input
                    data-ocid="machine.uuid.input"
                    className="flex-1 px-3 py-1.5 rounded-xl text-sm bg-transparent outline-none"
                    style={{
                      border: "1px solid rgba(129,140,248,0.3)",
                      color: "white",
                      background: "rgba(255,255,255,0.04)",
                    }}
                    value={machineName}
                    onChange={(e) => setMachineName(e.target.value)}
                    placeholder="Machine name"
                  />
                  <button
                    type="button"
                    onClick={() => setMachineName(randomMachineName())}
                    className="px-3 py-1.5 rounded-xl text-xs"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "#7F8AA3",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    title="Random name"
                  >
                    🔀
                  </button>
                </div>
              </div>

              {/* Service UUIDs */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#A7B2C6" }}
                >
                  Service UUID
                  {discoveredDevice.uuids.length > 1 ? "s" : ""}{" "}
                  <span className="font-normal" style={{ color: "#7F8AA3" }}>
                    ({discoveredDevice.uuids.length} discovered — tap to select)
                  </span>
                </p>
                <div className="space-y-1.5">
                  {discoveredDevice.uuids.map((uuid) => (
                    <button
                      key={uuid}
                      type="button"
                      onClick={() => setSelectedUUID(uuid)}
                      className="w-full text-left px-3 py-2.5 rounded-xl font-mono text-xs transition-all"
                      style={{
                        background:
                          selectedUUID === uuid
                            ? "rgba(129,140,248,0.2)"
                            : "rgba(255,255,255,0.04)",
                        border:
                          selectedUUID === uuid
                            ? "1.5px solid rgba(129,140,248,0.5)"
                            : "1px solid rgba(255,255,255,0.08)",
                        color: selectedUUID === uuid ? "#818CF8" : "#A7B2C6",
                      }}
                    >
                      <span className="mr-2">
                        {selectedUUID === uuid ? "✔" : "○"}
                      </span>
                      {uuid}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm register */}
              <button
                type="button"
                data-ocid="machine.primary_button"
                onClick={() => {
                  onConnect();
                  registerMachine(selectedUUID || DEFAULT_UUID, "bluetooth");
                }}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{
                  background: "rgba(129,140,248,0.2)",
                  color: "#818CF8",
                  border: "1.5px solid rgba(129,140,248,0.45)",
                }}
              >
                ✅ Register This Device
              </button>

              {/* Cancel back to bluetooth step */}
              <button
                type="button"
                onClick={() => {
                  setStep("bluetooth");
                  setDiscoveredDevice(null);
                  setSelectedUUID("");
                }}
                className="w-full py-2 rounded-xl text-xs transition-all hover:opacity-80"
                style={{ color: "#7F8AA3" }}
              >
                ← Back to pairing options
              </button>
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

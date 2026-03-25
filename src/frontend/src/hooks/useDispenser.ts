/**
 * useDispenser — central state hook for AquaSync WAE.
 * Manages all dispenser state: mode, volume, hot lock, dispense progress,
 * Bluetooth connection, sensor data, logs, and simulation console.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { connectBluetooth, sendATCommand } from "../lib/bluetooth";
import { logDispenseEvent, signInAnon } from "../lib/firebase";
import { parseKeywordCommand } from "../lib/insights";
import type {
  ActiveTab,
  ConnectionMode,
  DispenseLog,
  Mode,
  Volume,
} from "../types/dispenser";

/** Generate initial sparkline history around a center value */
function generateHistory(
  center: number,
  spread: number,
  points = 20,
): number[] {
  const history: number[] = [];
  let v = center;
  for (let i = 0; i < points; i++) {
    v = v + (Math.random() - 0.5) * spread;
    history.push(Math.round(v * 10) / 10);
  }
  return history;
}

export function useDispenser() {
  // ── Navigation ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // ── Dispense controls ───────────────────────────────────────────────────
  const [mode, setModeState] = useState<Mode>("AMBIENT");
  const [volume, setVolume] = useState<Volume>(300);
  const [isHotLocked, setIsHotLocked] = useState(true);
  const [hotUnlockProgress, setHotUnlockProgress] = useState(0);
  const [hotRelockCountdown, setHotRelockCountdown] = useState(30);
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseProgress, setDispenseProgress] = useState(0);

  // ── Bluetooth / connection ───────────────────────────────────────────────
  const [connectionMode, setConnectionMode] =
    useState<ConnectionMode>("disconnected");
  const [bluetoothCharacteristic, setBluetoothCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [bluetoothDevice, setBluetoothDevice] =
    useState<BluetoothDevice | null>(null);

  // ── Sensor data ──────────────────────────────────────────────────────────
  const [tds, setTds] = useState(24);
  const [ph, setPh] = useState(7.1);
  const [tdsHistory, setTdsHistory] = useState<number[]>(() =>
    generateHistory(24, 6),
  );
  const [phHistory, setPhHistory] = useState<number[]>(() =>
    generateHistory(7.1, 0.15),
  );

  // ── Logs ─────────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<DispenseLog[]>([]);
  const [userId, setUserId] = useState<string>(`local-${crypto.randomUUID()}`);

  // ── Simulation console ───────────────────────────────────────────────────
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  // ── Keyword command input ────────────────────────────────────────────────
  const [commandInput, setCommandInput] = useState("");

  // ── Interval refs for cleanup ────────────────────────────────────────────
  const unlockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const relockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dispenseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const sensorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Firebase anonymous auth on mount ─────────────────────────────────────
  useEffect(() => {
    signInAnon().then((user) => {
      if (user) setUserId(user.uid);
    });
  }, []);

  // ── Simulated sensor drift (update every 5 seconds) ──────────────────────
  useEffect(() => {
    sensorIntervalRef.current = setInterval(() => {
      setTds((prev) => {
        const next = Math.max(
          5,
          Math.min(80, prev + (Math.random() - 0.5) * 2),
        );
        setTdsHistory((h) => [...h.slice(1), Math.round(next)]);
        return Math.round(next);
      });
      setPh((prev) => {
        const next = Math.max(
          6.0,
          Math.min(8.5, prev + (Math.random() - 0.5) * 0.05),
        );
        setPhHistory((h) => [...h.slice(1), Math.round(next * 10) / 10]);
        return Math.round(next * 10) / 10;
      });
    }, 5000);
    return () => {
      if (sensorIntervalRef.current) clearInterval(sensorIntervalRef.current);
    };
  }, []);

  // ── Hot-water auto re-lock countdown ─────────────────────────────────────
  useEffect(() => {
    if (mode === "HOT" && !isHotLocked) {
      setHotRelockCountdown(30);
      relockIntervalRef.current = setInterval(() => {
        setHotRelockCountdown((prev) => {
          if (prev <= 1) {
            setIsHotLocked(true);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (relockIntervalRef.current) clearInterval(relockIntervalRef.current);
    }
    return () => {
      if (relockIntervalRef.current) clearInterval(relockIntervalRef.current);
    };
  }, [mode, isHotLocked]);

  // ── Cleanup all intervals on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      for (const ref of [
        unlockIntervalRef,
        relockIntervalRef,
        dispenseIntervalRef,
        sensorIntervalRef,
      ]) {
        if (ref.current) clearInterval(ref.current);
      }
    };
  }, []);

  // ── Mode setter (locks hot when switching to HOT) ─────────────────────────
  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    if (m === "HOT") {
      setIsHotLocked(true);
      setHotUnlockProgress(0);
    }
  }, []);

  // ── Append to simulation log ──────────────────────────────────────────────
  const appendSimLog = useCallback((cmd: string) => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setSimulationLog((prev) => [...prev, `[${ts}] ${cmd}`]);
  }, []);

  // ── Send AT command (bluetooth or simulation) ─────────────────────────────
  const sendCommand = useCallback(
    async (cmd: string) => {
      appendSimLog(cmd);
      if (connectionMode === "bluetooth" && bluetoothCharacteristic) {
        try {
          await sendATCommand(bluetoothCharacteristic, cmd);
        } catch (e) {
          console.warn("[BT] Send failed", e);
        }
      }
    },
    [connectionMode, bluetoothCharacteristic, appendSimLog],
  );

  // ── Hot unlock: start hold ─────────────────────────────────────────────────
  const startHotUnlock = useCallback(() => {
    if (unlockIntervalRef.current) return; // already running
    unlockIntervalRef.current = setInterval(() => {
      setHotUnlockProgress((prev) => {
        const next = prev + 5; // 5% per 100ms => 2 seconds to reach 100
        if (next >= 100) {
          clearInterval(unlockIntervalRef.current!);
          unlockIntervalRef.current = null;
          setIsHotLocked(false);
          setHotUnlockProgress(0);
          sendCommand("AT+LOCK=0");
          toast.success("Hot water unlocked for 30 seconds", { icon: "🔓" });
          return 0;
        }
        return next;
      });
    }, 100);
  }, [sendCommand]);

  // ── Hot unlock: cancel hold ───────────────────────────────────────────────
  const cancelHotUnlock = useCallback(() => {
    if (unlockIntervalRef.current) {
      clearInterval(unlockIntervalRef.current);
      unlockIntervalRef.current = null;
    }
    setHotUnlockProgress(0);
  }, []);

  // ── Reset hot relock timer (called on any activity) ───────────────────────
  const resetHotRelockTimer = useCallback(() => {
    if (mode === "HOT" && !isHotLocked) {
      setHotRelockCountdown(30);
    }
  }, [mode, isHotLocked]);

  // ── Dispense action ───────────────────────────────────────────────────────
  const startDispense = useCallback(async () => {
    if (isDispensing) return;
    if (mode === "HOT" && isHotLocked) return;

    resetHotRelockTimer();
    setIsDispensing(true);
    setDispenseProgress(0);

    // Send AT commands
    await sendCommand(`AT+MODE=${mode}`);
    await sendCommand(`AT+VOL=${volume}`);
    await sendCommand("AT+DISPENSE");

    // Animate progress ring: 0 → 100 over ~3 seconds (100ms ticks)
    dispenseIntervalRef.current = setInterval(() => {
      setDispenseProgress((prev) => {
        const next = prev + 3.34; // ~30 ticks to reach 100
        if (next >= 100) {
          clearInterval(dispenseIntervalRef.current!);
          dispenseIntervalRef.current = null;

          // Complete dispense
          const logEntry: DispenseLog = {
            timestamp: Date.now(),
            mode,
            volume,
            tds,
            ph,
            connectionMode,
          };
          setLogs((prev) => [logEntry, ...prev]);
          logDispenseEvent(userId, logEntry);
          setIsDispensing(false);
          setDispenseProgress(0);
          toast.success(`Dispensed ${volume}ml (${mode})`, { icon: "💧" });
          return 0;
        }
        return next;
      });
    }, 100);
  }, [
    isDispensing,
    mode,
    isHotLocked,
    volume,
    tds,
    ph,
    connectionMode,
    userId,
    sendCommand,
    resetHotRelockTimer,
  ]);

  // ── Stop dispense ──────────────────────────────────────────────────────────
  const stopDispense = useCallback(async () => {
    if (dispenseIntervalRef.current) {
      clearInterval(dispenseIntervalRef.current);
      dispenseIntervalRef.current = null;
    }
    await sendCommand("AT+STOP");
    setIsDispensing(false);
    setDispenseProgress(0);
  }, [sendCommand]);

  // ── Bluetooth connect ──────────────────────────────────────────────────────
  const connectBT = useCallback(async () => {
    try {
      const conn = await connectBluetooth();
      setBluetoothCharacteristic(conn.characteristic);
      setBluetoothDevice(conn.device);
      setConnectionMode("bluetooth");
      toast.success(`Connected to ${conn.device.name ?? "device"}`);

      conn.device.addEventListener("gattserverdisconnected", () => {
        setConnectionMode("simulation");
        setBluetoothCharacteristic(null);
        setBluetoothDevice(null);
        toast.error("Bluetooth disconnected — switched to simulation mode");
      });
    } catch (e) {
      console.warn("[BT] Connect failed, entering simulation mode", e);
      setConnectionMode("simulation");
      toast.info("Bluetooth unavailable — simulation mode active", {
        icon: "🔌",
      });
    }
  }, []);

  // ── Bluetooth disconnect ───────────────────────────────────────────────────
  const disconnectBT = useCallback(() => {
    if (bluetoothDevice?.gatt?.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    setBluetoothCharacteristic(null);
    setBluetoothDevice(null);
    setConnectionMode("disconnected");
    toast.info("Bluetooth disconnected");
  }, [bluetoothDevice]);

  // ── Keyword command parser ─────────────────────────────────────────────────
  const submitCommand = useCallback(() => {
    if (!commandInput.trim()) return;
    const parsed = parseKeywordCommand(commandInput);
    if (parsed.mode) setMode(parsed.mode);
    if (parsed.volume) setVolume(parsed.volume as Volume);
    const feedback = [
      parsed.mode ? `Mode → ${parsed.mode}` : null,
      parsed.volume ? `Volume → ${parsed.volume}ml` : null,
    ]
      .filter(Boolean)
      .join(", ");
    if (feedback) {
      toast.success(feedback, {
        description: `Parsed from: "${commandInput}"`,
      });
    } else {
      toast.error("No recognized keywords found");
    }
    setCommandInput("");
  }, [commandInput, setMode]);

  return {
    // Navigation
    activeTab,
    setActiveTab,
    // Controls
    mode,
    setMode,
    volume,
    setVolume,
    isHotLocked,
    hotUnlockProgress,
    hotRelockCountdown,
    isDispensing,
    dispenseProgress,
    startHotUnlock,
    cancelHotUnlock,
    startDispense,
    stopDispense,
    // Connection
    connectionMode,
    setConnectionMode,
    bluetoothDevice,
    connectBT,
    disconnectBT,
    // Sensor
    tds,
    ph,
    tdsHistory,
    phHistory,
    // Logs
    logs,
    userId,
    // Simulation
    simulationLog,
    setSimulationLog,
    // Command
    commandInput,
    setCommandInput,
    submitCommand,
  };
}

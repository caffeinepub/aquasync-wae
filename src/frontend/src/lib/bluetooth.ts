/**
 * Web Bluetooth GATT connection for AquaSync WAE.
 *
 * GATT Connection Flow:
 * 1. navigator.bluetooth.requestDevice() — prompts user to select HC-05/HM-10
 * 2. device.gatt!.connect() — establishes GATT connection
 * 3. server.getPrimaryService('0000ffe0-...') — HM-10/HC-05 custom service UUID
 * 4. service.getCharacteristic('0000ffe1-...') — writable characteristic
 * 5. characteristic.writeValue(encoded command) — send AT command
 *
 * If any step fails or Web Bluetooth is not supported, the caller should
 * switch to Simulation Mode.
 *
 * AT Command Set:
 * AT+MODE=HOT      — set dispense mode to hot
 * AT+MODE=COLD     — set dispense mode to cold
 * AT+MODE=AMBIENT  — set dispense mode to ambient
 * AT+VOL=300       — set volume in ml
 * AT+DISPENSE      — trigger dispense
 * AT+STOP          — emergency stop
 * AT+LOCK=0        — disable hot water lock (redundant with app state)
 *
 * Sensor Notifications:
 * The sensor characteristic (BLE_SENSOR_CHAR_UUID) streams JSON lines:
 * {"tds":142,"ph":7.2,"temperature":{"hot":84.5,"cold":10.2,"ambient":25.1}}
 * The app subscribes to characteristicvaluechanged and parses these.
 */

export interface BluetoothConnection {
  characteristic: BluetoothRemoteGATTCharacteristic;
  sensorCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  device: BluetoothDevice;
}

export interface SensorTemperature {
  hot?: number;
  cold?: number;
  ambient?: number;
}

export interface SensorData {
  tds?: number;
  ph?: number;
  temperature?: SensorTemperature;
}

export type SensorCallback = (data: SensorData) => void;

// HM-10 / HC-05 BLE service and characteristic UUIDs
const BLE_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const BLE_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
// Sensor notify characteristic — adjust UUID to match your hardware
const BLE_SENSOR_CHAR_UUID = "0000ffe2-0000-1000-8000-00805f9b34fb";

/**
 * Request a Bluetooth device and return the writable characteristic.
 * Throws an error if Bluetooth is unavailable or user cancels.
 */
export async function connectBluetooth(): Promise<BluetoothConnection> {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth API is not supported in this browser.");
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ name: "HC-05" }, { name: "HM-10" }],
    optionalServices: [BLE_SERVICE_UUID],
  });

  if (!device.gatt) {
    throw new Error("Device does not support GATT.");
  }

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(BLE_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(BLE_CHAR_UUID);

  // Try to get the sensor notify characteristic (may not exist on all hardware)
  let sensorCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  try {
    sensorCharacteristic =
      await service.getCharacteristic(BLE_SENSOR_CHAR_UUID);
  } catch {
    // Sensor characteristic not available — sensor data will come via simulation
  }

  return { characteristic, sensorCharacteristic, device };
}

/**
 * Subscribe to real-time sensor notifications from the BLE sensor characteristic.
 * The sensor streams UTF-8 JSON lines:
 * {"tds":142,"ph":7.2,"temperature":{"hot":84.5,"cold":10.2,"ambient":25.1}}
 * Returns an unsubscribe function.
 */
export function subscribeSensorNotifications(
  characteristic: BluetoothRemoteGATTCharacteristic,
  onData: SensorCallback,
): () => void {
  const decoder = new TextDecoder();

  const handler = (event: Event) => {
    // Cast through unknown to avoid TS type overlap error on EventTarget
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    try {
      const text = decoder.decode(target.value);
      // Support both JSON object and simple comma-separated "tds=142,ph=7.2"
      if (text.trim().startsWith("{")) {
        const parsed = JSON.parse(text.trim()) as SensorData;
        onData(parsed);
      } else {
        // Fallback: parse key=value pairs
        const result: SensorData = {};
        for (const part of text.split(",")) {
          const [key, val] = part.trim().split("=");
          if (key === "tds" && val) result.tds = Number.parseFloat(val);
          if (key === "ph" && val) result.ph = Number.parseFloat(val);
        }
        if (result.tds !== undefined || result.ph !== undefined) {
          onData(result);
        }
      }
    } catch {
      // Ignore malformed sensor packets
    }
  };

  characteristic.addEventListener("characteristicvaluechanged", handler);
  characteristic.startNotifications().catch(() => {
    // Notifications not supported — silently ignore
  });

  return () => {
    characteristic.removeEventListener("characteristicvaluechanged", handler);
    characteristic.stopNotifications().catch(() => {});
  };
}

/**
 * Send an AT command string over the BLE characteristic.
 * Commands are UTF-8 encoded and terminated with \r\n.
 */
export async function sendATCommand(
  characteristic: BluetoothRemoteGATTCharacteristic,
  command: string,
): Promise<void> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${command}\r\n`);
  await characteristic.writeValue(data);
}

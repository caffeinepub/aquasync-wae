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
 */

export interface BluetoothConnection {
  characteristic: BluetoothRemoteGATTCharacteristic;
  device: BluetoothDevice;
}

// HM-10 / HC-05 BLE service and characteristic UUIDs
const BLE_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const BLE_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

/**
 * Request a Bluetooth device and return the writable characteristic.
 * Throws an error if Bluetooth is unavailable or user cancels.
 */
export async function connectBluetooth(): Promise<BluetoothConnection> {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth API is not supported in this browser.");
  }

  // Step 1: Request device — filter for HC-05 and HM-10 by name
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ name: "HC-05" }, { name: "HM-10" }],
    optionalServices: [BLE_SERVICE_UUID],
  });

  if (!device.gatt) {
    throw new Error("Device does not support GATT.");
  }

  // Step 2: Connect to GATT server
  const server = await device.gatt.connect();

  // Step 3: Get the primary BLE UART service
  const service = await server.getPrimaryService(BLE_SERVICE_UUID);

  // Step 4: Get the writable TX characteristic
  const characteristic = await service.getCharacteristic(BLE_CHAR_UUID);

  return { characteristic, device };
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

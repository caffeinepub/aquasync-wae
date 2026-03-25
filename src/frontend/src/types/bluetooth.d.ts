/**
 * Minimal Web Bluetooth API ambient type declarations.
 * The full spec is available via @types/web-bluetooth but is not installed.
 * These stubs are sufficient for AquaSync WAE's usage.
 */

interface BluetoothRemoteGATTCharacteristic {
  readonly service: BluetoothRemoteGATTService;
  readonly uuid: string;
  value: DataView | null;
  writeValue(value: BufferSource): Promise<void>;
  readValue(): Promise<DataView>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
}

interface BluetoothRemoteGATTService {
  readonly device: BluetoothDevice;
  readonly uuid: string;
  getCharacteristic(
    characteristic: string,
  ): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean;
  readonly device: BluetoothDevice;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  addEventListener(
    type: "gattserverdisconnected",
    listener: EventListenerOrEventListenerObject,
  ): void;
}

interface RequestDeviceOptions {
  filters?: Array<{ name?: string; namePrefix?: string; services?: string[] }>;
  acceptAllDevices?: boolean;
  optionalServices?: string[];
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  getAvailability(): Promise<boolean>;
}

interface Navigator {
  bluetooth: Bluetooth;
}

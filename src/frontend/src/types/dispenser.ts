export type Mode = "HOT" | "COLD" | "AMBIENT";
export type Volume = 150 | 300 | 500 | 1000;
export type ConnectionMode = "disconnected" | "bluetooth" | "simulation";
export type ActiveTab = "dashboard" | "control" | "history" | "settings";

export interface DispenseLog {
  id?: string;
  timestamp: number;
  mode: Mode;
  volume: Volume;
  tds: number;
  ph: number;
  connectionMode: ConnectionMode;
}

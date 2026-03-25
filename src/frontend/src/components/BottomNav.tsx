import { History, LayoutDashboard, Settings, Zap } from "lucide-react";
import type { ActiveTab } from "../types/dispenser";

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  Icon: React.FC<{ size: number }>;
}[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "control", label: "Control", Icon: Zap },
  { id: "history", label: "History", Icon: History },
  { id: "settings", label: "Settings", Icon: Settings },
];

interface BottomNavProps {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-nav flex items-center gap-1 px-3 py-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              type="button"
              key={id}
              data-ocid={`nav.${id}_link`}
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all"
              style={
                isActive
                  ? {
                      color: "#22D3EE",
                      background: "rgba(34,211,238,0.10)",
                      textShadow: "0 0 10px rgba(34,211,238,0.5)",
                    }
                  : { color: "#A7B2C6" }
              }
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

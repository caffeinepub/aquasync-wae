# AquaSync | WAE — Android App Developer Specification

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
- **Background:** Deep navy/dark (`#0A1420` base), with subtle animated starfield overlay
- **Glassmorphic cards:** `rgba(10, 20, 45, 0.7)` with `1px solid rgba(255,255,255,0.10)` border and `backdrop-filter: blur(20px)`
- **Fonts:**
  - Primary: Plus Jakarta Sans (Bold, SemiBold, Medium, Regular)
  - Monospace: JetBrains Mono (for console/logs)

### 2.2 Color Palette
| Token | Hex | Usage |
|---|---|---|
| Accent Cyan | `#22D3EE` | Cold water, primary CTA |
| Accent Purple | `#818CF8` | Brand gradient |
| Accent Rose | `#FB7185` | Hot water, alerts |
| Accent Green | `#34D399` | Ambient, connected, good |
| Accent Amber | `#FBBF24` | Warnings, simulation mode |
| Text Primary | `#F4F7FF` | Main text |
| Text Secondary | `#A7B2C6` | Labels, subtitles |
| Text Muted | `#7F8AA3` | Placeholders, helpers |

### 2.3 Branding Rules
- Show `WAE` (small, muted, letter-spaced) above `AquaSync` on the Home screen only
- `AquaSync` uses a gradient: `#22D3EE → #818CF8 → #FB7185`
- Tagline: "Hydration Intelligent Solution"
- No logos or image branding anywhere in the app
- Settings screen footer: **WAE Limited, HQ- H18 Sector 63 NOIDA INDIA**

---

## 3. Navigation Structure

Bottom navigation bar with 4 tabs:

| Tab | Icon | Screen |
|---|---|---|
| Dashboard | 💧 | Home / data overview |
| Control | ⚡ | Dispense water |
| History | 📋 | Dispense log |
| Settings | ⚙️ | App configuration |

---

## 4. Screens & Features

### 4.1 Dashboard (Home)

#### 4.1.1 Header
- `WAE` label — tiny, muted, letter-spaced
- `AquaSync` — large gradient text
- Tagline — small, muted
- Decorative divider with a centered dot

#### 4.1.2 Sparklines Card
- Two mini line charts: **TDS (ppm)** and **pH**
- Show last ~20 readings, live updates
- TDS: cyan, pH: purple

#### 4.1.3 TDS Purification Level Card
- Horizontal bar with 4 zones:
  - **Error** (0–50 ppm) — red, ~5% width
  - **Excellent** (50–150 ppm) — cyan, ~35% width
  - **Good** (150–300 ppm) — green, ~45% width
  - **Service Required** (300+ ppm) — amber, ~15% width
- Animated pointer at current TDS position
- Current TDS value shown numerically
- Simulation drifts between 55–290 ppm

#### 4.1.4 Temperature Mode Section
- Title: "🌡️ Temperature Mode"
- Three cards in a horizontal row: **Hot → Cold → Ambient**
- Each card: emoji, label, temperature value
- Defaults: Hot ~85°C, Cold ~10°C, Ambient ~25°C
- During dispensing: all three cards show live values with pulsing `Live` indicator
- Progress bar appears at top of section while dispensing
- Toggle: "Sync Temp from BT Sensor"
- No mode selection in this section

#### 4.1.5 Water Quality Insight Card
- Purity percentage (rule-based, 0–100%)
- Combined TDS + pH insight text
- No AI — deterministic rules only

#### 4.1.6 Quick Command Input
- Text field + Go button
- Keyword parser: `cold bottle`, `hot cup`, `ambient large`, etc.

---

### 4.2 Control Screen

#### 4.2.1 Mode Selector
- Hot, Cold, Ambient buttons
- Hot requires unlock

#### 4.2.2 Volume Selector
- 250ml (Cup), 500ml (Bottle), 1000ml (Large)

#### 4.2.3 Dispense Circle
States:
- **Idle Cold/Ambient:** water drop + "Hold to dispense"
- **Idle Hot Locked:** 🔒 + "Hold 2s to unlock", animated ring on hold
- **Hot Unlocked:** 🔓 + "Tap to dispense"
- **Dispensing Cold/Ambient:** animated flow, live temp inside circle, pulsing LIVE badge
- **Dispensing Hot:** 🔥 inside circle, live temp, pulsing LIVE badge

During dispensing: all 3 temperature cards shown below circle; only selected mode updates live.

#### 4.2.4 Connection Status Badge
🔵 Bluetooth / 🟡 Simulation / ⭕ Disconnected

---

### 4.3 History Screen
- List of dispense events: timestamp, mode, volume, TDS, pH
- Stored in Firebase Firestore
- Most recent first, pull-to-refresh

---

### 4.4 Settings Screen

Sections:
1. Water Purification Flow (animated diagram: Input → Sediment → Carbon → RO → UV → Output)
2. Authentication (Firebase anonymous, Google Sign-In placeholder)
3. Machine Register (see §4.4.3)
4. Simulation Console (only in simulation mode)
5. Text Command (same keyword parser as dashboard)
6. Developer Spec (link to this document)
7. Footer: **WAE Limited, HQ- H18 Sector 63 NOIDA INDIA**

#### 4.4.3 Machine Register
**Pairing options:**
- **Bluetooth:** manual UUID input or scan. Default UUID: `0000ffe2-0000-1000-8000-00805f9b34fb`
- **QR Code:** camera scan, reads UUID/serial from QR

**Machine naming:**
- Random name on pairing from pool: `VAR 100`, `AquaTap`, `AquaSync`, `Annon`, `HydraUnit`, `ClearFlow`, `PureStream`, `NovaDrop`, `AquaVault`, `HydraMax`
- User can edit or shuffle name

**Registered machines list:**
- Shows: name, UUID (truncated), serial, pairing method
- Tap ✕ to remove

---

## 5. Bluetooth / BLE Integration

| Item | Value |
|---|---|
| Default Service UUID | `0000ffe2-0000-1000-8000-00805f9b34fb` |
| TDS Characteristic | Notify/Read — float ppm |
| Temperature Characteristic | Notify/Read — float °C per mode |
| pH Characteristic | Notify/Read — float |
| Dispense Control Characteristic | Write — command bytes |

> Confirm exact UUIDs with hardware team. App supports manual UUID override.

### 5.1 Connection Flow
1. Open Machine Register → Bluetooth
2. Scan or enter UUID manually
3. Connect, discover services
4. Save to local storage as active machine
5. Stream sensor data via BLE notifications

### 5.2 Dispense Command Format
Suggested: `HOT:250`, `COLD:500`, `AMB:1000` — confirm with hardware team.

### 5.3 Simulation Mode
- Auto-activates when no BLE device connected
- TDS drifts 55–290 ppm; temp drifts per mode
- All simulated events logged to console

---

## 6. Firebase Integration

### 6.1 Services
- Firebase Auth (anonymous)
- Cloud Firestore (dispense history)

### 6.2 Firestore Schema
```
Collection: dispense_logs
  userId: string
  mode: "HOT" | "COLD" | "AMBIENT"
  volume: number (ml)
  tds: number (ppm)
  ph: number
  timestamp: Timestamp
  duration: number (ms)
```

### 6.3 Security Rules
- Users can only read/write their own documents (matched by userId)

---

## 7. Hot Water Safety Lock

| State | Behaviour |
|---|---|
| Locked | 🔒 shown. Hold 2s to unlock. Ring animates during hold. |
| Released early | Ring resets, stays locked. |
| Unlocked | 🔓 shown. Tap to dispense. 30s silent auto re-lock starts. |
| Auto re-locked | Lock re-engages after 30s. No countdown shown. |
| Dispensing | 🔥 + live temp + LIVE badge inside circle. |

---

## 8. Rule-Based Insights Engine

```
TDS Rules:
  < 50 ppm    → "Error: water may lack essential minerals."
  50–150 ppm  → "Excellent: ideal mineral balance."
  150–300 ppm → "Good: safe and within acceptable standards."
  > 300 ppm   → "Service Required: TDS too high, inspect filter."

pH Rules:
  < 6.5       → "Slightly acidic. Check filter."
  6.5–8.5     → "pH balanced — ideal drinking range."
  > 8.5       → "Slightly alkaline. Monitor levels."

Purity % = (tdsScore × 0.7) + (phScore × 0.3)
  TDS scores: <50=20, 50-150=100, 150-300=80, >300=20
  pH scores:  <6.5=70, 6.5-8.5=100, >8.5=70
```

---

## 9. Keyword Command Parser

| Keywords | Action |
|---|---|
| `cold`, `cool`, `chilled` | Mode = COLD |
| `hot`, `warm`, `boiled` | Mode = HOT |
| `ambient`, `normal`, `room` | Mode = AMBIENT |
| `cup`, `small`, `250` | Volume = 250 ml |
| `bottle`, `medium`, `500` | Volume = 500 ml |
| `large`, `big`, `1000`, `1l` | Volume = 1000 ml |

---

## 10. Dispensing Flow

1. Select mode + volume on Control tab
2. For Hot: hold unlock 2s → unlocked
3. Tap/hold dispense button
4. Send BLE command (or simulate)
5. Progress ring animates; live temp shown inside circle with LIVE badge
6. On complete: log to Firestore, show toast
7. For Hot: auto re-lock after 30s

Estimated durations: 250ml ≈ 5s, 500ml ≈ 10s, 1000ml ≈ 20s (adjust per hardware flow rate)

---

## 11. Deliverables Checklist

- [ ] Android APK / AAB
- [ ] Glassmorphic dark UI (matching spec)
- [ ] BLE connectivity (confirmed UUIDs)
- [ ] Simulation mode
- [ ] Hot water 2-second safety lock + auto re-lock
- [ ] TDS + pH sparklines
- [ ] TDS Purification Level bar (4 zones)
- [ ] Temperature Mode section (Hot/Cold/Ambient cards)
- [ ] Dispense circle with live temp inside
- [ ] Rule-based insights engine
- [ ] Keyword command parser
- [ ] Firebase Auth + Firestore history logging
- [ ] Machine Register (BT + QR, manual UUID, random names)
- [ ] Water Purification Flow animation
- [ ] Company info footer in Settings
- [ ] Spec document accessible in app

---

## 12. Developer Notes

- Actual BLE UUIDs must be confirmed with WAE hardware team before integration.
- Firebase project credentials will be provided separately.
- "Google Sign-In" is a placeholder for future implementation.
- All insight logic is deterministic — no external AI/ML.
- Contact: [Please fill in before sharing this document]

---

*End of AquaSync WAE Android Developer Specification v1.0*

// Floor plan layout config for the CE office.
// Edit coordinates here to reposition desks, rooms, or zones — no component changes needed.

export const FLOOR_CANVAS = { width: 548, height: 636 };

export const DESK_POSITIONS: Record<string, { x: number; y: number }> = {
  // Zona A — top row
  A01: { x: 72,  y: 24 },
  A02: { x: 130, y: 24 },
  A03: { x: 188, y: 24 },
  A04: { x: 246, y: 24 },
  A05: { x: 304, y: 24 },
  A06: { x: 362, y: 24 },

  // Zona B — left pods
  B01: { x: 72,  y: 108 },
  B02: { x: 130, y: 108 },
  B03: { x: 72,  y: 162 },
  B04: { x: 130, y: 162 },

  B05: { x: 72,  y: 240 },
  B06: { x: 130, y: 240 },
  B07: { x: 72,  y: 294 },
  B08: { x: 130, y: 294 },

  B09: { x: 72,  y: 372 },
  B10: { x: 130, y: 372 },
  B11: { x: 72,  y: 426 },
  B12: { x: 130, y: 426 },

  // Zona C — right block
  C01: { x: 248, y: 108 },
  C02: { x: 306, y: 108 },
  C03: { x: 364, y: 108 },
  C04: { x: 248, y: 162 },
  C05: { x: 306, y: 162 },
  C06: { x: 364, y: 162 },

  // GG area
  GG01: { x: 100, y: 498 },
};

export interface RoomBox {
  label: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  muted?: boolean;
}

export const ROOM_BOXES: RoomBox[] = [
  { label: "Oficina OE", x: 424, y: 24,  w: 116, h: 44 },
  { label: "HR",         x: 4,   y: 108 },
  { label: "FIN",        x: 4,   y: 162 },
  { label: "BD",         x: 4,   y: 240 },
  { label: "SD",         x: 4,   y: 294 },
  { label: "OE",         x: 4,   y: 372 },
  { label: "Sala",       x: 4,   y: 426 },
  { label: "Ops",        x: 4,   y: 498, muted: true },
  { label: "GG",         x: 4,   y: 554 },
  { label: "Meeting Room", x: 72, y: 560, w: 248, h: 48, muted: true },
];

export interface GroupBorder {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const GROUP_BORDERS: GroupBorder[] = [
  { x: 68, y: 104, w: 120, h: 112 },
  { x: 68, y: 236, w: 120, h: 112 },
  { x: 68, y: 368, w: 120, h: 112 },
];

export const ZONE_LABELS: Array<{ text: string; x: number; y: number }> = [
  { text: "Zona A", x: 72,  y: 12 },
  { text: "Zona B", x: 72,  y: 92 },
  { text: "Zona C", x: 248, y: 92 },
];

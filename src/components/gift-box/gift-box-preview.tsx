import * as React from "react";

import { GIFT_ITEMS, getGiftBox, type GiftBoxConfig, type GiftItemId } from "@/lib/gift-box/catalog";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 470;
const CENTER_X = VIEW_WIDTH / 2;
const RIM_BACK_Y = 120;
const FLOOR_BACK_Y = 225;
const WALL_TOP_Y = 300;
const WALL_HEIGHT = 140;
/** How far the back of the box narrows on each side, to suggest perspective. */
const BACK_INSET = 36;
const FRONT_ROW_Y = WALL_TOP_Y + 15;
const BACK_ROW_Y = FLOOR_BACK_Y + 5;
const MAX_ITEMS_PER_ROW = 4;
const MAX_ITEM_SCALE = 1.15;

interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Quarter turn for tall, narrow surfaces such as a pen barrel. */
  rotate?: boolean;
}

interface ItemArt {
  width: number;
  height: number;
  print: PrintArea;
  /** Drawn with the base at the origin, growing upward. */
  body: React.ReactNode;
}

const OUTLINE = { stroke: "var(--color-hairline)", strokeWidth: 1.5 };

const ITEM_ART: Record<GiftItemId, ItemArt> = {
  mug: {
    width: 124,
    height: 110,
    print: { x: -34, y: -96, width: 68, height: 62 },
    body: (
      <>
        <path
          d="M42 -88 h14 a18 18 0 0 1 18 18 v14 a18 18 0 0 1 -18 18 h-14"
          fill="none"
          stroke="var(--color-surface-tint)"
          strokeWidth="10"
        />
        <rect x="-42" y="-110" width="84" height="110" rx="8" fill="var(--color-surface)" {...OUTLINE} />
        <ellipse cx="0" cy="-108" rx="38" ry="4" fill="var(--color-border)" />
      </>
    ),
  },
  bottle: {
    width: 58,
    height: 190,
    print: { x: -22, y: -112, width: 44, height: 52 },
    body: (
      <>
        <rect x="-11" y="-168" width="22" height="30" fill="var(--color-border)" {...OUTLINE} />
        <rect x="-14" y="-190" width="28" height="26" rx="4" fill="var(--color-teal-dark)" />
        <rect x="-27" y="-146" width="54" height="146" rx="13" fill="var(--color-surface-tint)" {...OUTLINE} />
      </>
    ),
  },
  pen: {
    width: 22,
    height: 170,
    print: { x: -36, y: -91, width: 72, height: 12, rotate: true },
    body: (
      <>
        <path d="M0 0 L-8 -22 H8 Z" fill="var(--color-border)" {...OUTLINE} />
        <rect x="-9" y="-160" width="18" height="138" rx="3" fill="var(--color-surface)" {...OUTLINE} />
        <rect x="-9" y="-170" width="18" height="24" rx="4" fill="var(--color-gold-deep)" />
        <rect x="7" y="-168" width="3" height="42" rx="1.5" fill="var(--color-gold-deep)" />
      </>
    ),
  },
  notebook: {
    width: 112,
    height: 150,
    print: { x: -32, y: -128, width: 76, height: 80 },
    body: (
      <>
        <rect x="-56" y="-150" width="112" height="150" rx="6" fill="var(--color-gold)" {...OUTLINE} />
        <rect x="-56" y="-150" width="14" height="150" rx="4" fill="var(--color-gold-deep)" />
        <rect x="44" y="-150" width="4" height="150" fill="var(--color-gold-deep)" />
      </>
    ),
  },
};

function ArtWithLogo({ id, logoUrl }: { id: GiftItemId; logoUrl?: string }) {
  const { body, print } = ITEM_ART[id];
  const rotation = print.rotate
    ? `rotate(-90 ${print.x + print.width / 2} ${print.y + print.height / 2})`
    : undefined;
  return (
    <>
      {body}
      {logoUrl && (
        <image
          href={logoUrl}
          x={print.x}
          y={print.y}
          width={print.width}
          height={print.height}
          transform={rotation}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </>
  );
}

/** A single product on its own, for the product grid. */
export function GiftItemThumbnail({ id, logoUrl }: { id: GiftItemId; logoUrl?: string }) {
  const { height } = ITEM_ART[id];
  // Square frame around the tallest item, so every product keeps its true proportions.
  const frame = 200;
  return (
    <svg viewBox={`${-frame / 2} ${-frame + 5} ${frame} ${frame}`} className="h-full w-full" aria-hidden>
      <g transform={`translate(0 ${-(frame - 10 - height) / 2})`}>
        <ArtWithLogo id={id} logoUrl={logoUrl} />
      </g>
    </svg>
  );
}

/** Lays items out in up to two rows, tallest at the back so front items don't hide them. */
function placeItems(items: GiftBoxConfig["items"], boxWidth: number) {
  const pieces = GIFT_ITEMS.flatMap((item) =>
    Array.from({ length: items[item.id] ?? 0 }, (_, index) => ({ id: item.id, key: `${item.id}-${index}` })),
  ).sort((a, b) => ITEM_ART[b.id].height - ITEM_ART[a.id].height);
  if (pieces.length === 0) return [];

  const rows = pieces.length > MAX_ITEMS_PER_ROW ? [pieces.slice(0, MAX_ITEMS_PER_ROW), pieces.slice(MAX_ITEMS_PER_ROW)] : [pieces];
  const usableWidth = boxWidth - 40;
  const perRow = Math.max(...rows.map((row) => row.length));
  const widest = Math.max(...pieces.map((piece) => ITEM_ART[piece.id].width));
  // One scale for every item keeps a pen smaller than a mug, whatever else is in the box.
  const scale = Math.min(MAX_ITEM_SCALE, (usableWidth / perRow - 6) / widest);

  return rows.flatMap((row, rowIndex) => {
    const baseline = rows.length > 1 && rowIndex === 0 ? BACK_ROW_Y : FRONT_ROW_Y;
    const cell = usableWidth / row.length;
    const left = CENTER_X - usableWidth / 2;
    return row.map((piece, index) => ({
      ...piece,
      x: left + cell * (index + 0.5),
      y: baseline,
      scale,
    }));
  });
}

interface GiftBoxPreviewProps {
  config: GiftBoxConfig;
  className?: string;
}

export function GiftBoxPreview({ config, className }: GiftBoxPreviewProps) {
  const box = getGiftBox(config.boxId);
  const placed = placeItems(config.items, box.previewWidth);
  const logoUrl = config.logo?.dataUrl;

  const left = CENTER_X - box.previewWidth / 2;
  const right = CENTER_X + box.previewWidth / 2;
  const backLeft = left + BACK_INSET;
  const backRight = right - BACK_INSET;

  const itemNames = GIFT_ITEMS.filter((item) => config.items[item.id]).map(
    (item) => `${config.items[item.id]} ${item.name}`,
  );
  const label = `${box.name} preview${itemNames.length ? ` containing ${itemNames.join(", ")}` : ", empty"}${
    logoUrl ? ", with your logo on the box and products" : ""
  }.`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={label}
      className={className}
    >
      <ellipse cx={CENTER_X} cy={WALL_TOP_Y + WALL_HEIGHT + 6} rx={box.previewWidth / 2 + 16} ry="16" fill="var(--color-teal)" opacity="0.16" />

      {/* Inside of the box: back wall, side walls, floor */}
      <g fill={box.wallColor}>
        <rect x={backLeft} y={RIM_BACK_Y} width={backRight - backLeft} height={FLOOR_BACK_Y - RIM_BACK_Y} />
        <path d={`M${left} ${WALL_TOP_Y} L${backLeft} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} />
        <path d={`M${right} ${WALL_TOP_Y} L${backRight} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} />
        <path d={`M${left} ${WALL_TOP_Y} L${backLeft} ${FLOOR_BACK_Y} H${backRight} L${right} ${WALL_TOP_Y} Z`} />
      </g>
      <g fill="#000">
        <rect x={backLeft} y={RIM_BACK_Y} width={backRight - backLeft} height={FLOOR_BACK_Y - RIM_BACK_Y} opacity="0.3" />
        <path d={`M${left} ${WALL_TOP_Y} L${backLeft} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} opacity="0.42" />
        <path d={`M${right} ${WALL_TOP_Y} L${backRight} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} opacity="0.42" />
        <path d={`M${left} ${WALL_TOP_Y} L${backLeft} ${FLOOR_BACK_Y} H${backRight} L${right} ${WALL_TOP_Y} Z`} opacity="0.5" />
      </g>

      {placed.map((piece) => (
        <g key={piece.key} transform={`translate(${piece.x} ${piece.y}) scale(${piece.scale})`}>
          {/* Inner group: the entrance animation's transform must not replace the placement above. */}
          <g className="pg-rise">
            <ArtWithLogo id={piece.id} logoUrl={logoUrl} />
          </g>
        </g>
      ))}

      {/* Front wall sits over the items' bases, so they read as inside the box. */}
      <rect x={left} y={WALL_TOP_Y} width={box.previewWidth} height={WALL_HEIGHT} rx="4" fill={box.wallColor} />
      <rect x={left} y={WALL_TOP_Y} width={box.previewWidth} height="8" fill={box.accentColor} />
      {logoUrl ? (
        <>
          <rect x={CENTER_X - 76} y={WALL_TOP_Y + 22} width="152" height="104" rx="6" fill="var(--color-surface)" />
          <image
            href={logoUrl}
            x={CENTER_X - 68}
            y={WALL_TOP_Y + 30}
            width="136"
            height="88"
            preserveAspectRatio="xMidYMid meet"
          />
        </>
      ) : (
        <text
          x={CENTER_X}
          y={WALL_TOP_Y + 80}
          textAnchor="middle"
          fontSize="16"
          fontWeight="500"
          fill="var(--color-surface)"
          opacity="0.75"
        >
          Your logo here
        </text>
      )}
    </svg>
  );
}

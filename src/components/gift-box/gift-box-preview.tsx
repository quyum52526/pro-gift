"use client";

import * as React from "react";
import { Package, PackageOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GIFT_ITEMS,
  getGiftBox,
  type GiftBox,
  type GiftBoxConfig,
  type GiftItemId,
} from "@/lib/gift-box/catalog";
import { cn } from "@/lib/utils";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 470;
const CENTER_X = VIEW_WIDTH / 2;
const RIM_BACK_Y = 120;
const FLOOR_BACK_Y = 225;
const WALL_TOP_Y = 300;
const WALL_HEIGHT = 140;
/** How far the back of the box narrows on each side, to suggest perspective. */
const BACK_INSET = 36;
const SINGLE_ROW_Y = 272;
const FRONT_ROW_Y = 283;
const BACK_ROW_Y = 244;
const MAX_ITEMS_IN_SINGLE_ROW = 3;
const MAX_SCALE_SINGLE_ROW = 1;
const MAX_SCALE_TWO_ROWS = 0.85;
const ROW_MARGIN = 24;
const FOAM_COLOR = "#6b7278";
const LID_FRONT_Y = 250;
const LID_BACK_Y = 130;
const LID_OVERHANG = 8;

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
  /** Half-size of the hole this item sits in; `square` for flat-based items. */
  cutout: { rx: number; ry: number; square?: boolean };
  /** Drawn with the base at the origin, growing upward. */
  body: React.ReactNode;
}

const OUTLINE = { stroke: "var(--color-hairline)", strokeWidth: 1.5 };

const ITEM_ART: Record<GiftItemId, ItemArt> = {
  mug: {
    width: 124,
    height: 110,
    print: { x: -34, y: -96, width: 68, height: 62 },
    cutout: { rx: 54, ry: 15 },
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
    cutout: { rx: 38, ry: 12 },
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
    cutout: { rx: 18, ry: 8 },
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
    cutout: { rx: 66, ry: 12, square: true },
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

/** How far the foam's edge has moved in at this height, following the box's perspective. */
function insetAt(y: number) {
  return (BACK_INSET * (WALL_TOP_Y - y)) / (WALL_TOP_Y - FLOOR_BACK_Y);
}

/** One row up to three items, then two rows with the tallest at the back so nothing is hidden. */
function placeItems(items: GiftBoxConfig["items"], boxWidth: number) {
  const pieces = GIFT_ITEMS.flatMap((item) =>
    Array.from({ length: items[item.id] ?? 0 }, (_, index) => ({ id: item.id, key: `${item.id}-${index}` })),
  ).sort((a, b) => ITEM_ART[b.id].height - ITEM_ART[a.id].height);
  if (pieces.length === 0) return [];

  const backCount = Math.ceil(pieces.length / 2);
  const rows =
    pieces.length > MAX_ITEMS_IN_SINGLE_ROW
      ? [
          { pieces: pieces.slice(0, backCount), y: BACK_ROW_Y },
          { pieces: pieces.slice(backCount), y: FRONT_ROW_Y },
        ]
      : [{ pieces, y: SINGLE_ROW_Y }];
  const rowWidth = (y: number) => boxWidth - ROW_MARGIN * 2 - insetAt(y) * 2;
  const widest = Math.max(...pieces.map((piece) => ITEM_ART[piece.id].width));
  // One scale for every item keeps a pen smaller than a mug, whatever else is in the box.
  const scale = Math.min(
    rows.length > 1 ? MAX_SCALE_TWO_ROWS : MAX_SCALE_SINGLE_ROW,
    ...rows.map((row) => (rowWidth(row.y) / row.pieces.length - 6) / widest),
  );

  return rows.flatMap((row) => {
    const width = rowWidth(row.y);
    const cell = width / row.pieces.length;
    return row.pieces.map((piece, index) => ({
      ...piece,
      x: CENTER_X - width / 2 + cell * (index + 0.5),
      y: row.y,
      scale,
    }));
  });
}

function Cutout({ id }: { id: GiftItemId }) {
  const { rx, ry, square } = ITEM_ART[id].cutout;
  const hole = { fill: "#000", fillOpacity: 0.8, stroke: "#fff", strokeOpacity: 0.4, strokeWidth: 2 };
  return square ? (
    <rect x={-rx} y={-ry} width={rx * 2} height={ry * 2} rx="3" {...hole} />
  ) : (
    <ellipse rx={rx} ry={ry} {...hole} />
  );
}

function OpenBox({ box, config }: { box: GiftBox; config: GiftBoxConfig }) {
  const foamPatternId = `foam-${React.useId().replace(/\W/g, "")}`;
  const placed = placeItems(config.items, box.previewWidth);
  const logoUrl = config.logo?.dataUrl;

  const left = CENTER_X - box.previewWidth / 2;
  const right = CENTER_X + box.previewWidth / 2;
  const backLeft = left + BACK_INSET;
  const backRight = right - BACK_INSET;
  const foamPath = `M${left} ${WALL_TOP_Y} L${backLeft} ${FLOOR_BACK_Y} H${backRight} L${right} ${WALL_TOP_Y} Z`;

  return (
    <>
      <defs>
        {/* Egg-crate foam, flattened to lie on the box's floor. */}
        <pattern
          id={foamPatternId}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1 0.6)"
        >
          <circle cx="7" cy="7" r="5" fill="#fff" opacity="0.1" />
          <circle cx="0" cy="0" r="4" fill="#000" opacity="0.28" />
          <circle cx="14" cy="0" r="4" fill="#000" opacity="0.28" />
          <circle cx="0" cy="14" r="4" fill="#000" opacity="0.28" />
          <circle cx="14" cy="14" r="4" fill="#000" opacity="0.28" />
        </pattern>
      </defs>

      {/* Inside of the box: back wall and side walls */}
      <g fill={box.wallColor}>
        <rect x={backLeft} y={RIM_BACK_Y} width={backRight - backLeft} height={FLOOR_BACK_Y - RIM_BACK_Y} />
        <path d={`M${left} ${WALL_TOP_Y} L${backLeft} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} />
        <path d={`M${right} ${WALL_TOP_Y} L${backRight} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} />
      </g>
      <g fill="#000">
        <rect x={backLeft} y={RIM_BACK_Y} width={backRight - backLeft} height={FLOOR_BACK_Y - RIM_BACK_Y} opacity="0.3" />
        <path d={`M${left} ${WALL_TOP_Y} L${backLeft} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} opacity="0.42" />
        <path d={`M${right} ${WALL_TOP_Y} L${backRight} ${RIM_BACK_Y} V${FLOOR_BACK_Y} Z`} opacity="0.42" />
      </g>

      <path d={foamPath} fill={FOAM_COLOR} />
      <path d={foamPath} fill={`url(#${foamPatternId})`} />

      {/* Every hole goes down first, so no item is ever covered by a neighbour's cutout. */}
      {placed.map((piece) => (
        <g key={piece.key} transform={`translate(${piece.x} ${piece.y}) scale(${piece.scale})`}>
          <Cutout id={piece.id} />
        </g>
      ))}
      {placed.map((piece) => (
        <g key={piece.key} transform={`translate(${piece.x} ${piece.y}) scale(${piece.scale})`}>
          {/* Inner group: the entrance animation's transform must not replace the placement above. */}
          <g className="pg-rise">
            <ArtWithLogo id={piece.id} logoUrl={logoUrl} />
          </g>
        </g>
      ))}

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
    </>
  );
}

function ClosedBox({ box, logoUrl }: { box: GiftBox; logoUrl?: string }) {
  const baseLeft = CENTER_X - box.previewWidth / 2;
  const left = baseLeft - LID_OVERHANG;
  const width = box.previewWidth + LID_OVERHANG * 2;
  const lidFrontHeight = WALL_TOP_Y + 12 - LID_FRONT_Y;

  /** Maps a spot on the lid to the drawing: u runs left to right, v from front edge to back edge. */
  const onLid = (u: number, v: number) => {
    const inset = BACK_INSET * v;
    return {
      x: left + inset + (width - inset * 2) * u,
      y: LID_FRONT_Y + (LID_BACK_Y - LID_FRONT_Y) * v,
    };
  };
  const quad = (u0: number, v0: number, u1: number, v1: number) =>
    [onLid(u0, v0), onLid(u1, v0), onLid(u1, v1), onLid(u0, v1)]
      .map(({ x, y }) => `${x},${y}`)
      .join(" ");

  const ribbonU = 0.2;
  const ribbonV = 0.72;
  const ribbonHalf = 0.035;
  const ribbonLeft = onLid(ribbonU - ribbonHalf, 0).x;
  const ribbonWidth = onLid(ribbonU + ribbonHalf, 0).x - ribbonLeft;
  const bow = onLid(ribbonU, ribbonV);
  // The ribbon crosses off-centre to leave the lid's open area for the logo.
  const label = onLid(0.62, 0.34);
  const labelWidth = width * 0.46;
  const logoHeight = 92;
  // Flattens the upright logo to match the lid's viewing angle.
  const squash = 0.6;

  return (
    <g className="pg-rise">
      <rect x={baseLeft} y={WALL_TOP_Y} width={box.previewWidth} height={WALL_HEIGHT} rx="4" fill={box.wallColor} />
      <rect x={baseLeft} y={WALL_TOP_Y} width={box.previewWidth} height={WALL_HEIGHT} rx="4" fill="#000" opacity="0.18" />

      {/* Lid */}
      <polygon points={quad(0, 0, 1, 1)} fill={box.wallColor} />
      <rect x={left} y={LID_FRONT_Y} width={width} height={lidFrontHeight} rx="3" fill={box.wallColor} />
      <rect x={left} y={LID_FRONT_Y} width={width} height={lidFrontHeight} rx="3" fill="#000" opacity="0.1" />

      {/* Ribbon */}
      <g fill={box.accentColor}>
        <polygon points={quad(0, ribbonV - 0.07, 1, ribbonV + 0.07)} />
        <polygon points={quad(ribbonU - ribbonHalf, 0, ribbonU + ribbonHalf, 1)} />
        <rect x={ribbonLeft} y={LID_FRONT_Y} width={ribbonWidth} height={WALL_TOP_Y + WALL_HEIGHT - LID_FRONT_Y} />
      </g>

      {/* Logo on the lid */}
      <g transform={`translate(${label.x} ${label.y}) scale(1 ${squash})`}>
        <rect
          x={-labelWidth / 2}
          y={-logoHeight / 2 - 8}
          width={labelWidth}
          height={logoHeight + 16}
          rx="6"
          fill="var(--color-surface)"
        />
        {logoUrl ? (
          <image
            href={logoUrl}
            x={-labelWidth / 2 + 8}
            y={-logoHeight / 2}
            width={labelWidth - 16}
            height={logoHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <text textAnchor="middle" y="6" fontSize="18" fontWeight="500" fill="var(--color-muted-foreground)">
            Your logo here
          </text>
        )}
      </g>

      {/* Bow */}
      <g
        transform={`translate(${bow.x} ${bow.y}) scale(1.2)`}
        fill={box.accentColor}
        // Light edge so the loops stay separate on a dark ribbon as well as a gold one.
        stroke="var(--color-surface)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      >
        <path d="M-5 2 L-30 44 L-16 40 L-10 52 L6 4 Z" />
        <path d="M5 2 L32 40 L18 38 L14 50 L-6 4 Z" />
        <path d="M0 0 C-22 -34 -66 -32 -62 -6 C-60 12 -22 12 0 0 Z" />
        <path d="M0 0 C22 -34 66 -32 62 -6 C60 12 22 12 0 0 Z" />
        <rect x="-11" y="-11" width="22" height="20" rx="6" />
      </g>
    </g>
  );
}

interface GiftBoxPreviewProps {
  config: GiftBoxConfig;
  closed?: boolean;
  className?: string;
}

export function GiftBoxPreview({ config, closed = false, className }: GiftBoxPreviewProps) {
  const box = getGiftBox(config.boxId);
  const logoUrl = config.logo?.dataUrl;

  const itemNames = GIFT_ITEMS.filter((item) => config.items[item.id]).map(
    (item) => `${config.items[item.id]} ${item.name}`,
  );
  const label = closed
    ? `Closed ${box.name} with a ribbon and bow${logoUrl ? ", with your logo on the lid" : ""}.`
    : `${box.name} preview${itemNames.length ? ` with foam cutouts holding ${itemNames.join(", ")}` : ", empty"}${
        logoUrl ? ", with your logo on the box and products" : ""
      }.`;

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={label} className={className}>
      <ellipse
        cx={CENTER_X}
        cy={WALL_TOP_Y + WALL_HEIGHT + 6}
        rx={box.previewWidth / 2 + 16}
        ry="16"
        fill="var(--color-teal)"
        opacity="0.16"
      />
      {closed ? <ClosedBox box={box} logoUrl={logoUrl} /> : <OpenBox box={box} config={config} />}
    </svg>
  );
}

/** The preview with its open/close control. */
export function GiftBoxPreviewPanel({ config, className }: { config: GiftBoxConfig; className?: string }) {
  // Remembers which contents were closed, so changing them reopens the box to show the change.
  const contents = JSON.stringify(config.items);
  const [closedContents, setClosedContents] = React.useState<string | null>(null);
  const closed = closedContents === contents;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-surface-tint/60 p-2", className)}>
      <GiftBoxPreview config={config} closed={closed} className="block h-auto w-full" />
      <Button
        variant="outline"
        size="sm"
        aria-pressed={closed}
        onClick={() => setClosedContents(closed ? null : contents)}
        className="absolute top-3 right-3"
      >
        {closed ? <PackageOpen className="h-4 w-4" aria-hidden /> : <Package className="h-4 w-4" aria-hidden />}
        {closed ? "Open box" : "Close box"}
      </Button>
    </div>
  );
}

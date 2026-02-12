// @ts-nocheck
import * as PIXI from 'pixi.js';

// ═══════════════════════════════════════════════════════════════
//  HIGH-FIDELITY PROCEDURAL CHARACTER SYSTEM
//  Multi-layer rendering with organic bezier contours,
//  built-in shading, realistic proportions, and
//  natural joint transitions via overlap.
// ═══════════════════════════════════════════════════════════════

// ─── Color Palette ───
const SKIN = 0xC68642;
const SKIN_HI = 0xDDB87A;
const SKIN_SH = 0x8B4513;
const SKIN_DEEP = 0x6B3410;

const HAIR = 0x1A1A1A;
const HAIR_HI = 0x383848;

const BOY_SHIRT = 0xFFD740;
const BOY_SHIRT_SH = 0xE6B800;
const BOY_SHIRT_HI = 0xFFE57F;
const BOY_PANTS = 0x2979FF;
const BOY_PANTS_SH = 0x1565C0;

const GIRL_SUIT = 0xF50057;
const GIRL_SUIT_SH = 0xC51162;
const GIRL_SUIT_HI = 0xFF4081;
const GIRL_STRIPE = 0xFFFFFF;

const WHITE = 0xFFFFFF;
const BLACK = 0x000000;

// Line weights (varied for depth)
const OL = 0x1A0E05;
const OW_BODY = 2.2;
const OW_DETAIL = 1.4;
const OW_FINE = 0.8;

const BOY_SHOES = [0x43A047, 0xE53935, 0x00ACC1];
const GIRL_SHOES = [0xF48FB1, 0xCE93D8, 0xF48FB1];

export interface CharRefs { root: PIXI.Container; }

// ═══════════════════════════════════════════════════════════════
//  CORE SHAPES
// ═══════════════════════════════════════════════════════════════

/**
 * Draw an organic limb with natural muscle contour.
 * Uses bezier curves for both sides (outer with muscle bulge,
 * inner straighter). Ends are open (no caps) — the overlapping
 * upper layer covers the joint seam.
 */
function limb(
    g: PIXI.Graphics,
    x1: number, y1: number, w1: number,
    x2: number, y2: number, w2: number,
    fill: number,
    shadow: number,
    outerBulge = 2.5,
    innerBulge = 0.5
) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len;

    // Midpoint
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const mwO = (w1 + w2) / 2 + outerBulge;
    const mwI = (w1 + w2) / 2 + innerBulge;

    // Four corners
    const tL = { x: x1 + nx * w1, y: y1 + ny * w1 };
    const tR = { x: x1 - nx * w1, y: y1 - ny * w1 };
    const bL = { x: x2 + nx * w2, y: y2 + ny * w2 };
    const bR = { x: x2 - nx * w2, y: y2 - ny * w2 };

    // ── Main fill ──
    g.lineStyle(OW_BODY, OL, 1, 0.5, true);
    g.beginFill(fill);
    g.moveTo(tL.x, tL.y);
    // Outer contour (muscle bulge)
    g.quadraticCurveTo(mx + nx * mwO, my + ny * mwO, bL.x, bL.y);
    // Bottom edge
    g.lineTo(bR.x, bR.y);
    // Inner contour (straighter)
    g.quadraticCurveTo(mx - nx * mwI, my - ny * mwI, tR.x, tR.y);
    // Top edge
    g.lineTo(tL.x, tL.y);
    g.closePath();
    g.endFill();

    // ── Shadow strip (inner side) ──
    g.lineStyle(0);
    g.beginFill(shadow, 0.22);
    g.moveTo(tR.x, tR.y);
    g.quadraticCurveTo(
        mx - nx * (mwI - 1), my - ny * (mwI - 1),
        bR.x, bR.y
    );
    g.lineTo(
        (bR.x + x2) / 2, (bR.y + y2) / 2
    );
    g.quadraticCurveTo(
        mx - nx * (mwI - 4), my - ny * (mwI - 4),
        (tR.x + x1) / 2, (tR.y + y1) / 2
    );
    g.closePath();
    g.endFill();

    // ── Highlight (outer edge) ──
    g.lineStyle(1.5, WHITE, 0.08);
    g.moveTo(tL.x, tL.y);
    g.quadraticCurveTo(mx + nx * mwO, my + ny * mwO, bL.x, bL.y);
}

/** Simple filled circle (no outline) */
function blob(g: PIXI.Graphics, x: number, y: number, r: number, fill: number, a = 1) {
    g.lineStyle(0);
    g.beginFill(fill, a);
    g.drawCircle(x, y, r);
    g.endFill();
}

// ═══════════════════════════════════════════════════════════════
//  MAIN CHARACTER FACTORY
// ═══════════════════════════════════════════════════════════════
export function makeCharacter(type: 'boy' | 'girl', facing: number, idx: number): CharRefs {
    const root = new PIXI.Container();
    const isBoy = type === 'boy';

    const SHIRT = isBoy ? BOY_SHIRT : GIRL_SUIT;
    const SHIRT_S = isBoy ? BOY_SHIRT_SH : GIRL_SUIT_SH;
    const PANTS = isBoy ? BOY_PANTS : GIRL_SUIT;
    const PANTS_S = isBoy ? BOY_PANTS_SH : GIRL_SUIT_SH;
    const SHOE = isBoy ? BOY_SHOES[idx % 3] : GIRL_SHOES[idx % 3];

    // ═══ SKELETON ═══
    // More realistic proportions (~5.5 heads tall for kids)
    const LEAN = -48;

    // Feet (planted, wide stance)
    const fAnk = { x: 34, y: -8 };
    const bAnk = { x: -26, y: -8 };

    // Knees (bent for pulling)
    const fKnee = { x: 24, y: -46 };
    const bKnee = { x: -17, y: -44 };

    // Hips
    const fHip = { x: 8, y: -76 };
    const bHip = { x: -8, y: -76 };

    // Torso
    const waist = { x: LEAN * 0.3, y: -82 };
    const chest = { x: LEAN * 0.85, y: -114 };
    const neckPt = { x: LEAN * 0.88, y: -120 };

    // Shoulders
    const shB = { x: LEAN - 12, y: -110 };
    const shF = { x: LEAN + 16, y: -110 };

    // Head (proportionally large for kids, but not chibi)
    const hd = { x: LEAN * 0.9, y: -138 };
    const HR = 17;

    // Arms → reaching to rope grip
    const grip = { x: 14, y: -88 };
    const bElb = { x: shB.x + 12, y: shB.y + 20 };
    const fElb = { x: shF.x + 8, y: shF.y + 20 };

    // ═══════════════════════════════════════════════════
    // Render using multiple Graphics layers for clean overlap.
    // Draw order within each layer: LOWER part first,
    // then UPPER part on top (hides joint seam).
    // ═══════════════════════════════════════════════════

    // ── Layer 0: Ground shadow ──
    const shadowG = new PIXI.Graphics();
    shadowG.lineStyle(0);
    shadowG.beginFill(0x000000, 0.12);
    shadowG.drawEllipse(0, -1, 44, 6);
    shadowG.endFill();
    root.addChild(shadowG);

    // ── Layer 1: Back leg ──
    const backLegG = new PIXI.Graphics();
    // SHIN first (will be covered at knee by thigh)
    if (isBoy) {
        limb(backLegG, bKnee.x, bKnee.y, 8, bAnk.x, bAnk.y, 6, SKIN, SKIN_SH, 2, 0.5);
        // Sock
        backLegG.lineStyle(OW_DETAIL, OL, 0.5);
        backLegG.beginFill(WHITE, 0.9);
        backLegG.drawRoundedRect(bAnk.x - 7.5, bAnk.y - 9, 15, 11, 3);
        backLegG.endFill();
        // Sock stripe
        backLegG.lineStyle(1.5, SHOE, 0.5);
        backLegG.moveTo(bAnk.x - 6, bAnk.y - 6);
        backLegG.lineTo(bAnk.x + 6, bAnk.y - 6);
    } else {
        limb(backLegG, bKnee.x, bKnee.y, 8.5, bAnk.x, bAnk.y, 6, PANTS, PANTS_S, 2, 0.5);
        // Racing stripe
        backLegG.lineStyle(0);
        backLegG.beginFill(GIRL_STRIPE, 0.35);
        const sn = 1;
        backLegG.moveTo(bKnee.x + 7, bKnee.y); backLegG.lineTo(bKnee.x + 10, bKnee.y);
        backLegG.lineTo(bAnk.x + 7, bAnk.y); backLegG.lineTo(bAnk.x + 4, bAnk.y);
        backLegG.closePath(); backLegG.endFill();
    }
    drawShoe(backLegG, bAnk.x, bAnk.y, -1, SHOE);
    // THIGH on top (overlaps shin at knee — no joint circle needed)
    limb(backLegG, bHip.x, bHip.y, 11, bKnee.x, bKnee.y, 9, PANTS, PANTS_S, 3, 1);
    // Fabric fold at knee
    backLegG.lineStyle(OW_FINE, PANTS_S, 0.3);
    backLegG.arc(bKnee.x, bKnee.y - 2, 6, 0.3, 2.8);
    root.addChild(backLegG);

    // ── Layer 2: Back arm ──
    const backArmG = new PIXI.Graphics();
    // FOREARM first
    limb(backArmG, bElb.x, bElb.y, 5.5, grip.x - 8, grip.y, 4.5, SKIN, SKIN_SH, 1.5, 0.3);
    // Hand
    drawHand(backArmG, grip.x - 8, grip.y);
    // UPPER ARM on top (overlaps at elbow)
    limb(backArmG, shB.x, shB.y, 7, bElb.x, bElb.y, 6, SHIRT, SHIRT_S, 2, 0.5);
    // Sleeve cuff
    backArmG.lineStyle(OW_FINE, SHIRT_S, 0.4);
    backArmG.arc(bElb.x, bElb.y - 1, 5, 0.2, 2.9);
    // Fabric fold at elbow
    backArmG.lineStyle(OW_FINE, SHIRT_S, 0.2);
    backArmG.arc(bElb.x + 2, bElb.y - 3, 3, 1.5, 3.5);
    root.addChild(backArmG);

    // ── Layer 3: Torso ──
    const torsoG = new PIXI.Graphics();
    drawTorso(torsoG, waist, chest, { x: 0, y: -78 }, shB, shF, isBoy, SHIRT, SHIRT_S);
    root.addChild(torsoG);

    // ── Layer 4: Neck + Head ──
    const headG = new PIXI.Graphics();
    // Neck (hidden behind head and torso overlap)
    headG.lineStyle(OW_BODY, OL);
    headG.beginFill(SKIN);
    headG.moveTo(neckPt.x - 6, neckPt.y);
    headG.bezierCurveTo(neckPt.x - 7, hd.y + HR - 2, neckPt.x + 7, hd.y + HR - 2, neckPt.x + 6, neckPt.y);
    headG.closePath();
    headG.endFill();
    // Neck shadow
    blob(headG, neckPt.x, neckPt.y + 6, 4, SKIN_SH, 0.2);

    drawHead(headG, hd, HR, isBoy, idx);
    root.addChild(headG);

    // ── Layer 5: Front leg ──
    const frontLegG = new PIXI.Graphics();
    // SHIN first
    if (isBoy) {
        limb(frontLegG, fKnee.x, fKnee.y, 9, fAnk.x, fAnk.y, 6.5, SKIN, SKIN_SH, 2.5, 0.5);
        // Sock
        frontLegG.lineStyle(OW_DETAIL, OL, 0.5);
        frontLegG.beginFill(WHITE, 0.9);
        frontLegG.drawRoundedRect(fAnk.x - 8, fAnk.y - 9, 16, 11, 3);
        frontLegG.endFill();
        frontLegG.lineStyle(1.5, SHOE, 0.5);
        frontLegG.moveTo(fAnk.x - 6.5, fAnk.y - 6);
        frontLegG.lineTo(fAnk.x + 6.5, fAnk.y - 6);
    } else {
        limb(frontLegG, fKnee.x, fKnee.y, 9.5, fAnk.x, fAnk.y, 6.5, PANTS, PANTS_S, 2.5, 0.5);
        frontLegG.lineStyle(0);
        frontLegG.beginFill(GIRL_STRIPE, 0.35);
        frontLegG.moveTo(fKnee.x - 9, fKnee.y); frontLegG.lineTo(fKnee.x - 6, fKnee.y);
        frontLegG.lineTo(fAnk.x - 6, fAnk.y); frontLegG.lineTo(fAnk.x - 9, fAnk.y);
        frontLegG.closePath(); frontLegG.endFill();
    }
    drawShoe(frontLegG, fAnk.x, fAnk.y, 1, SHOE);
    // THIGH on top
    limb(frontLegG, fHip.x, fHip.y, 12, fKnee.x, fKnee.y, 9.5, PANTS, PANTS_S, 3.5, 1);
    // Fabric fold at knee
    frontLegG.lineStyle(OW_FINE, PANTS_S, 0.3);
    frontLegG.arc(fKnee.x - 1, fKnee.y - 2, 7, 0.2, 2.9);
    root.addChild(frontLegG);

    // ── Layer 6: Front arm (topmost) ──
    const frontArmG = new PIXI.Graphics();
    // FOREARM first
    limb(frontArmG, fElb.x, fElb.y, 6, grip.x, grip.y, 5, SKIN, SKIN_SH, 2, 0.3);
    // Hand with fingers
    drawHand(frontArmG, grip.x, grip.y);
    // UPPER ARM on top
    limb(frontArmG, shF.x, shF.y, 8, fElb.x, fElb.y, 6.5, SHIRT, SHIRT_S, 2.5, 0.5);
    // Sleeve cuff detail
    frontArmG.lineStyle(OW_FINE, SHIRT_S, 0.4);
    frontArmG.arc(fElb.x - 1, fElb.y - 1, 5.5, 0.2, 2.9);
    // Elbow fabric fold
    frontArmG.lineStyle(OW_FINE, SHIRT_S, 0.2);
    frontArmG.arc(fElb.x + 1, fElb.y - 3, 3, 1.2, 3.8);
    root.addChild(frontArmG);

    // ── Layer 7: Detail overlay ──
    const detailG = new PIXI.Graphics();

    // Sweat droplets
    detailG.lineStyle(0);
    detailG.beginFill(0x81D4FA, 0.55);
    const sx = hd.x + HR + 4, sy = hd.y - 4;
    detailG.moveTo(sx, sy);
    detailG.bezierCurveTo(sx + 3, sy + 4, sx + 3, sy + 8, sx, sy + 9);
    detailG.bezierCurveTo(sx - 3, sy + 8, sx - 3, sy + 4, sx, sy);
    detailG.endFill();
    blob(detailG, sx + 5, sy + 12, 2, 0x81D4FA, 0.3);

    // Effort/speed lines behind shoulders
    detailG.lineStyle(1.5, WHITE, 0.15);
    detailG.moveTo(shB.x - 8, shB.y - 3);
    detailG.lineTo(shB.x - 18, shB.y - 6);
    detailG.moveTo(shB.x - 7, shB.y + 4);
    detailG.lineTo(shB.x - 16, shB.y + 2);
    detailG.moveTo(shB.x - 9, shB.y + 10);
    detailG.lineTo(shB.x - 17, shB.y + 9);

    root.addChild(detailG);

    root.scale.x = facing;
    return { root };
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT DRAWING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function drawTorso(
    g: PIXI.Graphics,
    waist: { x: number; y: number },
    chest: { x: number; y: number },
    hip: { x: number; y: number },
    shB: { x: number; y: number },
    shF: { x: number; y: number },
    isBoy: boolean,
    fill: number,
    shadow: number
) {
    const wSh = 18;  // half-width at shoulders
    const wWa = 13;  // half-width at waist
    const wHi = 14;  // half-width at hips

    // ── Torso body: a smooth organic bezier shape ──
    g.lineStyle(OW_BODY, OL);
    g.beginFill(fill);

    // Start at left shoulder
    g.moveTo(chest.x - wSh, chest.y);
    // Left side: shoulder → waist → hip (S-curve)
    g.bezierCurveTo(
        chest.x - wSh + 2, (chest.y + waist.y) / 2 + 3,
        waist.x - wWa - 1, waist.y - 5,
        hip.x - wHi, hip.y
    );
    // Bottom: across hips (subtle curve)
    g.bezierCurveTo(
        hip.x - 4, hip.y + 4,
        hip.x + 4, hip.y + 4,
        hip.x + wHi, hip.y
    );
    // Right side: hip → waist → shoulder
    g.bezierCurveTo(
        waist.x + wWa + 1, waist.y - 5,
        chest.x + wSh - 2, (chest.y + waist.y) / 2 + 3,
        chest.x + wSh, chest.y
    );
    // Top: across shoulders (slight upward curve for natural shoulder line)
    g.bezierCurveTo(
        chest.x + wSh - 6, chest.y - 6,
        chest.x - wSh + 6, chest.y - 6,
        chest.x - wSh, chest.y
    );
    g.endFill();

    // ── Shading: diagonal shadow fold ──
    g.lineStyle(0);
    g.beginFill(shadow, 0.22);
    g.moveTo(chest.x - wSh + 3, chest.y + 2);
    g.bezierCurveTo(
        chest.x - 8, chest.y + 15,
        waist.x - wWa, waist.y + 3,
        hip.x - wHi + 3, hip.y - 1
    );
    g.lineTo(hip.x - wHi + 10, hip.y - 1);
    g.bezierCurveTo(
        waist.x - wWa + 8, waist.y,
        chest.x - 2, chest.y + 12,
        chest.x - wSh + 12, chest.y + 2
    );
    g.closePath();
    g.endFill();

    // ── Highlight rim (top-left edge) ──
    g.lineStyle(1.5, WHITE, 0.09);
    g.moveTo(chest.x - wSh + 1, chest.y + 1);
    g.bezierCurveTo(
        chest.x - wSh, (chest.y + waist.y) / 2,
        waist.x - wWa, waist.y,
        hip.x - wHi + 1, hip.y - 1
    );

    // ── Clothing details ──
    if (isBoy) {
        // V-neck collar
        g.lineStyle(OW_DETAIL, OL, 0.5);
        g.moveTo(chest.x - 5, chest.y - 3);
        g.lineTo(chest.x + 1, chest.y + 7);
        g.lineTo(chest.x + 7, chest.y - 3);

        // Horizontal chest fold lines (tension from pulling)
        g.lineStyle(OW_FINE, shadow, 0.25);
        g.moveTo(chest.x - wSh + 6, chest.y + 12);
        g.quadraticCurveTo(chest.x, chest.y + 10, chest.x + wSh - 6, chest.y + 12);
        g.moveTo(chest.x - wSh + 8, chest.y + 20);
        g.quadraticCurveTo(chest.x, chest.y + 18, chest.x + wSh - 8, chest.y + 20);

        // Waistband / belt
        g.lineStyle(0);
        g.beginFill(0x1A1A1A, 0.25);
        g.drawRoundedRect(hip.x - wHi, hip.y - 4, wHi * 2, 5, 2);
        g.endFill();
    } else {
        // Racing stripes
        g.lineStyle(0);
        g.beginFill(GIRL_STRIPE, 0.35);
        g.drawRect(chest.x - wSh + 4, chest.y, 4, 36);
        g.drawRect(chest.x + wSh - 8, chest.y, 4, 36);
        g.endFill();

        // Center zipper line
        g.lineStyle(OW_FINE, GIRL_SUIT_SH, 0.45);
        g.moveTo(chest.x + 1, chest.y + 2);
        g.lineTo(waist.x + 1, waist.y + 5);

        // Zipper pull (small rectangle)
        g.lineStyle(0);
        g.beginFill(0xCCCCCC, 0.6);
        g.drawRect(chest.x, chest.y + 8, 2, 4);
        g.endFill();

        // Collar
        g.lineStyle(OW_FINE, OL, 0.35);
        g.arc(chest.x, chest.y - 2, 8, -2.6, -0.5);
    }
}

function drawHead(
    g: PIXI.Graphics,
    c: { x: number; y: number },
    r: number,
    isBoy: boolean,
    idx: number
) {
    // ── Head shape (slightly oval — wider for kid look) ──
    g.lineStyle(OW_BODY, OL);
    g.beginFill(SKIN);
    g.drawEllipse(c.x, c.y, r + 2, r + 3);
    g.endFill();

    // Cheek warmth
    blob(g, c.x - r + 4, c.y + 6, 5, SKIN_HI, 0.25);
    blob(g, c.x + r - 2, c.y + 6, 5, SKIN_HI, 0.25);

    // Ear
    g.lineStyle(OW_DETAIL, OL, 0.7);
    g.beginFill(SKIN);
    g.drawEllipse(c.x - r - 2, c.y + 2, 4.5, 7);
    g.endFill();
    blob(g, c.x - r - 1, c.y + 2, 2, SKIN_DEEP, 0.3);

    // ═══ HAIR ═══
    g.lineStyle(OW_BODY, OL);
    if (isBoy) {
        // Natural, textured afro
        g.beginFill(HAIR);
        const ar = r + 9;
        // Main dome
        g.drawCircle(c.x + 1, c.y - 5, ar);
        // Volume bumps around edge
        const bumps = [
            { x: -ar + 6, y: -2, r: 10 },
            { x: ar - 6, y: -2, r: 10 },
            { x: -7, y: -ar + 3, r: 9 },
            { x: 7, y: -ar + 3, r: 9 },
            { x: 0, y: -ar + 5, r: 10 },
            { x: -ar + 10, y: 5, r: 7 },
            { x: ar - 10, y: 5, r: 7 },
        ];
        for (const b of bumps) {
            g.drawCircle(c.x + b.x, c.y + b.y, b.r);
        }
        g.endFill();

        // Curl texture lines
        g.lineStyle(OW_FINE, HAIR_HI, 0.1);
        [
            { cx: -12, cy: -16, cr: 6, s: 0.3, e: 2.5 },
            { cx: 10, cy: -18, cr: 5, s: 0.8, e: 2.8 },
            { cx: -2, cy: -22, cr: 5, s: 0.2, e: 2.3 },
            { cx: -18, cy: -6, cr: 4, s: 0.5, e: 2.2 },
            { cx: 18, cy: -6, cr: 4, s: 1.0, e: 2.8 },
            { cx: 5, cy: -14, cr: 4, s: 0.0, e: 2.0 },
            { cx: -8, cy: -8, cr: 5, s: 0.4, e: 2.6 },
        ].forEach(t => g.arc(c.x + t.cx, c.y + t.cy, t.cr, t.s, t.e));

        // Top sheen
        g.lineStyle(2, WHITE, 0.05);
        g.arc(c.x + 2, c.y - ar + 6, ar - 7, -1.3, -0.1);
    } else {
        // Hair base
        g.beginFill(HAIR);
        g.drawEllipse(c.x + 1, c.y - 5, r + 5, r);
        g.endFill();

        // Puff balls (cluster of circles for volume)
        const puffs = [
            // Left puff
            { x: -18, y: -22, r: 14 },
            { x: -24, y: -16, r: 9 },
            { x: -12, y: -30, r: 9 },
            { x: -26, y: -26, r: 7 },
            { x: -10, y: -22, r: 7 },
            // Right puff
            { x: 20, y: -22, r: 14 },
            { x: 26, y: -16, r: 9 },
            { x: 14, y: -30, r: 9 },
            { x: 28, y: -26, r: 7 },
            { x: 12, y: -22, r: 7 },
        ];
        g.lineStyle(OW_BODY, OL);
        g.beginFill(HAIR);
        for (const p of puffs) g.drawCircle(c.x + p.x, c.y + p.y, p.r);
        g.endFill();

        // Scrunchies
        g.lineStyle(0);
        g.beginFill(GIRL_SUIT_HI);
        g.drawRoundedRect(c.x - 24, c.y - 11, 13, 6, 3);
        g.drawRoundedRect(c.x + 13, c.y - 11, 13, 6, 3);
        g.endFill();
        blob(g, c.x - 18, c.y - 8.5, 1.5, WHITE, 0.5);
        blob(g, c.x + 20, c.y - 8.5, 1.5, WHITE, 0.5);

        // Hair texture
        g.lineStyle(OW_FINE, HAIR_HI, 0.1);
        g.arc(c.x - 18, c.y - 22, 8, 3.3, 5.5);
        g.arc(c.x + 20, c.y - 22, 8, 3.8, 6.0);
        g.arc(c.x - 14, c.y - 28, 6, 0, 2.0);
        g.arc(c.x + 16, c.y - 28, 6, 0, 2.0);
        g.lineStyle(2, WHITE, 0.04);
        g.arc(c.x - 18, c.y - 30, 11, -1.0, 0.3);
        g.arc(c.x + 20, c.y - 30, 11, -1.0, 0.3);
    }

    // ═══ FACE ═══
    const ey = c.y + 1;
    const eL = c.x - 7, eR = c.x + 11;

    // Eye whites
    g.lineStyle(1.2, OL, 0.8);
    g.beginFill(WHITE);
    g.drawEllipse(eL, ey, 6.5, 7.5);
    g.drawEllipse(eR, ey, 6.5, 7.5);
    g.endFill();

    // Irises (vary direction slightly by idx)
    const iriOff = [1.5, 1, 2][idx % 3];
    g.lineStyle(0);
    g.beginFill(0x4E342E);
    g.drawCircle(eL + iriOff, ey + 1, 4.2);
    g.drawCircle(eR + iriOff - 1.5, ey + 1, 4.2);
    g.endFill();

    // Pupils
    g.beginFill(BLACK);
    g.drawCircle(eL + iriOff, ey + 1, 2.3);
    g.drawCircle(eR + iriOff - 1.5, ey + 1, 2.3);
    g.endFill();

    // Catchlights (makes eyes look alive)
    g.beginFill(WHITE, 0.95);
    g.drawCircle(eL + iriOff - 2, ey - 2, 2);
    g.drawCircle(eR + iriOff - 3, ey - 2, 2);
    g.endFill();
    g.beginFill(WHITE, 0.4);
    g.drawCircle(eL + iriOff + 1, ey + 3, 0.9);
    g.drawCircle(eR + iriOff - 0.5, ey + 3, 0.9);
    g.endFill();

    // Eyebrows (vary expression by idx)
    g.lineStyle(2.8, OL);
    const browStyles = [
        // Determined (slightly angled)
        { lA: -2, lB: -5, rA: -5, rB: -2 },
        // Strained (V-shape, more angled)
        { lA: -1, lB: -7, rA: -7, rB: -1 },
        // Focused (flat, concentrated)
        { lA: -4, lB: -4, rA: -4, rB: -4 },
    ];
    const brow = browStyles[idx % 3];
    // Left brow
    g.moveTo(eL - 7, ey - 9 + brow.lA);
    g.bezierCurveTo(eL - 2, ey - 13, eL + 3, ey - 13, eL + 6, ey - 9 + brow.lB);
    // Right brow
    g.moveTo(eR - 4, ey - 9 + brow.rA);
    g.bezierCurveTo(eR + 1, ey - 13, eR + 6, ey - 13, eR + 8, ey - 9 + brow.rB);

    // Nose
    g.lineStyle(1.5, SKIN_SH, 0.5);
    g.moveTo(c.x + 1, ey + 4);
    g.bezierCurveTo(c.x + 4, ey + 8, c.x + 3, ey + 10, c.x, ey + 10);
    blob(g, c.x + 3, ey + 9, 1, SKIN_SH, 0.25);

    // Mouth (vary by idx)
    const mouthStyles = [
        'grit',   // idx 0: gritted teeth
        'shout',  // idx 1: open mouth yelling
        'strain', // idx 2: wide strain grimace
    ];
    const mouth = mouthStyles[idx % 3];

    if (mouth === 'grit') {
        // Gritted teeth — rectangular
        g.lineStyle(OW_DETAIL, OL);
        g.beginFill(0xD32F2F, 0.5);
        g.drawRoundedRect(c.x - 6, c.y + 13, 13, 7, 2.5);
        g.endFill();
        // Teeth
        g.lineStyle(0);
        g.beginFill(WHITE, 0.95);
        g.drawRoundedRect(c.x - 5, c.y + 13.5, 11, 4, 1.5);
        g.endFill();
        g.lineStyle(0.5, OL, 0.2);
        for (let tx = c.x - 2; tx <= c.x + 4; tx += 3) {
            g.moveTo(tx, c.y + 13.5); g.lineTo(tx, c.y + 17.5);
        }
    } else if (mouth === 'shout') {
        // Open mouth yelling
        g.lineStyle(OW_DETAIL, OL);
        g.beginFill(0xB71C1C, 0.7);
        g.moveTo(c.x - 7, c.y + 14);
        g.bezierCurveTo(c.x - 3, c.y + 12, c.x + 6, c.y + 12, c.x + 10, c.y + 14);
        g.bezierCurveTo(c.x + 7, c.y + 22, c.x - 4, c.y + 22, c.x - 7, c.y + 14);
        g.endFill();
        // Teeth (top row only)
        g.lineStyle(0);
        g.beginFill(WHITE, 0.9);
        g.moveTo(c.x - 6, c.y + 14);
        g.bezierCurveTo(c.x - 2, c.y + 12.5, c.x + 5, c.y + 12.5, c.x + 9, c.y + 14);
        g.lineTo(c.x + 8, c.y + 16.5);
        g.lineTo(c.x - 5, c.y + 16.5);
        g.closePath();
        g.endFill();
        g.lineStyle(0.5, OL, 0.2);
        g.moveTo(c.x - 1, c.y + 13); g.lineTo(c.x - 1, c.y + 16.5);
        g.moveTo(c.x + 3, c.y + 13); g.lineTo(c.x + 3, c.y + 16.5);
        // Tongue hint
        blob(g, c.x + 1, c.y + 19, 3, 0xE57373, 0.5);
    } else {
        // Wide grimace
        g.lineStyle(OW_DETAIL, OL);
        g.beginFill(WHITE, 0.9);
        g.moveTo(c.x - 8, c.y + 14);
        g.bezierCurveTo(c.x - 4, c.y + 12, c.x + 7, c.y + 12, c.x + 11, c.y + 14);
        g.lineTo(c.x + 10, c.y + 18);
        g.bezierCurveTo(c.x + 5, c.y + 17, c.x - 3, c.y + 17, c.x - 7, c.y + 18);
        g.closePath();
        g.endFill();
        // Tooth lines
        g.lineStyle(0.5, OL, 0.2);
        for (let tx = c.x - 4; tx <= c.x + 7; tx += 3) {
            g.moveTo(tx, c.y + 13); g.lineTo(tx, c.y + 17.5);
        }
        // Center divider
        g.lineStyle(0.6, OL, 0.25);
        g.moveTo(c.x - 8, c.y + 15.5);
        g.lineTo(c.x + 11, c.y + 15.5);
    }

    // Blush (effort flush)
    blob(g, c.x - r - 1, c.y + 7, 4.5, 0xE57373, 0.15);
    blob(g, c.x + r + 3, c.y + 7, 4.5, 0xE57373, 0.15);

    // Chin definition
    g.lineStyle(OW_FINE, SKIN_SH, 0.15);
    g.arc(c.x + 2, c.y + r + 1, 6, 0.5, 2.6);
}

function drawShoe(g: PIXI.Graphics, x: number, y: number, dir: number, color: number) {
    const toeX = dir > 0 ? 15 : -10;

    // ── Shoe body (rounded, chunky) ──
    g.lineStyle(OW_BODY, OL);
    g.beginFill(color);
    g.moveTo(x - 7, y - 1);
    g.bezierCurveTo(x - 9, y + 4, x - 9, y + 9, x - 5, y + 10);
    g.lineTo(x + toeX - dir * 2, y + 10);
    g.bezierCurveTo(x + toeX + dir * 4, y + 9, x + toeX + dir * 5, y + 4, x + toeX + dir * 2, y + 0);
    g.bezierCurveTo(x + toeX - dir * 2, y - 2, x + 3, y - 3, x - 7, y - 1);
    g.endFill();

    // Sole
    g.lineStyle(0);
    g.beginFill(0x222222, 0.6);
    g.drawRoundedRect(x - 9, y + 8, Math.abs(toeX) + 18, 3.5, 1.5);
    g.endFill();

    // Toe cap
    g.beginFill(WHITE, 0.12);
    g.drawEllipse(x + toeX - dir * 2, y + 5, 5, 4);
    g.endFill();

    // Lace details
    g.beginFill(WHITE, 0.6);
    g.drawCircle(x + dir * 2, y + 2, 1.2);
    g.drawCircle(x + dir * 5, y + 2, 1.2);
    g.drawCircle(x + dir * 8, y + 3, 1);
    g.endFill();

    // Swoosh / brand detail
    g.lineStyle(1, WHITE, 0.2);
    g.moveTo(x - 2, y + 6);
    g.quadraticCurveTo(x + dir * 5, y + 3, x + dir * 10, y + 5);

    // Shoe shadow
    g.lineStyle(0);
    g.beginFill(0x000000, 0.08);
    g.drawEllipse(x + toeX / 2, y + 7, 8, 2.5);
    g.endFill();
}

function drawHand(g: PIXI.Graphics, x: number, y: number) {
    // ── Palm ──
    g.lineStyle(OW_BODY, OL);
    g.beginFill(SKIN);
    g.drawEllipse(x, y, 6, 7);
    g.endFill();

    // ── Fingers (4 curled around rope) ──
    g.lineStyle(OW_DETAIL, OL, 0.7);
    for (let f = 0; f < 4; f++) {
        const angle = -0.8 + f * 0.5;
        const fx = x + Math.cos(angle) * 7;
        const fy = y + Math.sin(angle) * 7;
        g.beginFill(SKIN);
        g.drawEllipse(fx, fy, 2.5, 4);
        g.endFill();
    }

    // ── Thumb (on the side) ──
    g.lineStyle(OW_DETAIL, OL, 0.6);
    g.beginFill(SKIN);
    g.drawEllipse(x - 6, y - 3, 3.5, 2.5);
    g.endFill();

    // Knuckle highlights
    g.lineStyle(0);
    for (let f = 0; f < 3; f++) {
        blob(g, x - 3 + f * 3, y - 5, 1.2, SKIN_HI, 0.3);
    }

    // Shadow under fingers
    blob(g, x, y + 3, 4, SKIN_SH, 0.15);
}

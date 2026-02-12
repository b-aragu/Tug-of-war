// @ts-nocheck
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface GameScene2DProps {
  ropePosition: number;
  winner?: 'left' | 'right' | null;
}

const W = 1000, H = 500;
const GROUND_Y = 410;
const ROPE_Y = GROUND_Y - 75;
const TEAM_GAP = 125;
const ROPE_MULT = 4;
const MIN_RX = 200, MAX_RX = W - 200;

// Sprite scaling: images are 640×640, target display height
const TEAM_H = 195;
const S = TEAM_H / 640;

export default function GameScene2D({ ropePosition, winner }: GameScene2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const targetXRef = useRef(W / 2);
  const currentXRef = useRef(W / 2);
  const leftSprRef = useRef<PIXI.Sprite | null>(null);
  const rightSprRef = useRef<PIXI.Sprite | null>(null);
  const ropeGfxRef = useRef<PIXI.Graphics | null>(null);
  const dustRef = useRef<PIXI.Container | null>(null);
  const flagRef = useRef<PIXI.Graphics | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (appRef.current) { try { appRef.current.destroy(true, { children: true }); } catch (_) { } }
    while (el.firstChild) el.removeChild(el.firstChild);

    const app = new PIXI.Application({
      width: W, height: H, backgroundColor: 0x87CEEB,
      antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true,
    });
    el.appendChild(app.view as unknown as HTMLElement);
    appRef.current = app;
    let alive = true;

    // ═══ BACKGROUND ═══
    const sky = new PIXI.Graphics();
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const r = Math.round(0x4F + (0x87 - 0x4F) * t);
      const g = Math.round(0xC3 + (0xCE - 0xC3) * t);
      const b = Math.round(0xF7 + (0xEB - 0xF7) * t);
      sky.beginFill((r << 16) | (g << 8) | b);
      sky.drawRect(0, H * 0.8 * t, W, H * 0.8 / 20 + 1);
      sky.endFill();
    }
    app.stage.addChild(sky);

    // Sun
    const sun = new PIXI.Container();
    const sg = new PIXI.Graphics();
    sg.beginFill(0xFFEB3B, 0.08); sg.drawCircle(0, 0, 65); sg.endFill();
    sg.beginFill(0xFFEB3B, 0.15); sg.drawCircle(0, 0, 45); sg.endFill();
    sg.beginFill(0xFFEB3B, 0.3); sg.drawCircle(0, 0, 35); sg.endFill();
    sg.beginFill(0xFFEB3B); sg.drawCircle(0, 0, 24); sg.endFill();
    sg.beginFill(0xFFF9C4, 0.5); sg.drawCircle(-5, -5, 12); sg.endFill();
    sun.addChild(sg); sun.position.set(870, 65);
    app.stage.addChild(sun);

    // Clouds
    const clouds: PIXI.Container[] = [];
    [{ x: 100, y: 48, s: 1.0 }, { x: 340, y: 28, s: 0.75 }, { x: 560, y: 55, s: 1.15 }, { x: 780, y: 38, s: 0.6 }].forEach(cd => {
      const cl = new PIXI.Container();
      const cg = new PIXI.Graphics();
      cg.beginFill(0xFFFFFF, 0.92);
      cg.drawEllipse(0, 0, 42 * cd.s, 15 * cd.s);
      cg.drawEllipse(-25 * cd.s, 3, 25 * cd.s, 12 * cd.s);
      cg.drawEllipse(27 * cd.s, 3, 32 * cd.s, 13 * cd.s);
      cg.drawEllipse(10 * cd.s, -8, 22 * cd.s, 10 * cd.s);
      cg.drawEllipse(-10 * cd.s, -5, 15 * cd.s, 8 * cd.s);
      cg.endFill();
      cl.addChild(cg); cl.position.set(cd.x, cd.y);
      app.stage.addChild(cl); clouds.push(cl);
    });

    // Hills (far + near)
    const hf = new PIXI.Graphics();
    hf.beginFill(0x66BB6A, 0.5);
    hf.moveTo(0, GROUND_Y - 55); hf.quadraticCurveTo(150, GROUND_Y - 110, 300, GROUND_Y - 45);
    hf.quadraticCurveTo(500, GROUND_Y - 85, 700, GROUND_Y - 55);
    hf.quadraticCurveTo(850, GROUND_Y - 95, W, GROUND_Y - 35);
    hf.lineTo(W, GROUND_Y); hf.lineTo(0, GROUND_Y); hf.closePath(); hf.endFill();
    app.stage.addChild(hf);
    const hn = new PIXI.Graphics();
    hn.beginFill(0x43A047, 0.6);
    hn.moveTo(0, GROUND_Y - 18); hn.quadraticCurveTo(250, GROUND_Y - 45, 500, GROUND_Y - 10);
    hn.quadraticCurveTo(700, GROUND_Y - 30, W, GROUND_Y - 5);
    hn.lineTo(W, GROUND_Y); hn.lineTo(0, GROUND_Y); hn.closePath(); hn.endFill();
    app.stage.addChild(hn);

    // Trees
    [{ x: 40, s: 0.85 }, { x: 115, s: 1.1 }, { x: 870, s: 0.8 }, { x: 960, s: 1.0 }].forEach(tp => {
      const tree = new PIXI.Container();
      const tk = new PIXI.Graphics();
      tk.beginFill(0x5D4037); tk.drawRoundedRect(-5, -55 * tp.s, 10, 55 * tp.s, 2); tk.endFill();
      tree.addChild(tk);
      const fl = new PIXI.Graphics();
      fl.beginFill(0x2E7D32);
      fl.drawCircle(0, -60 * tp.s, 24 * tp.s);
      fl.drawCircle(-14 * tp.s, -48 * tp.s, 16 * tp.s);
      fl.drawCircle(14 * tp.s, -48 * tp.s, 16 * tp.s);
      fl.endFill(); tree.addChild(fl);
      tree.position.set(tp.x, GROUND_Y); app.stage.addChild(tree);
    });

    // Ground
    const ground = new PIXI.Graphics();
    ground.beginFill(0x558B2F); ground.drawRect(0, GROUND_Y, W, H - GROUND_Y); ground.endFill();
    ground.beginFill(0x795548, 0.2); ground.drawRect(0, GROUND_Y, W, 6); ground.endFill();
    app.stage.addChild(ground);

    // Grass
    const grassC = new PIXI.Container();
    for (let x = 0; x < W; x += 9) {
      const bl = new PIXI.Graphics();
      const bh = 6 + Math.random() * 12;
      bl.beginFill(Math.random() > 0.5 ? 0x7CB342 : 0x558B2F);
      bl.moveTo(0, 0); bl.lineTo(1.5, -bh); bl.lineTo(3, 0); bl.endFill();
      bl.x = x + Math.random() * 6; bl.y = GROUND_Y;
      grassC.addChild(bl);
    }
    app.stage.addChild(grassC);

    // Center marker
    const cl2 = new PIXI.Graphics();
    cl2.lineStyle(2, 0xFFFFFF, 0.3);
    for (let y = ROPE_Y - 40; y < GROUND_Y + 5; y += 10) { cl2.moveTo(W / 2, y); cl2.lineTo(W / 2, y + 5); }
    app.stage.addChild(cl2);

    // Rope (redrawn each frame)
    const ropeGfx = new PIXI.Graphics();
    app.stage.addChild(ropeGfx);
    ropeGfxRef.current = ropeGfx;

    // Flag
    const flag = new PIXI.Graphics();
    flag.lineStyle(2.5, 0xF44336);
    flag.moveTo(0, 18); flag.lineTo(0, -42);
    flag.beginFill(0xF44336);
    flag.moveTo(0, -42); flag.lineTo(20, -30); flag.lineTo(0, -19); flag.endFill();
    flag.beginFill(0xF44336, 0.7);
    flag.moveTo(-6, 18); flag.lineTo(0, 10); flag.lineTo(6, 18); flag.lineTo(0, 25); flag.endFill();
    flag.position.set(W / 2, ROPE_Y);
    app.stage.addChild(flag);
    flagRef.current = flag;

    // Dust
    const dustC = new PIXI.Container();
    app.stage.addChild(dustC);
    dustRef.current = dustC;

    // ═══════════════════════════════════════════════════════
    //  TEAM SPRITES — Direct, no containers
    //
    //  boy_team.png : boys face RIGHT, rope exits RIGHT side
    //  girl_team.png: girls face RIGHT, rope exits RIGHT side
    //
    //  Left team (boys):  face RIGHT toward center → as-is
    //  Right team (girls): face LEFT toward center → flip via scale.x = -S
    //
    //  Anchor = (0.9, 0.97) → near the rope-exit edge, near feet
    //  For boys:  anchor at right edge → sprite body extends LEFT
    //  For girls: anchor at right edge → flipped → sprite body extends RIGHT
    // ═══════════════════════════════════════════════════════

    const boySprite = new PIXI.Sprite(PIXI.Texture.from('/boy_team.png'));
    boySprite.anchor.set(0.9, 0.97);
    boySprite.scale.set(S, S);
    boySprite.y = GROUND_Y;
    app.stage.addChild(boySprite);
    leftSprRef.current = boySprite;

    const girlSprite = new PIXI.Sprite(PIXI.Texture.from('/girl_team.png'));
    girlSprite.anchor.set(0.9, 0.97);
    girlSprite.scale.set(-S, S);  // NEGATIVE x = horizontal flip
    girlSprite.y = GROUND_Y;
    app.stage.addChild(girlSprite);
    rightSprRef.current = girlSprite;

    // Init
    currentXRef.current = W / 2;
    targetXRef.current = W / 2;
    applyPos(W / 2);

    let dustTimer = 0;

    // ═══ ANIMATION ═══
    app.ticker.add(delta => {
      if (!alive) return;
      const t = performance.now() / 1000;

      const prevX = currentXRef.current;
      currentXRef.current += (targetXRef.current - currentXRef.current) * 0.07;
      applyPos(currentXRef.current);

      // Clouds drift
      for (let i = 0; i < clouds.length; i++) {
        clouds[i].x += (0.12 + i * 0.04) * delta;
        if (clouds[i].x > W + 100) clouds[i].x = -100;
      }
      sun.scale.set(1 + Math.sin(t * 0.5) * 0.025);
      for (let i = 0; i < grassC.children.length; i++) {
        grassC.children[i].rotation = Math.sin(t * 2 + i * 0.3) * 0.08;
      }

      // Team heave animation
      if (leftSprRef.current) {
        leftSprRef.current.y = GROUND_Y + Math.sin(t * 3.2) * 2;
        leftSprRef.current.rotation = -0.012 - Math.sin(t * 3.2) * 0.01;
      }
      if (rightSprRef.current) {
        rightSprRef.current.y = GROUND_Y + Math.sin(t * 3.2 + 1.5) * 2;
        rightSprRef.current.rotation = 0.012 + Math.sin(t * 3.2 + 1.5) * 0.01;
      }

      // Dust
      const speed = Math.abs(currentXRef.current - prevX);
      dustTimer += delta;
      if (speed > 0.2 && dustTimer > 3 && dustRef.current) {
        dustTimer = 0;
        [leftSprRef.current, rightSprRef.current].forEach(spr => {
          if (!spr) return;
          for (let j = 0; j < 2; j++) {
            const d = new PIXI.Graphics();
            d.beginFill(0x795548, 0.45);
            d.drawCircle(0, 0, 3 + Math.random() * 5); d.endFill();
            d.x = spr.x + (Math.random() - 0.5) * 80;
            d.y = GROUND_Y + Math.random() * 5;
            (d as any).life = 1;
            (d as any).vx = (Math.random() - 0.5) * 1.5;
            (d as any).vy = -(Math.random() * 2 + 0.5);
            dustRef.current!.addChild(d);
          }
        });
      }
      if (dustRef.current) {
        for (let i = dustRef.current.children.length - 1; i >= 0; i--) {
          const p = dustRef.current.children[i] as any;
          p.life -= 0.015; p.x += p.vx; p.y += p.vy;
          p.alpha = p.life; p.scale.set(p.life * 1.4);
          if (p.life <= 0) { dustRef.current.removeChild(p); p.destroy(); }
        }
      }

      // Rope
      if (ropeGfxRef.current && leftSprRef.current && rightSprRef.current) {
        const g = ropeGfxRef.current;
        g.clear();
        const lx = leftSprRef.current.x + 12;
        const rx = rightSprRef.current.x - 12;
        g.lineStyle(2, 0x5D4519, 0.3); g.moveTo(lx, ROPE_Y + 3); g.lineTo(rx, ROPE_Y + 3);
        g.lineStyle(7, 0x8D6E2F); g.moveTo(lx, ROPE_Y); g.lineTo(rx, ROPE_Y);
        g.lineStyle(2.5, 0xC4A050, 0.35); g.moveTo(lx, ROPE_Y - 2); g.lineTo(rx, ROPE_Y - 2);
        g.lineStyle(1.5, 0x5D4519, 0.4);
        for (let kx = lx + 12; kx < rx; kx += 20) { g.moveTo(kx, ROPE_Y - 3); g.lineTo(kx + 4, ROPE_Y + 3); }
      }

      if (flagRef.current) flagRef.current.x = currentXRef.current;
    });

    function applyPos(rx: number) {
      const cl = Math.max(MIN_RX, Math.min(MAX_RX, rx));
      // Boys: anchor at right edge → position their rope-side at cl - gap
      if (leftSprRef.current) leftSprRef.current.x = cl - TEAM_GAP;
      // Girls: anchor at right edge, flipped → position their rope-side at cl + gap
      if (rightSprRef.current) rightSprRef.current.x = cl + TEAM_GAP;
    }

    return () => {
      alive = false;
      leftSprRef.current = null; rightSprRef.current = null;
      ropeGfxRef.current = null; dustRef.current = null; flagRef.current = null;
      if (appRef.current) {
        try { appRef.current.destroy(true, { children: true }); } catch (_) { }
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    targetXRef.current = W / 2 + (ropePosition * ROPE_MULT);
  }, [ropePosition, winner]);

  return (
    <div ref={containerRef}
      className="w-full rounded-xl overflow-hidden shadow-2xl border-4 border-amber-900/50 bg-black"
      style={{ aspectRatio: `${W}/${H}` }}
    />
  );
}

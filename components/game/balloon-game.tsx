"use client";

import { useEffect, useRef, useState } from "react";

const HEIGHT = 220;
const SQUARE_SIZE = 14;
const PLAYER_W = SQUARE_SIZE;
const PLAYER_H = SQUARE_SIZE;
const PLAYER_X = 60;
const PLAYING_START_Y = (HEIGHT - SQUARE_SIZE) / 2;
const IDLE_PROMPT_GAP = 14;
const IDLE_PROMPT_LINE_HEIGHT = 18;
const IDLE_STACK_HEIGHT =
  SQUARE_SIZE + IDLE_PROMPT_GAP + IDLE_PROMPT_LINE_HEIGHT;
const IDLE_SQUARE_Y = Math.round((HEIGHT - IDLE_STACK_HEIGHT) / 2);
const IDLE_PROMPT_TOP = IDLE_SQUARE_Y + SQUARE_SIZE + IDLE_PROMPT_GAP;
const INTRO_DURATION = 800;

// Width used to calibrate "feels right" scroll speed. Wider/narrower
// viewports proportionally scale horizontal speed so reaction time at
// the player stays consistent across screen sizes.
const REFERENCE_WIDTH = 560;

// Vertical physics — not width-scaled (vertical space is fixed at HEIGHT).
// Units are px/sec and px/sec^2 so behavior is identical across refresh rates.
const GRAVITY = 470;
const THRUST = -720;
const MAX_VY = 160;

// Horizontal scroll, in px/sec at REFERENCE_WIDTH.
const SCROLL_BASE = 115;
// Scroll multiplier reached at the end of the initial difficulty ramp.
const SCROLL_END_MULT = 3.0;
// Width-independent progress (in reference px) needed to reach the initial cap.
// Obstacle gap/spacing also use this ramp; once you pass it they stop tightening.
const DIFFICULTY_RAMP = 3200;
// Additional speed multiplier per reference-px of progress past the ramp.
// Causes the game to keep getting faster forever instead of plateauing —
// at 2x the ramp distance you're +0.19x faster, at 4x you're +0.58x faster.
const SCROLL_OVERSHOOT_RATE = 0.00006;

const OBSTACLE_WIDTH = 22;
// Gap height shrinks linearly from BASE → END across the difficulty ramp.
const OBSTACLE_GAP_BASE = 155;
const OBSTACLE_GAP_END = 100;
const OBSTACLE_GAP_VAR = 18;
// Pixel spacing between obstacles (at REFERENCE_WIDTH) shrinks with difficulty.
const OBSTACLE_SPACING_BASE = 400;
const OBSTACLE_SPACING_END = 230;

// Trail is added at a fixed time interval so it looks the same at any FPS.
const TRAIL_INTERVAL = 0.018;
const TRAIL_MAX = 22;

// Cap dt to avoid huge jumps after tab-switch / heavy frame drops.
const MAX_DT = 0.05;

const STORAGE_KEY = "balloon-best";

type GameState = "idle" | "starting" | "playing" | "dead";

interface Obstacle {
  x: number;
  gapY: number;
  gapH: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type BalloonGameProps = {
  className?: string;
};

export function BalloonGame({ className = "" }: BalloonGameProps) {
  // Wrapper = full-width click/touch target (entire dark footer).
  // gameArea = visually centered + constrained container that the canvas
  // measures itself against, so play width matches the reading column.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [state, setState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const stateRef = useRef<GameState>("idle");
  const holdingRef = useRef(false);

  const playerXRef = useRef(0);
  const playerYRef = useRef(IDLE_SQUARE_Y);
  const playerVYRef = useRef(0);

  const introStartRef = useRef<number | null>(null);
  const introFromXRef = useRef(0);
  const introFromYRef = useRef(0);
  const introProgressRef = useRef(0);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  // Pixel-space distance traveled — used to position obstacle spawns.
  const distanceRef = useRef(0);
  // Width-independent progress (reference px) — used for score & difficulty
  // so the game ramps up at the same rate regardless of viewport width.
  const progressRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const trailAccumRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const widthRef = useRef(0);
  const bestRef = useRef(0);
  const lastScoreSetRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    try {
      const stored = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      if (!Number.isNaN(stored) && stored > 0) {
        bestRef.current = stored;
        setBest(stored);
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  function startIntro() {
    introFromXRef.current = playerXRef.current;
    introFromYRef.current = playerYRef.current;
    introStartRef.current = null;
    setShowHelp(false);
    setState("starting");
  }

  function restart() {
    playerXRef.current = PLAYER_X;
    playerYRef.current = PLAYING_START_Y;
    playerVYRef.current = 0;
    obstaclesRef.current = [];
    trailRef.current = [];
    distanceRef.current = 0;
    progressRef.current = 0;
    lastSpawnRef.current = 0;
    trailAccumRef.current = 0;
    lastScoreSetRef.current = 0;
    introProgressRef.current = 1;
    setScore(0);
    setShowHelp(false);
    setState("playing");
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const gameArea = gameAreaRef.current;
    if (!canvas || !gameArea) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = gameArea.clientWidth;
      widthRef.current = w;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(HEIGHT * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (stateRef.current === "idle") {
        playerXRef.current = (w - SQUARE_SIZE) / 2;
        playerYRef.current = IDLE_SQUARE_Y;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onDown = (e: Event) => {
      if (e instanceof MouseEvent && e.button !== 0) return;
      // Skip presses on overlay UI (e.g. "how to play" toggle, help bullets)
      // so they don't accidentally restart the game or steal touch events.
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-game-ui]")) return;
      // Prevent iOS from starting text-selection / callout / scroll
      // gestures that would steal the touch from us mid-hold.
      if (e.type === "touchstart" && e.cancelable) e.preventDefault();
      holdingRef.current = true;
      if (stateRef.current === "idle") {
        startIntro();
      } else if (stateRef.current === "dead") {
        restart();
      }
    };
    const onUp = () => {
      holdingRef.current = false;
    };
    // Suppress iOS gesture takeover (selection / scroll) while a hold is in progress.
    const onTouchMove = (e: TouchEvent) => {
      if (holdingRef.current && e.cancelable) e.preventDefault();
    };

    wrapper.addEventListener("mousedown", onDown);
    wrapper.addEventListener("touchstart", onDown, { passive: false });
    wrapper.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);
    window.addEventListener("blur", onUp);
    return () => {
      wrapper.removeEventListener("mousedown", onDown);
      wrapper.removeEventListener("touchstart", onDown);
      wrapper.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const readVar = (name: string) => {
      const v = getComputedStyle(wrapper).getPropertyValue(name).trim();
      return v || "#000";
    };

    const tick = (now: number) => {
      const w = widthRef.current;
      const fg = readVar("--foreground");
      const muted = readVar("--muted");

      const last = lastTickRef.current;
      lastTickRef.current = now;
      const dt = last === null ? 0 : Math.min(MAX_DT, (now - last) / 1000);

      if (stateRef.current === "starting") {
        if (introStartRef.current === null) {
          introStartRef.current = now;
        }
        const elapsed = now - introStartRef.current;
        const t = Math.min(1, elapsed / INTRO_DURATION);
        const e = easeOutCubic(t);
        playerXRef.current = lerp(introFromXRef.current, PLAYER_X, e);
        playerYRef.current = lerp(introFromYRef.current, PLAYING_START_Y, e);
        introProgressRef.current = e;
        if (t >= 1) {
          playerVYRef.current = 0;
          obstaclesRef.current = [];
          trailRef.current = [];
          distanceRef.current = 0;
          progressRef.current = 0;
          lastSpawnRef.current = 0;
          trailAccumRef.current = 0;
          lastScoreSetRef.current = 0;
          introProgressRef.current = 1;
          setScore(0);
          setState("playing");
        }
      } else if (stateRef.current === "playing" && dt > 0) {
        // Width scaling: keep obstacle reaction time consistent across viewports.
        const widthScale = w / REFERENCE_WIDTH;

        // Difficulty ramps from 0 → 1 over DIFFICULTY_RAMP reference-px of progress.
        // Used for obstacle gap/spacing only — those stop tightening at the cap.
        const difficulty = Math.min(1, progressRef.current / DIFFICULTY_RAMP);
        // Speed: linear ramp to SCROLL_END_MULT, then a slow perpetual creep
        // proportional to how far past the ramp we are — never plateaus.
        const overshoot = Math.max(0, progressRef.current - DIFFICULTY_RAMP);
        const speedMult =
          1 +
          difficulty * (SCROLL_END_MULT - 1) +
          overshoot * SCROLL_OVERSHOOT_RATE;

        // Scroll in actual pixels this frame.
        const scrollPxPerSec = SCROLL_BASE * speedMult * widthScale;
        const scrollDelta = scrollPxPerSec * dt;

        // Vertical physics — gravity/thrust are not width-scaled.
        const accel = holdingRef.current ? THRUST : GRAVITY;
        let vy = playerVYRef.current + accel * dt;
        if (vy > MAX_VY) vy = MAX_VY;
        else if (vy < -MAX_VY) vy = -MAX_VY;
        playerVYRef.current = vy;
        playerYRef.current += vy * dt;

        for (const o of obstaclesRef.current) o.x -= scrollDelta;
        obstaclesRef.current = obstaclesRef.current.filter(
          (o) => o.x + OBSTACLE_WIDTH > -10,
        );

        // Time-based trail emission so trail looks the same at any FPS.
        trailAccumRef.current += dt;
        while (trailAccumRef.current >= TRAIL_INTERVAL) {
          trailAccumRef.current -= TRAIL_INTERVAL;
          trailRef.current.push({
            x: PLAYER_X,
            y: playerYRef.current + PLAYER_H / 2,
          });
        }
        for (const tp of trailRef.current) tp.x -= scrollDelta;
        while (trailRef.current.length > TRAIL_MAX) trailRef.current.shift();

        distanceRef.current += scrollDelta;
        progressRef.current += SCROLL_BASE * speedMult * dt;

        const spacingPx =
          lerp(OBSTACLE_SPACING_BASE, OBSTACLE_SPACING_END, difficulty) *
          widthScale;
        if (
          obstaclesRef.current.length === 0 ||
          distanceRef.current - lastSpawnRef.current >= spacingPx
        ) {
          const gapMin = lerp(
            OBSTACLE_GAP_BASE,
            OBSTACLE_GAP_END,
            difficulty,
          );
          const gapH = gapMin + Math.random() * OBSTACLE_GAP_VAR;
          const gapY = 18 + Math.random() * (HEIGHT - 36 - gapH);
          obstaclesRef.current.push({ x: w + 30, gapY, gapH });
          lastSpawnRef.current = distanceRef.current;
        }

        const py = playerYRef.current;
        let dead = py < 0 || py + PLAYER_H > HEIGHT;
        if (!dead) {
          for (const o of obstaclesRef.current) {
            if (
              PLAYER_X + PLAYER_W < o.x ||
              PLAYER_X > o.x + OBSTACLE_WIDTH
            ) {
              continue;
            }
            if (py < o.gapY || py + PLAYER_H > o.gapY + o.gapH) {
              dead = true;
              break;
            }
          }
        }

        const newScore = Math.floor(progressRef.current / 10);
        if (dead) {
          if (newScore > bestRef.current) {
            bestRef.current = newScore;
            try {
              localStorage.setItem(STORAGE_KEY, String(newScore));
            } catch {
              // ignore
            }
            setBest(newScore);
          }
          if (newScore !== lastScoreSetRef.current) {
            lastScoreSetRef.current = newScore;
            setScore(newScore);
          }
          setState("dead");
        } else if (newScore !== lastScoreSetRef.current) {
          lastScoreSetRef.current = newScore;
          setScore(newScore);
        }
      }

      // Render
      ctx.clearRect(0, 0, w, HEIGHT);

      ctx.fillStyle = fg;
      for (const o of obstaclesRef.current) {
        ctx.fillRect(o.x, 0, OBSTACLE_WIDTH, o.gapY);
        ctx.fillRect(
          o.x,
          o.gapY + o.gapH,
          OBSTACLE_WIDTH,
          HEIGHT - (o.gapY + o.gapH),
        );
      }

      const trail = trailRef.current;
      ctx.fillStyle = muted;
      for (let i = 0; i < trail.length; i++) {
        const tp = trail[i];
        const a = (i + 1) / trail.length;
        ctx.globalAlpha = a * 0.4;
        ctx.fillRect(tp.x - 2, tp.y - 1, 2, 2);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = fg;
      ctx.fillRect(
        playerXRef.current,
        playerYRef.current,
        SQUARE_SIZE,
        SQUARE_SIZE,
      );

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={wrapperRef}
      aria-label="Mini flight game"
      className={`relative w-full cursor-pointer select-none touch-none ${className}`}
      style={{
        height: HEIGHT,
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div className="pointer-events-none mx-auto h-full w-full sm:max-w-2xl sm:px-6">
        <div ref={gameAreaRef} className="h-full w-full">
          <canvas ref={canvasRef} className="block h-full w-full" />
        </div>
      </div>
      {state === "playing" && (
        <div className="pointer-events-none absolute right-3 top-3 text-[13px] text-[var(--muted)]">
          <span className="tabular-nums text-[var(--foreground)]">{score}</span>
          {best > 0 ? <> · best {best}</> : null}
        </div>
      )}
      {state === "dead" && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[13px] text-[var(--muted)]">
          <div>
            <span className="tabular-nums text-[var(--foreground)]">
              {score}
            </span>
            {best > 0 ? <> · best {best}</> : null}
            <> · click to restart · </>
            <button
              type="button"
              data-game-ui
              onClick={() => setShowHelp((s) => !s)}
              className="pointer-events-auto cursor-pointer underline decoration-1 underline-offset-[3px] transition-colors hover:text-[var(--foreground)]"
            >
              how to play
            </button>
          </div>
          {showHelp && (
            <ul
              data-game-ui
              className="pointer-events-auto mt-2 inline-block list-disc space-y-0.5 pl-5 text-left marker:text-[var(--muted)]"
            >
              <li>Click and hold to go up</li>
              <li>Release to go down</li>
              <li>Avoid obstacles</li>
            </ul>
          )}
        </div>
      )}
      {state === "idle" && (
        <div
          className="pointer-events-none absolute left-0 right-0 text-center text-[13px] text-[var(--muted)]"
          style={{ top: IDLE_PROMPT_TOP }}
        >
          Click and hold to fly, release to go down
        </div>
      )}
    </section>
  );
}

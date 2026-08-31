import { keyframes } from '@mantine/core';
import type { MantineTheme } from '@mantine/core';

/*
 * Shared surface language for every ox_lib UI.
 *
 * Every feature — notifications, menus, dialogs, progress, skillcheck — draws
 * its panel, type and motion from here. Before this existed each one carried
 * its own hand-written gradient and radius, and they had already drifted: three
 * different panel backgrounds, two radii, and headings at three different
 * weights across features that appear on screen at the same time.
 *
 * Change a value here and every surface follows.
 */

/* ── Shape ─────────────────────────────────────────────────────────────── */

export const RADIUS = 7;

/** Panel fill: a horizontal falloff, darkest at the leading edge. */
export const slab =
  'linear-gradient(100deg, rgba(10,11,14,0.94) 0%, rgba(6,7,10,0.88) 55%, rgba(6,7,10,0.72) 100%)';

/** Solid variant for surfaces that sit over a dimmed backdrop (dialogs). */
export const slabSolid =
  'linear-gradient(160deg, rgba(16,17,22,0.98) 0%, rgba(9,10,13,0.98) 100%)';

export const shadow = '0 10px 28px -12px rgba(0,0,0,0.8)';
export const shadowLg = '0 24px 60px -18px rgba(0,0,0,0.9)';

/** 1px inner ring in a colour, at the alpha the language uses for edges. */
export const ring = (color: string, alpha = 0.22) =>
  `inset 0 0 0 1px ${hexAlpha(color, alpha)}`;

/** Hairline separator, fading out to the right. */
export const hairline = (color: string) => `linear-gradient(to right, ${color}, rgba(0,0,0,0))`;

function hexAlpha(color: string, alpha: number) {
  // Accepts #rrggbb or an already-rgba() string; anything else passes through.
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export const accentOf = (theme: MantineTheme) =>
  theme.colors[theme.primaryColor][theme.fn.primaryShade()];

/* ── Type ──────────────────────────────────────────────────────────────── */

export const DISPLAY = 'Panchang, Inter, sans-serif';
export const BODY = 'Inter, Roboto, sans-serif';

/*
 * Headings and any label that names a thing.
 *
 * Panchang LIGHT (300). The face is wide and geometric, so at 700 it went
 * blocky once it was also uppercase and letterspaced — three emphases stacked
 * on the same word. Light keeps the width and drops the weight, which is what
 * makes the caps read as a label rather than a shout. Tracking is opened a
 * touch to compensate: light strokes need more air between letters or the
 * counters close up.
 */
export const title = (size = 13) => ({
  fontFamily: DISPLAY,
  fontSize: size,
  fontWeight: 300 as const,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  lineHeight: 1.2,
});

/** Small all-caps label above a value. */
export const eyebrow = (size = 9) => ({
  fontFamily: DISPLAY,
  fontSize: size,
  fontWeight: 700 as const,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.42)',
});

/** Running text. */
export const body = (size = 11) => ({
  fontFamily: BODY,
  fontSize: size,
  color: 'rgba(255,255,255,0.7)',
  lineHeight: 1.35,
});

/* ── Diamond cutout ────────────────────────────────────────────────────── */

/*
 * Punches a diamond-shaped hole in a surface so a badge can sit INSIDE it with
 * the game showing through the gap.
 *
 * A two-layer mask rather than clip-path: these panels are fit-content, so
 * their width is unknown at author time, and `clip-path: path()` needs fixed
 * pixel coordinates. A mask layer can be a fixed-size shape pinned to an edge
 * of a panel at any width. Layer 1 keeps everything, layer 2 is the diamond,
 * composite `exclude` subtracts it.
 *
 * Both syntaxes are emitted: standard `mask-composite: exclude` only landed in
 * Chrome 120, and the CEF build FiveM ships varies, so `-webkit-mask-composite:
 * xor` is the one that actually resolves on most clients.
 */
export const diamondCutout = (opts: { square: number; centerX: number; box?: number }) => {
  const box = opts.box ?? Math.ceil(opts.square * 1.42) + 6;
  const off = (box - opts.square) / 2;

  const svg =
    `url("data:image/svg+xml;utf8,` +
    `<svg xmlns='http://www.w3.org/2000/svg' width='${box}' height='${box}'>` +
    `<rect x='${off}' y='${off}' width='${opts.square}' height='${opts.square}' rx='7' ` +
    `transform='rotate(45 ${box / 2} ${box / 2})' fill='%23fff'/></svg>")`;

  const layers = `linear-gradient(#fff, #fff), ${svg}`;
  const position = `0 0, ${opts.centerX - box / 2}px center`;
  const size = `100% 100%, ${box}px ${box}px`;

  return {
    maskImage: layers,
    maskPosition: position,
    maskSize: size,
    maskRepeat: 'no-repeat, no-repeat',
    maskComposite: 'exclude',
    WebkitMaskImage: layers,
    WebkitMaskPosition: position,
    WebkitMaskSize: size,
    WebkitMaskRepeat: 'no-repeat, no-repeat',
    WebkitMaskComposite: 'xor',
  } as const;
};

/* ── Motion ────────────────────────────────────────────────────────────── */

/** The one easing curve. Fast out, long settle — reads as weight, not bounce. */
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export const kf = {
  /*
   * prp-hud's notification entrance, sampled frame by frame off the running
   * bundle and replayed here.
   *
   * It is a SPRING, not an easing curve — scale runs 0 → 1.105 at ~250ms →
   * undershoots to 0.988 at ~450ms → settles by ~700ms, while opacity is done
   * inside the first 150ms. A cubic-bezier cannot cross its end value and come
   * back, so the overshoot-and-return has to be written as keyframes and played
   * LINEAR: the curve lives in the frame values, not in the timing function.
   *
   * Percentages below are the measured milliseconds over the 700ms total.
   */
  springIn: keyframes({
    '0%': { opacity: 0, transform: 'scale(0)' },
    '7%': { opacity: 0.29, transform: 'scale(0.165)' },
    '14%': { opacity: 0.72, transform: 'scale(0.589)' },
    '21%': { opacity: 1, transform: 'scale(0.928)' },
    '29%': { transform: 'scale(1.085)' },
    '36%': { transform: 'scale(1.105)' },
    '43%': { transform: 'scale(1.065)' },
    '50%': { transform: 'scale(1.022)' },
    '57%': { transform: 'scale(0.996)' },
    '64%': { transform: 'scale(0.988)' },
    '71%': { transform: 'scale(0.991)' },
    '79%': { transform: 'scale(0.996)' },
    '86%': { transform: 'scale(0.999)' },
    '100%': { opacity: 1, transform: 'scale(1)' },
  }),

  /*
   * Directional slide with a spring settle.
   *
   * Travel comes in on CSS custom properties (--sx / --sy) rather than being
   * baked in, so one keyframe serves every screen position: a toast on the
   * right flies in from the right, one at the top drops from above, and the
   * overshoot always runs back along the SAME axis it arrived on. Baked-in
   * offsets would need four near-identical keyframe sets that drift apart.
   *
   * The settle reuses the damping measured off prp-hud — overshoot past the
   * mark, a smaller correction back, then rest — applied to travel as well as
   * scale, so the card decelerates like it has weight instead of gliding to a
   * stop. Played LINEAR: the curve is in the frames.
   */
  slideSpringIn: keyframes({
    '0%': { opacity: 0, transform: 'translate3d(var(--sx, 0px), var(--sy, 0px), 0) scale(0.94)' },
    '18%': { opacity: 1 },
    '45%': {
      transform: 'translate3d(calc(var(--sx, 0px) * -0.09), calc(var(--sy, 0px) * -0.09), 0) scale(1.028)',
    },
    '68%': {
      transform: 'translate3d(calc(var(--sx, 0px) * 0.025), calc(var(--sy, 0px) * 0.025), 0) scale(0.993)',
    },
    '85%': { transform: 'translate3d(0, 0, 0) scale(1.003)' },
    '100%': { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
  }),

  /** Leaves the way it came in, no overshoot — an exit should not linger. */
  slideSpringOut: keyframes({
    from: { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
    to: {
      opacity: 0,
      transform: 'translate3d(calc(var(--sx, 0px) * 0.7), calc(var(--sy, 0px) * 0.7), 0) scale(0.94)',
    },
  }),

  /** Badge landing: arrives just after the card, so the two read as layered. */
  badgeIn: keyframes({
    '0%': { opacity: 0, transform: 'translate(var(--bx), -50%) rotate(45deg) scale(0.2)' },
    '55%': { opacity: 1, transform: 'translate(var(--bx), -50%) rotate(45deg) scale(1.18)' },
    '78%': { transform: 'translate(var(--bx), -50%) rotate(45deg) scale(0.96)' },
    '100%': { opacity: 1, transform: 'translate(var(--bx), -50%) rotate(45deg) scale(1)' },
  }),

  /** Slide in from the leading edge with a small overshoot. */
  slideIn: keyframes({
    '0%': { opacity: 0, transform: 'translateX(-20px)' },
    '70%': { transform: 'translateX(3px)' },
    '100%': { opacity: 1, transform: 'translateX(0)' },
  }),
  slideOut: keyframes({
    from: { opacity: 1, transform: 'translateX(0)' },
    to: { opacity: 0, transform: 'translateX(-26px)' },
  }),
  /** Counterpart to springIn — collapses back the way it came, no overshoot. */
  springOut: keyframes({
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.82)' },
  }),
  /** Rise into place — for surfaces that own the screen centre. */
  riseIn: keyframes({
    '0%': { opacity: 0, transform: 'translateY(14px) scale(0.985)' },
    '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
  }),
  /** Wipe a panel open from its leading edge. */
  wipeX: keyframes({
    from: { transform: 'scaleX(0)' },
    to: { transform: 'scaleX(1)' },
  }),
  /** Drain a bar left to right — remaining time / progress. */
  drainX: keyframes({
    from: { transform: 'scaleX(1)' },
    to: { transform: 'scaleX(0)' },
  }),
  /** A light blade travelling along a filled bar. */
  sheen: keyframes({
    '0%': { transform: 'translateX(-100%)' },
    '60%': { transform: 'translateX(320%)' },
    '100%': { transform: 'translateX(320%)' },
  }),
};

/** Badge that grows AND slides into its cutout — arriving, not appearing. */
export const diamondEntry = (centerX: number, slide = 16) => {
  const at = (dx: number, s: number) =>
    `translate(calc(-50% + ${centerX + dx}px), -50%) rotate(45deg) scale(${s})`;
  return keyframes({
    '0%': { opacity: 0, transform: at(-slide, 0.3) },
    '45%': { opacity: 1 },
    '72%': { opacity: 1, transform: at(3, 1.16) },
    '100%': { opacity: 1, transform: at(0, 1) },
  });
};

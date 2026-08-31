import { Box, createStyles, useMantineTheme } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useNuiEvent } from '../../../hooks/useNuiEvent';
import { fetchNui } from '../../../utils/fetchNui';
import { isIconUrl } from '../../../utils/isIconUrl';
import ScaleFade from '../../../transitions/ScaleFade';
import type { RadialMenuItem } from '../../../typings';
import { useLocales } from '../../../providers/LocaleProvider';
import LibIcon from '../../../components/LibIcon';
import { title, accentOf, EASE } from '../../../theme/surface';

/*
 * Radial menu — discrete TILES on a ring, not pie sectors.
 *
 * The wheel version put every label inside its own wedge, which meant six
 * labels competing at once, each one rotated into a different reading angle and
 * squeezed to fit its slice. One label shows at a time now, upright, in the
 * centre: the ring is the choice, the middle is the readout and the way out.
 *
 * Geometry and lighting are matched to prp-hud from measurements. Tiles are lit
 * from WITHIN by the accent rather than outlined — faint at rest, and when
 * selected a DIRECTIONAL glow entering from the side facing the middle, plus a
 * gradient ring. A rotating arc marks the bearing. No close control: Escape or
 * Backspace closes.
 *
 * Selection is by pointer DIRECTION, not hover — a flick towards an item picks
 * it from anywhere on screen.
 */

const PAGE_ITEMS = 6;

/*
 * Geometry measured off prp-hud's own radial and converted out of its scale.
 * Its NUI runs at an 11.533px root, so every rendered value was divided by
 * 11.533 to recover the authored rem and re-expressed here at a 16px root:
 *
 *   tile     55px rendered → 5rem      → 80px
 *   ring     122px rendered → 10.58rem → 169px
 *   label    17.3px rendered → 1.5rem  → 24px (dialled down below)
 *
 * Its six tiles sat at exactly -90/-30/29/90/151/-151° — 60° apart from twelve
 * o'clock, which is the layout below.
 */
const RING_R = 169;
const TILE = 80;
const FIELD = RING_R * 2 + TILE + 40;
const degToRad = (deg: number) => deg * (Math.PI / 180);

const TILE_RADIUS = 14;
const BORDER_W = 2;

/*
 * Active-tile border: a 2px ROUNDED ring carrying a gradient.
 *
 * A gradient cannot be a border-color, so the ring is a full-bleed gradient
 * masked down to just the border band: one mask layer covering the padding box
 * and one covering the whole element, composited `exclude`, which leaves only
 * the 2px difference between them. The rounding comes along for free because
 * both boxes are rounded.
 *
 * The gradient is the point — prp-hud runs `linear-gradient(420deg, accent,
 * accent 20%)` through its ring so the edge is bright at one corner and fades
 * around the tile. A flat border cannot fade, and the fade is what reads as a
 * highlight rather than a box.
 */
const BORDER_MASK = {
  maskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
  maskClip: 'padding-box, border-box',
  maskComposite: 'exclude',
  WebkitMaskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
  WebkitMaskClip: 'padding-box, border-box',
  WebkitMaskComposite: 'xor',
} as const;

/*
 * The arc that marks the chosen direction.
 *
 * A short segment of a circle struck from the ring's centre, sitting inside the
 * tiles, which rotates to whichever item is selected. It is the piece that says
 * "this way" — the tile tells you WHAT is selected, the arc tells you WHERE the
 * selection came from, and because it rotates rather than cutting, the movement
 * between items is legible.
 */
const ARC_R = RING_R - TILE / 2 - 20;
const ARC_LEN = 30; // px of visible stroke
const ARC_C = 2 * Math.PI * ARC_R;

const useStyles = createStyles((theme) => {
  const accent = accentOf(theme);

  return {
    wrapper: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    // Square field the ring is laid out inside. Sized so a tile at the top and
    // one at the bottom both sit fully inside it.
    field: {
      position: 'relative',
      width: FIELD,
      height: FIELD,
    },
    tile: {
      position: 'absolute',
      width: TILE,
      height: TILE,
      marginLeft: -TILE / 2,
      marginTop: -TILE / 2,
      borderRadius: TILE_RADIUS,
      backgroundColor: 'rgba(12, 15, 20, 0.85)',
      // Lit from within, not outlined. Measured off prp-hud: 0.153 alpha at
      // ~3.7px blur at rest.
      boxShadow: `inset 0 0 3.7px ${theme.fn.rgba(accent, 0.153)}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.82)',
      cursor: 'pointer',
      transition: `box-shadow 150ms ease, color 150ms ease`,

      // Gradient ring, faded in when the tile is the selected one.
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: TILE_RADIUS,
        border: `${BORDER_W}px solid transparent`,
        backgroundImage: `linear-gradient(420deg, ${accent} 0%, ${theme.fn.rgba(accent, 0.2)} 100%)`,
        backgroundOrigin: 'border-box',
        ...BORDER_MASK,
        opacity: 0,
        transition: 'opacity 150ms ease',
        pointerEvents: 'none',
      },
    },
    // Selection is driven by pointer DIRECTION, not by :hover — see the
    // useEffect below — so the active look is a class, not a hover rule.
    //
    // The inner glow is applied per tile as an inline style rather than here,
    // because it is OFFSET along the tile's own bearing: the light enters from
    // the side facing the middle of the ring, so it reads as coming from where
    // the pointer is rather than as a uniform halo.
    tileActive: {
      // The icon takes the accent too: prp-hud tints the glyph, not just the
      // edge, so the whole tile reads as active rather than merely outlined.
      color: accent,
      '&::before': { opacity: 1 },
    },
    // Arc layer sits under the tiles and never eats a click.
    arcSvg: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'visible',
    },
    arc: {
      fill: 'none',
      stroke: accent,
      strokeWidth: 3,
      strokeLinecap: 'round',
      strokeDasharray: `${ARC_LEN} ${ARC_C - ARC_LEN}`,
      // Pull the segment back by half its length so it straddles the bearing
      // instead of starting on it.
      strokeDashoffset: ARC_LEN / 2,
      filter: `drop-shadow(0 0 6px ${theme.fn.rgba(accent, 0.9)})`,
      transformOrigin: 'center',
      transition: `transform 180ms ${EASE}, opacity 150ms ease`,
    },
    tileIcon: {
      fontSize: 22,
    },
    tileImage: {
      maxWidth: 30,
      maxHeight: 30,
    },
    // Bare label in the middle — no panel, no button. prp-hud has nothing in
    // the centre but the hovered item's name, and closing is a keypress.
    centerLabel: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      ...title(17),
      color: '#fff',
      textShadow: '0 2px 10px rgba(0,0,0,0.9)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      textAlign: 'center',
    },
  };
});

const RadialMenu: React.FC = () => {
  const { classes, cx } = useStyles();
  const theme = useMantineTheme();
  const accentColor = accentOf(theme);
  const { locale } = useLocales();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<RadialMenuItem[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ items: RadialMenuItem[]; sub?: boolean; page: number }>({
    items: [],
    sub: false,
    page: 1,
  });

  const changePage = async (increment?: boolean) => {
    setVisible(false);

    const didTransition: boolean = await fetchNui('radialTransition');

    if (!didTransition) return;

    setVisible(true);
    setMenu({ ...menu, page: increment ? menu.page + 1 : menu.page - 1 });
  };

  useEffect(() => {
    if (menu.items.length <= PAGE_ITEMS) return setMenuItems(menu.items);
    const items = menu.items.slice(
      PAGE_ITEMS * (menu.page - 1) - (menu.page - 1),
      PAGE_ITEMS * menu.page - menu.page + 1
    );
    if (PAGE_ITEMS * menu.page - menu.page + 1 < menu.items.length) {
      items[items.length - 1] = { icon: 'ellipsis-h', label: locale.ui.more, isMore: true };
    }
    setMenuItems(items);
  }, [menu.items, menu.page]);

  useNuiEvent('openRadialMenu', async (data: { items: RadialMenuItem[]; sub?: boolean; option?: string } | false) => {
    if (!data) return setVisible(false);
    let initialPage = 1;
    if (data.option) {
      data.items.findIndex(
        (item, index) => item.menu == data.option && (initialPage = Math.floor(index / PAGE_ITEMS) + 1)
      );
    }
    setMenu({ ...data, page: initialPage });
    setHovered(null);
    setVisible(true);
  });

  useNuiEvent('refreshItems', (data: RadialMenuItem[]) => {
    setMenu({ ...menu, items: data });
  });

  /*
   * Escape / Backspace close the menu, since there is no longer a button to
   * click. Both step BACK one level first where there is one — a page, then a
   * submenu — so the key means "up one" rather than "quit", and only closes
   * outright from the top level. That mirrors what right-click already does.
   *
   * Bound only while visible, so the keys stay free for everything else.
   */
  useEffect(() => {
    if (!visible) return;

    const onKey = async (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Backspace') return;
      e.preventDefault();

      if (menu.page > 1) return await changePage();
      if (menu.sub) return fetchNui('radialBack');

      setVisible(false);
      fetchNui('radialClose');
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, menu.page, menu.sub]);

  const count = Math.max(menuItems.length, 1);
  const centreLabel = hovered !== null ? menuItems[hovered]?.label : undefined;

  /** Commit whichever item the pointer is aimed at. */
  const select = async (index: number | null) => {
    if (index === null) return;
    const item = menuItems[index];
    if (!item) return;

    if (item.isMore) return await changePage(true);

    const clickIndex = menu.page === 1 ? index : PAGE_ITEMS * (menu.page - 1) - (menu.page - 1) + index;
    fetchNui('radialClick', clickIndex);
  };

  /*
   * Selection follows the pointer's DIRECTION from the centre, not whether it
   * is over a tile.
   *
   * A ring of 80px tiles is mostly empty space — hovering each one meant
   * steering into a small square, which is the slowest possible way to use a
   * radial. Reading the angle instead means a flick in a direction selects that
   * item from anywhere on screen, which is what makes a radial fast and what
   * every in-game one does.
   *
   * Inside DEAD_ZONE nothing is selected, so the middle stays neutral and you
   * can close without brushing a choice on the way out.
   */
  useEffect(() => {
    if (!visible) return;

    const DEAD_ZONE = 46; // px from centre with no selection

    const onMove = (e: MouseEvent) => {
      const el = fieldRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);

      if (Math.hypot(dx, dy) < DEAD_ZONE) return setHovered(null);

      // Tiles sit every 360/count degrees starting at twelve o'clock, so the
      // nearest one is just the angle divided by the step, rounded.
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const step = 360 / count;
      const index = ((Math.round(deg / step) % count) + count) % count;

      setHovered(index);
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [visible, count]);

  return (
    <Box
      className={classes.wrapper}
      onContextMenu={async () => {
        if (menu.page > 1) await changePage();
        else if (menu.sub) fetchNui('radialBack');
      }}
    >
      <ScaleFade visible={visible}>
        {/* Click anywhere: the selection is whatever direction you are pointing,
            so the target is a 60° wedge of the screen rather than an 80px tile. */}
        <Box className={classes.field} ref={fieldRef} onClick={() => select(hovered)}>
          {/* Direction arc. Always mounted so it can ROTATE between items
              rather than cutting; it just fades out when nothing is selected. */}
          <svg className={classes.arcSvg} viewBox={`0 0 ${FIELD} ${FIELD}`}>
            <circle
              className={classes.arc}
              cx={FIELD / 2}
              cy={FIELD / 2}
              r={ARC_R}
              style={{
                opacity: hovered === null ? 0 : 1,
                // SVG angles start at 3 o'clock; the ring starts at 12, hence
                // the -90 to line the arc up with the tile bearings.
                transform: `rotate(${(360 / count) * (hovered ?? 0) - 90}deg)`,
              }}
            />
          </svg>

          {menuItems.map((item, index) => {
            // Start at 12 o'clock and go clockwise, so the first item is where
            // the eye already is.
            const angle = degToRad((360 / count) * index - 90);
            const x = RING_R * Math.cos(angle);
            const y = RING_R * Math.sin(angle);

            // Directional glow: the light enters from the side facing the
            // middle of the ring — a tile at the top is lit along its bottom
            // edge, one on the right along its left. A centred halo looks the
            // same whichever item you pick; this points back at the centre.
            //
            // The offset is the tile's own bearing UNNEGATED, which looks wrong
            // until you remember an inset shadow casts from the edge OPPOSITE
            // its offset: +x offset puts the glow on the left edge. Negating it
            // lit the outer edge instead — the exact reverse.
            const GLOW = 11;
            const glow =
              hovered === index
                ? `inset ${(Math.cos(angle) * GLOW).toFixed(1)}px ${(Math.sin(angle) * GLOW).toFixed(1)}px 16px ` +
                  `${theme.fn.rgba(accentColor, 0.55)}, inset 0 0 6px ${theme.fn.rgba(accentColor, 0.35)}`
                : undefined;

            return (
              <Box
                key={`radial-${index}`}
                className={cx(classes.tile, { [classes.tileActive]: hovered === index })}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, boxShadow: glow }}
              >
                {typeof item.icon === 'string' && isIconUrl(item.icon) ? (
                  <img src={item.icon} className={classes.tileImage} alt="" />
                ) : (
                  <LibIcon icon={item.icon as IconProp} className={classes.tileIcon} fixedWidth />
                )}
              </Box>
            );
          })}

          {centreLabel && <Box className={classes.centerLabel}>{centreLabel}</Box>}
        </Box>
      </ScaleFade>
    </Box>
  );
};

export default RadialMenu;

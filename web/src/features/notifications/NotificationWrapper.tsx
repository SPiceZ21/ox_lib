import { useNuiEvent } from '../../hooks/useNuiEvent';
import { toast, Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Box, createStyles, Text } from '@mantine/core';
import React, { useState } from 'react';
import tinycolor from 'tinycolor2';
import type { NotificationProps } from '../../typings';
import MarkdownComponents from '../../config/MarkdownComponents';
import LibIcon from '../../components/LibIcon';
import { RADIUS, slab, shadow, title, body, kf } from '../../theme/surface';

/*
 * Notification card.
 *
 * Keeps prp-hud's structure — diamond severity badge, dark horizontal-falloff
 * slab, severity carried by colour rather than by a coloured background — but
 * on ROUNDED corners and in Panchang, the framework's own display face.
 *
 * Severity is carried by the BADGE alone. Earlier versions also drew edge lines
 * — twin hairlines, then a leading rail, then an inner ring — and every one of
 * them read as decoration stuck on the panel rather than as part of it. One
 * coloured object, no trim.
 *
 * The diamond's own corners are rounded to match: a hard-cornered badge on a
 * soft panel is the detail that gives the whole thing away.
 *
 * Slim by intent — 34px tall. These stack three or four deep during a race, so
 * every row of height costs four rows of screen.
 *
 * Motion: the card slides in from whichever edge it lives on and settles with
 * the spring damping sampled off prp-hud — overshoot, a smaller correction, then
 * rest — so it decelerates like it has weight. The badge lands a beat later, the
 * one deliberate stagger, which is what gives the card depth instead of it
 * arriving as a single flat object.
 */

const BADGE_SQ = 34;   // badge size
const BADGE_CX = 3;    // badge centre, px inside the panel left edge

// Severity palette, carried over from the reference so a success here and a
// success anywhere else in the framework are the same green.
const SEVERITY: Record<string, string> = {
  info: '#87BCE1',
  error: '#E84B45',
  success: '#B6EB9D',
  warning: '#E8C547',
};

const useStyles = createStyles((theme) => ({
  item: {
    position: 'relative',
    isolation: 'isolate',
    display: 'flex',
    alignItems: 'center',
    width: 'fit-content',
    maxWidth: 400,
    minHeight: 34,
    padding: '5px 17px 5px 39px',
    color: '#fff',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    borderRadius: RADIUS,
    background: slab,
    transformOrigin: 'left center',
    boxShadow: shadow,
  },
  // Diamond badge: rotated square with softened corners, riding ON TOP of the
  // panel’s leading edge. The slab runs unbroken underneath it — an earlier
  // version punched a matching hole through the panel, and at this badge size
  // the bite took a visible chunk out of the card instead of reading as one
  // object sitting on another.
  diamond: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: BADGE_SQ,
    height: BADGE_SQ,
    borderRadius: 10,
    // Reads BADGE_CX so the badge and the hole it sits in can never drift.
    transform: `translate(calc(-50% + ${BADGE_CX}px), -50%) rotate(45deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(14,15,19,0.98), rgba(6,7,10,0.9))',
  },
  diamondGlyph: {
    transform: 'rotate(-45deg)',
    fontSize: 15,
    lineHeight: 1,
    display: 'flex',
  },
  title: {
    ...title(12),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  body: body(11),
  // Remaining duration: rounded, inset to the panel's curve.
  timer: {
    position: 'absolute',
    left: 7,
    right: 7,
    bottom: 2,
    height: 2,
    borderRadius: 99,
    transformOrigin: 'left center',
    zIndex: 1,
  },
}));

const Notifications: React.FC = () => {
  const { classes } = useStyles();
  const [toastKey, setToastKey] = useState(0);

  useNuiEvent<NotificationProps>('notify', (data) => {
    if (!data.title && !data.description) return;

    const toastId = data.id?.toString();
    const duration = data.duration || 3000;

    let position = data.position || 'top-right';

    data.showDuration = data.showDuration !== undefined ? data.showDuration : true;

    if (toastId) setToastKey((prevKey) => prevKey + 1);

    // Backwards compat with old notifications
    switch (position) {
      case 'top':
        position = 'top-center';
        break;
      case 'bottom':
        position = 'bottom-center';
        break;
    }

    if (!data.icon) {
      switch (data.type) {
        case 'error':
          data.icon = 'xmark';
          break;
        case 'success':
          data.icon = 'check';
          break;
        case 'warning':
          data.icon = 'exclamation';
          break;
        default:
          data.icon = 'info';
          break;
      }
    }

    const sev = data.iconColor
      ? tinycolor(data.iconColor).toRgbString()
      : SEVERITY[data.type || 'info'] || SEVERITY.info;

    /*
     * Travel vector: a toast enters from the edge it lives on, so one on the
     * right flies in from off-screen right and one pinned to the top drops from
     * above. Entering from the wrong side reads as the card crossing the screen
     * to get somewhere it was always going to sit.
     *
     * Handed to the keyframes as custom properties — see kf.slideSpringIn.
     */
    const TRAVEL = 44;
    const slide = position.includes('right')
      ? { x: TRAVEL, y: 0 }
      : position.includes('left')
      ? { x: -TRAVEL, y: 0 }
      : position.startsWith('bottom')
      ? { x: 0, y: TRAVEL }
      : { x: 0, y: -TRAVEL };

    toast.custom(
      (t) => (
        <Box
          className={classes.item}
          style={{ ['--sx' as any]: `${slide.x}px`, ['--sy' as any]: `${slide.y}px` }}
          sx={{
            // Linear on purpose: the spring lives in the keyframe values, so a
            // timing function on top would bend a curve that is already shaped.
            animation: t.visible
              ? `${kf.slideSpringIn} 620ms linear both`
              : `${kf.slideSpringOut} 200ms ease-in both`,
            ...data.style,
          }}
        >
          <Box className={classes.bg} />

          {data.icon && (
            <Box
              className={classes.diamond}
              style={{ ['--bx' as any]: `calc(-50% + ${BADGE_CX}px)` }}
              sx={{
                boxShadow: `inset 0 0 0 1.5px ${sev}, 0 0 10px ${tinycolor(sev).setAlpha(0.35).toRgbString()}`,
                // Lands a beat after the card so the two read as layered rather
                // than as one flat object arriving.
                animation: `${kf.badgeIn} 420ms 90ms linear both`,
              }}
            >
              <Box className={classes.diamondGlyph}>
                <LibIcon icon={data.icon} fixedWidth color={sev} animation={data.iconAnimation} fontSize={15} />
              </Box>
            </Box>
          )}

          <Box sx={{ minWidth: 0 }}>
            {data.title && <Text className={classes.title}>{data.title}</Text>}
            {data.description && (
              <ReactMarkdown components={MarkdownComponents} className={`${classes.body} description`}>
                {data.description}
              </ReactMarkdown>
            )}
          </Box>

          {data.showDuration && (
            <Box
              key={toastKey}
              className={classes.timer}
              sx={{
                backgroundColor: sev,
                opacity: 0.65,
                animation: `${kf.drainX} linear forwards`,
                animationDuration: `${duration}ms`,
              }}
            />
          )}
        </Box>
      ),
      {
        id: toastId,
        duration: duration,
        position: position,
      }
    );
  });

  return <Toaster containerStyle={{ zIndex: 20 }} gutter={6} />;
};

export default Notifications;

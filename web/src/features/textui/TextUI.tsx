import React from 'react';
import { useNuiEvent } from '../../hooks/useNuiEvent';
import { Box, createStyles } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TextUiPosition, TextUiProps } from '../../typings';
import MarkdownComponents from '../../config/MarkdownComponents';
import LibIcon from '../../components/LibIcon';
import { RADIUS, slab, shadow, title, accentOf, kf } from '../../theme/surface';

/*
 * Text UI — the same card as a notification.
 *
 * Identical anatomy: a slab that runs UNDER the diamond badge, the badge riding
 * on top of its leading edge, Panchang Light type. A keybind prompt and a
 * notification are the same kind of object — a short line the framework is
 * showing you — so they should not be two different shapes.
 *
 * What differs is only what the badge carries: a notification's badge is its
 * severity, a prompt's is the accent, because a prompt is always "here is
 * something you can do" rather than good or bad news.
 *
 * A prompt with no icon drops the badge and its left padding, so the panel
 * closes up rather than reserving space for nothing.
 */

const BADGE_SQ = 30;
const BADGE_CX = 3;

const useStyles = createStyles((theme, params: { position?: TextUiPosition; hasIcon: boolean }) => ({
  wrapper: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    display: 'flex',
    alignItems:
      params.position === 'top-center' ? 'baseline' :
      params.position === 'bottom-center' ? 'flex-end' : 'center',
    justifyContent:
      params.position === 'right-center' ? 'flex-end' :
      params.position === 'left-center' ? 'flex-start' : 'center',
  },
  item: {
    position: 'relative',
    isolation: 'isolate',
    display: 'flex',
    alignItems: 'center',
    width: 'fit-content',
    maxWidth: 420,
    minHeight: 30,
    padding: params.hasIcon ? '5px 16px 5px 34px' : '5px 16px',
    margin: 8,
    color: '#fff',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    borderRadius: RADIUS,
    background: slab,
    boxShadow: shadow,
  },
  diamond: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: BADGE_SQ,
    height: BADGE_SQ,
    borderRadius: 9,
    transform: `translate(calc(-50% + ${BADGE_CX}px), -50%) rotate(45deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(14,15,19,0.98), rgba(6,7,10,0.9))',
  },
  diamondGlyph: {
    transform: 'rotate(-45deg)',
    fontSize: 13,
    lineHeight: 1,
    display: 'flex',
  },
  text: {
    ...title(11.5),
    minWidth: 0,
  },
}));

const TextUI: React.FC = () => {
  const [data, setData] = React.useState<TextUiProps>({
    text: '',
    position: 'right-center',
  });
  const [visible, setVisible] = React.useState(false);
  const hasIcon = !!data.icon;
  const { classes, theme } = useStyles({ position: data.position, hasIcon });
  const accent = accentOf(theme);

  useNuiEvent<TextUiProps>('textUi', (data) => {
    if (!data.position) data.position = 'right-center'; // Default right position
    setData(data);
    setVisible(true);
  });

  useNuiEvent('textUiHide', () => setVisible(false));

  // Enters from the edge it is pinned to, exactly as a notification does.
  const TRAVEL = 40;
  const slide =
    data.position === 'left-center' ? { x: -TRAVEL, y: 0 } :
    data.position === 'top-center' ? { x: 0, y: -TRAVEL } :
    data.position === 'bottom-center' ? { x: 0, y: TRAVEL } :
    { x: TRAVEL, y: 0 };

  const badge = data.iconColor || accent;

  return (
    <Box className={classes.wrapper}>
      {visible && (
        <Box
          className={classes.item}
          style={{
            ...data.style,
            ['--sx' as any]: `${slide.x}px`,
            ['--sy' as any]: `${slide.y}px`,
          }}
          sx={{ animation: `${kf.slideSpringIn} 620ms linear both` }}
        >
          <Box className={classes.bg} />

          {data.icon && (
            <Box
              className={classes.diamond}
              style={{ ['--bx' as any]: `calc(-50% + ${BADGE_CX}px)` }}
              sx={{
                boxShadow: `inset 0 0 0 1.5px ${badge}, 0 0 10px ${theme.fn.rgba(badge, 0.35)}`,
                animation: `${kf.badgeIn} 420ms 90ms linear both`,
              }}
            >
              <Box className={classes.diamondGlyph}>
                <LibIcon icon={data.icon} fixedWidth color={badge} animation={data.iconAnimation} fontSize={13} />
              </Box>
            </Box>
          )}

          <Box className={classes.text}>
            <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
              {data.text}
            </ReactMarkdown>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TextUI;

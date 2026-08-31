import React from 'react';
import { Box, createStyles, keyframes, Text } from '@mantine/core';
import { useNuiEvent } from '../../hooks/useNuiEvent';
import { fetchNui } from '../../utils/fetchNui';
import ScaleFade from '../../transitions/ScaleFade';
import type { ProgressbarProps } from '../../typings';

/*
 * Progress bar — prp-hud language, rebuilt from measured geometry.
 *
 * The reference bar is a 45° SKEWED parallelogram (transform matrix(1,0,-1,1))
 * over a half-black track, with a Quantico header row — label left, percent
 * right — and no housing panel at all: the world stays visible.
 *
 * Added motion (ours): a shine sweep looping along the fill while active, and
 * a settle-in on the header. Fill width itself is a plain CSS animation, so a
 * JS hitch can never stutter it.
 */

const shine = keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '60%': { transform: 'translateX(320%)' },
  '100%': { transform: 'translateX(320%)' },
});

const headIn = keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const useStyles = createStyles((theme) => {
  const accent = theme.colors[theme.primaryColor][theme.fn.primaryShade()];

  return {
    wrapper: {
      width: '100%',
      height: '20%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bottom: 0,
      position: 'absolute',
    },
    container: {
      width: 340,
    },
    head: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: 7,
      animation: `${headIn} 300ms cubic-bezier(0.16, 1, 0.3, 1) both`,
    },
    label: {
      flex: 1,
      minWidth: 0,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: 'Panchang, Inter, sans-serif',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#fff',
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)',
    },
    percent: {
      fontFamily: 'Panchang, Inter, sans-serif',
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      color: accent,
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)',
      flexShrink: 0,
    },
    // Rounded rail. The reference skews this −45°; rounded corners and a skew
    // fight each other (the radius shears into an ellipse), so the shape is a
    // clean pill and the motion carries the energy instead.
    track: {
      height: 6,
      borderRadius: 99,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.06)',
      overflow: 'hidden',
    },
    bar: {
      position: 'relative',
      height: '100%',
      borderRadius: 99,
      background: `linear-gradient(90deg, ${theme.fn.lighten(accent, 0.18)} 0%, ${accent} 100%)`,
      boxShadow: `0 0 10px ${theme.fn.rgba(accent, 0.55)}`,
      overflow: 'hidden',
      // Width is a plain CSS animation: smooth, and unaffected by JS hitching.
      animation: 'progress-bar linear',
    },
    // Light blade sweeping down the fill while the task runs.
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '34%',
      height: '100%',
      background:
        'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)',
      animation: `${shine} 1.6s ease-in-out infinite`,
    },
  };
});

const Progressbar: React.FC = () => {
  const { classes } = useStyles();
  const [visible, setVisible] = React.useState(false);
  const [label, setLabel] = React.useState('');
  const [duration, setDuration] = React.useState(0);
  const [percent, setPercent] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setInterval>>();

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = undefined;
  };

  useNuiEvent('progressCancel', () => {
    stop();
    setVisible(false);
  });

  useNuiEvent<ProgressbarProps>('progress', (data) => {
    stop();
    setVisible(true);
    setLabel(data.label);
    setDuration(data.duration);
    setPercent(0);

    // Only drives the readout; the fill is the CSS animation above.
    const started = Date.now();
    timer.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / data.duration) * 100);
      setPercent(pct);
      if (pct >= 100) stop();
    }, 40);
  });

  React.useEffect(() => stop, []);

  return (
    <Box className={classes.wrapper}>
      <ScaleFade visible={visible} onExitComplete={() => fetchNui('progressComplete')}>
        <Box className={classes.container}>
          <Box className={classes.head}>
            <Text className={classes.label}>{label}</Text>
            <Text className={classes.percent}>{Math.round(percent)}%</Text>
          </Box>

          <Box className={classes.track}>
            <Box
              className={classes.bar}
              onAnimationEnd={() => {
                stop();
                setVisible(false);
              }}
              sx={{ animationDuration: `${duration}ms` }}
            >
              <Box className={classes.sheen} />
            </Box>
          </Box>
        </Box>
      </ScaleFade>
    </Box>
  );
};

export default Progressbar;

import React from 'react';
import { Box, createStyles, Text } from '@mantine/core';
import { useNuiEvent } from '../../hooks/useNuiEvent';
import { fetchNui } from '../../utils/fetchNui';
import ScaleFade from '../../transitions/ScaleFade';
import type { ProgressbarProps } from '../../typings';

/*
 * SPiceZ progress bar — minimal.
 *
 * No panel, no housing: just the label, the figure and a thin rule. Text shadows
 * carry legibility instead of a background, so the world stays visible during
 * long tasks and the bar reads as part of the HUD rather than a window over it.
 */

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
      width: 380,
    },
    head: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: 8,
    },
    label: {
      flex: 1,
      minWidth: 0,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: 'Panchang, Inter, sans-serif',
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: '#fff',
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)',
    },
    percent: {
      fontFamily: 'Panchang, Inter, sans-serif',
      fontSize: 13,
      fontWeight: 800,
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      color: accent,
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)',
      flexShrink: 0,
    },
    track: {
      height: 3,
      borderRadius: 99,
      backgroundColor: theme.fn.rgba('#ffffff', 0.16),
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
      borderRadius: 99,
      backgroundColor: accent,
      boxShadow: `0 0 8px ${theme.fn.rgba(accent, 0.6)}`,
      // Width is a plain CSS animation: smooth, and unaffected by JS hitching.
      animation: 'progress-bar linear',
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
            />
          </Box>
        </Box>
      </ScaleFade>
    </Box>
  );
};

export default Progressbar;

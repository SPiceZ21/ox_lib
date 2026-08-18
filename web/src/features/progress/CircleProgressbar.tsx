import React from 'react';
import { Box, createStyles, keyframes, Stack, Text } from '@mantine/core';
import { useNuiEvent } from '../../hooks/useNuiEvent';
import { fetchNui } from '../../utils/fetchNui';
import ScaleFade from '../../transitions/ScaleFade';
import type { CircleProgressbarProps } from '../../typings';

/*
 * SPiceZ circular progress.
 *
 * Rebuilt on a plain SVG ring instead of Mantine's RingProgress, which had to be
 * driven by reaching into `svg > circle:nth-child(2)` — fragile, and it left no
 * control over cap shape, glow or the track. Here the arc is ours: round cap,
 * gradient stroke, and a soft pulse so the ring reads as active.
 */

const SIZE = 104;
const STROKE = 6;
const R = (SIZE - STROKE) / 2 - 4;
const CIRCUMFERENCE = 2 * Math.PI * R;

const sweep = keyframes({
  from: { strokeDashoffset: CIRCUMFERENCE },
  to: { strokeDashoffset: 0 },
});

const pulse = keyframes({
  '0%, 100%': { opacity: 0.25, transform: 'scale(1)' },
  '50%': { opacity: 0.5, transform: 'scale(1.04)' },
});

const useStyles = createStyles(
  (theme, params: { position: 'middle' | 'bottom'; duration: number }) => {
    const accent = theme.colors[theme.primaryColor][theme.fn.primaryShade()];

    return {
      container: {
        width: '100%',
        height: params.position === 'middle' ? '100%' : '20%',
        bottom: 0,
        position: 'absolute',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      wrapper: {
        marginTop: params.position === 'middle' ? 25 : undefined,
      },
      ring: {
        position: 'relative',
        width: SIZE,
        height: SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      // Soft halo behind the ring so it holds up over bright scenery.
      glow: {
        position: 'absolute',
        inset: 8,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.fn.rgba(accent, 0.22)}, transparent 68%)`,
        animation: `${pulse} 1800ms ease-in-out infinite`,
      },
      svg: {
        position: 'absolute',
        inset: 0,
        // 12 o'clock start instead of 3 o'clock.
        transform: 'rotate(-90deg)',
      },
      track: {
        fill: 'none',
        stroke: theme.fn.rgba('#ffffff', 0.09),
        strokeWidth: STROKE,
      },
      arc: {
        fill: 'none',
        stroke: accent,
        strokeWidth: STROKE,
        strokeLinecap: 'round',
        strokeDasharray: CIRCUMFERENCE,
        strokeDashoffset: CIRCUMFERENCE,
        filter: `drop-shadow(0 0 5px ${theme.fn.rgba(accent, 0.75)})`,
        animation: `${sweep} linear forwards`,
        animationDuration: `${params.duration}ms`,
      },
      value: {
        position: 'relative',
        fontFamily: 'Panchang, Inter, sans-serif',
        fontSize: 24,
        fontWeight: 800,
        lineHeight: 1,
        color: '#fff',
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
      },
      unit: {
        fontSize: 12,
        fontWeight: 700,
        color: theme.fn.rgba('#ffffff', 0.45),
        marginLeft: 1,
      },
      label: {
        marginTop: 10,
        textAlign: 'center',
        fontFamily: 'Panchang, Inter, sans-serif',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#fff',
        textShadow: '0 1px 5px rgba(0, 0, 0, 0.9)',
      },
    };
  }
);

const CircleProgressbar: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const [progressDuration, setProgressDuration] = React.useState(0);
  const [position, setPosition] = React.useState<'middle' | 'bottom'>('middle');
  const [value, setValue] = React.useState(0);
  const [label, setLabel] = React.useState('');
  const { classes } = useStyles({ position, duration: progressDuration });
  const timer = React.useRef<ReturnType<typeof setInterval>>();

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = undefined;
  };

  useNuiEvent('progressCancel', () => {
    stopTimer();
    setValue(99);
    setVisible(false);
  });

  useNuiEvent<CircleProgressbarProps>('circleProgress', (data) => {
    if (visible) return;
    setVisible(true);
    setValue(0);
    setLabel(data.label || '');
    setProgressDuration(data.duration);
    setPosition(data.position || 'middle');

    // Elapsed-time based rather than a counter that increments once per tick —
    // the old version drifted behind the ring whenever a frame was missed.
    stopTimer();
    const started = Date.now();
    timer.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / data.duration) * 100);
      setValue(pct);
      if (pct >= 100) stopTimer();
    }, 40);
  });

  React.useEffect(() => stopTimer, []);

  return (
    <Stack spacing={0} className={classes.container}>
      <ScaleFade visible={visible} onExitComplete={() => fetchNui('progressComplete')}>
        <Stack spacing={0} align="center" className={classes.wrapper}>
          <Box className={classes.ring}>
            <Box className={classes.glow} />

            <svg className={classes.svg} width={SIZE} height={SIZE}>
              <circle className={classes.track} cx={SIZE / 2} cy={SIZE / 2} r={R} />
              <circle
                className={classes.arc}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                onAnimationEnd={() => {
                  stopTimer();
                  setVisible(false);
                }}
              />
            </svg>

            <Text className={classes.value}>
              {Math.round(value)}
              <span className={classes.unit}>%</span>
            </Text>
          </Box>

          {label && <Text className={classes.label}>{label}</Text>}
        </Stack>
      </ScaleFade>
    </Stack>
  );
};

export default CircleProgressbar;

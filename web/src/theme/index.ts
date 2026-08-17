import { MantineThemeOverride, Tuple } from '@mantine/core';

/*
 * SPiceZ-Core theme for ox_lib.
 *
 * Every lib.notify / lib.showMenu / lib.progressBar / lib.inputDialog in the
 * framework renders through here, so the tokens live in ONE place rather than
 * being re-skinned per feature. Matches the house style used by spz-raceUI and
 * the rest of the NUIs: near-black surfaces, a single orange accent, Panchang
 * for anything numeric or heading-like, tight 4-6px radii.
 */

// Accent ramp built around #ff6600. Mantine needs all 10 shades; index 6 is the
// one `primaryShade` points at.
const spz: Tuple<string, 10> = [
  '#fff2e8',
  '#ffdcc4',
  '#ffc39b',
  '#ffa871',
  '#ff9147',
  '#ff7a1f',
  '#ff6600', // primary
  '#d95400',
  '#b04400',
  '#873400',
];

// Neutral ramp: 9 = the darkest surface, matching the NUI panels.
const ink: Tuple<string, 10> = [
  '#c9cbd1',
  '#a7aab3',
  '#868a95',
  '#6a6e79',
  '#4e525c',
  '#343841',
  '#22252b',
  '#15171c',
  '#0d0e12',
  '#06070a',
];

export const theme: MantineThemeOverride = {
  colorScheme: 'dark',

  colors: { spz, dark: ink },
  primaryColor: 'spz',
  primaryShade: 6,

  fontFamily: 'Inter, Roboto, sans-serif',
  fontFamilyMonospace: 'Roboto Mono, monospace',
  headings: {
    fontFamily: 'Panchang, Inter, sans-serif',
    fontWeight: 800,
  },

  defaultRadius: 'sm',
  radius: { xs: 3, sm: 5, md: 7, lg: 10, xl: 14 },

  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.5)',
    sm: '0 4px 14px rgba(0, 0, 0, 0.45)',
    md: '0 8px 24px rgba(0, 0, 0, 0.5)',
    lg: '0 14px 34px rgba(0, 0, 0, 0.55)',
    xl: '0 22px 48px rgba(0, 0, 0, 0.6)',
  },

  components: {
    Button: {
      defaultProps: { radius: 'sm' },
      styles: (t) => ({
        root: {
          border: 'none',
          fontWeight: 700,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          fontSize: 12,
          transition: 'filter 120ms ease, background-color 120ms ease',
          '&:hover': { filter: 'brightness(1.08)' },
        },
      }),
    },

    Modal: {
      styles: (t) => ({
        modal: {
          backgroundColor: t.colors.dark[8],
          border: `1px solid ${t.fn.rgba(t.colors.spz[6], 0.28)}`,
          boxShadow: t.shadows.lg,
        },
        title: {
          fontFamily: 'Panchang, Inter, sans-serif',
          fontWeight: 800,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          fontSize: 15,
        },
        overlay: { backgroundColor: 'rgba(0, 0, 0, 0.62)' },
      }),
    },

    Input: {
      styles: (t) => ({
        input: {
          backgroundColor: t.colors.dark[9],
          border: `1px solid ${t.fn.rgba('#ffffff', 0.1)}`,
          '&:focus, &:focus-within': {
            borderColor: t.fn.rgba(t.colors.spz[6], 0.6),
          },
        },
      }),
    },

    InputWrapper: {
      styles: {
        label: {
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.65,
          marginBottom: 6,
        },
      },
    },

    Progress: {
      styles: (t) => ({
        root: { backgroundColor: t.fn.rgba('#ffffff', 0.07) },
        bar: { backgroundColor: t.colors.spz[6] },
      }),
    },

    Tooltip: {
      styles: (t) => ({
        tooltip: {
          backgroundColor: t.colors.dark[9],
          border: `1px solid ${t.fn.rgba('#ffffff', 0.08)}`,
          fontSize: 11,
          fontWeight: 600,
        },
      }),
    },
  },
};

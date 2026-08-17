import { Box, createStyles, Text } from '@mantine/core';
import React from 'react';

const useStyles = createStyles((theme) => ({
  container: {
    textAlign: 'center',
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    // Accent bar across the top edge — the house header treatment.
    background: `linear-gradient(180deg, ${theme.colors.dark[7]}, ${theme.colors.dark[9]})`,
    boxShadow: `inset 0 2px 0 ${theme.colors[theme.primaryColor][theme.fn.primaryShade()]},
                inset 0 0 0 1px ${theme.fn.rgba('#ffffff', 0.06)}`,
    height: 52,
    width: 384,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontFamily: 'Panchang, Inter, sans-serif',
    fontSize: 17,
    textTransform: 'uppercase',
    fontWeight: 800,
    letterSpacing: '0.08em',
  },
}));

const Header: React.FC<{ title: string }> = ({ title }) => {
  const { classes } = useStyles();

  return (
    <Box className={classes.container}>
      <Text className={classes.heading}>{title}</Text>
    </Box>
  );
};

export default React.memo(Header);

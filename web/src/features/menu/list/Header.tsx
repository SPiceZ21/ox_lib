import { Box, createStyles, Text } from '@mantine/core';
import React from 'react';
import { RADIUS, slab, ring, title, accentOf } from '../../../theme/surface';

const useStyles = createStyles((theme) => ({
  container: {
    textAlign: 'center',
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    background: slab,
    boxShadow: ring('#ffffff', 0.06),
    height: 46,
    width: 384,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    ...title(15),
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

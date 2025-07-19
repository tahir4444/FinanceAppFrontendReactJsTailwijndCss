import React, { useContext } from 'react';
import { ThemeContext } from '../ThemeProvider';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <AppBar
      position="static"
      className="bg-primary-light dark:bg-primary-dark shadow-md"
      elevation={1}
    >
      <Toolbar className="flex justify-between">
        <Typography variant="h6" className="text-white">
          Todo App
        </Typography>
        <IconButton
          color="inherit"
          onClick={toggleTheme}
          aria-label="toggle theme"
        >
          {theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

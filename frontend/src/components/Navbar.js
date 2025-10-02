import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Container,
  Badge,
  Avatar
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from "react-router-dom";
import { cartService } from "../services/api";

const Navbar = () => {
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const adminMenuItems = [
    { label: "Dashboard", path: "/admin", icon: <DashboardIcon /> },
    { label: "Orders", path: "/admin/orders", icon: <LocalShippingIcon /> },
    { label: "Products", path: "/products", icon: <InventoryIcon /> },
    { label: "Add Product", path: "/admin/add-product", icon: <AddCircleIcon /> },
    { 
      label: "Logout", 
      path: null, 
      action: handleLogout,
      icon: <LogoutIcon />,
      color: "error"
    }
  ];

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(to right, #1e3c72, #2a5298)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo Section */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.3s ease'
              }
            }}
            onClick={() => navigate("/")}
          >
            <TwoWheelerIcon 
              sx={{ 
                fontSize: 40, 
                mr: 2,
                color: '#fff',
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))'
              }} 
            />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '1px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Royal Enfield
            </Typography>
          </Box>

          {/* Navigation Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {token ? (
              <>
                {role === "admin" ? (
                  <Box>
                    <Button
                      onClick={handleMenuOpen}
                      endIcon={<KeyboardArrowDownIcon />}
                      sx={{
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                        }
                      }}
                    >
                      Admin Menu
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      sx={{
                        '& .MuiPaper-root': {
                          borderRadius: 2,
                          minWidth: 200,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          mt: 1
                        }
                      }}
                    >
                      {adminMenuItems.map((item) => (
                        <MenuItem
                          key={item.label}
                          onClick={() => {
                            if (item.action) {
                              item.action();
                            } else {
                              navigate(item.path);
                            }
                            handleMenuClose();
                          }}
                          sx={{
                            gap: 2,
                            py: 1.5,
                            color: item.color === 'error' ? 'error.main' : 'inherit',
                            '&:hover': {
                              backgroundColor: item.color === 'error' ? 'error.lighter' : 'action.hover'
                            }
                          }}
                        >
                          {item.icon}
                          <Typography>{item.label}</Typography>
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      onClick={() => navigate("/products")}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Products
                    </Button>
                    <IconButton
                      onClick={() => navigate("/cart")}
                      sx={{ 
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      <Badge badgeContent={cartItemCount} color="error">
                        <ShoppingCartIcon />
                      </Badge>
                    </IconButton>
                    <Button
                      onClick={handleLogout}
                      startIcon={<LogoutIcon />}
                      sx={{
                        color: 'white',
                        borderRadius: 2,
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={() => navigate("/login")}
                  variant="text"
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  variant="contained"
                  sx={{
                    backgroundColor: 'white',
                    color: '#1e3c72',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;

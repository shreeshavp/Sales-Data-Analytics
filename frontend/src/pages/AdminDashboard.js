import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, Container, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import statisticsIcon from '../assets/icons/statistics.png';
import mostrecentIcon from '../assets/icons/most-recent.png';
import RefreshIcon from '@mui/icons-material/Refresh';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalReviews: 0,
    totalOrders: 0,
    products: [],
    recentReviews: []
  });

  const navigate = useNavigate();

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const productsResponse = await axios.get('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const reviewsResponse = await axios.get('http://localhost:5000/api/reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const ordersResponse = await axios.get('http://localhost:5000/api/orders/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setStats({
        totalProducts: productsResponse.data.length,
        totalReviews: reviewsResponse.data.length,
        totalOrders: ordersResponse.data.length,
        products: productsResponse.data,
        recentReviews: reviewsResponse.data
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        py: 4,
        px: { xs: 2, sm: 4 },
        color: 'white'
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TwoWheelerIcon 
              sx={{ 
                fontSize: 48,
                color: '#ffd700',
                filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.3))'
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '1px'
              }}
            >
              Admin Dashboard
            </Typography>
          </Box>
          <IconButton 
            onClick={fetchDashboardStats}
            sx={{
              backgroundColor: 'rgba(255,215,0,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,215,0,0.2)',
                transform: 'rotate(180deg)',
                transition: 'all 0.5s ease-in-out'
              }
            }}
          >
            <RefreshIcon sx={{ color: '#ffd700' }} />
          </IconButton>
        </Box>

        {/* Summary Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3,
            mb: 4
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,215,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                border: '1px solid rgba(255,215,0,0.5)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TwoWheelerIcon sx={{ fontSize: 32, color: '#ffd700' }} />
              <Typography sx={{ fontWeight: 500, color: '#ffd700' }}>Total Bikes</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>{stats.totalProducts}</Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,215,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                border: '1px solid rgba(255,215,0,0.5)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <RateReviewIcon sx={{ fontSize: 32, color: '#ffd700' }} />
              <Typography sx={{ fontWeight: 500, color: '#ffd700' }}>Total Reviews</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>{stats.totalReviews}</Typography>
          </Paper>

          
        </Box>

        {/* Navigation Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)'
            },
            gap: 3
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,215,0,0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                border: '1px solid rgba(255,215,0,0.5)',
              }
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,215,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                mx: 'auto',
                border: '2px solid rgba(255,215,0,0.3)'
              }}
            >
              <TwoWheelerIcon sx={{ fontSize: 40, color: '#ffd700' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                fontWeight: 600,
                color: '#ffd700',
                mb: 2
              }}
            >
              Bike Analytics
            </Typography>
            <Typography
              sx={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                mb: 3
              }}
            >
              Track motorcycle performance metrics and sales data
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/admin/product-statistics')}
                sx={{
                  background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
                  color: '#1e1e1e',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ffa500 30%, #ffd700 90%)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                View Analytics
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,215,0,0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                border: '1px solid rgba(255,215,0,0.5)',
              }
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,215,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                mx: 'auto',
                border: '2px solid rgba(255,215,0,0.3)'
              }}
            >
              <RateReviewIcon sx={{ fontSize: 40, color: '#ffd700' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                fontWeight: 600,
                color: '#ffd700',
                mb: 2
              }}
            >
              Rider Reviews
            </Typography>
            <Typography
              sx={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                mb: 3
              }}
            >
              Monitor rider feedback and motorcycle reviews
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/admin/recent-reviews')}
                sx={{
                  background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
                  color: '#1e1e1e',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ffa500 30%, #ffd700 90%)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                View Reviews
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminDashboard;

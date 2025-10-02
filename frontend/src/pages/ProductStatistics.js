import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Rating,
  Container,
  CircularProgress,
  Alert,
  Box,
  Paper,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import SpeedIcon from '@mui/icons-material/Speed';
import RefreshIcon from '@mui/icons-material/Refresh';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';

const ProductStatistics = () => {
  const [stats, setStats] = useState({ products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const fetchStats = async () => {
    try {
      setLoading(true);
      const productsResponse = await axios.get('http://localhost:5000/api/products', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const reviewsResponse = await axios.get('http://localhost:5000/api/reviews', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const products = productsResponse.data.map(product => {
        const productReviews = reviewsResponse.data.filter(
          review => review.product_id === product.id
        );
        
        const reviewCount = productReviews.length;
        const averageRating = reviewCount > 0
          ? productReviews.reduce((acc, review) => acc + review.rating, 0) / reviewCount
          : 0;

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          reviewCount,
          averageRating
        };
      });

      setStats({ products });
      setError(null);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load product statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <CircularProgress sx={{ color: '#ffd700' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          py: 4
        }}
      >
        <Container maxWidth="lg">
          <Alert 
            severity="error"
            sx={{
              backgroundColor: 'rgba(255,215,0,0.1)',
              color: '#ffd700',
              border: '1px solid rgba(255,215,0,0.3)',
              '& .MuiAlert-icon': {
                color: '#ffd700'
              }
            }}
          >
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

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
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DirectionsBikeIcon 
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
              Bike Statistics
            </Typography>
          </Box>
          <IconButton 
            onClick={fetchStats}
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
        
        {stats.products.length === 0 ? (
          <Alert 
            severity="info"
            sx={{
              backgroundColor: 'rgba(255,215,0,0.1)',
              color: '#ffd700',
              border: '1px solid rgba(255,215,0,0.3)',
              '& .MuiAlert-icon': {
                color: '#ffd700'
              }
            }}
          >
            No bikes found
          </Alert>
        ) : (
          <Paper
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 4,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        color: '#ffd700',
                        borderBottom: '1px solid rgba(255,215,0,0.3)',
                        fontWeight: 600,
                        py: 3
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TwoWheelerIcon sx={{ color: '#ffd700' }} />
                        Bike Model
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#ffd700',
                        borderBottom: '1px solid rgba(255,215,0,0.3)',
                        fontWeight: 600,
                        py: 3
                      }}
                    >
                      Reviews
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#ffd700',
                        borderBottom: '1px solid rgba(255,215,0,0.3)',
                        fontWeight: 600,
                        py: 3
                      }}
                    >
                      Rating
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#ffd700',
                        borderBottom: '1px solid rgba(255,215,0,0.3)',
                        fontWeight: 600,
                        py: 3
                      }}
                    >
                      Price
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#ffd700',
                        borderBottom: '1px solid rgba(255,215,0,0.3)',
                        fontWeight: 600,
                        py: 3
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.products.map((product) => (
                    <TableRow 
                      key={product.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(255,215,0,0.1)',
                        },
                        transition: 'background-color 0.3s'
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          color: 'white',
                          borderBottom: '1px solid rgba(255,215,0,0.2)'
                        }}
                      >
                        {product.name}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: 'rgba(255,255,255,0.7)',
                          borderBottom: '1px solid rgba(255,215,0,0.2)'
                        }}
                      >
                        {product.reviewCount}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid rgba(255,215,0,0.2)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating 
                            value={product.averageRating} 
                            precision={0.1} 
                            readOnly 
                            size="small"
                            sx={{
                              '& .MuiRating-iconFilled': {
                                color: '#ffd700',
                              },
                              '& .MuiRating-iconEmpty': {
                                color: 'rgba(255,215,0,0.3)',
                              }
                            }}
                          />
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            ({product.averageRating.toFixed(1)})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: '#ffd700',
                          borderBottom: '1px solid rgba(255,215,0,0.2)',
                          fontWeight: 600
                        }}
                      >
                        ₹{product.price}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid rgba(255,215,0,0.2)'
                        }}
                      >
                        <Box
                          component="button"
                          onClick={() => handleViewDetails(product.id)}
                          sx={{
                            background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
                            color: '#1e1e1e',
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': {
                              transform: 'scale(1.05)',
                              background: 'linear-gradient(45deg, #ffa500 30%, #ffd700 90%)',
                            }
                          }}
                        >
                          <SpeedIcon sx={{ fontSize: 18 }} />
                          View Details
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ProductStatistics;
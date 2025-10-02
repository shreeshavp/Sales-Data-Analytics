import React from "react";
import { Box, Typography, Container, Grid, Paper, Button } from "@mui/material";
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import SpeedIcon from '@mui/icons-material/Speed';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BuildIcon from '@mui/icons-material/Build';
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate("/products");
  };

  const FeatureCard = ({ title, description, icon }) => (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,215,0,0.5)',
        }
      }}
    >
      <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, rgba(255,215,0,0.2), rgba(255,215,0,0.4))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid rgba(255,215,0,0.3)',
              animation: 'pulse 2s infinite'
            }
          }}
        >
          {icon}
        </Box>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            color: '#ffd700',
            fontWeight: 600,
            mb: 2
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            flex: 1
          }}
        >
          {description}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        pt: { xs: 4, md: 8 },
        pb: 8
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 6, md: 10 },
            position: 'relative'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2,
              mb: 3
            }}
          >
            <TwoWheelerIcon 
              sx={{ 
                fontSize: { xs: 48, md: 72 },
                color: '#ffd700',
                filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.3))',
                animation: 'float 3s ease-in-out infinite'
              }}
            />
            <Typography 
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '1px'
              }}
            >
              AI for Sales Data Analysis to Optimize Inventory 
                    Management and Reduce Stockouts

            </Typography>
          </Box>
          <Typography 
            variant="h5"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 800,
              mx: 'auto',
              mb: 4,
              lineHeight: 1.6
            }}
          >
            Experience the power of advanced analytics for your motorcycle business. 
            Gain valuable insights from customer feedback and make data-driven decisions.
          </Typography>
          <Button
            onClick={handleExplore}
            sx={{
              py: 2,
              px: 6,
              background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
              color: '#1e1e1e',
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                background: 'linear-gradient(45deg, #ffa500 30%, #ffd700 90%)',
              }
            }}
          >
            <SpeedIcon sx={{ mr: 1 }} />
            Explore Analytics
          </Button>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              title="Rider Reviews"
              description="Collect and analyze comprehensive feedback from motorcycle enthusiasts. Understand what riders love about your bikes and where improvements can be made."
              icon={<RateReviewIcon sx={{ fontSize: 32, color: '#ffd700' }} />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FeatureCard
              title="Performance Metrics"
              description="Track key performance indicators and analyze market trends. Get detailed insights into your motorcycle's performance and market positioning."
              icon={<AnalyticsIcon sx={{ fontSize: 32, color: '#ffd700' }} />}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FeatureCard
              title="Enhancement Insights"
              description="Transform feedback into actionable improvements. Our AI-powered analysis helps identify key areas for motorcycle enhancement and innovation."
              icon={<BuildIcon sx={{ fontSize: 32, color: '#ffd700' }} />}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Add keyframes for animations */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default Home;

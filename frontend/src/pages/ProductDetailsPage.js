import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CircularProgress,
  Box,
  Typography,
  Container,
  Paper,
  Button
} from "@mui/material";
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import SpeedIcon from '@mui/icons-material/Speed';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import RateReviewIcon from '@mui/icons-material/RateReview';
import MotionPhotosAutoIcon from '@mui/icons-material/MotionPhotosAuto';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleReviewAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5001/analyze-product-reviews/${id}`
      );
      if (!response.ok) throw new Error("Failed to fetch analysis");
      const analysisResult = await response.json();
      navigate("/analysis-results", { state: { analysis: analysisResult } });
    } catch (error) {
      console.error("Error analyzing reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductAnalysis = () => {
    navigate("/product-analysis", { state: { productId: id } });
  };

  const AnalysisCard = ({ title, description, icon, onClick, isLoading }) => (
    <Paper
      elevation={0}
      sx={{
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
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, rgba(255,215,0,0.2), rgba(255,215,0,0.4))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
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
          variant="h4" 
          sx={{ 
            mb: 2,
            color: '#ffd700',
            fontWeight: 600,
            textAlign: 'center'
          }}
        >
          {title}
        </Typography>
        <Typography 
          sx={{ 
            mb: 4,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            flexGrow: 1
          }}
        >
          {description}
        </Typography>
        <Button
          onClick={onClick}
          disabled={isLoading}
          sx={{
            width: '100%',
            py: 1.5,
            background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
            color: '#1e1e1e',
            fontWeight: 600,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              background: 'linear-gradient(45deg, #ffa500 30%, #ffd700 90%)',
            },
            '&:disabled': {
              background: 'rgba(255,215,0,0.3)',
              color: 'rgba(255,255,255,0.5)'
            }
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: '#1e1e1e' }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon />
              {title}
            </Box>
          )}
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        py: 6,
        px: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
            <TwoWheelerIcon 
              sx={{ 
                fontSize: 64,
                color: '#ffd700',
                filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.3))'
              }}
            />
            <Typography 
              variant="h2"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ffd700 30%, #ffa500 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '1px'
              }}
            >
              Two Wheeler Analytics
            </Typography>
          </Box>
          <Typography 
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 800,
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Discover comprehensive insights about your motorcycle's performance and customer satisfaction through our advanced analytics tools
          </Typography>
        </Box>

        {/* Analysis Cards Grid */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            mb: 6
          }}
        >
          <AnalysisCard
            title="Review Analysis"
            description="Analyze rider feedback and sentiment to understand customer satisfaction and improve your motorcycle's appeal"
            icon={<RateReviewIcon sx={{ fontSize: 40, color: '#ffd700' }} />}
            onClick={handleReviewAnalysis}
            isLoading={loading}
          />
          <AnalysisCard
            title="Performance Analysis"
            description="Get detailed insights into your motorcycle's performance metrics and market positioning"
            icon={<AnalyticsIcon sx={{ fontSize: 40, color: '#ffd700' }} />}
            onClick={handleProductAnalysis}
          />
        </Box>

        {/* Additional Info Section */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(255,215,0,0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 4,
            p: 4,
            textAlign: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <MotionPhotosAutoIcon sx={{ fontSize: 32, color: '#ffd700' }} />
            <Typography 
              variant="h4"
              sx={{
                color: '#ffd700',
                fontWeight: 600
              }}
            >
              Drive Data-Powered Decisions
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 800, mx: 'auto' }}>
            Our advanced analytics engine helps you understand your motorcycle's market performance, 
            rider satisfaction, and competitive positioning through comprehensive analysis and 
            intuitive visualizations. Make informed decisions to enhance your bike's appeal and success.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProductDetailsPage;

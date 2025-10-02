import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, CircularProgress, Chip, 
  ToggleButton, ToggleButtonGroup, Fade, Zoom,
  Card, CardContent, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  PieChart, Pie, Cell, Sector,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  LineChart, Line, CartesianGrid, Scatter, ScatterChart,
  ComposedChart, Treemap
} from 'recharts';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const COLORS = ['#00C853', '#FFD600', '#FF3D00'];  // Brighter green, yellow, red
const RADAR_COLORS = ['#2196F3', '#E91E63', '#FF9800'];  // Brighter blue, pink, orange

const ReviewAnalytics = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState('sentiment');
  const [processedSuggestions, setProcessedSuggestions] = useState([]);
  const location = useLocation();
  const analysis = location.state?.analysis;

  useEffect(() => {
    if (analysis?.improvement_suggestion) {
      // Process and clean suggestions
      const suggestions = analysis.improvement_suggestion
        .split('\n')
        .map(suggestion => suggestion.trim())
        .filter(suggestion => suggestion.length > 0)
        .filter(suggestion => !isUnwanted(suggestion)) // Filter out unwanted sentences
        .map((suggestion, index) => ({
          id: index,
          text: suggestion,
          category: getCategoryFromSuggestion(suggestion),
          priority: getPriorityFromSuggestion(suggestion)
        }))
        .sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority)); // Sort by priority

      setProcessedSuggestions(suggestions);
    }
  }, [analysis]);

  // Helper function to filter out unwanted sentences
  const isUnwanted = (suggestion) => {
    // Filter based on unwanted keywords or patterns
    const unwantedPatterns = [
      'please', // Example: remove suggestions with 'please'
      'thanks', // Example: remove suggestions with 'thanks'
      'do better' // Example: remove any suggestions mentioning 'do better'
    ];

    return unwantedPatterns.some(pattern => suggestion.toLowerCase().includes(pattern));
  };

  // Helper function to map priority strings to numerical values for sorting
  const priorityValue = (priority) => {
    if (priority === 'High') return 3;
    if (priority === 'Medium') return 2;
    return 1; // Low priority
  };

  // Keep the original logic for category and priority assignment
  const getCategoryFromSuggestion = (suggestion) => {
    if (suggestion.toLowerCase().includes('product')) return 'Product';
    if (suggestion.toLowerCase().includes('service')) return 'Service';
    if (suggestion.toLowerCase().includes('customer')) return 'Customer';
    return 'General';
  };

  const getPriorityFromSuggestion = (suggestion) => {
    const length = suggestion.length;
    if (length > 100) return 'High';
    if (length > 50) return 'Medium';
    return 'Low';
  };

  if (!analysis) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const { sentiment_analysis, common_problems } = analysis;

  // Data preparation for sentiment analysis
  const pieData = [
    { name: 'Positive', value: sentiment_analysis.positive },
    { name: 'Neutral', value: sentiment_analysis.neutral },
    { name: 'Negative', value: sentiment_analysis.negative }
  ];

  // Process problems data
  const problemsData = common_problems.map((problem, index) => ({
    name: `Issue ${index + 1}`,
    count: problem.count || 1,
    impact: problem.severity === 'high' ? 3 : problem.severity === 'medium' ? 2 : 1,
    category: problem.category,
    description: problem.issue
  }));

  // Custom active shape for interactive pie chart
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize="16">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <text x={cx} y={cy - 20} textAnchor="middle" fill="#333" fontSize="14">
          {(percent * 100).toFixed(1)}%
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#666" fontSize="12">
          {value} reviews
        </text>
      </g>
    );
  };

  // Treemap data for problem categories
  const treemapData = Object.entries(
    problemsData.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.count;
      return acc;
    }, {})
  ).map(([name, size]) => ({ name, size }));

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#ffffff',
      p: 4
    }}>
      <Typography
        variant="h4"
        sx={{
          background: 'linear-gradient(45deg, #4fc3f7 30%, #00b0ff 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          mb: 4,
          fontWeight: 700,
          letterSpacing: '2px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        REVIEW ANALYTICS DASHBOARD
      </Typography>

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(e, newMode) => setViewMode(newMode)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 4,
          '& .MuiToggleButton-root': {
            color: '#ffffff',
            borderColor: 'rgba(255,255,255,0.2)',
            px: 4,
            py: 1,
            '&.Mui-selected': {
              background: 'linear-gradient(45deg, rgba(79, 195, 247, 0.2) 30%, rgba(0, 176, 255, 0.2) 90%)',
              color: '#4fc3f7',
              fontWeight: 600
            },
            '&:hover': {
              background: 'rgba(79, 195, 247, 0.1)'
            }
          }
        }}
      >
        <ToggleButton value="sentiment">SENTIMENT ANALYSIS</ToggleButton>
        <ToggleButton value="problems">PROBLEM ANALYSIS</ToggleButton>
        <ToggleButton value="suggestions">IMPROVEMENT SUGGESTIONS</ToggleButton>
      </ToggleButtonGroup>

      {viewMode === "sentiment" && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                height: '400px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #353535 100%)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                '& text': {
                  fill: '#ffffff !important'
                }
              }}
            >
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                Sentiment Distribution
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index]} 
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#353535', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      color: '#ffffff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                height: '400px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #353535 100%)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                '& text': {
                  fill: '#ffffff !important'
                }
              }}
            >
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                Sentiment Composition
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis
                    dataKey="name"
                    stroke="#fff"
                    tick={{ fill: '#fff' }}
                  />
                  <YAxis stroke="#fff" tick={{ fill: '#fff' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#4fc3f7"
                    radius={[4, 4, 0, 0]}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? '#81c784'
                            : index === 1
                            ? '#4fc3f7'
                            : '#ff8a65'
                        }
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {viewMode === "problems" && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                height: '400px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #353535 100%)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                '& text': {
                  fill: '#ffffff !important'
                }
              }}
            >
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                Problem Categories
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={treemapData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="size"
                  >
                    {treemapData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {viewMode === "suggestions" && (
        <Box sx={{ mt: 2 }}>
          <Paper
            elevation={8}
            sx={{
              p: 4,
              background: 'linear-gradient(135deg, #2d2d2d 0%, #353535 100%)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              '& text': {
                fill: '#ffffff !important'
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#4fc3f7',
                mb: 3,
                fontWeight: 500,
                textAlign: 'center'
              }}
            >
              Key Improvement Suggestions
            </Typography>
            <List>
              {processedSuggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    py: 2
                  }}
                >
                  <ListItemIcon>
                    <LightbulbIcon sx={{ color: '#4fc3f7' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: '#fff'
                      }
                    }}
                  />
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Chip
                      label={suggestion.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={suggestion.priority}
                      size="small"
                      color={
                        suggestion.priority === "High"
                          ? "error"
                          : suggestion.priority === "Medium"
                          ? "warning"
                          : "success"
                      }
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ReviewAnalytics;
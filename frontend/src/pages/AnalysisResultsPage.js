import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const AnalysisResultsPage = () => {
  const location = useLocation();
  const { salesForecast, stockoutPrediction, demandAnalysis } = location.state;

  // Round up predicted_sales in the sales forecast
  const roundedSalesForecast = useMemo(() => {
    return salesForecast?.map((forecast) => ({
      ...forecast,
      predicted_sales: forecast.predicted_sales
        ? Math.ceil(forecast.predicted_sales)
        : "N/A",
    }));
  }, [salesForecast]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analysis Results
      </Typography>

      <Grid container spacing={3}>
        {/* Sales Forecast Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sales Forecast
            </Typography>
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Predicted Sales</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roundedSalesForecast?.map((forecast, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(forecast.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {Math.ceil(parseFloat(forecast.predicted_sales))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
        {/* Stockout Prediction Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Stockout Prediction
            </Typography>
            <Typography>
              Average Daily Sales:{" "}
              {stockoutPrediction?.avgDailySales
                ? stockoutPrediction.avgDailySales.toFixed(0)
                : "N/A"}
            </Typography>
            <Typography>
              Days until stockout:{" "}
              {stockoutPrediction?.stockoutDays
                ? stockoutPrediction.stockoutDays.toFixed(0)
                : "N/A"}
            </Typography>
            <Typography
              color={stockoutPrediction?.warning ? "error" : "success"}
            >
              {stockoutPrediction?.message}
            </Typography>
          </Paper>
        </Grid>

        {/* Demand Analysis Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Demand Analysis
            </Typography>
            <Typography>
              Average Sales:{" "}
              {demandAnalysis?.avgSales
                ? demandAnalysis.avgSales.toFixed(0)
                : "N/A"}
            </Typography>
            <Typography>
              Maximum Sales:{" "}
              {demandAnalysis?.maxSales
                ? demandAnalysis.maxSales.toFixed(0)
                : "N/A"}
            </Typography>
            <Typography>
              Minimum Sales:{" "}
              {demandAnalysis?.minSales
                ? demandAnalysis.minSales.toFixed(0)
                : "N/A"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisResultsPage;

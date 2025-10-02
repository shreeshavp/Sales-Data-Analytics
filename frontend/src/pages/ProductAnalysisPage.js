import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Input,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

const ProductAnalysisPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productId, productName } = location.state;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [leadTime, setLeadTime] = useState("7");
  const [loading, setLoading] = useState({
    collect: false,
    forecast: false,
    demand: false,
    stockout: false,
  });
  const [error, setError] = useState("");
  const [analysisResults, setAnalysisResults] = useState({
    forecast: null,
    demand: null,
    stockout: null,
  });
  const [activeTab, setActiveTab] = useState(0);

  const handleCollectSalesDetails = async () => {
    console.log("Fetching sales details...");
    setLoading((prev) => ({
      ...prev,
      collect: true
    }));
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/sales/sales-details/${productId}?startDate=${startDate}&endDate=${endDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sales details");
      }
      const data = await response.json();
      console.log("Sales Data:", data);
      setSalesData(data);
    } catch (error) {
      setError("Error fetching sales details: " + error.message);
      console.error("Error fetching sales details:", error);
    } finally {
      setLoading((prev) => ({
        ...prev,
        collect: false
      }));
    }
  };

  const parseDateString = (dateStr) => {
    // Try different date formats
    const formats = [
      // DD-MM-YYYY
      (str) => {
        const [day, month, year] = str.split('-').map(Number);
        return new Date(year, month - 1, day);
      },
      // YYYY-MM-DD
      (str) => new Date(str),
      // DD/MM/YYYY
      (str) => {
        const [day, month, year] = str.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
    ];

    for (const format of formats) {
      try {
        const date = format(dateStr.trim());
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading((prev) => ({
      ...prev,
      collect: true
    }));
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/Sales/upload-csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload CSV file");
      }

      const data = await response.json();
      console.log("Raw CSV Data:", data);

      // Check for error in response
      if (data.error) {
        throw new Error(data.error);
      }

      // Format the data for display and analysis
      const formattedData = {
        name: data.name || productName || "Unknown",
        quantitySold: parseInt(data.quantitySold) || 0,
        totalLeftInStock: parseInt(data.totalLeftInStock) || 0,
        dailySales: Array.isArray(data.dailySales) ? data.dailySales.map(sale => ({
          saleDate: sale.saleDate,
          dailyQuantitySold: parseInt(sale.dailyQuantitySold) || 0,
          Stock_on_Date: parseInt(sale.Stock_on_Date) || data.totalLeftInStock || 0
        })).sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate)) : []
      };

      // Validate the formatted data
      if (!formattedData.dailySales || formattedData.dailySales.length === 0) {
        throw new Error("No valid sales data found in the CSV");
      }

      // Set the start and end dates
      formattedData.startDate = data.startDate;
      formattedData.endDate = data.endDate;
      
      setStartDate(data.startDate);
      setEndDate(data.endDate);

      console.log("Formatted Data:", formattedData);
      setSalesData(formattedData);
      setError("CSV file uploaded successfully!");
      
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError(`Error uploading CSV: ${error.message}`);
    } finally {
      setLoading((prev) => ({
        ...prev,
        collect: false
      }));
    }
  };

  const transformData = () => {
    console.log("Transforming data for prediction...");
    console.log("Current salesData:", salesData);

    if (!salesData || !salesData.dailySales || salesData.dailySales.length === 0) {
      console.warn("No sales data or dailySales found.");
      return [];
    }

    // Transform data for sales prediction
    const transformedData = salesData.dailySales.map(sale => ({
      date: sale.saleDate,
      quantity_sold: sale.dailyQuantitySold,
      current_stock: sale.Stock_on_Date || salesData.totalLeftInStock
    }));

    console.log("Transformed data for prediction:", transformedData);
    return transformedData;
  };

  const handleSalesPrediction = async () => {
    if (!salesData || !salesData.dailySales || salesData.dailySales.length === 0) {
      setError("Please collect sales data first");
      return;
    }

    setLoading((prev) => ({ ...prev, forecast: true }));
    setError("");

    try {
      const transformedData = transformData();
      console.log("Sending data:", transformedData);

      const response = await fetch("http://localhost:5001/api/sales/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_data: transformedData,
          brand: productName || "Unknown",
          model: productName || "Unknown"
        }),
      });

      if (!response.ok) {
        throw new Error("Sales prediction failed");
      }

      const data = await response.json();
      console.log("Received forecast data:", data);

      // Calculate forecast period based on data timespan
      const startDate = new Date(salesData.startDate);
      const endDate = new Date(salesData.endDate);
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth();
      const forecastPeriod = monthsDiff > 6 ? "2 years" : "45 days";

      setAnalysisResults((prev) => ({
        ...prev,
        forecast: {
          ...data,
          forecastPeriod
        }
      }));
    } catch (error) {
      console.error("Error in sales prediction:", error);
      setError("Sales prediction failed: " + error.message);
    } finally {
      setLoading((prev) => ({ ...prev, forecast: false }));
    }
  };

  const handleDemandAnalysis = async () => {
    if (salesData.length === 0) {
      setError("Please collect sales data first");
      return;
    }

    setLoading((prev) => ({ ...prev, demand: true }));
    setError("");
    const transformedData = transformData();

    const requestBody = {
      sales_data: transformedData,
      brand: productName || "Unknown",
      model: productName || "Unknown",
    };

    try {
      const response = await fetch(
        "http://localhost:5001/api/sales/demand-analysis",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Demand analysis failed");
      }

      const data = await response.json();
      setAnalysisResults((prev) => ({ ...prev, demand: data }));
    } catch (error) {
      setError("Demand analysis failed: " + error.message);
      console.error("Error during demand analysis:", error);
    } finally {
      setLoading((prev) => ({ ...prev, demand: false }));
    }
  };

  const handleStockoutPrediction = async () => {
    if (!salesData || !salesData.dailySales) {
      setError("Please collect sales data first");
      return;
    }

    setLoading((prev) => ({ ...prev, stockout: true }));
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5001/api/sales/stockout-prediction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sales_data: transformData(),
            brand: productName || "Unknown",
            model: productName || "Unknown",
            current_stock: parseInt(salesData.totalLeftInStock) || 0,
            lead_time: parseInt(leadTime) || 7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Stockout prediction failed");
      }

      const data = await response.json();
      setAnalysisResults((prev) => ({ ...prev, stockout: data }));
    } catch (error) {
      setError("Stockout prediction failed: " + error.message);
      console.error("Error during stockout prediction:", error);
    } finally {
      setLoading((prev) => ({ ...prev, stockout: false }));
    }
  };

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const renderAnalysisButtons = () => (
    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
      <Button
        variant={activeTab === 0 ? "contained" : "outlined"}
        color="primary"
        onClick={() => {
          handleTabChange(0);
          handleSalesPrediction();
        }}
        disabled={loading.forecast || salesData.length === 0}
        startIcon={loading.forecast && <CircularProgress size={20} />}
      >
        {loading.forecast ? "Predicting..." : "Sales Prediction"}
      </Button>
      <Button
        variant={activeTab === 1 ? "contained" : "outlined"}
        color="secondary"
        onClick={() => {
          handleTabChange(1);
          handleDemandAnalysis();
        }}
        disabled={loading.demand || salesData.length === 0}
        startIcon={loading.demand && <CircularProgress size={20} />}
      >
        {loading.demand ? "Analyzing..." : "Demand Analysis"}
      </Button>
      <Button
        variant={activeTab === 2 ? "contained" : "outlined"}
        color="warning"
        onClick={() => {
          handleTabChange(2);
          handleStockoutPrediction();
        }}
        disabled={loading.stockout || salesData.length === 0}
        startIcon={loading.stockout && <CircularProgress size={20} />}
      >
        {loading.stockout ? "Predicting..." : "Stockout Prediction"}
      </Button>
      <Input
        type="file"
        accept=".csv"
        onChange={handleCSVUpload}
        sx={{ display: 'none' }}
        id="csv-upload"
      />
      <label htmlFor="csv-upload">
        <Button variant="contained" component="span" color="secondary">
          Upload CSV
        </Button>
      </label>
    </Box>
  );

  const renderActiveAnalysis = () => {
    console.log("Active tab:", activeTab);
    console.log("Analysis results:", analysisResults);

    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ width: "100%" }}>
            {loading.forecast ? (
              <CircularProgress />
            ) : (
              analysisResults.forecast &&
              renderSalesChart(analysisResults.forecast)
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ width: "100%" }}>
            {loading.demand ? (
              <CircularProgress />
            ) : (
              analysisResults.demand &&
              renderDemandAnalysisChart(analysisResults.demand)
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ width: "100%" }}>
            {loading.stockout ? (
              <CircularProgress />
            ) : (
              analysisResults.stockout &&
              renderStockoutAnalysis(analysisResults.stockout)
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const renderSalesChart = (data) => {
    if (!data || !data.aggregated_data) return null;

    const { aggregated_data } = data;
    const isPeriodWeekly = aggregated_data.period === 'weekly';

    // Combine historical and forecast data
    const chartData = [
      ...(aggregated_data.historical || []).map(item => ({
        date: new Date(item.date),
        historicalTotal: item.total,
        historicalAvg: item.average,
        historicalLower: item.lower,
        historicalUpper: item.upper,
        historicalGrowth: item.growth_rate
      })),
      ...(aggregated_data.forecast || []).map(item => ({
        date: new Date(item.date),
        forecastTotal: item.total,
        forecastAvg: item.average,
        forecastLower: item.lower,
        forecastUpper: item.upper,
        forecastGrowth: item.growth_rate
      }))
    ].sort((a, b) => a.date - b.date);

    // Prepare data for the table
    const tableData = [
      ...(data.historical_data || []).map((item) => ({
        date: item.date,
        value: item.actual_sales,
        type: 'Historical'
      })),
      ...(data.forecast_data || []).map((item) => ({
        date: item.date,
        value: item.predicted_sales,
        type: 'Forecast'
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <Box sx={{ width: "100%", mt: 3 }}>
        <Card 
          elevation={3}
          sx={{ 
            borderRadius: '16px',
            background: '#1a1a1a',
            p: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <CardContent>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#fff',
                textAlign: 'center',
                mb: 3
              }}
            >
              Sales Forecast Analysis ({isPeriodWeekly ? 'Weekly' : 'Monthly'} View)
            </Typography>

            {/* CSV Upload Section */}
            <Box sx={{ mb: 4 }}>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleCSVUpload}
              />
              <label htmlFor="raised-button-file">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #4fc3f7 30%, #03a9f4 90%)',
                    borderRadius: '20px',
                    boxShadow: '0 3px 5px 2px rgba(79, 195, 247, .3)',
                    color: 'white',
                    height: 48,
                    padding: '0 30px',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #03a9f4 30%, #4fc3f7 90%)',
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  Upload CSV
                </Button>
              </label>
            </Box>

            {/* Chart Section */}
            <Box sx={{ 
              height: 500, 
              width: "100%",
              p: 2,
              background: '#2d2d2d',
              borderRadius: '12px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => {
                      if (isPeriodWeekly) {
                        return `Week ${date.getDate()}/${date.getMonth() + 1}`;
                      }
                      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
                    }}
                    stroke="#fff"
                    tick={{ fill: '#fff', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#fff"
                    tick={{ fill: '#fff', fontSize: 12 }}
                    label={{ value: 'Sales (units)', angle: -90, position: 'insideLeft', fill: '#fff', offset: 10 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#ff9800"
                    tick={{ fill: '#ff9800', fontSize: 12 }}
                    label={{ value: 'Growth Rate (%)', angle: 90, position: 'insideRight', fill: '#ff9800', offset: 10 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    labelFormatter={(date) => {
                      if (isPeriodWeekly) {
                        return `Week of ${date.toLocaleDateString()}`;
                      }
                      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    }}
                    contentStyle={{
                      borderRadius: '8px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      color: '#fff'
                    }}
                    formatter={(value, name) => {
                      if (name.includes('Growth')) {
                        return [`${value.toFixed(1)}%`, name];
                      }
                      return [value.toFixed(2), name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                      color: '#fff'
                    }}
                  />
                  {/* Historical Data */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="historicalTotal"
                    stroke="#4fc3f7"
                    fill="#4fc3f7"
                    fillOpacity={0.1}
                    name="Historical Total"
                    connectNulls
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="historicalAvg"
                    stroke="#4fc3f7"
                    name="Historical Average"
                    dot={{ stroke: '#4fc3f7', strokeWidth: 2, r: 4 }}
                    strokeWidth={2}
                    connectNulls
                  />
                  {/* <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="historicalGrowth"
                    stroke="#ff9800"
                    name="Historical Growth %"
                    dot={{ stroke: '#ff9800', strokeWidth: 2, r: 4 }}
                    strokeWidth={2}
                  /> */}
                  {/* Forecast Data */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="forecastTotal"
                    stroke="#f06292"
                    fill="#f06292"
                    fillOpacity={0.1}
                    name="Forecast Total"
                    connectNulls
                    strokeDasharray="5 5"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="forecastAvg"
                    stroke="#f06292"
                    name="Forecast Average"
                    dot={{ stroke: '#f06292', strokeWidth: 2, r: 4 }}
                    strokeWidth={2}
                    connectNulls
                    strokeDasharray="5 5"
                  />
                  {/* <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="forecastGrowth"
                    stroke="#ff9800"
                    name="Forecast Growth %"
                    dot={{ stroke: '#ff9800', strokeWidth: 2, r: 4 }}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  /> */}
                  {/* Confidence Intervals */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="historicalUpper"
                    stroke="transparent"
                    fill="#4fc3f7"
                    fillOpacity={0.1}
                    name="Historical Confidence"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="forecastUpper"
                    stroke="transparent"
                    fill="#f06292"
                    fillOpacity={0.1}
                    name="Forecast Confidence"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Statistics Chips */}
            <Box sx={{ 
              mt: 3, 
              display: "flex", 
              gap: 2, 
              flexWrap: "wrap",
              justifyContent: "center"
            }}>
              <Chip
                label={`${isPeriodWeekly ? 'Weekly' : 'Monthly'} Historical Data`}
                sx={{
                  borderRadius: '16px',
                  backgroundColor: '#4fc3f7',
                  color: '#000',
                  '& .MuiChip-label': {
                    fontWeight: 500
                  }
                }}
              />
              <Chip
                label={`${isPeriodWeekly ? 'Weekly' : 'Monthly'} Forecast`}
                sx={{
                  borderRadius: '16px',
                  backgroundColor: '#f06292',
                  color: '#000',
                  '& .MuiChip-label': {
                    fontWeight: 500
                  }
                }}
              />
            </Box>

            {/* Data Table */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                mt: 4,
                background: '#2d2d2d',
                '& .MuiTableCell-root': {
                  color: '#fff',
                  borderBottom: '1px solid #404040'
                },
                '& .MuiTableHead-root': {
                  backgroundColor: '#1a1a1a',
                  '& .MuiTableCell-head': {
                    fontWeight: 600
                  }
                }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{row.value?.toFixed(2)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{
                          color: row.type === 'Historical' ? '#4fc3f7' : '#f06292',
                          fontWeight: 600
                        }}
                      >
                        {row.type}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderDemandAnalysisChart = (data) => {
    if (!data || !data.trend_data || !data.statistics) {
      console.log("No data available for demand analysis");
      return null;
    }

    const chartData = data.trend_data.map((item) => ({
      date: item.date,
      sales: item.sales,
      MA7: item.MA7,
      MA30: item.MA30,
    }));

    return (
      <Card sx={{ 
        mt: 3, 
        p: 3,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#fff',
            textAlign: 'center',
            mb: 3
          }}
        >
          Demand Analysis
        </Typography>

        <Box sx={{ 
          height: 500,
          width: "100%",
          mb: 4,
          p: 2,
          background: '#2d2d2d',
          borderRadius: '12px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
         <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => new Date(str).toLocaleDateString()}
                stroke="#fff"
                tick={{ fill: '#fff', fontSize: 12 }}
                label={{ value: 'Date', position: 'bottom', fill: '#fff', offset: 10 }}
              />
              <YAxis 
                type="number" 
                domain={[0, "auto"]} 
                allowDecimals={false}
                stroke="#fff"
                tick={{ fill: '#fff', fontSize: 12 }}
                label={{ value: 'Sales (units)', angle: -90, position: 'insideLeft', fill: '#fff', offset: 10 }}
              />
              <Tooltip
                labelFormatter={(str) => new Date(str).toLocaleDateString()}
                contentStyle={{
                  borderRadius: '8px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #404040',
                  color: '#fff'
                }}
              />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#4fc3f7"
                name="Daily Sales"
                dot={{ stroke: '#4fc3f7', strokeWidth: 2, r: 4 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="MA7"
                stroke="#81c784"
                name="7-Day Moving Average"
                dot={{ stroke: '#81c784', strokeWidth: 2, r: 4 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="MA30"
                stroke="#ba68c8"
                name="30-Day Moving Average"
                dot={{ stroke: '#ba68c8', strokeWidth: 2, r: 4 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <Chip
            label={`Average Sales: ${data.statistics.avg_sales.toFixed(1)} units/day`}
            sx={{
              borderRadius: '16px',
              backgroundColor: '#2196f3',
              color: '#000',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
          <Chip
            label={`Max Sales: ${data.statistics.max_sales} units`}
            sx={{
              borderRadius: '16px',
              backgroundColor: '#81c784',
              color: '#000',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
          <Chip
            label={`Min Sales: ${data.statistics.min_sales} units`}
            sx={{
              borderRadius: '16px',
              backgroundColor: '#ba68c8',
              color: '#000',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
          <Chip
            label={`Total Sales: ${data.statistics.total_sales} units`}
            sx={{
              borderRadius: '16px',
              backgroundColor: '#ffb74d',
              color: '#000',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
        </Box>

        <TableContainer 
          component={Paper}
          sx={{ 
            backgroundColor: '#2d2d2d',
            '& .MuiTableCell-root': {
              color: '#fff',
              borderBottom: '1px solid #404040'
            },
            '& .MuiTableHead-root': {
              backgroundColor: '#1a1a1a',
              '& .MuiTableCell-head': {
                fontWeight: 600
              }
            }
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Sales (units)</TableCell>
                <TableCell align="right">7-Day MA</TableCell>
                <TableCell align="right">30-Day MA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.trend_data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(row.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">{row.sales}</TableCell>
                  <TableCell align="right" sx={{ color: '#81c784' }}>
                    {row.MA7 ? row.MA7.toFixed(1) : "N/A"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#ba68c8' }}>
                    {row.MA30 ? row.MA30.toFixed(1) : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  };

  const renderStockoutAnalysis = (data) => {
    if (!data || !data.metrics) return null;

    const riskLevel = data.stockout_risk.toLowerCase();

    return (
      <Card sx={{ 
        mt: 3, 
        p: 3,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              mb: 3
            }}
          >
            Stockout Analysis
          </Typography>

          {data.alert && (
            <Alert
              severity={riskLevel === "high" ? "error" : riskLevel === "medium" ? "warning" : "success"}
              sx={{ 
                mb: 2,
                backgroundColor: riskLevel === "high" ? 'rgba(244, 67, 54, 0.1)' : 
                               riskLevel === "medium" ? 'rgba(255, 152, 0, 0.1)' : 
                               'rgba(76, 175, 80, 0.1)',
                color: '#fff',
                border: '1px solid',
                borderColor: riskLevel === "high" ? '#f44336' : 
                           riskLevel === "medium" ? '#ff9800' : 
                           '#4caf50',
                '& .MuiAlert-icon': {
                  color: riskLevel === "high" ? '#f44336' : 
                         riskLevel === "medium" ? '#ff9800' : 
                         '#4caf50'
                }
              }}
            >
              <AlertTitle sx={{ color: '#fff' }}>
                {riskLevel === "high" ? "Critical Stock Level Warning!" :
                 riskLevel === "medium" ? "Stock Level Warning" :
                 "Healthy Stock Levels"}
              </AlertTitle>
              {riskLevel === "high" && (
                <>
                  <strong>Immediate Action Required:</strong>
                  <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                    <li>Current stock: {data.metrics.current_stock} units</li>
                    <li>
                      Estimated stockout in{" "}
                      {data.metrics.days_until_stockout.toFixed(1)} days
                    </li>
                    <li>Place new order immediately</li>
                  </ul>
                </>
              )}
              {riskLevel === "medium" && "Consider placing a new order soon."}
              {riskLevel === "low" &&
                "Stock levels are sufficient for projected demand."}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#2d2d2d', color: '#fff' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: '#2196f3' }} gutterBottom>
                    Current Status
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Current Stock: {data.metrics.current_stock} units
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Average Daily Sales:{" "}
                    {data.metrics.avg_daily_sales.toFixed(2)} units
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Days until Stockout:{" "}
                    {data.metrics.days_until_stockout.toFixed(1)} days
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      fontWeight: "bold",
                      color: riskLevel === "high" ? '#f44336' :
                             riskLevel === "medium" ? '#ff9800' :
                             '#4caf50'
                    }}
                  >
                    Stockout Risk: {data.stockout_risk}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#2d2d2d', color: '#fff' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: '#f06292' }} gutterBottom>
                    Inventory Metrics
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Safety Stock: {Math.round(data.metrics.safety_stock)} units
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Reorder Point: {Math.round(data.metrics.reorder_point)} units
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Max Daily Sales: {data.metrics.max_daily_sales} units
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {riskLevel === "high" && (
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity="info"
                sx={{ 
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  color: '#fff',
                  border: '1px solid #2196f3',
                  '& .MuiAlert-icon': {
                    color: '#2196f3'
                  }
                }}
              >
                <AlertTitle sx={{ color: '#fff' }}>Recommended Actions</AlertTitle>
                <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                  <li>Place order for at least {Math.round(data.metrics.reorder_point - data.metrics.current_stock)} units</li>
                  <li>Consider expedited shipping options</li>
                  <li>Monitor daily sales closely</li>
                </ul>
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const calculateMonthlyGrowthRates = (data, isPrediction = false) => {
    if (!data || data.length < 2) return [];
    
    // Group sales by month
    const monthlyData = data.reduce((acc, sale) => {
      const date = new Date(isPrediction ? sale.date : sale.saleDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          totalSales: 0,
          count: 0,
          month: date
        };
      }
      
      acc[monthKey].totalSales += isPrediction ? sale.predicted_sales : sale.dailyQuantitySold;
      acc[monthKey].count += 1;
      return acc;
    }, {});

    // Calculate monthly averages and growth rates
    const monthlyAverages = Object.entries(monthlyData)
      .map(([key, data]) => ({
        date: data.month,
        averageSales: data.totalSales / data.count
      }))
      .sort((a, b) => a.date - b.date);

    // Calculate growth rates
    const growthRates = [];
    for (let i = 1; i < monthlyAverages.length; i++) {
      const previousMonth = monthlyAverages[i - 1].averageSales;
      const currentMonth = monthlyAverages[i].averageSales;
      const growthRate = previousMonth === 0 ? 0 : ((currentMonth - previousMonth) / previousMonth) * 100;
      
      growthRates.push({
        date: monthlyAverages[i].date,
        growthRate: parseFloat(growthRate.toFixed(1))
      });
    }
    
    return growthRates;
  };

  const renderSalesPredictionGraph = () => {
    if (!analysisResults.forecast || !analysisResults.forecast.predictions) return null;

    // Combine historical and predicted data
    const historicalData = salesData.dailySales.map(sale => ({
      date: sale.saleDate,
      value: sale.dailyQuantitySold,
      type: 'historical'
    }));

    const predictedData = analysisResults.forecast.predictions.map(pred => ({
      date: pred.date,
      value: pred.predicted_sales,
      type: 'predicted'
    }));

    const combinedData = [...historicalData, ...predictedData].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <Card sx={{ 
        mt: 2, 
        mb: 2,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              mb: 3
            }}
          >
            Sales Prediction
          </Typography>
          <Box sx={{ 
            height: 300,
            width: "100%",
            p: 2,
            background: '#2d2d2d',
            borderRadius: '12px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <ResponsiveContainer>
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  interval={Math.ceil(combinedData.length / 10)}
                />
                <YAxis
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  label={{ 
                    value: 'Sales (units)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#fff',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip
                  labelFormatter={(str) => new Date(str).toLocaleDateString()}
                  formatter={(value, name) => [Math.round(value), name === 'historical' ? 'Historical Sales' : 'Predicted Sales']}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2196f3"
                  name="historical"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ff9800"
                  name="predicted"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderHistoricalGrowthRateGraph = () => {
    if (!salesData || !salesData.dailySales) return null;

    const growthRates = calculateMonthlyGrowthRates(salesData.dailySales);
    if (growthRates.length === 0) return null;

    return (
      <Card sx={{ 
        mt: 2, 
        mb: 2,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              mb: 3
            }}
          >
            Historical Monthly Growth Rate
          </Typography>
          <Box sx={{ 
            height: 300,
            width: "100%",
            p: 2,
            background: '#2d2d2d',
            borderRadius: '12px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <ResponsiveContainer>
              <BarChart data={growthRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                  }}
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  label={{ 
                    value: 'Growth Rate (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#fff',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={[-100, 100]}
                  ticks={[-100, -50, 0, 50, 100]}
                />
                <Tooltip
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
                  }}
                  formatter={(value) => [`${value}%`, 'Growth Rate']}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Bar dataKey="growthRate" name="Growth Rate">
                  {growthRates.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.growthRate >= 0 ? '#4caf50' : '#f44336'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderPredictedGrowthRateGraph = () => {
    if (!analysisResults.forecast || !analysisResults.forecast.predictions) return null;

    const growthRates = calculateMonthlyGrowthRates(analysisResults.forecast.predictions, true);
    if (growthRates.length === 0) return null;

    return (
      <Card sx={{ 
        mt: 2, 
        mb: 2,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              mb: 3
            }}
          >
            Predicted Monthly Growth Rate
          </Typography>
          <Box sx={{ 
            height: 300,
            width: "100%",
            p: 2,
            background: '#2d2d2d',
            borderRadius: '12px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <ResponsiveContainer>
              <BarChart data={growthRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                  }}
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  label={{ 
                    value: 'Growth Rate (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#fff',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={[-100, 100]}
                  ticks={[-100, -50, 0, 50, 100]}
                />
                <Tooltip
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
                  }}
                  formatter={(value) => [`${value}%`, 'Growth Rate']}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Bar dataKey="growthRate" name="Growth Rate">
                  {growthRates.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.growthRate >= 0 ? '#ff9800' : '#e65100'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSalesGraph = () => {
    if (!salesData || !salesData.dailySales) return null;

    return (
      <Card sx={{ 
        mt: 2, 
        mb: 2,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              mb: 3
            }}
          >
            Daily Sales Analysis
          </Typography>
          <Box sx={{ 
            height: 300,
            width: "100%",
            p: 2,
            background: '#2d2d2d',
            borderRadius: '12px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <ResponsiveContainer>
              <BarChart data={salesData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis
                  dataKey="saleDate"
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  interval={Math.ceil(salesData.dailySales.length / 10)}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  label={{ 
                    value: 'Daily Sales (units)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#fff',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip
                  labelFormatter={(str) => new Date(str).toLocaleDateString()}
                  formatter={(value) => [value, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar 
                  dataKey="dailyQuantitySold" 
                  name="Sales"
                  fill="#2196f3"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSalesDetailsTable = () => {
    if (!salesData) return null;

    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 2, 
          mb: 2,
          background: '#1a1a1a',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          '& .MuiTable-root': {
            background: 'transparent'
          },
          '& .MuiTableCell-root': {
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '16px',
            fontSize: '1rem'
          },
          '& .MuiTableHead-root': {
            background: 'linear-gradient(45deg, #2d2d2d 30%, #404040 90%)',
            '& .MuiTableCell-head': {
              color: '#2196f3',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }
          },
          '& .MuiTableBody-root': {
            '& .MuiTableRow-root': {
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(79, 195, 247, 0.1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              },
              '& .MuiTableCell-root': {
                '&:first-of-type': {
                  fontWeight: 500
                },
                '&:not(:first-of-type)': {
                  color: '#81c784'
                }
              }
            }
          }
        }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell align="right">Quantity Sold</TableCell>
              <TableCell align="right">Current Stock</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{salesData.name}</TableCell>
              <TableCell align="right">{salesData.quantitySold}</TableCell>
              <TableCell align="right">{salesData.totalLeftInStock}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderDailySalesGraph = () => {
    if (!salesData || !salesData.dailySales) return null;

    return (
      <Card sx={{ 
        mt: 2, 
        mb: 2,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              mb: 3
            }}
          >
            Daily Sales
          </Typography>
          <Box sx={{ 
            height: 300,
            width: "100%",
            p: 2,
            background: '#2d2d2d',
            borderRadius: '12px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <ResponsiveContainer>
              <LineChart data={salesData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis
                  dataKey="saleDate"
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  interval={Math.ceil(salesData.dailySales.length / 10)}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  label={{ 
                    value: 'Daily Sales (units)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#fff',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip
                  labelFormatter={(str) => new Date(str).toLocaleDateString()}
                  formatter={(value) => [value, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="dailyQuantitySold"
                  stroke="#2196f3"
                  name="Sales"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderGrowthRateGraph = () => {
    if (!salesData || !salesData.dailySales) return null;

    const growthRates = calculateMonthlyGrowthRates(salesData.dailySales);
    if (growthRates.length === 0) return null;

    return (
      <Card sx={{ 
        mt: 2, 
        mb: 2,
        borderRadius: '16px',
        background: '#1a1a1a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              mb: 3
            }}
          >
            Monthly Sales Growth Rate
          </Typography>
          <Box sx={{ 
            height: 300,
            width: "100%",
            p: 2,
            background: '#2d2d2d',
            borderRadius: '12px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <ResponsiveContainer>
              <BarChart data={growthRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                  }}
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12 }}
                  label={{ 
                    value: 'Growth Rate (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#fff',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={[-100, 100]}
                  ticks={[-100, -50, 0, 50, 100]}
                />
                <Tooltip
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
                  }}
                  formatter={(value) => [`${value}%`, 'Growth Rate']}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Bar dataKey="growthRate" name="Growth Rate">
                  {growthRates.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.growthRate >= 0 ? '#4caf50' : '#f44336'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#999', 
              mt: 2, 
              textAlign: 'center',
              fontSize: '0.8rem'
            }}
          >
            *Growth rate shows month-over-month change in average daily sales
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{
      p: 4,
      maxWidth: '1400px',
      margin: '0 auto',
      background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)',
      minHeight: '100vh',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          mb: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        Product Analysis - {productName}
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{
        display: "flex",
        gap: 2,
        mb: 3,
        flexWrap: "wrap",
        justifyContent: "center",
        '& .MuiTextField-root': {
          background: '#2d2d2d',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(79, 195, 247, 0.3)'
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255,255,255,0.1)',
            },
            '&:hover fieldset': {
              borderColor: '#2196f3',
            },
            '& input': {
              color: '#fff'
            }
          },
          '& .MuiInputLabel-root': {
            color: '#fff'
          }
        }
      }}>
        <TextField
          type="date"
          label="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: new Date().toISOString().split("T")[0] }}
        />
        <Button
          variant="contained"
          onClick={handleCollectSalesDetails}
          disabled={
            loading.collect ||
            !startDate ||
            !endDate
          }
          sx={{
            background: 'linear-gradient(45deg, #2196f3 30%, #03a9f4 90%)',
            color: '#fff',
            padding: '10px 24px',
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '0.5px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(79, 195, 247, 0.4)',
              background: 'linear-gradient(45deg, #03a9f4 30%, #00bcd4 90%)',
            },
            '&:disabled': {
              background: '#1a1a1a',
              color: 'rgba(255,255,255,0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }
          }}
        >
          {loading.collect ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: '#fff' }} />
              <span>Collecting...</span>
            </Box>
          ) : (
            "Collect Sales Details"
          )}
        </Button>
      </Box>

      <Box sx={{
        display: "flex",
        gap: 2,
        mb: 3,
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <Button
          variant={activeTab === 0 ? "contained" : "outlined"}
          onClick={() => {
            handleTabChange(0);
            handleSalesPrediction();
          }}
          disabled={loading.forecast || !salesData || !salesData.dailySales}
          sx={{
            background: activeTab === 0 
              ? 'linear-gradient(45deg, #2196f3 30%, #03a9f4 90%)'
              : 'transparent',
            color: activeTab === 0 ? '#fff' : '#2196f3',
            border: '1px solid #2196f3',
            padding: '10px 24px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 0 ? '0 4px 12px rgba(79, 195, 247, 0.3)' : 'none',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(79, 195, 247, 0.4)',
              background: activeTab === 0 
                ? 'linear-gradient(45deg, #03a9f4 30%, #00bcd4 90%)'
                : 'rgba(79, 195, 247, 0.1)'
            }
          }}
        >
          {loading.forecast ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: activeTab === 0 ? '#fff' : '#2196f3' }} />
              <span>Predicting...</span>
            </Box>
          ) : (
            "Sales Prediction"
          )}
        </Button>
        <Button
          variant={activeTab === 1 ? "contained" : "outlined"}
          onClick={() => {
            handleTabChange(1);
            handleDemandAnalysis();
          }}
          disabled={loading.demand || salesData.length === 0}
          sx={{
            background: activeTab === 1 
              ? 'linear-gradient(45deg, #81c784 30%, #4caf50 90%)'
              : 'transparent',
            color: activeTab === 1 ? '#fff' : '#81c784',
            border: '1px solid #81c784',
            padding: '10px 24px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 1 ? '0 4px 12px rgba(129, 199, 132, 0.3)' : 'none',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(129, 199, 132, 0.4)',
              background: activeTab === 1 
                ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                : 'rgba(129, 199, 132, 0.1)'
            }
          }}
        >
          {loading.demand ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: '#81c784' }} />
              <span>Analyzing...</span>
            </Box>
          ) : (
            "Demand Analysis"
          )}
        </Button>
        <Button
          variant={activeTab === 2 ? "contained" : "outlined"}
          onClick={() => {
            handleTabChange(2);
            handleStockoutPrediction();
          }}
          disabled={loading.stockout || salesData.length === 0}
          sx={{
            background: activeTab === 2 
              ? 'linear-gradient(45deg, #f06292 30%, #e91e63 90%)'
              : 'transparent',
            color: activeTab === 2 ? '#fff' : '#f06292',
            border: '1px solid #f06292',
            padding: '10px 24px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 2 ? '0 4px 12px rgba(240, 98, 146, 0.3)' : 'none',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(240, 98, 146, 0.4)',
              background: activeTab === 2 
                ? 'linear-gradient(45deg, #e91e63 30%, #ec407a 90%)'
                : 'rgba(240, 98, 146, 0.1)'
            }
          }}
        >
          {loading.stockout ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: '#f06292' }} />
              <span>Predicting...</span>
            </Box>
          ) : (
            "Stockout Prediction"
          )}
        </Button>
        <Input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          sx={{ display: 'none' }}
          id="csv-upload"
        />
        <label htmlFor="csv-upload">
          <Button 
            variant="contained" 
            component="span"
            sx={{
              background: 'linear-gradient(45deg, #ba68c8 30%, #9c27b0 90%)',
              color: '#fff',
              border: '1px solid #ba68c8',
              padding: '10px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 500,
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(186, 104, 200, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(186, 104, 200, 0.4)',
                background: 'linear-gradient(45deg, #9c27b0 30%, #ab47bc 90%)'
              }
            }}
          >
            Upload CSV
          </Button>
        </label>
      </Box>

      {salesData && renderSalesDetailsTable()}

      {salesData && renderSalesGraph()}

      {salesData && renderGrowthRateGraph()}

      {salesData && renderSalesPredictionGraph()}

      {/* Analysis Results */}
      {salesData && (
        <Box sx={{ mt: 2 }}>{renderActiveAnalysis()}</Box>
      )}
    </Box>
  );
};

export default ProductAnalysisPage;
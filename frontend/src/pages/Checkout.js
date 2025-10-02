import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PaymentWrapper from "../components/PaymentForm";

const steps = ["Shipping Information", "Payment"];

const Checkout = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    shippingAddress: "",
    phoneNumber: "",
  });
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if Stripe is properly configured
    if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
      setError("Payment system is not properly configured");
      return;
    }
    fetchCartTotal();
  }, []);

  const fetchCartTotal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const total = response.data.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      setCartTotal(total);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError("Error fetching cart details");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateShippingInfo = () => {
    const { shippingAddress, phoneNumber } = formData;

    // Basic check for empty fields
    if (!shippingAddress.trim() || !phoneNumber.trim()) {
      setError("Please fill in all fields");
      return false;
    }

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }

    // Validate shipping address format (door number, street, city, and optional postal code)
    const addressRegex = /^(?=.*\d)(?=.*[a-zA-Z])(.+)$/;
    if (!addressRegex.test(shippingAddress)) {
      setError("Shipping address must contain door number, street, and city");
      return false;
    }

    setError("");
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!validateShippingInfo()) return; // Only proceed if valid
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/orders",
        {
          ...formData,
          paymentIntentId: paymentIntent.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Clear cart count in navbar
      window.dispatchEvent(new CustomEvent("cart-updated"));

      alert("Order placed successfully!");
      navigate("/products");
    } catch (error) {
      console.error("Error creating order:", error);
      setError(error.response?.data?.message || "Error creating order");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 ? (
          <Box component="form">
            <TextField
              fullWidth
              label="Shipping Address"
              name="shippingAddress"
              value={formData.shippingAddress}
              onChange={handleChange}
              multiline
              rows={3}
              required
              sx={{ mb: 2 }}
              helperText="Include door number, street, city, and postal code (if applicable)"
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
            />

            <Button variant="contained" onClick={handleNext} fullWidth>
              Proceed to Payment
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Total Amount: ₹{cartTotal.toFixed(2)}
            </Typography>
            <PaymentWrapper
              amount={cartTotal}
              onPaymentSuccess={handlePaymentSuccess}
            />
            <Button onClick={handleBack} sx={{ mt: 2 }}>
              Back
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Checkout;

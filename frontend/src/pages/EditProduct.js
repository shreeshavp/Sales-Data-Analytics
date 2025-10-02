import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Snackbar, CardMedia } from '@mui/material';
import { productService } from '../services/api';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    image_url: ''
  });
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await productService.getProduct(id);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setMessage('Error fetching product');
      setOpen(true);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleChange = (e) => {
    setProduct({
      ...product,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.updateProduct(id, product);
      setMessage('Product updated successfully!');
      setOpen(true);
      setTimeout(() => {
        navigate('/products');
      }, 2000);
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage(error.response?.data?.message || 'Error updating product');
      setOpen(true);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Edit Product
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            name="name"
            label="Product Name"
            value={product.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="description"
            label="Description"
            multiline
            rows={4}
            value={product.description}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="price"
            label="Price"
            type="number"
            value={product.price}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="image_url"
            label="Image URL"
            value={product.image_url || ''}
            onChange={handleChange}
            margin="normal"
          />
          {product.image_url && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Image:
              </Typography>
              <CardMedia
                component="img"
                height="200"
                image={product.image_url}
                alt={product.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
                }}
                sx={{ 
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}
              />
            </Box>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Update Product
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={() => setOpen(false)}
        message={message}
      />
    </Container>
  );
};

export default EditProduct; 
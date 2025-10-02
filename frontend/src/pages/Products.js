import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box,
  Snackbar,
} from '@mui/material';
import { motion } from 'framer-motion';
import { SparklesIcon, HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import ProductReview from '../components/ProductReview';
import { productService, cartService } from '../services/api';

const Products = () => {
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const role = localStorage.getItem('role');

  useEffect(() => {
    fetchProducts();
  }, []);
  const handleReviewClick = (product) => {
    setSelectedProduct(product);
    setOpenReviewDialog(true);
  };
  const handleReviewSubmitted = () => {
    setOpenReviewDialog(false);
    fetchProducts(); // Refresh products to show updated reviews
  };
  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };
  const handleEditProduct = (productId) => {
    // Your logic to handle editing the product
    console.log(`Editing product with ID: ${productId}`);
  };

  const handleAddToCart = async (productId) => {
    try {
      await cartService.addToCart({
        productId,
        quantity: 1,
      });
      // Trigger cart update
      window.dispatchEvent(new CustomEvent('cart-updated'));
      // Show success message
      setMessage('Product added to cart');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage('Error adding to cart');
      setOpenSnackbar(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8E8E8]">
      {/* <Typography 
        variant="h4" 
        component="h1" 
        className="text-[#0056D2] font-bold mb-8 macondo-regular" 
        style={{ fontFamily: 'Macondo, serif' }} 
        gutterBottom 
        sx={{ 
          fontWeight: 600, 
          color: '#333', 
          padding: '16px'  // Adding padding
        }}
      >
        Product
      </Typography> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-teal-600 to-blue-600">
              Discover Amazing Products
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-700 max-w-2xl mx-auto"
          >
            Explore our curated collection of high-quality products
          </motion.p>
        </div> */}

        {/* Admin Add Product Button */}
        {/* {role === 'admin' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link
              to="/admin/add-product"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Add New Product
            </Link>
          </motion.div>
        )} */}

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="relative bg-white rounded-2xl shadow-md overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative h-64 overflow-hidden ">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    className="w-full h-full object-cover max-height:50px"
                  />
                  {product.quantity === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-teal-600">₹{product.price}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        product.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {role === 'admin' ? (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-white hover:text-teal-600 border-black hover:border-teal-600 transform hover:scale-105 transition-all duration-300 hover:translate-y-1"
                      >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-white hover:text-red-600 border-black hover:border-red-600 transform hover:scale-105 transition-all duration-300"
                      >
                        Delete
                      </button>


                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
        onClick={() => handleReviewClick(product)}
        className="flex-1 inline-flex justify-center items-center px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors duration-300"
      >
        <HeartIcon className="h-5 w-5 mr-2" />
        Review
      </button>
      <Dialog 
        open={openReviewDialog} 
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedProduct && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Write a Review for {selectedProduct.name}
            </h2>
            <ProductReview
              productId={selectedProduct.id}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>
        )}
      </Dialog>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.quantity === 0}
                        className={`flex-1 inline-flex justify-center items-center px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                          product.quantity === 0
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        <ShoppingCartIcon className="h-5 w-5 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Snackbar Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={message}
        className="!bottom-4 !left-1/2 !-translate-x-1/2"
      />
    </div>
  );
};

export default Products;
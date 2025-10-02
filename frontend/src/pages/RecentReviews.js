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
  Alert
} from '@mui/material';
import axios from 'axios';

const RecentReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // Fetch reviews
        const reviewsResponse = await axios.get('http://localhost:5000/api/reviews', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        // Fetch products to get product names
        const productsResponse = await axios.get('http://localhost:5000/api/products', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        // Create a map of product IDs to names
        const productMap = productsResponse.data.reduce((acc, product) => {
          acc[product.id] = product.name;
          return acc;
        }, {});

        // Combine review data with product names and sort by date
        const reviewsWithProducts = reviewsResponse.data.map(review => ({
          ...review,
          product_name: productMap[review.product_id] || 'Unknown Product'
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setReviews(reviewsWithProducts);
        setError(null);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" className="py-8 flex justify-center items-center">
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="text-[#333333] font-bold mb-6">
        Recent Reviews
      </Typography>

      {reviews.length === 0 ? (
        <Alert severity="info">No reviews found</Alert>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full table-auto">
              <TableHead className="bg-[#D3D3D3]">
                <TableRow>
                  <TableCell className="px-6 py-4 text-left text-sm font-semibold text-[#333333]">Product</TableCell>
                  <TableCell className="px-6 py-4 text-left text-sm font-semibold text-[#333333]">Rating</TableCell>
                  <TableCell className="px-6 py-4 text-left text-sm font-semibold text-[#333333]">Feedback</TableCell>
                  <TableCell className="px-6 py-4 text-left text-sm font-semibold text-[#333333]">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <TableCell className="px-6 py-4 text-sm text-[#333333]">
                      {review.product_name}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Rating value={review.rating} readOnly size="small" />
                        <Typography variant="body2" className="text-gray-600">
                          ({review.rating})
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-600">
                      {review.feedback}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-600">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Container>
  );
};

export default RecentReviews;
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      fs.unlinkSync(req.file.path);

      if (results.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      const startDate = results[0]?.Date || 'Unknown';
      const endDate = results[results.length - 1]?.Date || 'Unknown';

      const transformedData = {
        name: results[0]?.Brand || 'Unknown',
        quantitySold: results.reduce((sum, row) => sum + (parseInt(row.Quantity_Sold) || 0), 0),
        totalLeftInStock: parseInt(results[results.length - 1]?.Stock_on_Date) || 0,
        startDate,
        endDate,
        dailySales: results.map(row => ({
          saleDate: row.Date,
          dailyQuantitySold: parseInt(row.Quantity_Sold) || 0,
          Model: row.Model,
          Brand: row.Brand,
          Vehicle_Type: row.Vehicle_Type,
          Fuel_Type: row.Fuel_Type,
          City: row.City,
          Dealer_Type: row.Dealer_Type,
          Customer_Age_Group: row.Customer_Age_Group,
          Customer_Gender: row.Customer_Gender,
          Occupation_of_Buyer: row.Occupation_of_Buyer,
          Payment_Mode: row.Payment_Mode,
          Festive_Season_Purchase: row.Festive_Season_Purchase,
          Advertisement_Type: row.Advertisement_Type,
          Service_Availability: row.Service_Availability,
          Weather_Condition: row.Weather_Condition,
          Road_Conditions: row.Road_Conditions,
          Engine_Capacity_CC: row.Engine_Capacity_CC,
          Price_INR: row.Price_INR,
          Petrol_Price_at_Purchase: row.Petrol_Price_at_Purchase,
          Competitor_Brand_Presence: row.Competitor_Brand_Presence,
          Discounts_Offers: row.Discounts_Offers,
          Stock_on_Date: row.Stock_on_Date
        }))
      };

      res.json(transformedData);
    })
    .on('error', (error) => {
      console.error('Error processing CSV:', error);
      res.status(500).json({ error: 'Failed to process CSV file' });
    });
});

module.exports = router;
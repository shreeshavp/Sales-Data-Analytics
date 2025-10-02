const db = require("../config/db");

exports.getSalesDetails = async (req, res) => {
  const { startDate, endDate } = req.query;
  const productId = req.params.productId;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Start date and end date are required." });
  }

  try {
    console.log("Query date range:", startDate, "to", endDate);

    const [productDetails] = await db.query(
      "SELECT name, quantity AS totalLeftInStock FROM products WHERE id = ?",
      [productId]
    );

    if (!productDetails || productDetails.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Fetch all sales details including the last date in one query
    const [salesDetails] = await db.query(
      `
      SELECT 
        DATE(tsd.Date) AS saleDate,
        COALESCE(SUM(tsd.Quantity_Sold), 0) AS dailyQuantitySold,
        tsd.Model,
        tsd.Brand,
        tsd.Vehicle_Type,
        tsd.Fuel_Type,
        tsd.City,
        tsd.Dealer_Type,
        tsd.Customer_Age_Group,
        tsd.Customer_Gender,
        tsd.Occupation_of_Buyer,
        tsd.Payment_Mode,
        tsd.Festive_Season_Purchase,
        tsd.Advertisement_Type,
        tsd.Service_Availability,
        tsd.Weather_Condition,
        tsd.Road_Conditions,
        tsd.Engine_Capacity_CC,
        tsd.Price_INR,
        tsd.Petrol_Price_at_Purchase,
        tsd.Competitor_Brand_Presence,
        tsd.Discounts_Offers,
        tsd.Stock_on_Date
      FROM two_wheeler_sales_data tsd
      WHERE tsd.product_id = ? 
      AND tsd.Date >= ? 
      AND tsd.Date <= ? 
      GROUP BY DATE(tsd.Date), 
        tsd.Model,
        tsd.Brand,
        tsd.Vehicle_Type,
        tsd.Fuel_Type,
        tsd.City,
        tsd.Dealer_Type,
        tsd.Customer_Age_Group,
        tsd.Customer_Gender,
        tsd.Occupation_of_Buyer,
        tsd.Payment_Mode,
        tsd.Festive_Season_Purchase,
        tsd.Advertisement_Type,
        tsd.Service_Availability,
        tsd.Weather_Condition,
        tsd.Road_Conditions,
        tsd.Engine_Capacity_CC,
        tsd.Price_INR,
        tsd.Petrol_Price_at_Purchase,
        tsd.Competitor_Brand_Presence,
        tsd.Discounts_Offers,
        tsd.Stock_on_Date
      ORDER BY DATE(tsd.Date)
    `,
      [productId, startDate, endDate]
    );

    // Verify last date is included
    const lastDate = salesDetails.length > 0 ? 
      salesDetails[salesDetails.length - 1].saleDate : null;
    
    console.log("Total records returned:", salesDetails.length);
    if (salesDetails.length > 0) {
      console.log("First date:", salesDetails[0].saleDate);
      console.log("Last date:", lastDate);
      console.log("Expected end date:", endDate);
    }

    // Fetch the entire row for the end date
    const [endDayDetails] = await db.query(
      `
      SELECT 
        DATE(tsd.Date) AS saleDate,
        COALESCE(SUM(tsd.Quantity_Sold), 0) AS dailyQuantitySold,
        tsd.Model,
        tsd.Brand,
        tsd.Vehicle_Type,
        tsd.Fuel_Type,
        tsd.City,
        tsd.Dealer_Type,
        tsd.Customer_Age_Group,
        tsd.Customer_Gender,
        tsd.Occupation_of_Buyer,
        tsd.Payment_Mode,
        tsd.Festive_Season_Purchase,
        tsd.Advertisement_Type,
        tsd.Service_Availability,
        tsd.Weather_Condition,
        tsd.Road_Conditions,
        tsd.Engine_Capacity_CC,
        tsd.Price_INR,
        tsd.Petrol_Price_at_Purchase,
        tsd.Competitor_Brand_Presence,
        tsd.Discounts_Offers,
        tsd.Stock_on_Date
      FROM two_wheeler_sales_data tsd
      WHERE tsd.product_id = ? 
      AND DATE(tsd.Date) = DATE(?)
      GROUP BY DATE(tsd.Date), 
        tsd.Model,
        tsd.Brand,
        tsd.Vehicle_Type,
        tsd.Fuel_Type,
        tsd.City,
        tsd.Dealer_Type,
        tsd.Customer_Age_Group,
        tsd.Customer_Gender,
        tsd.Occupation_of_Buyer,
        tsd.Payment_Mode,
        tsd.Festive_Season_Purchase,
        tsd.Advertisement_Type,
        tsd.Service_Availability,
        tsd.Weather_Condition,
        tsd.Road_Conditions,
        tsd.Engine_Capacity_CC,
        tsd.Price_INR,
        tsd.Petrol_Price_at_Purchase,
        tsd.Competitor_Brand_Presence,
        tsd.Discounts_Offers,
        tsd.Stock_on_Date
      LIMIT 1
    `,
      [productId, endDate]
    );

    // Log end day details
    console.log("\nEnd Day Details:");
    console.log("Expected end date:", endDate);
    if (endDayDetails && endDayDetails.length > 0) {
        console.log("End day data found:", {
            date: endDayDetails[0].saleDate,
            quantity: endDayDetails[0].dailyQuantitySold,
            model: endDayDetails[0].Model,
            brand: endDayDetails[0].Brand,
            fullRow: endDayDetails[0]
        });
    } else {
        console.log("No data found for end date");
    }

    // Append end day details to salesDetails if it exists
    const combinedSalesDetails = endDayDetails && endDayDetails.length > 0 
        ? [...salesDetails, endDayDetails[0]]
        : salesDetails;

    console.log("\nOverall Data Summary:");
    console.log("Total records returned:", combinedSalesDetails.length);
    if (combinedSalesDetails.length > 0) {
        console.log("First date:", combinedSalesDetails[0].saleDate);
        console.log("Last date:", combinedSalesDetails[combinedSalesDetails.length - 1].saleDate);
        console.log("Last record details:", combinedSalesDetails[combinedSalesDetails.length - 1]);
    }

    // Get total quantity sold
    const [totalSalesDetails] = await db.query(
      `
      SELECT COALESCE(SUM(Quantity_Sold), 0) AS quantitySold
      FROM two_wheeler_sales_data
      WHERE product_id = ? 
      AND Date BETWEEN ? AND ?
    `,
      [productId, startDate, endDate]
    );

    // Log the total quantity sold for debugging
    console.log("Total Quantity Sold:", totalSalesDetails[0].quantitySold);

    res.json({
      name: productDetails[0].name,
      quantitySold: totalSalesDetails[0].quantitySold,
      totalLeftInStock: productDetails[0].totalLeftInStock,
      startDate,
      endDate,
      dailySales: combinedSalesDetails,
      endDayData: endDayDetails && endDayDetails.length > 0 ? endDayDetails[0] : null
    });
  } catch (error) {
    console.error("Error fetching sales details:", error.message || error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

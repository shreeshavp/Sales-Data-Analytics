const User = require("../models/User");
const jwt = require("jsonwebtoken");

const authController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check for missing email or password
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            // Find user in MongoDB
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Verify password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            res.status(200).json({
                message: "Login successful",
                token,
                role: user.role,
                userId: user._id
            });

        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ message: "An error occurred during login" });
        }
    },

    register: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            // Check for existing user
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({ message: "Email already registered" });
            }

            // Create and save the user
            const user = new User({
                email: email.toLowerCase(),
                password,
                role: 'customer' // Default role
            });

            await user.save();

            res.status(201).json({
                message: "User registered successfully",
                userId: user._id
            });

        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ message: "An error occurred during registration" });
        }
    }
};

module.exports = authController;

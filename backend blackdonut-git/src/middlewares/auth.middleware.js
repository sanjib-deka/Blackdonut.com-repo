const foodPartnerModel = require('../models/foodParther.model'); // <-- fix spelling
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');



async function authFoodParthnerMiddleware(req, res, next) {
    // Check for both new and old cookie names for backwards compatibility
    const token = req.cookies.foodPartnerToken || req.cookies.token;
    
    console.log('🔍 Food Partner Auth - Cookies:', req.cookies);
    console.log('🔍 Food Partner Auth - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Food Partner Token decoded:', decoded);
        
        // Validate token type is 'foodpartner'
        if (decoded.type !== 'foodpartner') {
            return res.status(401).json({ message: "Invalid token type: expected foodpartner" });
        }
        
        // Fetch full food partner document from DB
        const foodPartner = await foodPartnerModel.findById(decoded.id);
        console.log('✅ Food Partner found:', foodPartner ? foodPartner.email : 'Not found');
        
        if (!foodPartner) {
            return res.status(401).json({ message: "Food partner not found" });
        }
        
        req.foodPartner = foodPartner; // Full document
        next();
    } catch (err) {
        console.error('❌ authFoodParthnerMiddleware error:', err);
        return res.status(401).json({ message: "Invalid token" });
    }
};

async function authUserMiddleware(req, res, next) {
    try {
        // Check for both new and old cookie names for backwards compatibility
        const token = req.cookies.userToken || req.cookies.token;
        
        console.log('🔍 User Auth - Cookies:', req.cookies);
        console.log('🔍 User Auth - Token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ User Token decoded:', decoded);
        
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token" });
        }
        
        // Validate token type is 'user'
        if (decoded.type !== 'user') {
            return res.status(401).json({ message: "Invalid token type: expected user" });
        }

        const user = await userModel.findById(decoded.id);
        console.log('✅ User found:', user ? user.email : 'Not found');
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Auth middleware error:", error);
        return res.status(401).json({ 
            message: "Authentication failed",
            error: error.message 
        });
    }
}


module.exports = {
    authFoodParthnerMiddleware,
    authUserMiddleware
}


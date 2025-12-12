const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const foodPartnerModel = require('../models/foodParther.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../services/emailTransporter');

// normalize cloudinary import (works if service exports function or default)
let uploadOnCloudinaryModule = require('../services/cloudinary');
const uploadOnCloudinary = (typeof uploadOnCloudinaryModule === 'function')
  ? uploadOnCloudinaryModule
  : (uploadOnCloudinaryModule && uploadOnCloudinaryModule.default)
    ? uploadOnCloudinaryModule.default
    : null;

const fs = require('fs');


// Register controller 
async function registerUser(req, res) {

    const { fullName, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        email
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User already exists"
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        fullName,
        email,
        password: hashedPassword
    })

    const token = jwt.sign({
        id: user._id,
        type: 'user'
    }, process.env.JWT_SECRET)

    res.cookie("userToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
    
    // Clear any existing food partner token
    res.clearCookie("foodPartnerToken", { path: '/' });

    res.status(201).json({
        message: "User registered successfully",
        user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        }
    })

}

// Login controller 
async function loginUser(req, res) {

    const { email, password } = req.body;

    const user = await userModel.findOne({
        email
    })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }
// Generate JWT token with type='user'
// SET TOKEN IN COOKIE
    const token = jwt.sign({
        id: user._id,
        type: 'user'
    }, process.env.JWT_SECRET)

    console.log('🔐 Setting cookie - NODE_ENV:', process.env.NODE_ENV);
    
    res.cookie("userToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
    
    // Clear any existing food partner token
    res.clearCookie("foodPartnerToken", { path: '/' });

    console.log('✅ User cookie set with token');

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        }
    })
}

function logoutUser(req, res) {
    res.clearCookie("userToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: '/',
    });
    res.status(200).json({
        message: "User logged out successfully"
    });
}
 


async function RegisterFoodPartner(req, res) {
  try {
    const { name, email, password, phone, address, contactName } = req.body;

    if (!name || !email || !password || !phone || !address || !contactName) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) { console.error('cleanup error:', e); }
      }
      return res.status(400).json({ message: "All fields are required" });
    }

    const isAccountAlreadyExists = await foodPartnerModel.findOne({ email });
    if (isAccountAlreadyExists) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) { console.error('cleanup error:', e); }
      }
      return res.status(400).json({ message: "Account already exists" });
    }

    let profileImage = "";
    let profileImagePublicId = "";
    if (req.file) {
      if (!uploadOnCloudinary || typeof uploadOnCloudinary !== 'function') {
        console.error('uploadOnCloudinary is not a function:', uploadOnCloudinaryModule);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) { console.error('cleanup error:', e); }
        }
        return res.status(500).json({ message: "Upload service misconfigured" });
      }

      try {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        profileImage = uploadResult.secure_url || "";
        profileImagePublicId = uploadResult.public_id || "";
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) { console.error('cleanup error:', e); }
        }
        return res.status(500).json({ message: "Error uploading profile image" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const foodPartner = await foodPartnerModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      contactName,
      profileImage: profileImage,
      profileImagePublicId: profileImagePublicId
    });

    const token = jwt.sign({ id: foodPartner._id, type: 'foodpartner' }, process.env.JWT_SECRET);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(201).json({
      message: "Food Partner registered successfully",
      foodPartner: {
        _id: foodPartner._id,
        email: foodPartner.email,
        name: foodPartner.name,
        profileImage: foodPartner.profileImage
      }
    });
  } catch (err) {
    console.error('RegisterFoodPartner error:', err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { console.error('cleanup error:', e); }
    }
    
    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `This ${field} is already registered` });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
}





async function loginFoodPartner(req, res) {
    const { email, password } = req.body;

    const foodPartner = await foodPartnerModel.findOne({ email });

    if (!foodPartner) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, foodPartner.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: foodPartner._id, type: 'foodpartner' }, process.env.JWT_SECRET);

    res.cookie("foodPartnerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
    
    // Clear any existing user token
    res.clearCookie("userToken", { path: '/' });

    res.status(200).json({
        message: "Food partner logged in successfully",
        foodPartner: {
            _id: foodPartner._id,
            email: foodPartner.email,
            name: foodPartner.name
        }
    });
}

function logoutFoodPartner(req, res) {
    res.clearCookie("foodPartnerToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: '/',
    });
    res.status(200).json({
        message: "Food partner logged out successfully"
    });
}

// Debug helper to inspect cookies/headers in production
function debugCookie(req, res) {
    res.status(200).json({
        cookies: req.cookies,
        headers: req.headers,
        nodeEnv: process.env.NODE_ENV,
        backendTime: new Date().toISOString(),
    });
}

// ==================== FORGOT PASSWORD FLOWS ====================

// Forgot Password - User
async function forgotPasswordUser(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save hashed token and expiration (15 minutes)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        // Build reset link
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}&type=user`;

        // Send email - REQUIRED for data integrity
        try {
            await sendResetPasswordEmail(email, resetLink, user.fullName);
            console.log('✅ Reset email sent to:', email);
        } catch (emailError) {
            console.error('❌ Email service error:', emailError.message);
            // Clear the token if email fails - maintains data integrity
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save();
            return res.status(503).json({ 
                message: 'Email service unavailable. Please try again later.'
            });
        }

        res.status(200).json({
            message: 'Reset password link sent to your email',
            email: email
        });
    } catch (err) {
        console.error('forgotPasswordUser error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Forgot Password - Food Partner
async function forgotPasswordFoodPartner(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const foodPartner = await foodPartnerModel.findOne({ email });
        if (!foodPartner) {
            return res.status(404).json({ message: 'Food partner not found' });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save hashed token and expiration (15 minutes) - use findByIdAndUpdate to avoid validation errors
        await foodPartnerModel.findByIdAndUpdate(
            foodPartner._id,
            {
                resetPasswordToken: hashedToken,
                resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000)
            },
            { new: true }
        );

        // Build reset link
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}&id=${foodPartner._id}&type=foodpartner`;

        // Send email
        try {
            await sendResetPasswordEmail(email, resetLink, foodPartner.name);
        } catch (emailError) {
            // Clear the token if email fails
            foodPartner.resetPasswordToken = null;
            foodPartner.resetPasswordExpire = null;
            await foodPartner.save();
            return res.status(500).json({ message: 'Error sending reset email' });
        }

        res.status(200).json({
            message: 'Reset password link sent to your email',
            email: email
        });
    } catch (err) {
        console.error('forgotPasswordFoodPartner error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// ==================== RESET PASSWORD FLOWS ====================

// Reset Password - User
async function resetPasswordUser(req, res) {
    try {
        const { token, userId, newPassword } = req.body;

        if (!token || !userId || !newPassword) {
            return res.status(400).json({ message: 'Token, user ID, and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash the token to match what's in DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user by ID and token
        const user = await userModel.findOne({
            _id: userId,
            resetPasswordToken: hashedToken
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Check if token has expired
        if (user.resetPasswordExpire < Date.now()) {
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save();
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully'
        });
    } catch (err) {
        console.error('resetPasswordUser error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Reset Password - Food Partner
async function resetPasswordFoodPartner(req, res) {
    try {
        const { token, foodPartnerId, newPassword } = req.body;

        if (!token || !foodPartnerId || !newPassword) {
            return res.status(400).json({ message: 'Token, food partner ID, and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash the token to match what's in DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find food partner by ID and token
        const foodPartner = await foodPartnerModel.findOne({
            _id: foodPartnerId,
            resetPasswordToken: hashedToken
        });

        if (!foodPartner) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Check if token has expired
        if (foodPartner.resetPasswordExpire < Date.now()) {
            foodPartner.resetPasswordToken = null;
            foodPartner.resetPasswordExpire = null;
            await foodPartner.save();
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset fields
        foodPartner.password = hashedPassword;
        foodPartner.resetPasswordToken = null;
        foodPartner.resetPasswordExpire = null;
        await foodPartner.save();

        res.status(200).json({
            message: 'Password reset successfully'
        });
    } catch (err) {
        console.error('resetPasswordFoodPartner error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    RegisterFoodPartner,
    loginFoodPartner,
    logoutFoodPartner,
    forgotPasswordUser,
    forgotPasswordFoodPartner,
    resetPasswordUser,
    resetPasswordFoodPartner,
    debugCookie
}
const express = require('express');
const authController = require('../controllers/auth.controllers');
const { upload } = require('../middlewares/multer');

const router = express.Router();

// Middleware to prevent caching on auth routes
const noCacheMiddleware = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};

router.use(noCacheMiddleware);

// user auth routes
router.post('/user/register', authController.registerUser)
router.post('/user/login', authController.loginUser);
router.get('/user/logout', authController.logoutUser);
router.post('/user/forgot-password', authController.forgotPasswordUser);
router.post('/user/reset-password', authController.resetPasswordUser);

// food parthner auth routes 

router.post('/food-partner/register', upload.single("profileImage"), authController.RegisterFoodPartner)
router.post('/food-partner/login', authController.loginFoodPartner);
router.get('/food-partner/logout', authController.logoutFoodPartner);
router.post('/food-partner/forgot-password', authController.forgotPasswordFoodPartner);
router.post('/food-partner/reset-password', authController.resetPasswordFoodPartner);

// debug route to inspect cookies/headers
router.get('/debug-cookie', authController.debugCookie);

module.exports = router;
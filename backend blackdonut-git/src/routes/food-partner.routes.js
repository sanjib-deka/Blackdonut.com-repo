const express = require('express');
const foodPartnerController = require("../controllers/food-partner.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer");

const router = express.Router();

/* owner endpoints - MUST be before /:id route */
router.get('/me',
    authMiddleware.authFoodParthnerMiddleware,
    foodPartnerController.getMyProfile)

/* Update food partner name */
router.post('/update-name',
    authMiddleware.authFoodParthnerMiddleware,
    foodPartnerController.updateFoodPartnerName)

/* Update food partner address */
router.post('/update-address',
    authMiddleware.authFoodParthnerMiddleware,
    foodPartnerController.updateFoodPartnerAddress)

/* Update food partner profile picture */
router.post('/update-profile-picture',
    authMiddleware.authFoodParthnerMiddleware,
    upload.single("profileImage"),
    foodPartnerController.updateFoodPartnerProfilePicture)

/* Update food partner contact name */
router.put('/update-contact-name',
    authMiddleware.authFoodParthnerMiddleware,
    foodPartnerController.updateFoodPartnerContactName)

/* Update food partner contact number */
router.put('/update-contact-number',
    authMiddleware.authFoodParthnerMiddleware,
    foodPartnerController.updateFoodPartnerContactNumber)

/* Update customer served count */
router.put('/update-customer-served',
    authMiddleware.authFoodParthnerMiddleware,
    foodPartnerController.updateCustomerServed)

/* /api/food-partner/:id (public for authenticated users) */
router.get("/:id",
    authMiddleware.authUserMiddleware,
    foodPartnerController.getFoodPartnerById)

module.exports = router;
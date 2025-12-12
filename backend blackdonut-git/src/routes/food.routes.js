const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');
const { authFoodParthnerMiddleware, authUserMiddleware } = require('../middlewares/auth.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
})

/*  post /api/food/   [protected]  */
router.post('/',
    authFoodParthnerMiddleware,
    upload.single("video"),
    foodController.createFood
)

/* GET /api/food/ [protected] */ 
router.get('/', authUserMiddleware, foodController.getFoodItems)

/* SPECIFIC ROUTES - BEFORE DYNAMIC :id ROUTES */

// Like food
router.post('/like', authMiddleware.authUserMiddleware, foodController.likeFood)

// Save food
router.post('/save', authMiddleware.authUserMiddleware, foodController.saveFood)

router.get('/save', authMiddleware.authUserMiddleware, foodController.getSaveFood)

/* DYNAMIC :id ROUTES - AFTER SPECIFIC ROUTES */

// Delete food item by id (only owner)
router.delete('/:id', authFoodParthnerMiddleware, foodController.deleteFood);

// Update food name (only owner)
router.put('/:id/name', authFoodParthnerMiddleware, foodController.updateFoodName);

// Update food description (only owner)
router.put('/:id/description', authFoodParthnerMiddleware, foodController.updateFoodDescription);

module.exports = router;
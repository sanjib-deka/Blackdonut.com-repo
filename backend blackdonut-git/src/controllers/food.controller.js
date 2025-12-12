const foodModel = require('../models/food.model');
const storageService = require('../services/storage.services');
const { v4: uuid } = require('uuid');
const likeModel = require('../models/likes.model');
const saveModel = require('../models/save.model');
async function createFood(req,res) {

    console.log("req.foodPartner:", req.foodPartner);
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUploadResult = await storageService.uploadFile(req.file.buffer, uuid());
   

    const foodItem = await foodModel.create({
        name: req.body.name,
        description: req.body.description,
        video: fileUploadResult.url,
        foodPartner:req.foodPartner._id
    });

    res.status(201).json({
        message: "Food created successfully",
        food: foodItem
    });
}

// Get food items with pagination

async function getFoodItems(req, res) {
    const foodItems = await foodModel.find();
    res.status(200).json({
        message: "Food items fetched successfully",
        foodItems
    });
}


// This will like the food video for a user
async function likeFood(req, res) {
    try {
        const { foodId } = req.body;
        const userId = req.user?.id; // Optional chaining to safely access id

        // Validate inputs
        if (!foodId || !userId) {
            return res.status(400).json({ 
                message: "Missing required fields", 
                details: !foodId ? "Food ID required" : "User not authenticated" 
            });
        }

        // Find the food item first
        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }

        // Find if user already liked
        const existingLike = await likeModel.findOne({
            user: userId,
            food: foodId
        });

        if (existingLike) {
            // Unlike: Remove the like
            await likeModel.findByIdAndDelete(existingLike._id);
            await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: -1 } });
            return res.json({ like: false });
        } else {
            // Like: Create new like
            await likeModel.create({
                user: userId,
                food: foodId
            });
            await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: 1 } });
            return res.json({ like: true });
        }
    } catch (error) {
        console.error("Like food error:", error);
        return res.status(500).json({ 
            message: "Error processing like action",
            error: error.message 
        });
    }
}

// This will save the food videos for a user

async function saveFood(req, res) {

    const { foodId } = req.body;
    const user = req.user;

    const isAlreadySaved = await saveModel.findOne({
        user: user._id,
        food: foodId
    })

    if (isAlreadySaved) {
        await saveModel.deleteOne({
            user: user._id,
            food: foodId
        })

        await foodModel.findByIdAndUpdate(foodId, {
            $inc: { savesCount: -1 }
        })

        return res.status(200).json({
            message: "Food unsaved successfully"
        })
    }

    const save = await saveModel.create({
        user: user._id,
        food: foodId
    })

    await foodModel.findByIdAndUpdate(foodId, {
        $inc: { savesCount: 1 }
    })

    res.status(201).json({
        message: "Food saved successfully",
        save
    })

}


// This will show the saved food items for a user
async function getSaveFood(req, res) {

    const user = req.user;

    const savedFoods = await saveModel.find({ user: user._id }).populate('food');

    if (!savedFoods || savedFoods.length === 0) {
        return res.status(404).json({ message: "No saved foods found" });
    }

    res.status(200).json({
        message: "Saved foods retrieved successfully",
        savedFoods
    });

}


// Update food name only
async function updateFoodName(req, res) {
    try {
        const foodId = req.params.id;
        const { name } = req.body;
        const partner = req.foodPartner;

        if (!partner) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Food name is required' });
        }

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Verify ownership
        if (String(food.foodPartner) !== String(partner._id)) {
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        const updatedFood = await foodModel.findByIdAndUpdate(
            foodId,
            { name: name.trim() },
            { new: true }
        );

        return res.status(200).json({
            message: 'Food name updated successfully',
            food: updatedFood
        });
    } catch (err) {
        console.error('updateFoodName error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// Update food description only
async function updateFoodDescription(req, res) {
    try {
        const foodId = req.params.id;
        const { description } = req.body;
        const partner = req.foodPartner;

        if (!partner) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Verify ownership
        if (String(food.foodPartner) !== String(partner._id)) {
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        const updatedFood = await foodModel.findByIdAndUpdate(
            foodId,
            { description: description || '' },
            { new: true }
        );

        return res.status(200).json({
            message: 'Food description updated successfully',
            food: updatedFood
        });
    } catch (err) {
        console.error('updateFoodDescription error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    createFood,
    getFoodItems,
    likeFood,
    saveFood,
    getSaveFood,
    deleteFood,
    updateFoodName,
    updateFoodDescription
}

// Delete a food item (only owner/foodPartner who created it)
async function deleteFood(req, res) {
    try {
        const foodId = req.params.id;
        const food = await foodModel.findById(foodId);
        if (!food) return res.status(404).json({ message: 'Food item not found' });

        // req.foodPartner should be set by auth middleware for partner auth
        const partner = req.foodPartner;
        if (!partner) return res.status(401).json({ message: 'Not authorized' });

        if (String(food.foodPartner) !== String(partner._id)) {
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        await foodModel.findByIdAndDelete(foodId);
        return res.status(200).json({ message: 'Food deleted' });
    } catch (err) {
        console.error('deleteFood error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}



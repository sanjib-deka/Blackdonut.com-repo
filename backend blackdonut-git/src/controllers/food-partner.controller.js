const foodPartnerModel = require('../models/foodParther.model');
const foodModel = require('../models/food.model');
const fs = require('fs');

// normalize cloudinary imports (works if service exports function or default)
let uploadOnCloudinaryModule = require('../services/cloudinary');
const uploadOnCloudinary = (typeof uploadOnCloudinaryModule === 'function')
  ? uploadOnCloudinaryModule
  : (uploadOnCloudinaryModule && uploadOnCloudinaryModule.default)
    ? uploadOnCloudinaryModule.default
    : null;

const { deleteFromCloudinary } = require('../services/cloudinary');

async function getFoodPartnerById(req, res) {

    const foodPartnerId = req.params.id;

    const foodPartner = await foodPartnerModel.findById(foodPartnerId)
    const foodItemsByFoodPartner = await foodModel.find({ foodPartner: foodPartnerId })

    if (!foodPartner) {
        return res.status(404).json({ message: "Food partner not found" });
    }

    res.status(200).json({
        message: "Food partner retrieved successfully",
        foodPartner: {
            ...foodPartner.toObject(),
            foodItems: foodItemsByFoodPartner
        }

    });
}

// Get current authenticated food partner (used by owner profile)
async function getMyProfile(req, res) {
    try {
        const foodPartner = req.foodPartner;
        if (!foodPartner) return res.status(401).json({ message: 'Not authenticated' });

        const foodItemsByFoodPartner = await foodModel.find({ foodPartner: foodPartner._id });

        res.status(200).json({
            message: 'Profile retrieved',
            foodPartner: {
                _id: foodPartner._id,
                name: foodPartner.name,
                contactName: foodPartner.contactName,
                phone: foodPartner.phone,
                email: foodPartner.email,
                address: foodPartner.address,
                profileImage: foodPartner.profileImage,
                totalMeals: foodPartner.totalMeals,
                customersServed: foodPartner.customersServed,
                foodItems: foodItemsByFoodPartner
            }
        });
    } catch (err) {
        console.error('getMyProfile error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Update food partner name
async function updateFoodPartnerName(req, res) {
    try {
        const foodPartner = req.foodPartner;
        if (!foodPartner) return res.status(404).json({ message: 'Food partner not found' });

        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Valid name is required' });
        }

        const updated = await foodPartnerModel.findByIdAndUpdate(
            foodPartner._id,
            { $set: { name } },
            { new: true }
        );

        res.status(200).json({
            message: 'Food partner name updated successfully',
            foodPartner: {
                _id: updated._id,
                name: updated.name
            }
        });
    } catch (err) {
        console.error('updateFoodPartnerName error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Update food partner address
async function updateFoodPartnerAddress(req, res) {
    try {
        const foodPartner = req.foodPartner;
        if (!foodPartner) return res.status(404).json({ message: 'Food partner not found' });

        const { address } = req.body;
        if (!address || typeof address !== 'string') {
            return res.status(400).json({ message: 'Valid address is required' });
        }

        const updated = await foodPartnerModel.findByIdAndUpdate(
            foodPartner._id,
            { $set: { address } },
            { new: true }
        );
        res.status(200).json({
            message: 'Food partner address updated successfully',
            foodPartner: {
                _id: updated._id,
                address: updated.address
            }
        });
    } catch (err) {
        console.error('updateFoodPartnerAddress error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Update food partner profile picture
// Update food partner profile picture
async function updateFoodPartnerProfilePicture(req, res) {
    try {
        const foodPartner = req.foodPartner;
        console.log('=== updateFoodPartnerProfilePicture START ===');
        console.log('Food Partner ID:', foodPartner?._id);
        console.log('Current profileImagePublicId:', foodPartner?.profileImagePublicId);
        
        if (!foodPartner) return res.status(401).json({ message: 'Not authenticated' });

        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        if (!uploadOnCloudinary || typeof uploadOnCloudinary !== 'function') {
            console.error('uploadOnCloudinary is not a function:', uploadOnCloudinaryModule);
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch (e) { }
            }
            return res.status(500).json({ message: 'Upload service misconfigured' });
        }

        let uploadResult = {};
        try {
            uploadResult = await uploadOnCloudinary(req.file.path);
            console.log('✓ Upload successful:', uploadResult);
        } catch (uploadErr) {
            console.error('Cloudinary upload failed:', uploadErr);
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch (e) { }
            }
            return res.status(500).json({ message: 'Error uploading profile image to Cloudinary' });
        }

        // Delete old profile picture from Cloudinary if it exists
        if (foodPartner.profileImagePublicId) {
            console.log(`Found existing profile image with public_id: ${foodPartner.profileImagePublicId}`);
            try {
                const deleteResult = await deleteFromCloudinary(foodPartner.profileImagePublicId);
                if (deleteResult) {
                    console.log(`✓ Successfully deleted old profile picture: ${foodPartner.profileImagePublicId}`);
                } else {
                    console.warn(`⚠ Deletion returned null for: ${foodPartner.profileImagePublicId}`);
                }
            } catch (deleteErr) {
                console.error('Failed to delete old profile picture:', deleteErr);
                // Continue with update despite deletion failure
            }
        } else {
            console.log('No previous profile image to delete (profileImagePublicId is empty)');
        }

        // Update food partner with new profile picture
        const updated = await foodPartnerModel.findByIdAndUpdate(
            foodPartner._id,
            { 
                $set: { 
                    profileImage: uploadResult.secure_url,
                    profileImagePublicId: uploadResult.public_id
                } 
            },
            { new: true }
        );

        res.status(200).json({
            message: 'Profile picture updated successfully',
            foodPartner: {
                _id: updated._id,
                profileImage: updated.profileImage
            }
        });
        console.log('=== updateFoodPartnerProfilePicture END (SUCCESS) ===');
    } catch (err) {
        console.error('=== updateFoodPartnerProfilePicture ERROR ===', err);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Update food partner contact name
async function updateFoodPartnerContactName(req, res) {
    try {
        const foodPartner = req.foodPartner;
        if (!foodPartner) return res.status(404).json({ message: 'Food partner not found' });

        const { contactName } = req.body;
        if (!contactName || typeof contactName !== 'string') {
            return res.status(400).json({ message: 'Valid contact name is required' });
        }

        const updated = await foodPartnerModel.findByIdAndUpdate(
            foodPartner._id,
            { $set: { contactName } },
            { new: true }
        );

        res.status(200).json({
            message: 'Food partner contact name updated successfully',
            foodPartner: {
                _id: updated._id,
                contactName: updated.contactName
            }
        });
    } catch (err) {
        console.error('updateFoodPartnerContactName error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Update food partner contact number
async function updateFoodPartnerContactNumber(req, res) {
    try {
        const foodPartner = req.foodPartner;
        if (!foodPartner) return res.status(404).json({ message: 'Food partner not found' });

        const { phone } = req.body;
        if (!phone || typeof phone !== 'string') {
            return res.status(400).json({ message: 'Valid phone number is required' });
        }

        const updated = await foodPartnerModel.findByIdAndUpdate(
            foodPartner._id,
            { $set: { phone } },
            { new: true }
        );

        res.status(200).json({
            message: 'Food partner contact number updated successfully',
            foodPartner: {
                _id: updated._id,
                phone: updated.phone
            }
        });
    } catch (err) {
        console.error('updateFoodPartnerContactNumber error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// Update customer served count
async function updateCustomerServed(req, res) {
    try {
        const partnerId = req.foodPartner._id;
        const { customerServed } = req.body;

        if (typeof customerServed !== 'number' || customerServed < 0) {
            return res.status(400).json({ message: 'customerServed must be a non-negative number' });
        }

        const updated = await foodPartnerModel.findByIdAndUpdate(
            partnerId,
            { customerServed },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Food partner not found' });
        }

        console.log('✅ Customer served count updated:', { partnerId, customerServed });

        res.status(200).json({
            message: 'Customer served count updated successfully',
            foodPartner: {
                _id: updated._id,
                customerServed: updated.customerServed
            }
        });
    } catch (err) {
        console.error('updateCustomerServed error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

module.exports = {
    getFoodPartnerById,
    getMyProfile,
    updateFoodPartnerName,
    updateFoodPartnerAddress,
    updateFoodPartnerProfilePicture,
    updateFoodPartnerContactName,
    updateFoodPartnerContactNumber,
    updateCustomerServed
};


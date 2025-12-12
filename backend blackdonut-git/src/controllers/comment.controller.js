const commentModel = require('../models/comment.model');
const foodModel = require('../models/food.model');
const foodPartnerModel = require('../models/foodParther.model');

// USER: Add a comment to a food video
async function addComment(req, res) {
    try {
        const { foodId, text } = req.body;
        const userId = req.user._id;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        if (!foodId) {
            return res.status(400).json({ message: 'Food ID is required' });
        }

        // Verify food exists
        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        const comment = await commentModel.create({
            text: text.trim(),
            food: foodId,
            user: userId
        });

        // Increment comment count on food
        await foodModel.findByIdAndUpdate(foodId, { $inc: { commentCount: 1 } });

        const populatedComment = await comment.populate('user', 'fullName profileImage');

        return res.status(201).json({
            message: 'Comment added successfully',
            comment: populatedComment
        });
    } catch (err) {
        console.error('addComment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// USER: Delete own comment
async function deleteComment(req, res) {
    try {
        const commentId = req.params.id;
        const userId = req.user._id;

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Verify ownership
        if (String(comment.user) !== String(userId)) {
            return res.status(403).json({ message: 'Can only delete your own comments' });
        }

        await commentModel.findByIdAndDelete(commentId);

        // Decrement comment count on food
        await foodModel.findByIdAndUpdate(comment.food, { $inc: { commentCount: -1 } });

        return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('deleteComment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// USER & OWNER: Fetch comments for a video
async function getComments(req, res) {
    try {
        const foodId = req.params.foodId;

        const comments = await commentModel.find({ food: foodId })
            .populate('user', 'fullName profileImage isPartner businessName')
            .populate('reply.author', 'fullName profileImage businessName isPartner')
            .sort({ isPinned: -1, createdAt: -1 });

        return res.status(200).json({
            message: 'Comments fetched successfully',
            comments
        });
    } catch (err) {
        console.error('getComments error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ============== FOOD PARTNER ENGAGEMENT ENDPOINTS ==============

// PARTNER: Get engagement stats for a food item
async function getEngagementStats(req, res) {
    try {
        const foodId = req.params.foodId;
        const partnerId = req.user._id;

        // Verify food exists and belongs to partner
        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Check if partner owns this food
        if (String(food.foodPartner) !== String(partnerId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Count comments
        const commentCount = await commentModel.countDocuments({ food: foodId });

        // Get likes and saves (if these fields exist on food model)
        const likes = food.likeCount || food.likesCount || 0;
        const saves = food.savesCount || food.bookmarks || 0;

        return res.status(200).json({
            message: 'Engagement stats retrieved',
            stats: {
                likes,
                comments: commentCount,
                saves
            }
        });
    } catch (err) {
        console.error('getEngagementStats error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PARTNER: Pin/Unpin a comment
async function togglePinComment(req, res) {
    try {
        const commentId = req.params.commentId;
        const partnerId = req.user._id;

        const comment = await commentModel.findById(commentId)
            .populate('food');

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Verify partner owns the food item
        if (String(comment.food.foodPartner) !== String(partnerId)) {
            return res.status(403).json({ message: 'Unauthorized to manage this comment' });
        }

        // Toggle pin status
        comment.isPinned = !comment.isPinned;
        await comment.save();

        const populatedComment = await comment
            .populate('user', 'fullName profileImage isPartner businessName')
            .populate('reply.author', 'fullName profileImage businessName isPartner');

        const message = comment.isPinned ? 'Comment pinned' : 'Comment unpinned';

        return res.status(200).json({
            message,
            comment: populatedComment
        });
    } catch (err) {
        console.error('togglePinComment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PARTNER: Reply to a comment
async function replyToComment(req, res) {
    try {
        const commentId = req.params.commentId;
        const partnerId = req.user._id;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Reply text is required' });
        }

        const comment = await commentModel.findById(commentId)
            .populate('food');

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Verify partner owns the food item
        if (String(comment.food.foodPartner) !== String(partnerId)) {
            return res.status(403).json({ message: 'Unauthorized to reply to this comment' });
        }

        // Get partner details
        const partner = await foodPartnerModel.findById(partnerId);

        // Add reply to comment
        comment.reply = {
            text: text.trim(),
            author: partnerId,
            createdAt: new Date()
        };

        await comment.save();

        const populatedComment = await comment
            .populate('user', 'fullName profileImage isPartner businessName')
            .populate('reply.author', 'fullName profileImage businessName isPartner');

        return res.status(200).json({
            message: 'Reply added successfully',
            comment: populatedComment
        });
    } catch (err) {
        console.error('replyToComment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PARTNER: Delete a comment from their food item
async function deleteCommentByPartner(req, res) {
    try {
        const commentId = req.params.commentId;
        const partnerId = req.user._id;

        const comment = await commentModel.findById(commentId)
            .populate('food');

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Verify partner owns the food item
        if (String(comment.food.foodPartner) !== String(partnerId)) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        await commentModel.findByIdAndDelete(commentId);

        // Decrement comment count on food
        await foodModel.findByIdAndUpdate(comment.food._id, { $inc: { commentCount: -1 } });
        return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('deleteCommentByPartner error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PARTNER: Add a comment to any food item
// PARTNER: Add a comment to any food item
async function addCommentAsPartner(req, res) {
    try {
        const { foodId, text } = req.body;
        const partnerId = req.foodPartner._id;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        if (!foodId) {
            return res.status(400).json({ message: 'Food ID is required' });
        }

        // Verify food exists
        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Get partner details for the comment
        const partner = await foodPartnerModel.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        // Create comment with partner as user
        const comment = await commentModel.create({
            text: text.trim(),
            food: foodId,
            user: partnerId
        });

        // Mark as partner comment
        comment.isPartnerComment = true;
        await comment.save();

        // Increment comment count on food
        await foodModel.findByIdAndUpdate(foodId, { $inc: { commentCount: 1 } });

        // Populate and return
        // Populate and return
        const populatedComment = await comment.populate('user', 'fullName businessName profileImage isPartner');

        console.log('✅ Partner comment added:', { partnerId, foodId, commentId: comment._id });

        return res.status(201).json({
            message: 'Comment added successfully',
            comment: populatedComment
        });
    } catch (err) {
        console.error('addCommentAsPartner error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    addComment,
    deleteComment,
    getComments,
    getEngagementStats,
    togglePinComment,
    replyToComment,
    deleteCommentByPartner,
    addCommentAsPartner
};

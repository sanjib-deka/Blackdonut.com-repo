const commentModel = require('../models/comment.model');
const foodModel = require('../models/food.model');

// FOOD PARTNER: Get engagement stats (likes, comments, saves) for their video
async function getEngagementStats(req, res) {
    try {
        const foodId = req.params.foodId;
        const partner = req.foodPartner;

        console.log('📊 getEngagementStats called');
        console.log('   foodId:', foodId);
        console.log('   partnerId:', partner._id);

        const food = await foodModel.findById(foodId);
        if (!food) {
            console.error('❌ Food item not found:', foodId);
            return res.status(404).json({ message: 'Food item not found' });
        }

        console.log('✅ Food found:', food.name);
        console.log('   likeCount:', food.likeCount);
        console.log('   commentCount:', food.commentCount);
        console.log('   savesCount:', food.savesCount);

        // Verify ownership
        if (String(food.foodPartner) !== String(partner._id)) {
            console.error('❌ Ownership verification failed');
            console.error('   food.foodPartner:', food.foodPartner);
            console.error('   partner._id:', partner._id);
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        console.log('✅ Ownership verified');

        // Count actual comments directly from database
        const actualCommentCount = await commentModel.countDocuments({ food: foodId });
        console.log('📝 Actual comments in DB:', actualCommentCount);

        const stats = {
            likes: food.likeCount || 0,
            comments: actualCommentCount,  // Use actual count from DB
            saves: food.savesCount || 0
        };

        console.log('📊 Stats being returned:', stats);

        return res.status(200).json({
            message: 'Engagement stats retrieved',
            stats
        });
    } catch (err) {
        console.error('🔴 getEngagementStats error:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// FOOD PARTNER: Pin a comment on their video
async function pinComment(req, res) {
    try {
        const commentId = req.params.commentId;
        const partner = req.foodPartner;

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const food = await foodModel.findById(comment.food);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Verify ownership
        if (String(food.foodPartner) !== String(partner._id)) {
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        const updatedComment = await commentModel.findByIdAndUpdate(
            commentId,
            { isPinned: !comment.isPinned },
            { new: true }
        ).populate('user', 'name profileImage').populate('reply.author', 'name profileImage');

        return res.status(200).json({
            message: comment.isPinned ? 'Comment unpinned' : 'Comment pinned',
            comment: updatedComment
        });
    } catch (err) {
        console.error('pinComment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// FOOD PARTNER: Delete any comment on their video
async function deleteCommentAsOwner(req, res) {
    try {
        const commentId = req.params.commentId;
        const partner = req.foodPartner;

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const food = await foodModel.findById(comment.food);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Verify ownership
        if (String(food.foodPartner) !== String(partner._id)) {
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        await commentModel.findByIdAndDelete(commentId);

        // Decrement comment count on food
        await foodModel.findByIdAndUpdate(comment.food, { $inc: { commentCount: -1 } });

        return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('deleteCommentAsOwner error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// FOOD PARTNER: Reply to a comment on their video
async function replyToComment(req, res) {
    try {
        const commentId = req.params.commentId;
        const { text } = req.body;
        const partner = req.foodPartner;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Reply text is required' });
        }

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const food = await foodModel.findById(comment.food);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Verify ownership
        if (String(food.foodPartner) !== String(partner._id)) {
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        // Update comment with reply
        const updatedComment = await commentModel.findByIdAndUpdate(
            commentId,
            {
                reply: {
                    text: text.trim(),
                    author: partner._id,
                    createdAt: new Date()
                }
            },
            { new: true }
        ).populate('user', 'name profileImage').populate('reply.author', 'name profileImage');

        return res.status(200).json({
            message: 'Reply added successfully',
            comment: updatedComment
        });
    } catch (err) {
        console.error('replyToComment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    getEngagementStats,
    pinComment,
    deleteCommentAsOwner,
    replyToComment
};

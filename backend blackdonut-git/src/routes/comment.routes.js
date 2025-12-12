const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const engagementController = require('../controllers/engagement.controller');
const { authUserMiddleware, authFoodParthnerMiddleware } = require('../middlewares/auth.middleware');

/* USER ROUTES */

// Add comment
router.post('/',
    authUserMiddleware,
    commentController.addComment
);

// Delete own comment
router.delete('/:id',
    authUserMiddleware,
    commentController.deleteComment
);

// Get comments for a video
router.get('/food/:foodId',
    commentController.getComments
);

/* FOOD PARTNER ENGAGEMENT ROUTES */

// Get engagement stats
router.get('/engagement/:foodId',
    authFoodParthnerMiddleware,
    engagementController.getEngagementStats
);

// Pin/unpin a comment
router.put('/engagement/:commentId/pin',
    authFoodParthnerMiddleware,
    engagementController.pinComment
);

// Delete comment as owner
router.delete('/engagement/:commentId',
    authFoodParthnerMiddleware,
    engagementController.deleteCommentAsOwner
);

// Reply to comment
router.post('/engagement/:commentId/reply',
    authFoodParthnerMiddleware,
    engagementController.replyToComment
);

// Add comment as partner
router.post('/add-by-partner',
    authFoodParthnerMiddleware,
    commentController.addCommentAsPartner
);

module.exports = router;

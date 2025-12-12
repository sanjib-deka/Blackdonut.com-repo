/**
 * Centralized API Configuration
 * Update the BASE_URL here to switch between development and production environments
 */

const API_CONFIG = {
  // Use production backend URL
  BASE_URL: 'https://backend-blackdonut-03.onrender.com',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth Routes
    AUTH: {
      USER_REGISTER: '/api/auth/user/register',
      USER_LOGIN: '/api/auth/user/login',
      USER_LOGOUT: '/api/auth/user/logout',
      FORGOT_PASSWORD_USER: '/api/auth/user/forgot-password',
      RESET_PASSWORD_USER: '/api/auth/user/reset-password',
      FOOD_PARTNER_REGISTER: '/api/auth/food-partner/register',
      FOOD_PARTNER_LOGIN: '/api/auth/food-partner/login',
      FOOD_PARTNER_LOGOUT: '/api/auth/food-partner/logout',
      FORGOT_PASSWORD_FOODPARTNER: '/api/auth/food-partner/forgot-password',
      RESET_PASSWORD_FOODPARTNER: '/api/auth/food-partner/reset-password',
    },
    
    // Food Routes
    FOOD: {
      GET_ALL: '/api/food',
      CREATE: '/api/food',
      UPDATE: (id) => `/api/food/${id}`,
      DELETE: (id) => `/api/food/${id}`,
      UPDATE_NAME: (id) => `/api/food/${id}/name`,
      UPDATE_DESCRIPTION: (id) => `/api/food/${id}/description`,
      LIKE: '/api/food/like',
      SAVE: '/api/food/save',
      GET_SAVES: '/api/food/save',
    },
    
    // Food Partner Routes
    FOOD_PARTNER: {
      GET_ME: '/api/food-partner/me',
      UPDATE_ME: '/api/food-partner/me',
      GET_BY_ID: (id) => `/api/food-partner/${id}`,
      UPDATE_NAME: '/api/food-partner/update-name',
      UPDATE_ADDRESS: '/api/food-partner/update-address',
      UPDATE_CONTACT_NAME: '/api/food-partner/update-contact-name',
      UPDATE_CONTACT_NUMBER: '/api/food-partner/update-contact-number',
      UPDATE_CUSTOMER_SERVED: '/api/food-partner/update-customer-served',
      UPDATE_PROFILE_PICTURE: '/api/food-partner/update-profile-picture',
    },
    
    // Comments (if needed in future)
    COMMENTS: {
      GET: (foodId) => `/api/comments/food/${foodId}`,
      ADD: '/api/comments',
      CREATE: '/api/comments',
      DELETE: (commentId) => `/api/comments/${commentId}`,
      ENGAGEMENT: (foodId) => `/api/comments/engagement/${foodId}`,
      PIN: (commentId) => `/api/comments/engagement/${commentId}/pin`,
      REPLY: (commentId) => `/api/comments/engagement/${commentId}/reply`,
    },
  },
};

export default API_CONFIG;

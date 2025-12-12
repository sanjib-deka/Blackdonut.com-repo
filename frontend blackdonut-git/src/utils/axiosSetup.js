import axios from 'axios';

// Configure axios to always send credentials (cookies) with requests
axios.defaults.withCredentials = true;

// Create a global notification system
const createNotification = (message, type = 'error') => {
  // Create container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `custom-alert custom-alert-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    background: #1a1a1a;
    border: 1px solid rgba(192, 191, 184, 0.3);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(192, 191, 184, 0.1);
    z-index: 10000;
    animation: slideInRight 0.4s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    border-top: 3px solid ${type === 'error' ? '#ef4444' : '#10b981'};
  `;

  const icon = type === 'error' ? '⚠️' : '✓';
  notification.innerHTML = `
    <div style="display: flex; gap: 12px; align-items: flex-start;">
      <div style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">${icon}</div>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
        <div style="color: #c0bfb8; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Black Donut</div>
        <div style="color: #a8a8a8; font-size: 13px; line-height: 1.5;">${message}</div>
      </div>
      <button style="background: none; border: none; color: #c0bfb8; font-size: 24px; cursor: pointer; padding: 0; margin: -8px -8px 0 0; transition: color 0.2s ease; flex-shrink: 0;" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: linear-gradient(90deg, ${type === 'error' ? '#ef4444, #f87171' : '#10b981, #34d399'}); border-radius: 0 0 12px 12px; animation: progressBar 4s linear forwards;"></div>
  `;

  container.appendChild(notification);

  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.remove();
  }, 4000);
};

// Add CSS animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes progressBar {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;
document.head.appendChild(style);

// Guard to avoid duplicate alerts/redirects
if (!window._authRedirectSetup) {
  window._authRedirectSetup = true;

  axios.interceptors.response.use(
    response => response,
    error => {
      const status = error?.response?.status;
      // Only treat 401 as "please login again" - NOT 404!
      // 404 means the resource doesn't exist, not that user is unauthorized
      if (status === 401) {
        // avoid loop if already on login page
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/user/login') && !window._authRedirectInProgress) {
          window._authRedirectInProgress = true;
          try {
            // Show custom notification instead of alert
            createNotification('Please login again', 'error');
          } catch (e) {
            /* ignore errors */
          }
          // redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/user/login';
          }, 1500);
        }
      }
      return Promise.reject(error);
    }
  );
}

export { createNotification };
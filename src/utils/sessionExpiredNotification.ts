/**
 * Show a Material-UI style notification when session expires
 * This is a standalone utility that doesn't require React context
 */

let notificationContainer: HTMLDivElement | null = null;

export const showSessionExpiredNotification = () => {
  // Remove existing notification if any
  if (notificationContainer) {
    document.body.removeChild(notificationContainer);
    notificationContainer = null;
  }

  // Create notification container
  notificationContainer = document.createElement('div');
  notificationContainer.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    min-width: 300px;
    max-width: 500px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    animation: slideIn 0.3s ease-out;
  `;

  // Create notification content
  notificationContainer.innerHTML = `
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    </style>
    <div style="
      display: flex;
      align-items: flex-start;
      padding: 16px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
    ">
      <div style="
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        margin-right: 12px;
        color: #ff9800;
      ">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <div style="flex: 1;">
        <div style="
          font-weight: 600;
          font-size: 14px;
          color: #e65100;
          margin-bottom: 4px;
        ">Session Expired</div>
        <div style="
          font-size: 14px;
          color: #5d4037;
          line-height: 1.5;
        ">Your session has expired. Please sign in again to continue your work.</div>
      </div>
    </div>
  `;

  document.body.appendChild(notificationContainer);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notificationContainer) {
      notificationContainer.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (notificationContainer && document.body.contains(notificationContainer)) {
          document.body.removeChild(notificationContainer);
          notificationContainer = null;
        }
      }, 300);
    }
  }, 3000);
};

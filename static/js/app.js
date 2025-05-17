/**
 * Badir - Common Application Logic
 */

// Initialize common functionality when the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("Badir application initialized");
    
    // Initialize any interactive elements
    initInteractiveElements();
});

/**
 * Initialize interactive elements on the page
 */
function initInteractiveElements() {
    // Handle navbar scroll effects
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        }
    });

    // Initialize AOS animations if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 50
        });
    }
}

/**
 * Format address to show abbreviated form
 * @param {string} address - Full address 
 * @return {string} Abbreviated address (e.g., 0x1234...5678)
 */
function formatAddress(address) {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

/**
 * Show a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, warning, danger, info)
 * @param {number} duration - How long to display the notification in ms
 */
function showNotification(message, type = 'info', duration = 5000) {
    const notificationContainer = document.getElementById('notifications');
    
    // Create container if it doesn't exist
    if (!notificationContainer) {
        const container = document.createElement('div');
        container.id = 'notifications';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'danger') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    document.getElementById('notifications').appendChild(notification);
    
    // Auto-dismiss after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}
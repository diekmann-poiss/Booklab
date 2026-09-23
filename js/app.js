// ===== Main App Module =====
const App = {
    // Current tab
    currentTab: 'calendar',
    
    // Initialize
    init() {
        // Initialize theme
        this.initTheme();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup FAB
        this.setupFAB();
        
        // Setup theme toggle
        this.setupThemeToggle();
        
        // Setup sign out
        this.setupSignOut();
        
        // Setup info button
        this.setupInfoButton();
        
        // Initialize all modules
        this.initModules();
        
        // Initial render
        this.switchTab('calendar');
    },
    
    // Initialize theme
    initTheme() {
        const theme = AppData.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    },
    
    // Setup navigation
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
    },
    
    // Switch tab
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });
        
        // Hide FAB for devices tab (since devices don't use it)
        const fab = document.getElementById('fab');
        fab.style.display = tab === 'devices' ? 'none' : 'flex';
        
        // Initialize the tab if needed
        if (tab === 'calendar' && !window.calendarInitialized) {
            Calendar.init();
            window.calendarInitialized = true;
        }
        
        // BookingForm is needed by both calendar (FAB, day-detail) and bookings tab
        if (!window.bookingFormInitialized) {
            BookingForm.init();
            window.bookingFormInitialized = true;
        }
        
        if (tab === 'devices' && !window.devicesInitialized) {
            Devices.init();
            DeviceForm.init();
            window.devicesInitialized = true;
        } else if (tab === 'bookings' && !window.bookingsInitialized) {
            Bookings.init();
            window.bookingsInitialized = true;
        }
    },
    
    // Setup FAB
    setupFAB() {
        const fab = document.getElementById('fab');
        fab.addEventListener('click', () => {
            // Ensure BookingForm is initialized
            if (typeof BookingForm !== 'undefined' && !window.bookingFormInitialized) {
                BookingForm.init();
                window.bookingFormInitialized = true;
            }
            if (this.currentTab === 'calendar') {
                BookingForm.open(Utils.getCurrentDate());
            } else if (this.currentTab === 'bookings') {
                BookingForm.open(Utils.getCurrentDate());
            }
        });
    },
    
    // Setup theme toggle
    setupThemeToggle() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            Auth.toggleTheme();
            
            // Update icon
            const icon = document.getElementById('theme-toggle').querySelector('i');
            const theme = AppData.getTheme();
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
        
        // Initialize icon
        const icon = document.getElementById('theme-toggle').querySelector('i');
        const theme = AppData.getTheme();
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    },
    
    // Setup sign out
    setupSignOut() {
        document.getElementById('signout-btn').addEventListener('click', () => {
            Auth.confirmSignOut();
        });
    },
    
    // Setup info button
    setupInfoButton() {
        document.getElementById('info-btn').addEventListener('click', () => {
            Auth.showInfo();
        });
    },
    
    // Initialize all modules
    initModules() {
        // Initialize calendar immediately since it's the default tab
        if (typeof Calendar !== 'undefined' && !window.calendarInitialized) {
            Calendar.init();
            window.calendarInitialized = true;
        }
        // BookingForm is needed by calendar tab (FAB, day-detail)
        if (typeof BookingForm !== 'undefined' && !window.bookingFormInitialized) {
            BookingForm.init();
            window.bookingFormInitialized = true;
        }
        // Devices and Bookings will be initialized when their tabs are first activated
    },
    
    // Refresh all
    refresh() {
        if (window.calendarInitialized) {
            Calendar.render();
        }
        if (window.devicesInitialized) {
            Devices.render();
        }
        if (window.bookingsInitialized) {
            Bookings.render();
        }
    }
};

// ===== Modal Management =====
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Close modals on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// Prevent modal content from closing when clicking inside
document.querySelectorAll('.modal-content').forEach(content => {
    content.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// ===== Global Functions =====
function showAlert(message) {
    alert(message);
}

// Make functions globally available
window.App = App;
window.Auth = Auth;
window.Utils = Utils;
window.AppData = AppData;
window.Calendar = Calendar;
window.Devices = Devices;
window.Bookings = Bookings;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Auth initialization is handled in auth.js
    });
}

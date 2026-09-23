// ===== Authentication Module =====
const Auth = {
    // Login form
    loginForm: null,
    
    // Initialize
    init() {
        this.loginForm = document.getElementById('login-form');
        this.setupLoginForm();
        this.setupTheme();
        
        // Check if already authenticated
        if (AppData.isAuthenticated()) {
            this.showMainScreen();
        }
    },
    
    // Setup login form
    setupLoginForm() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    },
    
    // Handle login
    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');
        
        // Validate
        if (!username || !password) {
            this.showError('Please enter both username and password', errorElement);
            return;
        }
        
        // Check credentials
        let isValid = false;
        let user = null;
        
        // Check owner credentials
        if (username === AppData.OWNER_USERNAME && password === AppData.OWNER_PASSWORD) {
            isValid = true;
            user = { username: username, isOwner: true };
        }
        // Check shared login (use stored or default)
        else {
            const sharedLogin = AppData.getSharedLogin() || {
                username: AppData.SHARED_USERNAME,
                password: AppData.SHARED_PASSWORD
            };
            if (username === sharedLogin.username && password === sharedLogin.password) {
                isValid = true;
                user = { username: username, isOwner: false };
            }
        }
        
        if (isValid) {
            AppData.saveAuth(user);
            this.showMainScreen();
        } else {
            this.showError('Invalid username or password', errorElement);
        }
    },
    
    // Show error
    showError(message, element) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'fadeIn 0.3s ease';
        }, 10);
    },
    
    // Hide error
    hideError(element) {
        element.style.display = 'none';
    },
    
    // Show main screen
    showMainScreen() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-screen').style.display = 'flex';
        document.getElementById('main-screen').classList.add('active');
        
        // Clear form
        this.loginForm.reset();
        this.hideError(document.getElementById('login-error'));
        
        // Initialize app
        App.init();
    },
    
    // Sign out
    signOut() {
        AppData.clearAuth();
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('main-screen').style.display = 'none';
    },
    
    // Setup theme
    setupTheme() {
        const theme = AppData.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    },
    
    // Toggle theme
    toggleTheme() {
        AppData.toggleTheme();
    },
    
    // Show info modal
    showInfo() {
        const modal = document.getElementById('info-modal');
        const ownerSection = document.getElementById('owner-section');
        const sharedLoginDisplay = document.getElementById('shared-login-display');
        
        // Show/hide owner section
        if (AppData.isOwner()) {
            ownerSection.style.display = 'block';
            const sharedLogin = AppData.getSharedLogin() || {
                username: AppData.SHARED_USERNAME,
                password: AppData.SHARED_PASSWORD
            };
            sharedLoginDisplay.textContent = `${sharedLogin.username} / ${sharedLogin.password}`;
            
            // Setup create shared login button
            document.getElementById('create-shared-login').onclick = () => {
                const statusElement = document.getElementById('shared-login-status');
                try {
                    AppData.createSharedLogin(AppData.SHARED_USERNAME, AppData.SHARED_PASSWORD);
                    statusElement.textContent = 'Shared login created successfully!';
                    statusElement.style.color = '#26a69a';
                    setTimeout(() => {
                        statusElement.textContent = '';
                    }, 3000);
                } catch (e) {
                    statusElement.textContent = 'Error creating shared login';
                    statusElement.style.color = '#e74c3c';
                }
            };
        } else {
            ownerSection.style.display = 'none';
        }
        
        modal.style.display = 'flex';
    },
    
    // Confirm sign out
    confirmSignOut() {
        if (confirm('Are you sure you want to sign out?')) {
            this.signOut();
        }
    }
};

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}

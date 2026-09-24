// ===== GitHub Configuration =====
const GitHubConfig = {
    // GitHub Pages URL
    PAGES_URL: 'https://diekmann-poiss.github.io/Booklab/',
    
    // GitHub repository info (derived from Pages URL)
    USERNAME: 'diekmann-poiss',
    REPO: 'Booklab',
    BRANCH: 'master',
    
    // API base URL
    API_BASE: 'https://api.github.com',
    RAW_BASE: 'https://raw.githubusercontent.com',
    
    // Data file paths
    DEVICES_FILE: 'data/devices.json',
    BOOKINGS_FILE: 'data/bookings.json',
    
    // Get raw URL for a file
    getRawUrl(filePath) {
        return `${this.RAW_BASE}/${this.USERNAME}/${this.REPO}/${this.BRANCH}/${filePath}`;
    },
    
    // Get API URL for a file
    getApiUrl(filePath) {
        return `${this.API_BASE}/repos/${this.USERNAME}/${this.REPO}/contents/${filePath}`;
    }
};

// ===== Data Store =====
const AppData = {
    // Device storage key
    DEVICES_KEY: 'booklab_devices',
    
    // Bookings storage key
    BOOKINGS_KEY: 'booklab_bookings',
    
    // GitHub token storage key
    GITHUB_TOKEN_KEY: 'booklab_github_token',
    
    // Authentication
    AUTH_KEY: 'booklab_auth',
    SHARED_LOGIN_KEY: 'booklab_shared_login',
    
    // Theme
    THEME_KEY: 'booklab_theme',
    
    // Owner credentials (hardcoded for demo)
    OWNER_USERNAME: 'owner',
    OWNER_PASSWORD: 'owner123',
    
    // Shared login (default as described in requirements)
    SHARED_USERNAME: 'iblb',
    SHARED_PASSWORD: 'iblb7300',
    
    // Data state
    useGitHub: true, // Flag to enable/disable GitHub sync
    
    // Initialize
    init() {
        // Check if we should use GitHub sync
        // For now, default to false to maintain backward compatibility
        // Users can enable it via settings or by setting a token
        this.useGitHub = !!this.getGitHubToken();
        
        // Seed initial devices if none exist in localStorage
        if (!this.getDevices().length) {
            this.seedDevices();
        }
        
        // If GitHub token is set, try to load from GitHub
        if (this.useGitHub) {
            this.loadFromGitHub().catch(() => {
                console.log('GitHub not available, using localStorage');
            });
        }
    },
    
    // ===== GitHub Token Management =====
    
    setGitHubToken(token) {
        if (token) {
            localStorage.setItem(this.GITHUB_TOKEN_KEY, token);
            this.useGitHub = true;
        } else {
            localStorage.removeItem(this.GITHUB_TOKEN_KEY);
            this.useGitHub = false;
        }
    },
    
    getGitHubToken() {
        return localStorage.getItem(this.GITHUB_TOKEN_KEY);
    },
    
    hasGitHubToken() {
        return !!this.getGitHubToken();
    },
    
    // ===== GitHub Read Methods =====
    
    async loadFromGitHub() {
        try {
            const [devices, bookings] = await Promise.all([
                this.fetchFromGitHub(GitHubConfig.DEVICES_FILE),
                this.fetchFromGitHub(GitHubConfig.BOOKINGS_FILE)
            ]);
            
            if (devices) {
                this.saveDevices(devices);
            }
            
            if (bookings) {
                this.saveBookings(bookings);
            }
            
            this.notifyUpdate();
            return true;
        } catch (error) {
            console.error('Error loading from GitHub:', error);
            return false;
        }
    },
    
    async fetchFromGitHub(filePath) {
        try {
            const url = GitHubConfig.getRawUrl(filePath);
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null; // File doesn't exist yet
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching ${filePath} from GitHub:`, error);
            return null;
        }
    },
    
    // ===== GitHub Write Methods =====
    
    async saveToGitHub(filePath, data) {
        const token = this.getGitHubToken();
        
        if (!token) {
            console.error('No GitHub token set. Cannot save to GitHub.');
            return { success: false, error: 'No GitHub token' };
        }
        
        try {
            const apiUrl = GitHubConfig.getApiUrl(filePath);
            const content = JSON.stringify(data, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // First, get the current file SHA (for updates)
            let sha = null;
            try {
                const getResponse = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // File doesn't exist yet, that's fine
                console.log('File does not exist yet, will create new one');
            }
            
            // Prepare the commit
            const commitData = {
                message: `Update ${filePath} via BookLab at ${new Date().toISOString()}`,
                content: encodedContent,
                branch: GitHubConfig.BRANCH
            };
            
            if (sha) {
                commitData.sha = sha;
            }
            
            // Send the update
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commitData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('GitHub API error:', errorData);
                return { success: false, error: errorData.message || 'API error' };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error saving to GitHub:', error);
            return { success: false, error: error.message };
        }
    },
    
    async saveAllToGitHub() {
        const devices = this.getDevices();
        const bookings = this.getBookings();
        
        const devicesResult = await this.saveToGitHub(GitHubConfig.DEVICES_FILE, devices);
        const bookingsResult = await this.saveToGitHub(GitHubConfig.BOOKINGS_FILE, bookings);
        
        return {
            devices: devicesResult,
            bookings: bookingsResult
        };
    },
    
    // ===== Sync Status =====
    
    getSyncStatus() {
        if (!this.hasGitHubToken()) {
            return 'No GitHub token configured. Data is stored locally only.';
        }
        return this.useGitHub ? 'GitHub sync enabled' : 'GitHub sync disabled';
    },
    
    // ===== Data Access Methods (Synchronous) =====
    // These maintain backward compatibility with existing code
    
    // Get devices
    getDevices() {
        try {
            const data = localStorage.getItem(this.DEVICES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading devices:', e);
            return [];
        }
    },
    
    // Save devices
    saveDevices(devices) {
        try {
            localStorage.setItem(this.DEVICES_KEY, JSON.stringify(devices));
            this.notifyUpdate();
        } catch (e) {
            console.error('Error saving devices:', e);
        }
    },
    
    // Add device
    addDevice(name) {
        const devices = this.getDevices();
        const newDevice = {
            id: Date.now().toString(),
            name: name.trim()
        };
        devices.push(newDevice);
        this.saveDevices(devices);
        return newDevice;
    },
    
    // Update device
    updateDevice(id, newName) {
        const devices = this.getDevices();
        const index = devices.findIndex(d => d.id === id);
        if (index !== -1) {
            devices[index].name = newName.trim();
            this.saveDevices(devices);
            return devices[index];
        }
        return null;
    },
    
    // Delete device
    deleteDevice(id) {
        const devices = this.getDevices().filter(d => d.id !== id);
        this.saveDevices(devices);
        
        // Also remove bookings for this device
        const bookings = this.getBookings().filter(b => 
            !b.devices.some(d => d.id === id)
        );
        this.saveBookings(bookings);
    },
    
    // Get bookings
    getBookings() {
        try {
            const data = localStorage.getItem(this.BOOKINGS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading bookings:', e);
            return [];
        }
    },
    
    // Save bookings
    saveBookings(bookings) {
        try {
            localStorage.setItem(this.BOOKINGS_KEY, JSON.stringify(bookings));
            this.notifyUpdate();
        } catch (e) {
            console.error('Error saving bookings:', e);
        }
    },
    
    // Add booking
    addBooking(booking) {
        const bookings = this.getBookings();
        bookings.push(booking);
        this.saveBookings(bookings);
        return booking;
    },
    
    // Cancel booking
    cancelBooking(id) {
        const bookings = this.getBookings().filter(b => b.id !== id);
        this.saveBookings(bookings);
    },
    
    // Get booking by ID
    getBookingById(id) {
        return this.getBookings().find(b => b.id === id);
    },
    
    // Check for conflicts
    checkConflicts(newBooking) {
        const bookings = this.getBookings();
        const conflicts = [];
        
        for (const existing of bookings) {
            // Skip the booking being edited (if any)
            if (existing.id === newBooking.id) continue;
            
            // Check if they share any device
            const sharedDevices = existing.devices.filter(d1 =>
                newBooking.devices.some(d2 => d2.id === d1.id)
            );
            
            if (sharedDevices.length > 0) {
                // Check if time ranges overlap
                const newStart = new Date(newBooking.date + 'T' + newBooking.startTime);
                const newEnd = new Date(newBooking.date + 'T' + newBooking.endTime);
                const existingStart = new Date(existing.date + 'T' + existing.startTime);
                const existingEnd = new Date(existing.date + 'T' + existing.endTime);
                
                if (newStart < existingEnd && newEnd > existingStart) {
                    conflicts.push(existing);
                }
            }
        }
        
        return conflicts;
    },
    
    // Seed initial devices
    seedDevices() {
        const initialDevices = [
            'Soil Moisture Sensor',
            'pH Meter',
            'Temperature Logger',
            'Spectrophotometer',
            'Gas Chromatograph',
            'Tensometer',
            'Drones',
            'Laser Scanner'
        ];
        
        const devices = initialDevices.map((name, index) => ({
            id: `seed_${index}`,
            name: name
        }));
        
        this.saveDevices(devices);
    },
    
    // Get device color index
    getDeviceColorIndex(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 16;
    },
    
    // Get device color
    getDeviceColor(name) {
        return `device-color-${this.getDeviceColorIndex(name)}`;
    },
    
    // Get booking chip color
    getBookingChipColor(deviceName) {
        return `booking-chip-${this.getDeviceColorIndex(deviceName)}`;
    },
    
    // Notify update to all listeners
    notifyUpdate() {
        window.dispatchEvent(new Event('dataUpdated'));
    },
    
    // ===== Refresh from GitHub =====
    
    async refreshFromGitHub() {
        return this.loadFromGitHub();
    },
    
    // Authentication methods
    saveAuth(user) {
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
    },
    
    getAuth() {
        try {
            const data = localStorage.getItem(this.AUTH_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },
    
    clearAuth() {
        localStorage.removeItem(this.AUTH_KEY);
    },
    
    isAuthenticated() {
        return this.getAuth() !== null;
    },
    
    isOwner() {
        const auth = this.getAuth();
        return auth && auth.username === this.OWNER_USERNAME;
    },
    
    isSharedUser() {
        const auth = this.getAuth();
        return auth && auth.username === this.SHARED_USERNAME;
    },
    
    // Theme methods
    saveTheme(theme) {
        localStorage.setItem(this.THEME_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
    },
    
    getTheme() {
        return localStorage.getItem(this.THEME_KEY) || 'light';
    },
    
    toggleTheme() {
        const current = this.getTheme();
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.saveTheme(newTheme);
        return newTheme;
    },
    
    // Export methods
    exportCSV() {
        const bookings = this.getBookings();
        const devices = this.getDevices();
        
        let csv = 'Device,Booked by,Start,End\n';
        
        for (const booking of bookings) {
            for (const device of booking.devices) {
                const deviceName = devices.find(d => d.id === device.id)?.name || device.id;
                csv += `"${deviceName.replace(/"/g, '""')}","${booking.name.replace(/"/g, '""')}","${booking.date} ${booking.startTime}","${booking.date} ${booking.endTime}"\n`;
            }
        }
        
        return csv;
    },
    
    exportICS() {
        const bookings = this.getBookings();
        const devices = this.getDevices();
        
        let ics = 'BEGIN:VCALENDAR\n';
        ics += 'VERSION:2.0\n';
        ics += 'PRODID:-//BookLab//BOKU University//EN\n';
        
        for (const booking of bookings) {
            const startDate = new Date(booking.date + 'T' + booking.startTime);
            const endDate = new Date(booking.date + 'T' + booking.endTime);
            
            const startStr = this.formatICSDate(startDate);
            const endStr = this.formatICSDate(endDate);
            const deviceNames = booking.devices.map(d => 
                devices.find(device => device.id === d.id)?.name || d.id
            ).join(', ');
            
            ics += 'BEGIN:VEVENT\n';
            ics += `UID:${booking.id}@booklab.boku\n`;
            ics += `DTSTART:${startStr}\n`;
            ics += `DTEND:${endStr}\n`;
            ics += `SUMMARY:BookLab - ${deviceNames}\n`;
            ics += `DESCRIPTION:${booking.name} - ${deviceNames}\n`;
            ics += 'END:VEVENT\n';
        }
        
        ics += 'END:VCALENDAR\n';
        
        return ics;
    },
    
    formatICSDate(date) {
        const pad = (n) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        
        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    },
    
    // Shared login methods
    createSharedLogin(username, password) {
        localStorage.setItem(this.SHARED_LOGIN_KEY, JSON.stringify({
            username: username,
            password: password
        }));
        this.SHARED_USERNAME = username;
        this.SHARED_PASSWORD = password;
        return true;
    },
    
    getSharedLogin() {
        try {
            const data = localStorage.getItem(this.SHARED_LOGIN_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
};

// Initialize data store
AppData.init();

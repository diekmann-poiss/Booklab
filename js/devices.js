// ===== Devices Module =====
const Devices = {
    // Elements
    devicesListElement: null,
    emptyDevicesElement: null,
    deviceSearchElement: null,
    
    // State
    isEditing: false,
    currentSearch: '',
    
    // Initialize
    init() {
        this.devicesListElement = document.getElementById('devices-list');
        this.emptyDevicesElement = document.getElementById('empty-devices');
        this.deviceSearchElement = document.getElementById('device-search');
        
        // Setup controls
        this.setupControls();
        
        // Render
        this.render();
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // Setup controls
    setupControls() {
        // Add device button
        document.getElementById('add-device-btn').addEventListener('click', () => {
            DeviceForm.open();
        });
        
        // Toggle delete buttons
        const toggleDeleteBtn = document.getElementById('toggle-delete-btn');
        if (toggleDeleteBtn) {
            toggleDeleteBtn.addEventListener('click', () => {
                this.toggleEdit();
            });
        }
        
        // Search
        this.deviceSearchElement.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.toLowerCase();
            this.render();
        });
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Listen for data updates
        window.addEventListener('dataUpdated', () => {
            this.render();
        });
    },
    
    // Toggle edit mode (now only controls delete buttons)
    toggleEdit(enable) {
        if (enable === undefined) {
            enable = !this.isEditing;
        }
        
        this.isEditing = enable;
        
        // Update delete buttons visibility
        document.querySelectorAll('.device-card .delete-btn').forEach(btn => {
            btn.style.display = enable ? 'flex' : 'none';
        });
        
        // Update toggle button icon
        const toggleBtn = document.getElementById('toggle-delete-btn');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (enable) {
                icon.className = 'fas fa-times';
                toggleBtn.title = 'Hide delete buttons';
            } else {
                icon.className = 'fas fa-trash';
                toggleBtn.title = 'Show delete buttons';
            }
        }
        
        this.render();
    },
    
    // Render
    render() {
        const devices = AppData.getDevices();
        const search = this.currentSearch.toLowerCase();
        
        // Filter devices
        const filteredDevices = devices.filter(device => 
            device.name.toLowerCase().includes(search)
        );
        
        // Check if empty
        if (filteredDevices.length === 0) {
            this.devicesListElement.style.display = 'none';
            this.emptyDevicesElement.style.display = 'block';
            return;
        }
        
        this.devicesListElement.style.display = 'flex';
        this.emptyDevicesElement.style.display = 'none';
        
        // Build HTML
        let html = '';
        for (const device of filteredDevices) {
            const colorClass = AppData.getDeviceColor(device.name);
            
            // Always show edit button, delete button visible in edit mode
            html += `
                <div class="card device-card ${colorClass}" data-device-id="${device.id}">
                    <div class="device-info">
                        <div class="device-name">${Utils.escapeHtml(device.name)}</div>
                    </div>
                    <div class="device-actions">
                        <button class="icon-btn edit-btn" onclick="Devices.editDevice('${device.id}')" title="Edit">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="icon-btn delete-btn" onclick="Devices.deleteDevice('${device.id}')" title="Delete" style="display: ${this.isEditing ? 'flex' : 'none'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.devicesListElement.innerHTML = html;
    },
    
    // Edit device
    editDevice(deviceId) {
        const device = AppData.getDevices().find(d => d.id === deviceId);
        if (device) {
            DeviceForm.open(device);
        }
    },
    
    // Delete device
    deleteDevice(deviceId) {
        if (confirm('Are you sure you want to delete this device? This will also delete all bookings for this device.')) {
            AppData.deleteDevice(deviceId);
        }
    },
    
    // Get device by ID
    getDevice(deviceId) {
        return AppData.getDevices().find(d => d.id === deviceId);
    }
};

// ===== Device Form =====
const DeviceForm = {
    modal: null,
    form: null,
    editingDevice: null,
    
    init() {
        this.modal = document.getElementById('device-modal');
        this.form = document.getElementById('device-form');
        
        // Setup form
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Setup modal close
        this.setupModalClose();
    },
    
    setupModalClose() {
        // Close button
        this.modal.querySelector('.modal-close').addEventListener('click', () => {
            this.close();
        });
        
        // Cancel button
        this.modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Overlay click
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.close();
        });
    },
    
    open(device) {
        this.editingDevice = device || null;
        
        // Set title
        document.getElementById('device-modal-title').textContent = device ? 'Edit Device' : 'Add Device';
        
        // Set value
        document.getElementById('device-name').value = device ? device.name : '';
        
        // Focus
        document.getElementById('device-name').focus();
        
        // Show modal
        this.modal.style.display = 'flex';
    },
    
    close() {
        this.form.reset();
        this.editingDevice = null;
        this.modal.style.display = 'none';
    },
    
    handleSubmit() {
        const name = document.getElementById('device-name').value.trim();
        
        if (!name) {
            alert('Please enter a device name');
            return;
        }
        
        if (this.editingDevice) {
            // Update
            AppData.updateDevice(this.editingDevice.id, name);
        } else {
            // Add
            AppData.addDevice(name);
        }
        
        this.close();
    }
};

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Devices.init();
        DeviceForm.init();
    });
} else {
    Devices.init();
    DeviceForm.init();
}

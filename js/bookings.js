// ===== Bookings Module =====
const Bookings = {
    // Elements
    bookingsListElement: null,
    emptyBookingsElement: null,
    
    // State
    currentFilter: 'upcoming', // 'upcoming' or 'past'
    
    // Initialize
    init() {
        this.bookingsListElement = document.getElementById('bookings-list');
        this.emptyBookingsElement = document.getElementById('empty-bookings');
        
        // Setup controls
        this.setupControls();
        
        // Render
        this.render();
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // Setup controls
    setupControls() {
        // Upcoming/Past toggle
        document.getElementById('upcoming-btn').addEventListener('click', () => {
            this.filter('upcoming');
        });
        
        document.getElementById('past-btn').addEventListener('click', () => {
            this.filter('past');
        });
        
        // Export buttons
        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.exportCSV();
        });
        
        document.getElementById('export-ics-btn').addEventListener('click', () => {
            this.exportICS();
        });
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Listen for data updates
        window.addEventListener('dataUpdated', () => {
            this.render();
        });
    },
    
    // Filter bookings
    filter(filter) {
        this.currentFilter = filter;
        
        // Update buttons
        document.getElementById('upcoming-btn').classList.toggle('active', filter === 'upcoming');
        document.getElementById('past-btn').classList.toggle('active', filter === 'past');
        
        // Render
        this.render();
    },
    
    // Render
    render() {
        const allBookings = AppData.getBookings();
        const devices = AppData.getDevices();
        const today = Utils.getCurrentDate();
        
        // Filter bookings
        let filteredBookings;
        if (this.currentFilter === 'upcoming') {
            filteredBookings = allBookings.filter(b => b.date >= today);
            filteredBookings.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            });
        } else {
            filteredBookings = allBookings.filter(b => b.date < today);
            filteredBookings.sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return b.startTime.localeCompare(a.startTime);
            });
        }
        
        // Check if empty
        if (filteredBookings.length === 0) {
            this.bookingsListElement.style.display = 'none';
            this.emptyBookingsElement.style.display = 'block';
            return;
        }
        
        this.bookingsListElement.style.display = 'flex';
        this.emptyBookingsElement.style.display = 'none';
        
        // Build HTML
        let html = '';
        for (const booking of filteredBookings) {
            // Check for conflicts
            const hasConflict = allBookings.some(other => 
                other.id !== booking.id &&
                booking.date === other.date &&
                other.devices.some(d1 => booking.devices.some(d2 => d2.id === d1.id)) &&
                booking.startTime < other.endTime &&
                booking.endTime > other.startTime
            );
            
            // Use first device for color
            const firstDevice = devices.find(d => d.id === booking.devices[0].id);
            const colorClass = firstDevice ? AppData.getDeviceColor(firstDevice.name) : 'device-color-0';
            
            // Device names
            const deviceNames = booking.devices.map(d => 
                devices.find(device => device.id === d.id)?.name || d.id
            ).join(', ');
            
            // Format date
            const date = new Date(booking.date);
            const weekday = Utils.getWeekdayNameShort(date.getDay());
            const month = Utils.getMonthNameShort(date.getMonth());
            const day = date.getDate();
            const year = date.getFullYear();
            
            html += `
                <div class="card booking-card ${hasConflict ? 'conflict' : ''}" data-booking-id="${booking.id}">
                    <div class="booking-header">
                        <div class="booking-devices">${Utils.escapeHtml(deviceNames)}</div>
                        <div class="booking-actions">
                            <button class="cancel-btn" onclick="Bookings.cancelBooking('${booking.id}')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
                    <div class="booking-time">${weekday}, ${month} ${day}, ${year} - ${Utils.formatTimeRange(booking.startTime, booking.endTime)}</div>
                    <div class="booking-booked-by">Booked by: ${Utils.escapeHtml(booking.name)}</div>
                </div>
            `;
        }
        
        this.bookingsListElement.innerHTML = html;
    },
    
    // Cancel booking
    cancelBooking(bookingId) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            AppData.cancelBooking(bookingId);
        }
    },
    
    // Export CSV
    exportCSV() {
        const csv = AppData.exportCSV();
        const filename = Utils.formatFilename('iblb-bookings', 'csv');
        Utils.downloadFile(csv, filename, 'text/csv');
    },
    
    // Export ICS
    exportICS() {
        const ics = AppData.exportICS();
        const filename = Utils.formatFilename('iblb-bookings', 'ics');
        Utils.downloadFile(ics, filename, 'text/calendar');
    }
};

// ===== Booking Form =====
const BookingForm = {
    modal: null,
    form: null,
    
    // Current booking (for edit)
    currentBooking: null,
    
    // Initialize
    init() {
        this.modal = document.getElementById('booking-modal');
        this.form = document.getElementById('booking-form');
        
        // Setup form
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Setup modal close
        this.setupModalClose();
        
        // Setup device checkboxes
        this.renderDeviceCheckboxes();
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
    
    // Render device checkboxes
    renderDeviceCheckboxes() {
        const container = document.getElementById('device-checkboxes');
        const devices = AppData.getDevices();
        
        let html = '';
        for (const device of devices) {
            const colorClass = AppData.getDeviceColor(device.name);
            
            html += `
                <label class="device-checkbox ${colorClass}">
                    <input type="checkbox" name="device" value="${device.id}" ${this.currentBooking?.devices.some(d => d.id === device.id) ? 'checked' : ''}>
                    <div class="color-bar"></div>
                    <span>${Utils.escapeHtml(device.name)}</span>
                </label>
            `;
        }
        
        container.innerHTML = html;
    },
    
    // Open form
    open(date) {
        this.currentBooking = null;
        
        // Set default date
        document.getElementById('booking-date').value = date || Utils.getCurrentDate();
        
        // Set default time (09:00 - 11:00)
        document.getElementById('booking-start').value = '09:00';
        document.getElementById('booking-end').value = '11:00';
        
        // Clear name
        document.getElementById('booking-name').value = '';
        
        // Clear conflicts
        this.hideConflictWarning();
        
        // Update button text
        document.getElementById('book-btn-text').textContent = 'Book Device';
        
        // Render checkboxes
        this.renderDeviceCheckboxes();
        
        // Focus name field
        document.getElementById('booking-name').focus();
        
        // Show modal
        this.modal.style.display = 'flex';
    },
    
    // Close form
    close() {
        this.form.reset();
        this.currentBooking = null;
        this.hideConflictWarning();
        this.modal.style.display = 'none';
    },
    
    // Handle submit
    handleSubmit() {
        const name = document.getElementById('booking-name').value.trim();
        const date = document.getElementById('booking-date').value;
        const startTime = document.getElementById('booking-start').value;
        const endTime = document.getElementById('booking-end').value;
        
        // Get selected devices
        const selectedDevices = Array.from(document.querySelectorAll('input[name="device"]:checked'))
            .map(input => ({ id: input.value }));
        
        // Validate
        if (!name) {
            alert('Please enter your name');
            return;
        }
        
        if (selectedDevices.length === 0) {
            alert('Please select at least one device');
            return;
        }
        
        if (!Utils.isValidTimeRange(startTime, endTime)) {
            alert('End time must be after start time');
            return;
        }
        
        // Create booking
        const newBooking = {
            id: Utils.generateId(),
            name: name,
            devices: selectedDevices,
            date: date,
            startTime: startTime,
            endTime: endTime,
            createdAt: new Date().toISOString()
        };
        
        // Check for conflicts
        const conflicts = AppData.checkConflicts(newBooking);
        
        if (conflicts.length > 0) {
            this.showConflicts(conflicts);
            return;
        }
        
        // Add booking
        AppData.addBooking(newBooking);
        
        // Close form
        this.close();
    },
    
    // Show conflicts
    showConflicts(conflicts) {
        const container = document.getElementById('conflict-list');
        const devices = AppData.getDevices();
        
        let html = '';
        for (const conflict of conflicts) {
            const deviceNames = conflict.devices.map(d => 
                devices.find(device => device.id === d.id)?.name || d.id
            ).join(', ');
            
            html += `
                <li>${Utils.escapeHtml(deviceNames)} - ${Utils.formatTimeRange(conflict.startTime, conflict.endTime)} (${Utils.escapeHtml(conflict.name)})</li>
            `;
        }
        
        container.innerHTML = html;
        document.getElementById('conflict-warning').style.display = 'block';
    },
    
    // Hide conflict warning
    hideConflictWarning() {
        document.getElementById('conflict-warning').style.display = 'none';
        document.getElementById('conflict-list').innerHTML = '';
    }
};

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Bookings.init();
        BookingForm.init();
    });
} else {
    Bookings.init();
    BookingForm.init();
}

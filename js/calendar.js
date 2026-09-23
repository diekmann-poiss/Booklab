// ===== Calendar Module =====
const Calendar = {
    // Current view state
    currentDate: null,
    currentView: 'month', // 'month' or 'week'
    
    // Elements
    monthYearElement: null,
    monthGridElement: null,
    weekRangeElement: null,
    weekGridElement: null,
    
    // Initialize
    init() {
        this.currentDate = new Date();
        this.currentView = 'month';
        
        // Get elements
        this.monthYearElement = document.getElementById('month-year');
        this.monthGridElement = document.getElementById('month-grid');
        this.weekRangeElement = document.getElementById('week-range');
        this.weekGridElement = document.getElementById('week-grid');
        
        // Setup controls
        this.setupControls();
        
        // Render initial view
        this.render();
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // Setup controls
    setupControls() {
        // View toggle
        document.getElementById('month-view-btn').addEventListener('click', () => {
            this.switchView('month');
        });
        
        document.getElementById('week-view-btn').addEventListener('click', () => {
            this.switchView('week');
        });
        
        // Navigation
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.navigate(-1);
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            this.navigate(1);
        });
        
        document.getElementById('today-btn').addEventListener('click', () => {
            this.goToToday();
        });
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Listen for data updates
        window.addEventListener('dataUpdated', () => {
            this.render();
        });
    },
    
    // Switch view
    switchView(view) {
        this.currentView = view;
        
        // Update buttons
        document.getElementById('month-view-btn').classList.toggle('active', view === 'month');
        document.getElementById('week-view-btn').classList.toggle('active', view === 'week');
        
        // Show/hide views
        document.getElementById('month-view').style.display = view === 'month' ? 'block' : 'none';
        document.getElementById('week-view').style.display = view === 'week' ? 'block' : 'none';
        
        // Render
        this.render();
    },
    
    // Navigate
    navigate(direction) {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + direction * 7);
        }
        this.render();
    },
    
    // Go to today
    goToToday() {
        this.currentDate = new Date();
        this.render();
    },
    
    // Render
    render() {
        if (this.currentView === 'month') {
            this.renderMonth();
        } else {
            this.renderWeek();
        }
    },
    
    // Render month
    renderMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update header
        const monthName = `${Utils.getMonthName(month)} ${year}`;
        this.monthYearElement.textContent = monthName;
        
        // Get days in month
        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDayOfMonth = Utils.getFirstDayOfMonth(year, month);
        
        // Adjust to Monday-first
        let firstDay = firstDayOfMonth;
        if (firstDay === 0) firstDay = 7; // Sunday = 0, should be 7 for Monday-first
        
        // Build grid
        let html = '';
        
        // Previous month days
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const prevMonthDays = Utils.getDaysInMonth(prevYear, prevMonth);
        
        for (let i = 1; i < firstDay; i++) {
            const day = prevMonthDays - (firstDay - i) + 1;
            const date = new Date(prevYear, prevMonth, day);
            const dateStr = Utils.formatDate(date);
            html += this.createDayElement(dateStr, true);
        }
        
        // Current month days
        const todayInfo = Utils.getTodayInfo();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = Utils.formatDate(date);
            const isToday = dateStr === todayInfo.dateStr;
            html += this.createDayElement(dateStr, false, isToday);
        }
        
        // Next month days
        const totalCells = Math.ceil((firstDay + daysInMonth - 1) / 7) * 7;
        const currentCells = firstDay + daysInMonth - 1;
        const remainingCells = totalCells - currentCells;
        
        for (let i = 1; i <= remainingCells; i++) {
            const date = new Date(year, month + 1, i);
            const dateStr = Utils.formatDate(date);
            html += this.createDayElement(dateStr, true);
        }
        
        this.monthGridElement.innerHTML = html;
    },
    
    // Create day element
    createDayElement(dateStr, isOtherMonth, isToday) {
        const bookings = AppData.getBookings();
        const devices = AppData.getDevices();
        
        // Get bookings for this day
        const dayBookings = bookings.filter(b => b.date === dateStr);
        
        // Sort by start time
        dayBookings.sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        // Check for conflicts
        const conflictBookings = dayBookings.filter(b => {
            return bookings.some(other => 
                other.id !== b.id &&
                b.date === other.date &&
                other.devices.some(d1 => b.devices.some(d2 => d2.id === d1.id)) &&
                b.startTime < other.endTime &&
                b.endTime > other.startTime
            );
        });
        
        const hasConflict = conflictBookings.length > 0;
        
        // Build booking chips
        let bookingChipsHtml = '';
        let bookingCount = 0;
        
        for (const booking of dayBookings) {
            if (bookingCount < 2) {
                for (const device of booking.devices) {
                    if (bookingCount < 2) {
                        const deviceObj = devices.find(d => d.id === device.id);
                        if (deviceObj) {
                            const colorClass = AppData.getBookingChipColor(deviceObj.name);
                            bookingChipsHtml += `<span class="booking-chip ${colorClass}" title="${Utils.escapeHtml(deviceObj.name)}">${Utils.escapeHtml(deviceObj.name)}</span>`;
                            bookingCount++;
                        }
                    }
                }
            }
        }
        
        // Overflow marker
        let overflowHtml = '';
        if (dayBookings.length > 2 || bookingCount > 2) {
            const remaining = dayBookings.length - 2;
            overflowHtml = `<span class="overflow-marker">+${remaining}</span>`;
        }
        
        const day = new Date(dateStr).getDate();
        const isPast = dateStr < Utils.getCurrentDate();
        const isDisabled = isPast && AppData.getAuth()?.username !== AppData.OWNER_USERNAME;
        
        const dayClass = `month-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''} ${hasConflict ? 'has-conflict' : ''}`;
        
        // Only add click handler if not disabled and not other month
        const clickHandler = !isDisabled && !isOtherMonth ? `onclick="Calendar.openDayDetail('${dateStr}')"` : '';
        
        return `
            <div class="${dayClass}" data-date="${dateStr}" ${clickHandler}>
                <span class="day-number">${day}</span>
                <div class="booking-chips">
                    ${bookingChipsHtml}
                    ${overflowHtml}
                </div>
                ${hasConflict ? '<span class="conflict-indicator" title="Conflict detected"><i class="fas fa-exclamation-triangle" style="font-size: 8px;"></i></span>' : ''}
            </div>
        `;
    },
    
    // Render week
    renderWeek() {
        const todayInfo = Utils.getTodayInfo();
        const startOfWeek = Utils.getStartOfWeek(this.currentDate);
        const endOfWeek = Utils.getEndOfWeek(startOfWeek);
        
        // Update header
        const startStr = Utils.formatDisplayDate(startOfWeek);
        const endStr = Utils.formatDisplayDate(endOfWeek);
        this.weekRangeElement.textContent = `${startStr} - ${endStr}`;
        
        // Build week grid
        let html = '';
        const bookings = AppData.getBookings();
        const devices = AppData.getDevices();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            const dateStr = Utils.formatDate(date);
            const dayName = Utils.getWeekdayNameShort(date.getDay());
            const day = date.getDate();
            const isToday = dateStr === todayInfo.dateStr;
            const isPast = dateStr < todayInfo.dateStr;
            const isDisabled = isPast && AppData.getAuth()?.username !== AppData.OWNER_USERNAME;
            
            // Get bookings for this day
            const dayBookings = bookings.filter(b => b.date === dateStr);
            dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            // Check for conflicts
            const hasConflict = dayBookings.some(b => {
                return bookings.some(other => 
                    other.id !== b.id &&
                    b.date === other.date &&
                    other.devices.some(d1 => b.devices.some(d2 => d2.id === d1.id)) &&
                    b.startTime < other.endTime &&
                    b.endTime > other.startTime
                );
            });
            
            let bookingsHtml = '';
            if (dayBookings.length === 0) {
                bookingsHtml = '<div class="free-day">Free</div>';
            } else {
                for (const booking of dayBookings) {
                    const timeRange = Utils.formatTimeRange(booking.startTime, booking.endTime);
                    const deviceNames = booking.devices.map(d => 
                        devices.find(device => device.id === d.id)?.name || d.id
                    ).join(', ');
                    
                    // Use first device for color
                    const firstDevice = devices.find(d => d.id === booking.devices[0].id);
                    const colorClass = firstDevice ? AppData.getDeviceColor(firstDevice.name) : 'device-color-0';
                    
                    bookingsHtml += `
                        <div class="booking-item ${hasConflict ? 'conflict' : ''}" data-booking-id="${booking.id}">
                            <div class="color-bar ${colorClass}"></div>
                            <span class="booking-time">${Utils.escapeHtml(timeRange)}</span>
                            <span class="booking-name">${Utils.escapeHtml(deviceNames)}</span>
                        </div>
                    `;
                }
            }
            
            const dayClass = `week-day ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`;
            
            html += `
                <div class="${dayClass}" data-date="${dateStr}" ${isDisabled ? '' : 'onclick="Calendar.openDayDetail(\''+dateStr+'\')"'}>
                    <div class="day-header">
                        <span class="day-name">${dayName}</span>
                        <span class="day-number">${day}</span>
                    </div>
                    <div class="day-bookings">
                        ${bookingsHtml}
                    </div>
                    ${hasConflict ? '<span class="conflict-indicator" title="Conflict detected"><i class="fas fa-exclamation-triangle" style="font-size: 8px;"></i></span>' : ''}
                </div>
            `;
        }
        
        this.weekGridElement.innerHTML = html;
        
        // Re-attach event listeners for non-disabled days
        setTimeout(() => {
            document.querySelectorAll('.week-day:not(.disabled)').forEach(day => {
                day.addEventListener('click', () => {
                    this.openDayDetail(day.dataset.date);
                });
            });
        }, 100);
    },
    
    // Open day detail
    openDayDetail(dateStr) {
        const modal = document.getElementById('day-detail-modal');
        const date = new Date(dateStr);
        const dayName = Utils.getWeekdayName(date.getDay());
        const monthName = Utils.getMonthName(date.getMonth());
        const day = date.getDate();
        const year = date.getFullYear();
        
        document.getElementById('day-detail-date').textContent = `${dayName}, ${monthName} ${day}, ${year}`;
        
        const bookings = AppData.getBookings().filter(b => b.date === dateStr);
        bookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        const devices = AppData.getDevices();
        
        let html = '';
        if (bookings.length === 0) {
            html = '<div class="day-detail-empty"><i class="fas fa-calendar-check"></i><p>No bookings for this day</p></div>';
        } else {
            for (const booking of bookings) {
                const deviceNames = booking.devices.map(d => 
                    devices.find(device => device.id === d.id)?.name || d.id
                );
                
                // Check if this booking has conflicts
                const hasConflict = AppData.getBookings().some(other => 
                    other.id !== booking.id &&
                    booking.date === other.date &&
                    other.devices.some(d1 => booking.devices.some(d2 => d2.id === d1.id)) &&
                    booking.startTime < other.endTime &&
                    booking.endTime > other.startTime
                );
                
                // Use first device for color
                const firstDevice = devices.find(d => d.id === booking.devices[0].id);
                const colorClass = firstDevice ? AppData.getDeviceColor(firstDevice.name) : 'device-color-0';
                
                const deviceChips = deviceNames.map(name => {
                    const chipColor = AppData.getBookingChipColor(name);
                    return `<span class="booking-chip ${chipColor}">${Utils.escapeHtml(name)}</span>`;
                }).join('');
                
                html += `
                    <div class="day-detail-item ${hasConflict ? 'conflict' : ''}" data-booking-id="${booking.id}">
                        <div class="color-bar ${colorClass}"></div>
                        <div class="booking-info">
                            <div class="booking-time">${Utils.formatTimeRange(booking.startTime, booking.endTime)}</div>
                            <div class="booking-devices">${deviceChips}</div>
                            <div class="booking-name">Booked by: ${Utils.escapeHtml(booking.name)}</div>
                        </div>
                        <button class="cancel-btn" onclick="Calendar.cancelBookingFromDay('${booking.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }
        }
        
        document.getElementById('day-detail-body').innerHTML = html;
        
        // Set up add booking button
        document.getElementById('add-booking-from-day').onclick = () => {
            BookingForm.open(dateStr);
            this.closeDayDetail();
        };
        
        modal.style.display = 'flex';
    },
    
    // Close day detail
    closeDayDetail() {
        document.getElementById('day-detail-modal').style.display = 'none';
    },
    
    // Cancel booking from day detail
    cancelBookingFromDay(bookingId) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            AppData.cancelBooking(bookingId);
            this.closeDayDetail();
        }
    },
    
    // Setup day click handlers
    setupDayClickHandlers() {
        // Month view days
        document.querySelectorAll('.month-day:not(.disabled)').forEach(day => {
            day.addEventListener('click', () => {
                this.openDayDetail(day.dataset.date);
            });
        });
        
        // Week view days
        document.querySelectorAll('.week-day').forEach(day => {
            day.addEventListener('click', () => {
                this.openDayDetail(day.dataset.date);
            });
        });
    }
};

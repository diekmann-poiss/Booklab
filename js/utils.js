// ===== Utility Functions =====
const Utils = {
    // Format date
    formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    // Format date for display
    formatDisplayDate(dateStr) {
        const date = new Date(dateStr);
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },
    
    // Format date as "Weekday, Date"
    formatShortDate(dateStr) {
        const date = new Date(dateStr);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },
    
    // Format time
    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    },
    
    // Format time range
    formatTimeRange(start, end) {
        return `${this.formatTime(start)} - ${this.formatTime(end)}`;
    },
    
    // Check if two date strings are the same day
    isSameDay(date1, date2) {
        return date1 === date2;
    },
    
    // Get current date as YYYY-MM-DD
    getCurrentDate() {
        return this.formatDate(new Date());
    },
    
    // Get current time as HH:MM
    getCurrentTime() {
        const d = new Date();
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    },
    
    // Get days in a month
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    },
    
    // Get today's date info
    getTodayInfo() {
        const today = new Date();
        return {
            year: today.getFullYear(),
            month: today.getMonth(),
            day: today.getDate(),
            dateStr: this.formatDate(today)
        };
    },
    
    // Get month name
    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    },
    
    // Get month name short
    getMonthNameShort(month) {
        return this.getMonthName(month).substring(0, 3);
    },
    
    // Get weekday name
    getWeekdayName(weekday) {
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return weekdays[weekday];
    },
    
    // Get weekday name short
    getWeekdayNameShort(weekday) {
        return this.getWeekdayName(weekday).substring(0, 3);
    },
    
    // Add months to a date
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    },
    
    // Add weeks to a date
    addWeeks(date, weeks) {
        const d = new Date(date);
        d.setDate(d.getDate() + weeks * 7);
        return d;
    },
    
    // Add days to a date
    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    },
    
    // Get start of week (Monday)
    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        d.setDate(diff);
        return d;
    },
    
    // Get end of week (Sunday)
    getEndOfWeek(date) {
        const start = this.getStartOfWeek(date);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return end;
    },
    
    // Check if date is today
    isToday(dateStr) {
        return dateStr === this.getCurrentDate();
    },
    
    // Check if date is in the past
    isPast(dateStr) {
        return dateStr < this.getCurrentDate();
    },
    
    // Check if date is in the future
    isFuture(dateStr) {
        return dateStr > this.getCurrentDate();
    },
    
    // Compare dates
    compareDates(date1, date2) {
        if (date1 < date2) return -1;
        if (date1 > date2) return 1;
        return 0;
    },
    
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Truncate text
    truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },
    
    // Download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Format file name with date
    formatFilename(prefix, extension) {
        const date = this.getCurrentDate().replace(/-/g, '');
        return `${prefix}-${date}.${extension}`;
    },
    
    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // Scroll to element
    scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },
    
    // Parse time string to minutes
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },
    
    // Check if time range is valid (end > start)
    isValidTimeRange(start, end) {
        return this.timeToMinutes(end) > this.timeToMinutes(start);
    }
};

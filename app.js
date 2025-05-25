
Vue.config.productionTip = false;


new Vue({
    el: '#app',
    data: {
        currentDate: new Date(),
        selectedDate: null,
        keyboardFocusedDate: null,
        weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        months: [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ],
        events: {},
        newEvent: {
            title: '',
            time: '12:00'
        },

        searchQuery: '',
        showSearchResults: false,

        showConfirmModal: false,
        pendingAction: null,
        pendingActionParams: null,

        draggedEventIndex: null,
        draggedEventDate: null,
        draggingOverDate: null,

        showKeyboardShortcuts: false,

        hasUnsavedChanges: false,

        darkTheme: false
    },
    
    computed: {

        currentMonth() {
            return this.currentDate.getMonth();
        },
        
        currentYear() {
            return this.currentDate.getFullYear();
        },
        

        currentMonthName() {
            return this.months[this.currentMonth];
        },
        

        filteredEvents() {
            if (!this.searchQuery.trim()) {
                return [];
            }
            
            const query = this.searchQuery.toLowerCase().trim();
            const result = [];
            

            for (const dateKey in this.events) {
                const dateEvents = this.events[dateKey];
                const dateParts = dateKey.split('-');
                const eventDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                

                const matchingEvents = dateEvents.filter(event => {
                    return event.title.toLowerCase().includes(query) || 
                           event.time.toLowerCase().includes(query);
                });
                

                matchingEvents.forEach(event => {
                    result.push({
                        ...event,
                        date: eventDate
                    });
                });
            }
            

            return result.sort((a, b) => {

                const dateCompare = a.date.getTime() - b.date.getTime();
                if (dateCompare !== 0) return dateCompare;
                

                return a.time.localeCompare(b.time);
            });
        },
        
        calendarDays() {
            const days = [];
            
            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            
            let firstDayIndex = firstDay.getDay() - 1;
            if (firstDayIndex < 0) firstDayIndex = 6;  
            
            const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
            const daysInMonth = lastDay.getDate();
            
            const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
            
            const today = new Date();
            const isCurrentMonth = today.getMonth() === this.currentMonth && 
                                   today.getFullYear() === this.currentYear;
            const todayDate = today.getDate();
            
            for (let i = 0; i < firstDayIndex; i++) {
                const day = prevMonthLastDay - firstDayIndex + i + 1;
                const date = new Date(this.currentYear, this.currentMonth - 1, day);
                days.push({
                    date: date,
                    dayNumber: day,
                    currentMonth: false,
                    isToday: false
                });
            }
            
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(this.currentYear, this.currentMonth, i);
                days.push({
                    date: date,
                    dayNumber: i,
                    currentMonth: true,
                    isToday: isCurrentMonth && i === todayDate
                });
            }
            
            const remainingDays = 42 - days.length;  
            
            for (let i = 1; i <= remainingDays; i++) {
                const date = new Date(this.currentYear, this.currentMonth + 1, i);
                days.push({
                    date: date,
                    dayNumber: i,
                    currentMonth: false,
                    isToday: false
                });
            }
            
            return days;
        },
        
        formatSelectedDate() {
            if (!this.selectedDate) return '';
            
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            
            return this.selectedDate.toLocaleDateString('ru-RU', options);
        },
        
        eventsForSelectedDate() {
            if (!this.selectedDate) return [];
            
            const dateKey = this.formatDateKey(this.selectedDate);
            return this.events[dateKey] || [];
        }
    },
    
    methods: {

        toggleTheme() {
            this.darkTheme = !this.darkTheme;
            if (this.darkTheme) {
                document.documentElement.classList.add('dark-theme');
            } else {
                document.documentElement.classList.remove('dark-theme');
            }
            localStorage.setItem('darkTheme', this.darkTheme.toString());
            console.log('Theme toggled:', this.darkTheme ? 'dark' : 'light');
        },
        
        loadThemeSettings() {
            const savedTheme = localStorage.getItem('darkTheme');
            console.log('Loaded theme from localStorage:', savedTheme);
            if (savedTheme !== null) {
                this.darkTheme = savedTheme === 'true';
                if (this.darkTheme) {
                    document.documentElement.classList.add('dark-theme');
                } else {
                    document.documentElement.classList.remove('dark-theme');
                }
            } else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    this.darkTheme = true;
                    document.documentElement.classList.add('dark-theme');
                }
            }
        },
        

        previousMonth() {
            this.currentDate = new Date(this.currentYear, this.currentMonth - 1, 1);
            this.keyboardFocusedDate = new Date(this.currentYear, this.currentMonth, 1);
        },
        
        nextMonth() {
            this.currentDate = new Date(this.currentYear, this.currentMonth + 1, 1);
            this.keyboardFocusedDate = new Date(this.currentYear, this.currentMonth, 1);
        },
        
        previousYear() {
            this.currentDate = new Date(this.currentYear - 1, this.currentMonth, 1);
            this.keyboardFocusedDate = new Date(this.currentYear, this.currentMonth, 1);
        },
        
        nextYear() {
            this.currentDate = new Date(this.currentYear + 1, this.currentMonth, 1);
            this.keyboardFocusedDate = new Date(this.currentYear, this.currentMonth, 1);
        },
        

        handleKeyDown(event) {
            if (this.showConfirmModal && event.key === 'Escape') {
                this.cancelAction();
                return;
            }
            if (document.activeElement.tagName === 'INPUT') {
                return;
            }
            switch (event.key) {
                case 'ArrowLeft': this.previousMonth(); break;
                case 'ArrowRight': this.nextMonth(); break;
                case 'ArrowUp': this.previousYear(); break;
                case 'ArrowDown': this.nextYear(); break;
                case 'Enter':
                    if (this.keyboardFocusedDate) {
                        this.selectDate(this.keyboardFocusedDate);
                    }
                    break;
                case 'Escape':
                    this.showSearchResults = false;
                    break;
                case '?':
                    this.showKeyboardShortcuts = !this.showKeyboardShortcuts;
                    break;
            }
        },
        
        selectDate(date) {
            if (this.hasUnsavedChanges && this.newEvent.title) {
                this.pendingAction = 'selectDate';
                this.pendingActionParams = date;
                this.showConfirmModal = true;
                return;
            }
            this.selectedDate = new Date(date);
            this.keyboardFocusedDate = new Date(date);
            this.newEvent.title = '';
            this.newEvent.time = '12:00';
            this.hasUnsavedChanges = false;
        },
        
        isKeyboardFocused(date) {
            if (!this.keyboardFocusedDate) return false;
            return date.getDate() === this.keyboardFocusedDate.getDate() &&
                   date.getMonth() === this.keyboardFocusedDate.getMonth() &&
                   date.getFullYear() === this.keyboardFocusedDate.getFullYear();
        },
        

        formatDateForSearch(date) {
            const options = { day: 'numeric', month: 'long' };
            return date.toLocaleDateString('ru-RU', options);
        },
        

        selectSearchResult(event) {
            this.selectDate(event.date);
            this.searchQuery = '';
            this.showSearchResults = false;
        },
        

        confirmAction() {
            if (this.pendingAction === 'selectDate') {
                this.selectedDate = new Date(this.pendingActionParams);
                this.keyboardFocusedDate = new Date(this.pendingActionParams);
                this.newEvent.title = '';
                this.newEvent.time = '12:00';
            }
            this.hasUnsavedChanges = false;
            this.showConfirmModal = false;
            this.pendingAction = null;
            this.pendingActionParams = null;
        },
        
        cancelAction() {
            this.showConfirmModal = false;
            this.pendingAction = null;
            this.pendingActionParams = null;
        },
        
        isSelected(date) {
            if (!this.selectedDate) return false;
            return date.getDate() === this.selectedDate.getDate() &&
                   date.getMonth() === this.selectedDate.getMonth() &&
                   date.getFullYear() === this.selectedDate.getFullYear();
        },
        
        formatDateKey(date) {
            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        },
        
        hasEvents(date) {
            const dateKey = this.formatDateKey(date);
            return this.events[dateKey] && this.events[dateKey].length > 0;
        },
        
        addEvent() {
            if (!this.newEvent.title) return;
            const dateKey = this.formatDateKey(this.selectedDate);
            if (!this.events[dateKey]) {
                this.$set(this.events, dateKey, []);
            }
            this.events[dateKey].push({
                title: this.newEvent.title,
                time: this.newEvent.time || '12:00'
            });
            this.events[dateKey].sort((a, b) => a.time.localeCompare(b.time));
            this.newEvent.title = '';
            this.newEvent.time = '12:00';
            this.hasUnsavedChanges = false;
            this.saveEvents();
            this.$nextTick(() => {
                if (this.$refs.eventTitleInput) {
                    this.$refs.eventTitleInput.focus();
                }
            });
        },
        
        removeEvent(index) {
            const dateKey = this.formatDateKey(this.selectedDate);
            this.events[dateKey].splice(index, 1);
            if (this.events[dateKey].length === 0) {
                this.$delete(this.events, dateKey);
            }
            this.saveEvents();
        },
        
        saveEvents() {
            localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        },
        
        loadEvents() {
            const savedEvents = localStorage.getItem('calendarEvents');
            if (savedEvents) {
                this.events = JSON.parse(savedEvents);
            }
        },
        

        handleDragStart(event, index) {
            this.draggedEventIndex = index;
            this.draggedEventDate = new Date(this.selectedDate);
            event.target.classList.add('dragging');
            

            const eventData = this.eventsForSelectedDate[index];
            event.dataTransfer.setData('text/plain', JSON.stringify(eventData));
            event.dataTransfer.effectAllowed = 'move';
        },
        
        handleDragOver(event, date) {
            event.preventDefault();
            this.draggingOverDate = date;
        },
        
        handleDragLeave() {
            this.draggingOverDate = null;
        },
        
        handleDragEnd() {
            document.querySelectorAll('.event-item').forEach(item => {
                item.classList.remove('dragging');
            });
            this.draggedEventIndex = null;
            this.draggedEventDate = null;
            this.draggingOverDate = null;
        },
        
        handleDrop(event, targetDate) {
            event.preventDefault();
            event.stopPropagation();
            
            if (this.draggedEventIndex === null || this.draggedEventDate === null) {
                this.handleDragEnd();
                return;
            }
            

            if (!(targetDate instanceof Date)) {
                console.error("targetDate is not a Date object:", targetDate);
                this.handleDragEnd();
                return;
            }
            

            if (!(this.draggedEventDate instanceof Date)) {
                console.error("draggedEventDate is not a Date object:", this.draggedEventDate);
                this.handleDragEnd();
                return;
            }
            

            if (targetDate.getTime() === this.draggedEventDate.getTime()) {

                const eventItems = Array.from(document.querySelectorAll('.event-item'));
                const draggedItem = document.querySelector('.event-item.dragging');
                if (draggedItem) {

                    const newIndex = eventItems.indexOf(draggedItem);
                    

                    if (newIndex !== -1 && newIndex !== this.draggedEventIndex) {
                        const dateKey = this.formatDateKey(this.selectedDate);
                        const event = {...this.events[dateKey][this.draggedEventIndex]};
                        this.events[dateKey].splice(this.draggedEventIndex, 1);
                        this.events[dateKey].splice(newIndex, 0, event);
                        this.saveEvents();
                    }
                }
                this.handleDragEnd();
                return;
            }
            

            const sourceKey = this.formatDateKey(this.draggedEventDate);
            const targetKey = this.formatDateKey(targetDate);
            
            if (!this.events[sourceKey] || !this.events[sourceKey][this.draggedEventIndex]) {
                console.error("Source event not found for dragging.");
                this.handleDragEnd();
                return;
            }
            
            const eventToMove = {...this.events[sourceKey][this.draggedEventIndex]};
            
            this.events[sourceKey].splice(this.draggedEventIndex, 1);
            if (this.events[sourceKey].length === 0) {
                this.$delete(this.events, sourceKey);
            }
            
            if (!this.events[targetKey]) {
                this.$set(this.events, targetKey, []);
            }
            this.events[targetKey].push(eventToMove);
            this.events[targetKey].sort((a, b) => a.time.localeCompare(b.time));
            
            this.saveEvents();
            this.selectDate(targetDate);
            this.handleDragEnd();
        },
        

        isDraggingOver(date) {
            if (!this.draggingOverDate) return false;
            

            if (!(date instanceof Date)) return false;
            

            if (!(this.draggingOverDate instanceof Date)) return false;
            
            return date.getDate() === this.draggingOverDate.getDate() &&
                   date.getMonth() === this.draggingOverDate.getMonth() &&
                   date.getFullYear() === this.draggingOverDate.getFullYear();
        }
    },
    
    created() {

        this.loadEvents();
        

        this.selectedDate = new Date();
        this.keyboardFocusedDate = new Date();
        

        this.loadThemeSettings();
    },
    
    mounted() {

        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
        

        this.$refs.appRoot.focus();
    },
    
    beforeDestroy() {

        window.removeEventListener('beforeunload');
    }
});

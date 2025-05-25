<template>
  <div id="app">
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="header-controls">
          <button @click="previousYear" class="year-button">&lt;&lt;</button>
          <button @click="previousMonth" class="month-button">&lt;</button>
        </div>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <div class="header-controls">
          <button @click="nextMonth" class="month-button">&gt;</button>
          <button @click="nextYear" class="year-button">&gt;&gt;</button>
        </div>
      </div>
      <div class="weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="calendar-days">
        <div 
          v-for="day in calendarDays" 
          :key="day.date" 
          class="calendar-day" 
          :class="{ 
            'current-month': day.currentMonth, 
            'other-month': !day.currentMonth,
            'today': day.isToday,
            'selected': isSelected(day.date)
          }"
          @click="selectDate(day.date)"
        >
          {{ day.dayNumber }}
          <div v-if="hasEvents(day.date)" class="event-indicator"></div>
        </div>
      </div>
    </div>
    
    <div class="events-panel" v-if="selectedDate">
      <h3>Events for {{ formatSelectedDate }}</h3>
      <div v-if="eventsForSelectedDate.length === 0" class="no-events">
        No events for this date
      </div>
      <div v-else class="events-list">
        <div v-for="(event, index) in eventsForSelectedDate" :key="index" class="event-item">
          <div class="event-time">{{ event.time }}</div>
          <div class="event-title">{{ event.title }}</div>
          <button @click="removeEvent(index)" class="delete-btn">×</button>
        </div>
      </div>
      <div class="add-event">
        <input v-model="newEvent.title" placeholder="Event title" />
        <input v-model="newEvent.time" type="time" />
        <button @click="addEvent" :disabled="!newEvent.title">Add Event</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      // Информация о текущей дате
      currentDate: new Date(),
      selectedDate: null,
      
      // Данные календаря
      weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      
      // Хранилище событий
      events: {},
      
      // Данные формы нового события
      newEvent: {
        title: '',
        time: ''
      }
    }
  },
  
  computed: {
    /**
     * Получить текущий месяц в виде числа (0-11)
     */
    currentMonth() {
      return this.currentDate.getMonth();
    },
    
    /**
     * Получить текущий год
     */
    currentYear() {
      return this.currentDate.getFullYear();
    },
    
    /**
     * Получить название текущего месяца
     */
    currentMonthName() {
      return new Date(this.currentYear, this.currentMonth, 1)
        .toLocaleString('default', { month: 'long' });
    },
    
    /**
     * Вычислить все дни, которые будут отображаться в сетке календаря
     * Включая дни из предыдущего и следующего месяцев для заполнения сетки
     */
    calendarDays() {
      const days = [];
      
      // Получить первый день месяца
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      
      // Получить день недели для первого дня (0 = Воскресенье, 1 = Понедельник и т.д.)
      // Преобразовать в индекс, где понедельник = 0, воскресенье = 6
      let firstDayIndex = firstDay.getDay() - 1;
      if (firstDayIndex < 0) firstDayIndex = 6; // Воскресенье становится 6
      
      // Получить последний день месяца
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      // Получить последний день предыдущего месяца
      const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
      
      // Получить сегодняшнюю дату для выделения
      const today = new Date();
      const isCurrentMonth = today.getMonth() === this.currentMonth && 
                            today.getFullYear() === this.currentYear;
      const todayDate = today.getDate();
      
      // Добавить дни из предыдущего месяца
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
      
      // Добавить дни текущего месяца
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(this.currentYear, this.currentMonth, i);
        days.push({
          date: date,
          dayNumber: i,
          currentMonth: true,
          isToday: isCurrentMonth && i === todayDate
        });
      }
      
      // Вычислить, сколько дней нам нужно из следующего месяца
      const remainingDays = 42 - days.length; // 6 рядов по 7 дней
      
      // Добавить дни из следующего месяца
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
    
    /**
     * Форматировать выбранную дату для отображения
     */
    formatSelectedDate() {
      if (!this.selectedDate) return '';
      
      return this.selectedDate.toLocaleDateString('default', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    /**
     * Получить события для выбранной даты
     */
    eventsForSelectedDate() {
      if (!this.selectedDate) return [];
      
      const dateKey = this.formatDateKey(this.selectedDate);
      return this.events[dateKey] || [];
    }
  },
  
  methods: {
    
    /**
     * Перейти к предыдущему месяцу
     */
    previousMonth() {
      this.currentDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    },
    
    /**
     * Перейти к следующему месяцу
     */
    nextMonth() {
      this.currentDate = new Date(this.currentYear, this.currentMonth + 1, 1);
    },
    
    /**
     * Перейти к предыдущему году
     */
    previousYear() {
      this.currentDate = new Date(this.currentYear - 1, this.currentMonth, 1);
    },
    
    /**
     * Перейти к следующему году
     */
    nextYear() {
      this.currentDate = new Date(this.currentYear + 1, this.currentMonth, 1);
    },
    
    /**
     * Перейти к предыдущему году
     */
    previousYear() {
      this.currentDate = new Date(this.currentYear - 1, this.currentMonth, 1);
    },
    
    /**
     * Перейти к следующему году
     */
    nextYear() {
      this.currentDate = new Date(this.currentYear + 1, this.currentMonth, 1);
    },
    
    /**
     * Выбрать дату для просмотра/редактирования событий
     */
    selectDate(date) {
      this.selectedDate = new Date(date);
      this.newEvent.title = '';
      this.newEvent.time = '';
    },
    
    /**
     * Проверить, является ли дата текущей выбранной датой
     */
    isSelected(date) {
      if (!this.selectedDate) return false;
      
      return date.getDate() === this.selectedDate.getDate() &&
              date.getMonth() === this.selectedDate.getMonth() &&
              date.getFullYear() === this.selectedDate.getFullYear();
    },
    
    /**
     * Форматировать дату как ключ для объекта событий
     */
    formatDateKey(date) {
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },
    
    /**
     * Проверить, есть ли у даты события
     */
    hasEvents(date) {
      const dateKey = this.formatDateKey(date);
      return this.events[dateKey] && this.events[dateKey].length > 0;
    },
    
    /**
     * Добавить новое событие к выбранной дате
     */
    addEvent() {
      if (!this.newEvent.title) return;
      
      const dateKey = this.formatDateKey(this.selectedDate);
      
      if (!this.events[dateKey]) {
        this.$set(this.events, dateKey, []);
      }
      
      this.events[dateKey].push({
        title: this.newEvent.title,
        time: this.newEvent.time || '00:00'
      });
      
      // Сортировать события по времени
      this.events[dateKey].sort((a, b) => a.time.localeCompare(b.time));
      
      // Сбросить форму
      this.newEvent.title = '';
      this.newEvent.time = '';
      
      // Сохранить в localStorage
      this.saveEvents();
    },
    
    /**
     * Удалить событие из выбранной даты
     */
    removeEvent(index) {
      const dateKey = this.formatDateKey(this.selectedDate);
      this.events[dateKey].splice(index, 1);
      
      // Если для этой даты не осталось событий, удалить ключ даты
      if (this.events[dateKey].length === 0) {
        this.$delete(this.events, dateKey);
      }
      
      // Сохранить в localStorage
      this.saveEvents();
    },
    
    /**
     * Сохранить события в localStorage
     */
    saveEvents() {
      localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    },
    
    /**
     * Загрузить события из localStorage
     */
    loadEvents() {
      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      }
    }
  },
  
  // Инициализация компонента
  created() {
    // Загрузить сохраненные события
    this.loadEvents();
    
    // Установить сегодняшний день как выбранную дату по умолчанию
    this.selectedDate = new Date();
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Arial', sans-serif;
}

body {
  background-color: #f5f5f5;
  padding: 20px;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.calendar-container {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  flex: 1;
  min-width: 320px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-controls {
  display: flex;
  gap: 5px;
}

.calendar-header button {
  background-color: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.calendar-header button:hover {
  background-color: #f0f0f0;
}

.year-button {
  color: #1890ff;
  font-weight: bold;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
}

.weekday {
  text-align: center;
  font-weight: bold;
  padding: 10px;
  color: #555;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.calendar-day:hover {
  background-color: #f0f0f0;
}

.other-month {
  color: #ccc;
}

.today {
  background-color: #e6f7ff;
  font-weight: bold;
}

.selected {
  background-color: #1890ff;
  color: white;
}

.selected:hover {
  background-color: #40a9ff;
}

.event-indicator {
  width: 5px;
  height: 5px;
  background-color: #ff4d4f;
  border-radius: 50%;
  position: absolute;
  bottom: 5px;
}

.events-panel {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  flex: 1;
  min-width: 300px;
}

.events-panel h3 {
  margin-bottom: 15px;
  color: #333;
}

.no-events {
  color: #999;
  font-style: italic;
  margin: 20px 0;
}

.events-list {
  margin-bottom: 20px;
}

.event-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 5px;
  background-color: #f9f9f9;
}

.event-time {
  font-weight: bold;
  margin-right: 10px;
  color: #1890ff;
  min-width: 70px;
}

.event-title {
  flex: 1;
}

.delete-btn {
  background-color: transparent;
  border: none;
  color: #ff4d4f;
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
}

.add-event {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.add-event input {
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.add-event input[type="time"] {
  width: 120px;
}

.add-event input[placeholder="Event title"] {
  flex: 1;
}

.add-event button {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-event button:hover {
  background-color: #40a9ff;
}

.add-event button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  #app {
    flex-direction: column;
  }
  
  .calendar-container, .events-panel {
    width: 100%;
  }
}
</style>

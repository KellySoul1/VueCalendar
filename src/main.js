import Vue from 'vue'
import App from './App.vue'

// Отключаем сообщения о продакшн режиме
Vue.config.productionTip = false

// Создаем и монтируем корневой экземпляр Vue
new Vue({
  render: h => h(App),
}).$mount('#app')

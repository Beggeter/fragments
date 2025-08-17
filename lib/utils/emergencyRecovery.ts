// lib/utils/emergencyRecovery.ts
// ✅ Система экстренного восстановления при зависаниях UI

export interface RecoveryOptions {
  timeout?: number;
  maxAttempts?: number;
  forceReload?: boolean;
}

class EmergencyRecovery {
  private isRecovering = false;
  private recoveryAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;
  private lastInteractionTime = Date.now();
  private watchdog: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
    this.startWatchdog();
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Отслеживаем активность пользователя
    const updateLastInteraction = () => {
      this.lastInteractionTime = Date.now();
    };

    ['click', 'touch', 'keydown', 'scroll'].forEach(event => {
      document.addEventListener(event, updateLastInteraction, { passive: true });
    });

    // Обработка необработанных ошибок
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
  }

  private startWatchdog() {
    if (this.watchdog) {
      clearInterval(this.watchdog);
    }

    this.watchdog = setInterval(() => {
      this.checkForUIFreeze();
    }, 5000); // Проверяем каждые 5 секунд
  }

  private checkForUIFreeze() {
    const now = Date.now();
    const timeSinceInteraction = now - this.lastInteractionTime;
    
    // Если UI не отвечает больше 15 секунд
    if (timeSinceInteraction > 15000) {
      console.warn('⚠️ UI freeze detected, attempting recovery...');
      this.attemptRecovery();
    }
  }

  private handleError(event: ErrorEvent) {
    console.error('💥 Window error detected:', event.error);
    this.attemptRecovery({ timeout: 2000 });
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    console.error('💥 Unhandled promise rejection:', event.reason);
    this.attemptRecovery({ timeout: 2000 });
  }

  public attemptRecovery(options: RecoveryOptions = {}) {
    if (this.isRecovering) {
      console.log('🔄 Recovery already in progress...');
      return;
    }

    if (this.recoveryAttempts >= (options.maxAttempts || this.MAX_ATTEMPTS)) {
      console.error('💀 Max recovery attempts reached, forcing reload...');
      this.forceReload();
      return;
    }

    this.isRecovering = true;
    this.recoveryAttempts++;

    console.log(`🚑 Emergency recovery attempt ${this.recoveryAttempts}/${options.maxAttempts || this.MAX_ATTEMPTS}`);

    try {
      this.clearUIBlocks();
      this.resetEventHandlers();
      this.cleanupResources();
      
      // Показываем уведомление пользователю
      this.showRecoveryNotification();

      setTimeout(() => {
        this.isRecovering = false;
        this.lastInteractionTime = Date.now();
        console.log('✅ Recovery attempt completed');
      }, options.timeout || 3000);

    } catch (error) {
      console.error('❌ Recovery failed:', error);
      this.isRecovering = false;
      
      if (options.forceReload) {
        this.forceReload();
      }
    }
  }

  private clearUIBlocks() {
    // Убираем все pointer-events блокировки
    document.body.style.pointerEvents = '';
    
    // Удаляем overlay элементы, которые могут блокировать UI
    const overlays = document.querySelectorAll('[data-overlay], .pointer-events-none');
    overlays.forEach(overlay => {
      const element = overlay as HTMLElement;
      element.style.pointerEvents = 'none';
    });

    // Принудительно включаем взаимодействие
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  }

  private resetEventHandlers() {
    // Очищаем зависшие таймеры (только в браузерной среде)
    if (typeof window !== 'undefined') {
      const testTimeout = setTimeout(() => {}, 0);
      clearTimeout(testTimeout);
      
      // В браузере ID таймеров - числа, очищаем последние N таймеров
      if (typeof testTimeout === 'number') {
        const maxId = Math.min(testTimeout, 1000); // Ограничиваем для безопасности
        for (let i = Math.max(0, testTimeout - 100); i <= maxId; i++) {
          clearTimeout(i);
        }
      }

      // Аналогично для интервалов
      const testInterval = setInterval(() => {}, 0);
      clearInterval(testInterval);
      
      if (typeof testInterval === 'number') {
        const maxId = Math.min(testInterval, 1000);
        for (let i = Math.max(0, testInterval - 100); i <= maxId; i++) {
          clearInterval(i);
        }
      }
    }
  }

  private cleanupResources() {
    // Принудительная сборка мусора если доступна
    if ((window as any).gc) {
      (window as any).gc();
    }

    // Очистка localStorage от временных данных
    const tempKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('temp_') || key.includes('_cache_')
    );
    
    tempKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove temp key:', key);
      }
    });
  }

  private showRecoveryNotification() {
    if (typeof window === 'undefined') return;

    // Создаем уведомление о восстановлении
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      pointer-events: none;
    `;
    notification.textContent = '🚑 Восстановление интерфейса...';
    
    document.body.appendChild(notification);

    // Удаляем через 3 секунды
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  private forceReload() {
    console.log('🔄 Force reloading application...');
    
    // Сохраняем флаг принудительной перезагрузки
    try {
      localStorage.setItem('emergency_reload', Date.now().toString());
    } catch (error) {
      console.warn('Failed to set emergency reload flag');
    }

    // Перезагружаем страницу
    window.location.reload();
  }

  public isEmergencyReload(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const emergencyReload = localStorage.getItem('emergency_reload');
      if (emergencyReload) {
        const reloadTime = parseInt(emergencyReload);
        const timeSinceReload = Date.now() - reloadTime;
        
        // Если перезагрузка была меньше минуты назад
        if (timeSinceReload < 60000) {
          localStorage.removeItem('emergency_reload');
          return true;
        } else {
          localStorage.removeItem('emergency_reload');
        }
      }
    } catch (error) {
      console.warn('Failed to check emergency reload flag');
    }
    
    return false;
  }

  public resetRecoveryAttempts() {
    this.recoveryAttempts = 0;
    this.lastInteractionTime = Date.now();
  }

  public destroy() {
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = null;
    }
  }
}

// Глобальный экземпляр системы восстановления
export const emergencyRecovery = new EmergencyRecovery();

// Экспорт для ручного использования
export function manualRecovery(options?: RecoveryOptions) {
  emergencyRecovery.attemptRecovery(options);
}

// Проверка экстренной перезагрузки при запуске
export function checkEmergencyReload(): boolean {
  return emergencyRecovery.isEmergencyReload();
}

export default emergencyRecovery;

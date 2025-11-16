interface ErrorLog {
  timestamp: string;
  type: 'upload' | 'database' | 'network' | 'camera' | 'other';
  message: string;
  device?: {
    userAgent: string;
    platform: string;
    screenSize: string;
  };
  stack?: string;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 100;

  logError(
    type: ErrorLog['type'],
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
      },
      stack: error?.stack,
      metadata,
    };

    this.errors.push(errorLog);
    
    // Garder seulement les dernières erreurs
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Logger dans la console
    console.error(`[${type}] ${message}`, {
      error,
      metadata,
      device: errorLog.device,
    });

    // Sauvegarder dans localStorage pour persistance
    this.saveToStorage();
  }

  getErrors(type?: ErrorLog['type']): ErrorLog[] {
    if (type) {
      return this.errors.filter(e => e.type === type);
    }
    return this.errors;
  }

  getErrorStats() {
    const stats: Record<string, number> = {};
    this.errors.forEach(error => {
      stats[error.type] = (stats[error.type] || 0) + 1;
    });
    return stats;
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('error_logs');
  }

  private saveToStorage() {
    try {
      localStorage.setItem('error_logs', JSON.stringify(this.errors));
    } catch (e) {
      console.error('Failed to save errors to storage:', e);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('error_logs');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load errors from storage:', e);
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}

export const errorTracker = new ErrorTracker();

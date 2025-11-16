interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100;
  private activeMarks = new Map<string, number>();
  private activeMetadata = new Map<string, Record<string, any>>();

  startMeasure(name: string, metadata?: Record<string, any>) {
    const startTime = performance.now();
    this.activeMarks.set(name, startTime);
    
    if (metadata) {
      this.activeMetadata.set(name, metadata);
    }
  }

  endMeasure(name: string) {
    const startTime = this.activeMarks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    const metadata = this.activeMetadata.get(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.metrics.push(metric);

    // Garder seulement les dernières métriques
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Nettoyer les marks
    this.activeMarks.delete(name);
    this.activeMetadata.delete(name);

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metadata);

    return duration;
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getAverageDuration(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  getStats() {
    const stats: Record<string, { count: number; avg: number; min: number; max: number }> = {};

    this.metrics.forEach(metric => {
      if (!stats[metric.name]) {
        stats[metric.name] = { count: 0, avg: 0, min: Infinity, max: 0 };
      }

      const stat = stats[metric.name];
      stat.count++;
      stat.min = Math.min(stat.min, metric.duration);
      stat.max = Math.max(stat.max, metric.duration);
    });

    // Calculer les moyennes
    Object.keys(stats).forEach(name => {
      const filtered = this.metrics.filter(m => m.name === name);
      const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
      stats[name].avg = sum / filtered.length;
    });

    return stats;
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Mesure automatique pour les opérations async
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.startMeasure(name, metadata);
    try {
      const result = await fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

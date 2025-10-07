interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
  url?: string;
  userAgent?: string;
}

interface SpecificationUsageEvent extends AnalyticsEvent {
  event: 'specification_field_used';
  properties: {
    field_name: string;
    field_value: string;
    budget_id?: number;
    form_step: 'production_specifications';
  };
}

interface SpecificationCompletionEvent extends AnalyticsEvent {
  event: 'specification_section_completed';
  properties: {
    fields_filled: number;
    field_names: string[];
    completion_time: number;
    total_specification_fields: number;
  };
}

interface ValidationErrorEvent extends AnalyticsEvent {
  event: 'specification_validation_error';
  properties: {
    field_name: string;
    error_message: string;
    validation_rule: string;
  };
}

interface FormAbandonmentEvent extends AnalyticsEvent {
  event: 'budget_form_abandoned';
  properties: {
    abandonment_step: string;
    fields_filled: string[];
    total_fields: number;
    time_spent: number;
  };
}

class SpecificationAnalytics {
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.isEnabled = this.isAnalyticsEnabled();

    if (this.isEnabled) {
      this.startFlushTimer();
      this.trackSessionStart();
    }
  }

  private generateSessionId(): string {
    let sessionId = '';

    if (typeof window !== 'undefined') {
      sessionId = sessionStorage.getItem('analytics_session_id') || '';

      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
    }

    return sessionId;
  }

  private getUserId(): string | undefined {
    // This would typically come from your auth context
    // For now, return undefined - you can integrate with your auth system
    return undefined;
  }

  private isAnalyticsEnabled(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if analytics is enabled via environment variable or feature flag
    const envEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
    const featureFlagEnabled = false; // Would come from your feature flag system

    return envEnabled && featureFlagEnabled;
  }

  private startFlushTimer(): void {
    if (typeof window === 'undefined') return;

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private trackSessionStart(): void {
    this.track('session_start', {
      timestamp: Date.now(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }

  private createBaseEvent(event: string, properties: Record<string, any> = {}): AnalyticsEvent {
    return {
      event,
      properties,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };
  }

  track(event: string, properties: Record<string, any> = {}): void {
    if (!this.isEnabled) return;

    const analyticsEvent = this.createBaseEvent(event, properties);
    this.eventQueue.push(analyticsEvent);

    // Flush immediately for critical events
    if (this.isCriticalEvent(event)) {
      this.flushEvents();
    }
  }

  trackSpecificationFieldUsed(fieldName: string, value: string, budgetId?: number): void {
    if (!this.isEnabled) return;

    const event: SpecificationUsageEvent = {
      ...this.createBaseEvent('specification_field_used'),
      properties: {
        field_name: fieldName,
        field_value: value,
        budget_id: budgetId,
        form_step: 'production_specifications',
      },
    };

    this.eventQueue.push(event);
  }

  trackSpecificationSectionCompleted(
    specifications: Record<string, string>,
    startTime: number
  ): void {
    if (!this.isEnabled) return;

    const fieldNames = Object.keys(specifications);
    const filledFields = fieldNames.filter(name => specifications[name]);

    const event: SpecificationCompletionEvent = {
      ...this.createBaseEvent('specification_section_completed'),
      properties: {
        fields_filled: filledFields.length,
        field_names: filledFields,
        completion_time: Date.now() - startTime,
        total_specification_fields: fieldNames.length,
      },
    };

    this.eventQueue.push(event);
  }

  trackValidationError(fieldName: string, errorMessage: string, validationRule?: string): void {
    if (!this.isEnabled) return;

    const event: ValidationErrorEvent = {
      ...this.createBaseEvent('specification_validation_error'),
      properties: {
        field_name: fieldName,
        error_message: errorMessage,
        validation_rule: validationRule || 'unknown',
      },
    };

    this.eventQueue.push(event);
  }

  trackFormAbandonment(step: string, filledFields: string[], totalFields: number, startTime: number): void {
    if (!this.isEnabled) return;

    const event: FormAbandonmentEvent = {
      ...this.createBaseEvent('budget_form_abandoned'),
      properties: {
        abandonment_step: step,
        fields_filled: filledFields,
        total_fields: totalFields,
        time_spent: Date.now() - startTime,
      },
    };

    this.eventQueue.push(event);
  }

  trackFormSubmission(success: boolean, error?: string, submissionTime?: number): void {
    this.track('budget_form_submission', {
      success,
      error,
      submission_time: submissionTime,
    });
  }

  trackFormPerformance(metrics: {
    loadTime: number;
    validationTime: number;
    submissionTime: number;
  }): void {
    this.track('budget_form_performance', metrics);
  }

  private isCriticalEvent(event: string): boolean {
    const criticalEvents = [
      'specification_validation_error',
      'budget_form_submission',
      'budget_form_abandoned',
    ];
    return criticalEvents.includes(event);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      console.error('Analytics flush failed:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.isEnabled || events.length === 0) return;

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      throw error;
    }
  }

  // Public methods for manual control
  flush(): Promise<void> {
    return this.flushEvents();
  }

  enable(): void {
    this.isEnabled = true;
    this.startFlushTimer();
    this.trackSessionStart();
  }

  disable(): void {
    this.isEnabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Cleanup method for when component unmounts
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEvents();
  }
}

// Export singleton instance
export const specificationAnalytics = new SpecificationAnalytics();

// Hook for using analytics in components
export function useSpecificationAnalytics() {
  const startTime = React.useRef(Date.now());

  const trackFieldUsage = React.useCallback((fieldName: string, value: string, budgetId?: number) => {
    specificationAnalytics.trackSpecificationFieldUsed(fieldName, value, budgetId);
  }, []);

  const trackSectionCompletion = React.useCallback((specifications: Record<string, string>) => {
    specificationAnalytics.trackSpecificationSectionCompleted(specifications, startTime.current);
  }, []);

  const trackValidationError = React.useCallback((fieldName: string, errorMessage: string) => {
    specificationAnalytics.trackValidationError(fieldName, errorMessage);
  }, []);

  const trackFormAbandonment = React.useCallback((step: string, filledFields: string[], totalFields: number) => {
    specificationAnalytics.trackFormAbandonment(step, filledFields, totalFields, startTime.current);
  }, []);

  return {
    trackFieldUsage,
    trackSectionCompletion,
    trackValidationError,
    trackFormAbandonment,
    flush: specificationAnalytics.flush.bind(specificationAnalytics),
  };
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Record<string, number> = {};
  private timers: Record<string, number> = {};

  startTimer(name: string): void {
    this.timers[name] = Date.now();
  }

  endTimer(name: string): number {
    const startTime = this.timers[name];
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics[name] = duration;
    delete this.timers[name];

    return duration;
  }

  getMetric(name: string): number | undefined {
    return this.metrics[name];
  }

  getAllMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  clear(): void {
    this.metrics = {};
    this.timers = {};
  }

  // Track form-specific performance
  trackFormPerformance(): {
    loadTime: number;
    validationTime: number;
    submissionTime: number;
  } {
    return {
      loadTime: this.metrics.form_load || 0,
      validationTime: this.metrics.form_validation || 0,
      submissionTime: this.metrics.form_submission || 0,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Error tracking utilities
export class ErrorTracker {
  static trackError(error: Error, context?: Record<string, any>): void {
    console.error('Tracked error:', error, context);

    // Send to analytics
    specificationAnalytics.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context,
    });

    // You could also send to a service like Sentry here
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          component: 'budget_form',
        },
        extra: context,
      });
    }
  }

  static trackValidationError(field: string, error: string, value?: any): void {
    specificationAnalytics.trackValidationError(field, error);
  }
}

export { ErrorTracker };
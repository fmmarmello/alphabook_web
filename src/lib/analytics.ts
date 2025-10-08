'use client';

import { useRef, useCallback } from 'react';

type GtagFunction = (command: string, eventName: string, params?: Record<string, unknown>) => void;

interface SentryGlobal {
  captureException?: (error: Error, context?: { tags?: Record<string, string> }) => void;
}

// Types for analytics events
interface SpecificationFieldUsedEvent {
  fieldName: string;
  value: string;
  budgetId?: number;
  timestamp: number;
  sessionId: string;
}

interface SpecificationSectionCompletedEvent {
  specifications: Record<string, string>;
  completedFields: number;
  totalFields: number;
  completionRate: number;
  timestamp: number;
  sessionId: string;
}

interface SpecificationValidationErrorEvent {
  fieldName: string;
  errorMessage: string;
  attemptedValue?: string;
  timestamp: number;
  sessionId: string;
}

interface BudgetFormSubmissionEvent {
  budgetId?: number;
  hasSpecifications: boolean;
  specificationCount: number;
  submissionTime: number;
  timestamp: number;
  sessionId: string;
}

type SpecificationFieldUsedAnalyticsEvent = SpecificationFieldUsedEvent & {
  type: 'specification_field_used';
};

type SpecificationSectionCompletedAnalyticsEvent = SpecificationSectionCompletedEvent & {
  type: 'specification_section_completed';
};

type SpecificationValidationErrorAnalyticsEvent = SpecificationValidationErrorEvent & {
  type: 'specification_validation_error';
};

type BudgetFormSubmissionAnalyticsEvent = BudgetFormSubmissionEvent & {
  type: 'budget_form_submission';
};

type SpecificationAnalyticsEvent =
  | SpecificationFieldUsedAnalyticsEvent
  | SpecificationSectionCompletedAnalyticsEvent
  | SpecificationValidationErrorAnalyticsEvent
  | BudgetFormSubmissionAnalyticsEvent;

interface SpecificationAnalyticsSummary {
  totalFieldInteractions: number;
  totalValidationErrors: number;
  totalSectionCompletions: number;
  averageCompletionRate: number;
  mostUsedFields: Array<{ field: string; count: number }>;
  commonErrors: Array<{ error: string; count: number }>;
}

// Analytics service class
class SpecificationAnalyticsService {
  private sessionId: string;
  private events: SpecificationAnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logEvent(event: SpecificationAnalyticsEvent): void {
    this.events.push(event);
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Specification Analytics:', event);
    }

    // In production, send to analytics service (implement as needed)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(event);
    }
  }

  private sendToAnalyticsService(event: SpecificationAnalyticsEvent): void {
    // Implement your analytics service integration here
    // Examples: Google Analytics, Mixpanel, PostHog, etc.
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        const payload: Record<string, unknown> = {
          event_category: 'Budget Form',
          event_label: event.type,
          custom_parameters: event,
        };
        window.gtag('event', 'specification_interaction', payload);
      }
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  trackSpecificationFieldUsed(
    fieldName: string,
    value: string,
    budgetId?: number
  ): void {
    const event: SpecificationFieldUsedEvent = {
      fieldName,
      value,
      budgetId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    const analyticsEvent: SpecificationFieldUsedAnalyticsEvent = {
      ...event,
      type: 'specification_field_used',
    };

    this.logEvent(analyticsEvent);
  }

  trackSpecificationSectionCompleted(
    specifications: Record<string, string>
  ): void {
    const completedFields = Object.values(specifications).filter(
      value => value && value.trim() !== ''
    ).length;
    
    const totalFields = Object.keys(specifications).length;
    const completionRate = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

    const event: SpecificationSectionCompletedEvent = {
      specifications,
      completedFields,
      totalFields,
      completionRate,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    const analyticsEvent: SpecificationSectionCompletedAnalyticsEvent = {
      ...event,
      type: 'specification_section_completed',
    };

    this.logEvent(analyticsEvent);
  }

  trackSpecificationValidationError(
    fieldName: string,
    errorMessage: string,
    attemptedValue?: string
  ): void {
    const event: SpecificationValidationErrorEvent = {
      fieldName,
      errorMessage,
      attemptedValue,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    const analyticsEvent: SpecificationValidationErrorAnalyticsEvent = {
      ...event,
      type: 'specification_validation_error',
    };

    this.logEvent(analyticsEvent);
  }

  trackBudgetFormSubmission(
    budgetId: number | undefined,
    specifications: Record<string, string>,
    submissionStartTime: number
  ): void {
    const specificationEntries = Object.entries(specifications).filter(
      ([, value]) => value && value.trim() !== ''
    );

    const event: BudgetFormSubmissionEvent = {
      budgetId,
      hasSpecifications: specificationEntries.length > 0,
      specificationCount: specificationEntries.length,
      submissionTime: Date.now() - submissionStartTime,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    const analyticsEvent: BudgetFormSubmissionAnalyticsEvent = {
      ...event,
      type: 'budget_form_submission',
    };

    this.logEvent(analyticsEvent);
  }

  getEvents(): SpecificationAnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  getSessionId(): string {
    return this.sessionId;
  }

  exportAnalytics(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      events: this.events,
      summary: this.generateSummary(),
    }, null, 2);
  }

  private generateSummary(): SpecificationAnalyticsSummary {
    const fieldUsageEvents = this.events.filter(
      (event): event is SpecificationFieldUsedAnalyticsEvent =>
        event.type === 'specification_field_used'
    );
    const errorEvents = this.events.filter(
      (event): event is SpecificationValidationErrorAnalyticsEvent =>
        event.type === 'specification_validation_error'
    );
    const completionEvents = this.events.filter(
      (event): event is SpecificationSectionCompletedAnalyticsEvent =>
        event.type === 'specification_section_completed'
    );

    return {
      totalFieldInteractions: fieldUsageEvents.length,
      totalValidationErrors: errorEvents.length,
      totalSectionCompletions: completionEvents.length,
      averageCompletionRate: completionEvents.length > 0
        ? completionEvents.reduce((sum, event) => sum + event.completionRate, 0) / completionEvents.length
        : 0,
      mostUsedFields: this.getMostUsedFields(fieldUsageEvents),
      commonErrors: this.getCommonErrors(errorEvents),
    };
  }

  private getMostUsedFields(events: SpecificationFieldUsedAnalyticsEvent[]): Array<{ field: string; count: number }> {
    const fieldCounts: Record<string, number> = {};
    events.forEach(event => {
      const fieldName = event.fieldName;
      fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
    });

    return Object.entries(fieldCounts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getCommonErrors(events: SpecificationValidationErrorAnalyticsEvent[]): Array<{ error: string; count: number }> {
    const errorCounts: Record<string, number> = {};
    events.forEach(event => {
      const error = event.errorMessage;
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }
}

// Singleton instance
export const specificationAnalytics = new SpecificationAnalyticsService();

// Error tracker utility
export class ErrorTracker {
  private static errors: Array<{
    error: Error;
    context: string;
    timestamp: number;
  }> = [];

  static trackError(error: Error, context: string): void {
    this.errors.push({
      error,
      context,
      timestamp: Date.now(),
    });

    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 Error in ${context}:`, error);
    }

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error, context);
    }
  }

  private static sendToErrorService(error: Error, context: string): void {
    // Implement your error tracking service here
    // Examples: Sentry, Bugsnag, etc.
    try {
      if (typeof window !== 'undefined' && window.Sentry?.captureException) {
        window.Sentry.captureException(error, {
          tags: { context },
        });
      }
    } catch (trackingError) {
      console.warn('Failed to send error to tracking service:', trackingError);
    }
  }

  static getErrors(): Array<{ error: Error; context: string; timestamp: number }> {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }
}

// Hook for using analytics in components
export function useSpecificationAnalytics() {
  const startTime = useRef(Date.now());

  const trackFieldUsage = useCallback((fieldName: string, value: string, budgetId?: number) => {
    specificationAnalytics.trackSpecificationFieldUsed(fieldName, value, budgetId);
  }, []);

  const trackValidationError = useCallback((fieldName: string, errorMessage: string, attemptedValue?: string) => {
    specificationAnalytics.trackSpecificationValidationError(fieldName, errorMessage, attemptedValue);
  }, []);

  const trackSectionCompletion = useCallback((specifications: Record<string, string>) => {
    specificationAnalytics.trackSpecificationSectionCompleted(specifications);
  }, []);

  const trackFormSubmission = useCallback((budgetId: number | undefined, specifications: Record<string, string>) => {
    specificationAnalytics.trackBudgetFormSubmission(budgetId, specifications, startTime.current);
  }, []);

  return {
    trackFieldUsage,
    trackValidationError,
    trackSectionCompletion,
    trackFormSubmission,
    getSessionId: () => specificationAnalytics.getSessionId(),
    exportAnalytics: () => specificationAnalytics.exportAnalytics(),
  };
}

// Utility functions for development
export const analyticsDevUtils = {
  exportEvents: () => specificationAnalytics.exportAnalytics(),
  clearEvents: () => specificationAnalytics.clearEvents(),
  getEventCount: () => specificationAnalytics.getEvents().length,
  logSummary: () => {
    if (process.env.NODE_ENV === 'development') {
      console.table(specificationAnalytics.getEvents());
    }
  },
};

// Make analytics available in development console
type SpecificationAnalyticsDevGlobal = {
  service: SpecificationAnalyticsService;
  devUtils: typeof analyticsDevUtils;
  ErrorTracker: typeof ErrorTracker;
};

declare global {
  interface Window {
    gtag?: GtagFunction;
    Sentry?: SentryGlobal;
    specificationAnalytics?: SpecificationAnalyticsDevGlobal;
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.specificationAnalytics = {
    service: specificationAnalytics,
    devUtils: analyticsDevUtils,
    ErrorTracker,
  };
}

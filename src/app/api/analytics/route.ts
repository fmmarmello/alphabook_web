import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';

type AnalyticsEventProperties = Record<string, unknown> & {
  field_name?: string;
  error_message?: string;
  success?: boolean;
  error?: string;
  abandonment_step?: string;
};

interface AnalyticsEvent {
  event: string;
  properties: AnalyticsEventProperties;
  timestamp: string;
  userId?: string;
  sessionId: string;
  url?: string;
  userAgent?: string;
}

interface AnalyticsRequestBody {
  events: AnalyticsEvent[];
}

// Simple in-memory storage for analytics (in production, you'd use a proper analytics service)
const analyticsStorage: AnalyticsEvent[] = [];
const MAX_STORAGE_SIZE = 10000; // Prevent memory issues

export async function POST(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user
    const user = await requireApiAuth(req);

    // ✅ SECURITY: All authenticated users can send analytics data
    // In production, you might want to restrict this further

    const body = (await req.json()) as AnalyticsRequestBody;

    // Validate request body
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid request: events array is required' },
        { status: 400 }
      );
    }

    if (body.events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: events array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate each event
    const validEvents: AnalyticsEvent[] = [];
    const errors: string[] = [];

    for (const [index, event] of body.events.entries()) {
      if (!isValidEvent(event)) {
        errors.push(`Event at index ${index} is invalid`);
        continue;
      }

      // Add server-side timestamp and user info
      const enrichedEvent: AnalyticsEvent = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
        userId: ''+user.userId, // Override with server-side user ID
        // Add server-side metadata
        properties: {
          ...event.properties,
          server_timestamp: new Date().toISOString(),
          user_role: user.role,
        },
      };

      validEvents.push(enrichedEvent);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid events', details: errors },
        { status: 400 }
      );
    }

    // Store events (in production, send to analytics service)
    storeEvents(validEvents);

    // Log important events for monitoring
    logImportantEvents(validEvents);

    return NextResponse.json({
      success: true,
      events_processed: validEvents.length,
      message: 'Analytics events processed successfully',
    });

  } catch (error) {
    console.error('Analytics processing error:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

// GET endpoint for retrieving analytics (admin only)
export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user
    const user = await requireApiAuth(req);

    // ✅ SECURITY: Only admins can retrieve analytics
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const event_type = searchParams.get('event_type');

    let filteredEvents = analyticsStorage;

    // Filter by event type if specified
    if (event_type) {
      filteredEvents = analyticsStorage.filter(event => event.event === event_type);
    }

    // Apply pagination
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    // Generate summary statistics
    const summary = generateSummary(analyticsStorage);

    return NextResponse.json({
      events: paginatedEvents,
      summary,
      pagination: {
        total: filteredEvents.length,
        limit,
        offset,
        has_more: offset + limit < filteredEvents.length,
      },
    });

  } catch (error) {
    console.error('Analytics retrieval error:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidEvent(event: unknown): event is AnalyticsEvent {
  if (!isRecord(event)) return false;

  if (typeof event.event !== 'string' || event.event.length === 0) {
    return false;
  }

  if (!isRecord(event.properties)) {
    return false;
  }

  if (typeof event.sessionId !== 'string' || event.sessionId.length === 0) {
    return false;
  }

  if (
    event.timestamp !== undefined &&
    typeof event.timestamp !== 'string'
  ) {
    return false;
  }

  if (event.userId !== undefined && typeof event.userId !== 'string') {
    return false;
  }

  if (event.url !== undefined && typeof event.url !== 'string') {
    return false;
  }

  if (event.userAgent !== undefined && typeof event.userAgent !== 'string') {
    return false;
  }

  return true;
}

interface AnalyticsSummary {
  total_events: number;
  unique_sessions: number;
  recent_events_24h: number;
  event_type_counts: Record<string, number>;
  specification_field_usage: Record<string, number>;
  specification_validation_errors: Record<string, number>;
  storage_size: number;
  last_updated: string;
}

function storeEvents(events: AnalyticsEvent[]): void {
  // In production, you would send these to a proper analytics service
  // like Google Analytics, Mixpanel, Amplitude, or a custom database

  for (const event of events) {
    analyticsStorage.push(event);

    // Prevent memory issues by limiting storage size
    if (analyticsStorage.length > MAX_STORAGE_SIZE) {
      analyticsStorage.splice(0, analyticsStorage.length - MAX_STORAGE_SIZE);
    }
  }
}

function logImportantEvents(events: AnalyticsEvent[]): void {
  for (const event of events) {
    // Log errors and important business events
    if (event.event === 'specification_validation_error') {
      const fieldName = typeof event.properties.field_name === 'string'
        ? event.properties.field_name
        : 'unknown';
      const errorMessage = typeof event.properties.error_message === 'string'
        ? event.properties.error_message
        : 'unknown error';
      console.warn(`Validation error in field: ${fieldName} - ${errorMessage}`);
    }

    if (
      event.event === 'budget_form_submission' &&
      event.properties.success === false
    ) {
      const errorMessage = typeof event.properties.error === 'string'
        ? event.properties.error
        : 'Unknown error';
      console.error(`Form submission failed: ${errorMessage}`);
    }

    if (event.event === 'budget_form_abandoned') {
      const abandonmentStep = typeof event.properties.abandonment_step === 'string'
        ? event.properties.abandonment_step
        : 'unknown';
      console.info(`Form abandoned at step: ${abandonmentStep}`);
    }
  }
}

function generateSummary(events: AnalyticsEvent[]): AnalyticsSummary {
  const totalEvents = events.length;
  const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
  const eventTypeCounts: Record<string, number> = {};

  // Count events by type
  for (const event of events) {
    eventTypeCounts[event.event] = (eventTypeCounts[event.event] || 0) + 1;
  }

  // Calculate specification field usage
  const specificationFieldUsage: Record<string, number> = {};
  const specificationErrors: Record<string, number> = {};

  for (const event of events) {
    if (event.event === 'specification_field_used') {
      const fieldName = typeof event.properties.field_name === 'string'
        ? event.properties.field_name
        : undefined;
      if (!fieldName) continue;
      specificationFieldUsage[fieldName] = (specificationFieldUsage[fieldName] || 0) + 1;
    }

    if (event.event === 'specification_validation_error') {
      const fieldName = typeof event.properties.field_name === 'string'
        ? event.properties.field_name
        : undefined;
      if (!fieldName) continue;
      specificationErrors[fieldName] = (specificationErrors[fieldName] || 0) + 1;
    }
  }

  // Get recent events (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentEvents = events.filter(event =>
    new Date(event.timestamp) > oneDayAgo
  );

  return {
    total_events: totalEvents,
    unique_sessions: uniqueSessions,
    recent_events_24h: recentEvents.length,
    event_type_counts: eventTypeCounts,
    specification_field_usage: specificationFieldUsage,
    specification_validation_errors: specificationErrors,
    storage_size: analyticsStorage.length,
    last_updated: new Date().toISOString(),
  };
}

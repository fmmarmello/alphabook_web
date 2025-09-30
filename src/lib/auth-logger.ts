/**
 * Authentication Logger
 * Comprehensive logging utility for debugging authentication issues
 */

interface LogEntry {
  timestamp: string;
  component: string;
  function: string;
  action: string;
  details: any;
  userId?: string;
  sessionId?: string;
}

class AuthLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = process.env.NODE_ENV === 'development';

  private createLogEntry(
    component: string,
    functionName: string,
    action: string,
    details: any = {},
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      component,
      function: functionName,
      action,
      details,
      userId,
      sessionId: this.getSessionId(),
    };
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('auth_session_id') ||
             (sessionStorage.setItem('auth_session_id', Date.now().toString()), sessionStorage.getItem('auth_session_id')) ||
             'unknown';
    }
    return 'server';
  }

  log(component: string, functionName: string, action: string, details: any = {}, userId?: string) {
    if (!this.isEnabled) return;

    const entry = this.createLogEntry(component, functionName, action, details, userId);

    // Add to internal log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console logging with color coding
    const prefix = `[${entry.component}:${entry.function}]`;
    const message = `${action}: ${JSON.stringify(details)}`;

    switch (action.toLowerCase()) {
      case 'error':
      case 'failed':
      case 'denied':
        console.error(`🔴 ${prefix} ${message}`);
        break;
      case 'warning':
      case 'expired':
        console.warn(`🟡 ${prefix} ${message}`);
        break;
      case 'success':
      case 'granted':
      case 'valid':
        console.log(`🟢 ${prefix} ${message}`);
        break;
      default:
        console.log(`🔵 ${prefix} ${message}`);
    }
  }

  // Specific logging methods for common auth events
  middlewareCheck(pathname: string, hasToken: boolean, isValid: boolean, userId?: string) {
    this.log('Middleware', 'middleware', hasToken ? (isValid ? 'access_granted' : 'token_invalid') : 'no_token',
      { pathname, hasToken, isValid }, userId);
  }

  routeProtection(component: string, isAuthenticated: boolean, isLoading: boolean, willRedirect: boolean) {
    this.log('ProtectedRoute', component, isAuthenticated ? 'authenticated' : 'unauthenticated',
      { isAuthenticated, isLoading, willRedirect });
  }

  tokenValidation(token: string, isValid: boolean, error?: string) {
    this.log('TokenValidation', 'verifyAccessToken', isValid ? 'valid' : 'invalid',
      { tokenLength: token.length, error });
  }

  authStateChange(oldState: any, newState: any, reason: string) {
    this.log('AuthState', 'useAuth', 'state_changed',
      { oldState, newState, reason });
  }

  apiCall(endpoint: string, method: string, hasAuth: boolean, status: number, userId?: string) {
    this.log('API', endpoint, hasAuth ? 'authenticated_request' : 'unauthenticated_request',
      { method, status }, userId);
  }

  cookieCheck(cookieName: string, exists: boolean, valueLength?: number) {
    this.log('Cookie', 'check', exists ? 'found' : 'missing',
      { cookieName, valueLength });
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs for specific component
  getComponentLogs(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global auth logger instance
export const authLogger = new AuthLogger();

// Helper functions for easy logging
export const logAuth = {
  middleware: (pathname: string, hasToken: boolean, isValid: boolean, userId?: string) =>
    authLogger.middlewareCheck(pathname, hasToken, isValid, userId),

  route: (component: string, isAuthenticated: boolean, isLoading: boolean, willRedirect: boolean) =>
    authLogger.routeProtection(component, isAuthenticated, isLoading, willRedirect),

  token: (token: string, isValid: boolean, error?: string) =>
    authLogger.tokenValidation(token, isValid, error),

  state: (oldState: any, newState: any, reason: string) =>
    authLogger.authStateChange(oldState, newState, reason),

  api: (endpoint: string, method: string, hasAuth: boolean, status: number, userId?: string) =>
    authLogger.apiCall(endpoint, method, hasAuth, status, userId),

  cookie: (cookieName: string, exists: boolean, valueLength?: number) =>
    authLogger.cookieCheck(cookieName, exists, valueLength),
};

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authLogger = authLogger;
}
/**
 * API Monitor utility để track và prevent excessive API calls
 */

class ApiMonitor {
  constructor() {
    this.calls = new Map(); // Track API calls by endpoint
    this.callHistory = []; // History of all calls
    this.maxCallsPerMinute = 10; // Maximum calls per endpoint per minute
    this.warningThreshold = 5; // Warning threshold
  }

  // Track an API call
  trackCall(endpoint, method = 'GET') {
    const now = Date.now();
    const key = `${method}:${endpoint}`;
    
    // Initialize tracking for this endpoint if not exists
    if (!this.calls.has(key)) {
      this.calls.set(key, []);
    }
    
    const calls = this.calls.get(key);
    
    // Add current call
    calls.push(now);
    
    // Remove calls older than 1 minute
    const oneMinuteAgo = now - 60000;
    const recentCalls = calls.filter(time => time > oneMinuteAgo);
    this.calls.set(key, recentCalls);
    
    // Add to history
    this.callHistory.push({
      endpoint,
      method,
      timestamp: now,
      count: recentCalls.length
    });
    
    // Keep only last 100 history entries
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(-100);
    }
    
    // Check for excessive calls
    this.checkExcessiveCalls(key, recentCalls.length);
    
    return recentCalls.length;
  }

  // Check if calls are excessive
  checkExcessiveCalls(key, count) {
    if (count >= this.maxCallsPerMinute) {
      console.error(`🚨 EXCESSIVE API CALLS: ${key} called ${count} times in the last minute!`);
      console.trace('Call stack:');
    } else if (count >= this.warningThreshold) {
      console.warn(`⚠️ HIGH API USAGE: ${key} called ${count} times in the last minute`);
    }
  }

  // Check if an API call should be allowed
  shouldAllowCall(endpoint, method = 'GET') {
    const key = `${method}:${endpoint}`;
    const calls = this.calls.get(key) || [];
    const now = Date.now();
    
    // Filter recent calls (last minute)
    const recentCalls = calls.filter(time => time > now - 60000);
    
    if (recentCalls.length >= this.maxCallsPerMinute) {
      console.warn(`🛑 API CALL BLOCKED: ${key} has reached limit (${this.maxCallsPerMinute} calls/minute)`);
      return false;
    }
    
    return true;
  }

  // Get statistics for an endpoint
  getStats(endpoint, method = 'GET') {
    const key = `${method}:${endpoint}`;
    const calls = this.calls.get(key) || [];
    const now = Date.now();
    
    const recentCalls = calls.filter(time => time > now - 60000);
    
    return {
      endpoint,
      method,
      callsLastMinute: recentCalls.length,
      totalCalls: calls.length,
      lastCall: calls.length > 0 ? new Date(calls[calls.length - 1]) : null,
      isExcessive: recentCalls.length >= this.maxCallsPerMinute,
      isHigh: recentCalls.length >= this.warningThreshold
    };
  }

  // Get all statistics
  getAllStats() {
    const stats = [];
    for (const [key] of this.calls) {
      const [method, endpoint] = key.split(':');
      stats.push(this.getStats(endpoint, method));
    }
    return stats.sort((a, b) => b.callsLastMinute - a.callsLastMinute);
  }

  // Get call history
  getHistory(limit = 20) {
    return this.callHistory.slice(-limit).reverse();
  }

  // Reset statistics
  reset() {
    this.calls.clear();
    this.callHistory = [];
  }

  // Set limits
  setLimits(maxCallsPerMinute, warningThreshold) {
    this.maxCallsPerMinute = maxCallsPerMinute;
    this.warningThreshold = warningThreshold;
  }
}

// Create singleton instance
export const apiMonitor = new ApiMonitor();

// Wrapper function for fetch to automatically track calls
export const monitoredFetch = async (url, options = {}) => {
  const endpoint = url.replace(/\?.*$/, ''); // Remove query params for tracking
  const method = options.method || 'GET';
  
  // Check if call should be allowed
  if (!apiMonitor.shouldAllowCall(endpoint, method)) {
    throw new Error(`API call to ${endpoint} blocked due to excessive usage`);
  }
  
  // Track the call
  const callCount = apiMonitor.trackCall(endpoint, method);
  
  console.log(`📡 API Call: ${method} ${endpoint} (${callCount} calls in last minute)`);
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`❌ API Call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

// Hook to use API monitor in React components
export const useApiMonitor = () => {
  return {
    trackCall: apiMonitor.trackCall.bind(apiMonitor),
    shouldAllowCall: apiMonitor.shouldAllowCall.bind(apiMonitor),
    getStats: apiMonitor.getStats.bind(apiMonitor),
    getAllStats: apiMonitor.getAllStats.bind(apiMonitor),
    getHistory: apiMonitor.getHistory.bind(apiMonitor),
    reset: apiMonitor.reset.bind(apiMonitor),
    setLimits: apiMonitor.setLimits.bind(apiMonitor)
  };
};

// Development helper to log API stats
if (import.meta.env.DEV) {
  // Log stats every 30 seconds in development
  setInterval(() => {
    const stats = apiMonitor.getAllStats();
    if (stats.length > 0) {
      console.group('📊 API Usage Stats (Last Minute)');
      stats.forEach(stat => {
        const icon = stat.isExcessive ? '🚨' : stat.isHigh ? '⚠️' : '✅';
        console.log(`${icon} ${stat.method} ${stat.endpoint}: ${stat.callsLastMinute} calls`);
      });
      console.groupEnd();
    }
  }, 30000);
}

export default apiMonitor;

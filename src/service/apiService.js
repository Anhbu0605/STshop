/**
 * Centralized API service với caching và optimization
 */

class ApiService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.baseURL = {
      server: import.meta.env.VITE_STSHOP_SERVER_API,
      admin: import.meta.env.VITE_STSHOP_ADMIN_API,
      render: import.meta.env.VITE_STSHOP_RENDER_API,
      sepay: import.meta.env.VITE_SEPAY_API
    };
  }

  // Tạo cache key
  createCacheKey(url, params = {}, headers = {}) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    
    const keyData = {
      url,
      params: sortedParams,
      headers: headers['X-Api-Key'] ? { apiKey: headers['X-Api-Key'] } : {}
    };
    
    return JSON.stringify(keyData);
  }

  // Kiểm tra cache validity
  isCacheValid(cacheEntry, ttl = this.defaultTTL) {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < ttl;
  }

  // Generic fetch với caching
  async cachedFetch(url, options = {}, cacheOptions = {}) {
    const {
      ttl = this.defaultTTL,
      skipCache = false,
      forceRefresh = false
    } = cacheOptions;

    const cacheKey = this.createCacheKey(url, options.params || {}, options.headers || {});

    // Kiểm tra cache
    if (!forceRefresh && !skipCache) {
      const cachedData = this.cache.get(cacheKey);
      if (this.isCacheValid(cachedData, ttl)) {
        return cachedData.data;
      }
    }

    // Kiểm tra pending request (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Tạo request mới
    const requestPromise = this.executeRequest(url, options, cacheKey, skipCache);
    this.pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }

  // Execute actual request
  async executeRequest(url, options, cacheKey, skipCache) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      // Cache successful responses
      if (!skipCache && (data.ok || data.success || response.ok)) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Specific API methods với caching
  
  // Products API
  async getProducts(searchTerm = '', page = 1, limit = 40, options = {}) {
    const url = `${this.baseURL.server}/product?q=${searchTerm}&limit=${limit}&page=${page}`;
    return this.cachedFetch(url, {}, { ttl: 2 * 60 * 1000, ...options }); // 2 minutes cache
  }

  async getProductDetail(id, options = {}) {
    const url = `${this.baseURL.server}/product/${id}`;
    return this.cachedFetch(url, {}, { ttl: 5 * 60 * 1000, ...options }); // 5 minutes cache
  }

  async getTopProducts(limit = 20, options = {}) {
    const url = `${this.baseURL.server}/products/top?limit=${limit}`;
    return this.cachedFetch(url, {}, { ttl: 10 * 60 * 1000, ...options }); // 10 minutes cache
  }

  // User API
  async getProfile(apiKey, options = {}) {
    const url = `${this.baseURL.server}/profile`;
    return this.cachedFetch(url, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey }
    }, { ttl: 5 * 60 * 1000, ...options });
  }

  async getUserAddress(userId, options = {}) {
    const url = `${this.baseURL.server}/address/${userId}`;
    return this.cachedFetch(url, {}, { ttl: 5 * 60 * 1000, ...options });
  }

  // Cart API
  async getCart(apiKey, options = {}) {
    const url = `${this.baseURL.server}/cart`;
    return this.cachedFetch(url, {
      headers: { 'X-Api-Key': apiKey }
    }, { ttl: 30 * 1000, ...options }); // 30 seconds cache for cart
  }

  // Favorites API
  async getFavorites(userId, options = {}) {
    const url = `${this.baseURL.server}/favorites/${userId}`;
    return this.cachedFetch(url, {}, { ttl: 2 * 60 * 1000, ...options });
  }

  // Chat API
  async getChatMessages(apiKey, options = {}) {
    const url = `${this.baseURL.server}/message`;
    return this.cachedFetch(url, {
      headers: { 'X-Api-Key': apiKey }
    }, { ttl: 10 * 1000, ...options }); // 10 seconds cache for chat
  }

  async getChatAdminUsers(options = {}) {
    const url = `${this.baseURL.server}/message_admin`;
    return this.cachedFetch(url, {}, { ttl: 30 * 1000, ...options }); // 30 seconds cache
  }

  async getChatAdminMessages(userId, options = {}) {
    const url = `${this.baseURL.server}/detail_message_user/${userId}`;
    return this.cachedFetch(url, {}, { ttl: 5 * 1000, ...options }); // 5 seconds cache
  }

  // UI API
  async getUiHeader(options = {}) {
    const url = `${this.baseURL.render}/homepage/header`;
    return this.cachedFetch(url, {}, { ttl: 30 * 60 * 1000, ...options }); // 30 minutes cache
  }

  async getUiNavbar(options = {}) {
    const url = `${this.baseURL.render}/navbar`;
    return this.cachedFetch(url, {}, { ttl: 30 * 60 * 1000, ...options });
  }

  // Admin API
  async getAdminUsers(searchTerm = '', limit = 30, page = 1, options = {}) {
    const url = `${this.baseURL.server}/users?q=${searchTerm}&limit=${limit}&page=${page}`;
    return this.cachedFetch(url, {}, { ttl: 2 * 60 * 1000, ...options });
  }

  // Cache management methods
  invalidateCache(pattern) {
    if (typeof pattern === 'string') {
      this.cache.delete(pattern);
    } else if (pattern instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    } else if (typeof pattern === 'function') {
      for (const key of this.cache.keys()) {
        if (pattern(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  // Invalidate specific cache patterns
  invalidateProductCache() {
    this.invalidateCache(key => key.includes('/product'));
  }

  invalidateUserCache() {
    this.invalidateCache(key => key.includes('/profile') || key.includes('/address'));
  }

  invalidateCartCache() {
    this.invalidateCache(key => key.includes('/cart'));
  }

  invalidateChatCache() {
    this.invalidateCache(key => key.includes('/message'));
  }

  clearAllCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const validEntries = entries.filter(([, entry]) => this.isCacheValid(entry));
    
    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      pendingRequests: this.pendingRequests.size,
      cacheSize: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  // Cleanup expired cache entries
  cleanupExpiredCache() {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Auto cleanup expired cache every 5 minutes
setInterval(() => {
  apiService.cleanupExpiredCache();
}, 5 * 60 * 1000);

export default apiService;

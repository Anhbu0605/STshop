import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook để cache API responses và tránh duplicate calls
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const useApiCache = (ttl = 5 * 60 * 1000) => {
  const cache = useRef(new Map());
  const pendingRequests = useRef(new Map());
  const [loading, setLoading] = useState(false);

  // Tạo cache key từ URL và params
  const createCacheKey = useCallback((url, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    return `${url}?${JSON.stringify(sortedParams)}`;
  }, []);

  // Kiểm tra cache có hợp lệ không
  const isCacheValid = useCallback((cacheEntry) => {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < ttl;
  }, [ttl]);

  // Lấy data từ cache
  const getCachedData = useCallback((key) => {
    const cacheEntry = cache.current.get(key);
    if (isCacheValid(cacheEntry)) {
      return cacheEntry.data;
    }
    // Xóa cache hết hạn
    if (cacheEntry) {
      cache.current.delete(key);
    }
    return null;
  }, [isCacheValid]);

  // Lưu data vào cache
  const setCachedData = useCallback((key, data) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  // API call với cache và deduplication
  const cachedApiCall = useCallback(async (apiFunction, url, params = {}, options = {}) => {
    const cacheKey = createCacheKey(url, params);
    const { forceRefresh = false, skipCache = false } = options;

    // Kiểm tra cache trước nếu không force refresh
    if (!forceRefresh && !skipCache) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Kiểm tra có request đang pending không (deduplication)
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    // Tạo promise cho request mới
    const requestPromise = (async () => {
      setLoading(true);
      try {
        const result = await apiFunction(url, params);
        
        // Cache kết quả nếu thành công và không skip cache
        if (!skipCache && result && (result.ok || result.success)) {
          setCachedData(cacheKey, result);
        }
        
        return result;
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      } finally {
        setLoading(false);
        pendingRequests.current.delete(cacheKey);
      }
    })();

    // Lưu pending request
    pendingRequests.current.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, [createCacheKey, getCachedData, setCachedData]);

  // Xóa cache theo pattern
  const invalidateCache = useCallback((pattern) => {
    if (typeof pattern === 'string') {
      // Xóa exact match
      cache.current.delete(pattern);
    } else if (pattern instanceof RegExp) {
      // Xóa theo regex pattern
      for (const key of cache.current.keys()) {
        if (pattern.test(key)) {
          cache.current.delete(key);
        }
      }
    } else if (typeof pattern === 'function') {
      // Xóa theo function filter
      for (const key of cache.current.keys()) {
        if (pattern(key)) {
          cache.current.delete(key);
        }
      }
    }
  }, []);

  // Xóa toàn bộ cache
  const clearCache = useCallback(() => {
    cache.current.clear();
    pendingRequests.current.clear();
  }, []);

  // Lấy thông tin cache stats
  const getCacheStats = useCallback(() => {
    const entries = Array.from(cache.current.entries());
    const validEntries = entries.filter(([, entry]) => isCacheValid(entry));
    
    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      pendingRequests: pendingRequests.current.size
    };
  }, [isCacheValid]);

  return {
    cachedApiCall,
    invalidateCache,
    clearCache,
    getCacheStats,
    loading
  };
};

/**
 * Hook để debounce API calls
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 */
export const useDebounce = (callback, delay = 500) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debouncedCallback, cancel };
};

/**
 * Hook để throttle API calls
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Delay in milliseconds
 */
export const useThrottle = (callback, delay = 1000) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);

  return throttledCallback;
};

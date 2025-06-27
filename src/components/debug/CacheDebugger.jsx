import { useState, useEffect } from 'react';
import { apiService } from '../../service/apiService';

const CacheDebugger = () => {
  const [stats, setStats] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(apiService.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  // Chỉ hiển thị trong development mode
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
      >
        Cache Debug {isVisible ? '▼' : '▲'}
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px]">
          <h3 className="font-bold text-lg mb-3">API Cache Statistics</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Entries:</span>
              <span className="font-mono">{stats.totalEntries || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Valid Entries:</span>
              <span className="font-mono text-green-600">{stats.validEntries || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Expired Entries:</span>
              <span className="font-mono text-red-600">{stats.expiredEntries || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Pending Requests:</span>
              <span className="font-mono text-blue-600">{stats.pendingRequests || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Cache Size:</span>
              <span className="font-mono">{formatBytes(stats.cacheSize || 0)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                apiService.cleanupExpiredCache();
                setStats(apiService.getCacheStats());
              }}
              className="w-full bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
            >
              Cleanup Expired
            </button>
            
            <button
              onClick={() => {
                apiService.clearAllCache();
                setStats(apiService.getCacheStats());
              }}
              className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
            >
              Clear All Cache
            </button>
          </div>

          <div className="mt-4 space-y-1">
            <button
              onClick={() => {
                apiService.invalidateProductCache();
                setStats(apiService.getCacheStats());
              }}
              className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
            >
              Clear Product Cache
            </button>
            
            <button
              onClick={() => {
                apiService.invalidateUserCache();
                setStats(apiService.getCacheStats());
              }}
              className="w-full bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
            >
              Clear User Cache
            </button>
            
            <button
              onClick={() => {
                apiService.invalidateCartCache();
                setStats(apiService.getCacheStats());
              }}
              className="w-full bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 transition-colors"
            >
              Clear Cart Cache
            </button>
            
            <button
              onClick={() => {
                apiService.invalidateChatCache();
                setStats(apiService.getCacheStats());
              }}
              className="w-full bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 transition-colors"
            >
              Clear Chat Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default CacheDebugger;

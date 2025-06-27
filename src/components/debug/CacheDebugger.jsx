import { useState, useEffect } from 'react';
import { apiService } from '../../service/apiService';
import { apiMonitor } from '../../utils/apiMonitor';

const CacheDebugger = () => {
  const [stats, setStats] = useState({});
  const [apiStats, setApiStats] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('cache'); // 'cache' or 'api'

  useEffect(() => {
    const updateStats = () => {
      setStats(apiService.getCacheStats());
      setApiStats(apiMonitor.getAllStats());
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
        Debug Tools {isVisible ? '▼' : '▲'}
        {apiStats.some(stat => stat.isExcessive) && (
          <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">!</span>
        )}
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[400px] max-w-[500px]">
          {/* Tab Navigation */}
          <div className="flex mb-4 border-b">
            <button
              onClick={() => setActiveTab('cache')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'cache'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cache Stats
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'api'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              API Monitor
              {apiStats.some(stat => stat.isExcessive) && (
                <span className="ml-1 bg-red-500 text-white rounded-full px-1 text-xs">!</span>
              )}
            </button>
          </div>

          {activeTab === 'cache' && (
            <div>
              <h3 className="font-bold text-lg mb-3">Cache Statistics</h3>
          
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

          {activeTab === 'api' && (
            <div>
              <h3 className="font-bold text-lg mb-3">API Call Monitor</h3>

              <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                {apiStats.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">No API calls tracked</div>
                ) : (
                  apiStats.map((stat, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border ${
                        stat.isExcessive
                          ? 'bg-red-50 border-red-200'
                          : stat.isHigh
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">
                          {stat.method} {stat.endpoint}
                        </span>
                        <span className={`font-bold ${
                          stat.isExcessive ? 'text-red-600' : stat.isHigh ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {stat.callsLastMinute}/min
                        </span>
                      </div>
                      {stat.lastCall && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {stat.lastCall.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    apiMonitor.reset();
                    setApiStats([]);
                  }}
                  className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Reset API Monitor
                </button>

                <div className="text-xs text-gray-600 mt-2">
                  <div>🚨 Red: ≥10 calls/min (blocked)</div>
                  <div>⚠️ Yellow: ≥5 calls/min (warning)</div>
                  <div>✅ Green: &lt;5 calls/min (normal)</div>
                </div>
              </div>
            </div>
          )}
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

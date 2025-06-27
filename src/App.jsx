/* eslint-disable no-unused-vars */
import React, { useEffect } from "react";
import RouterDom from "./router/RouterDom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CacheDebugger from "./components/debug/CacheDebugger";
export default function App() {
  useEffect(() => {
    // Tối ưu keep-alive mechanism
    let keepAliveInterval;
    let isPageVisible = true;

    const keepServerAlive = () => {
      // Chỉ ping server khi page visible và user đang active
      if (isPageVisible && !document.hidden) {
        const img = new Image();
        img.src = "https://stshop.onrender.com/";
        img.onerror = () => {
          console.warn('Keep-alive ping failed');
        };
      }
    };

    // Lắng nghe visibility change để tạm dừng ping khi tab không active
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;

      if (isPageVisible) {
        // Resume ping khi tab active lại
        if (!keepAliveInterval) {
          keepAliveInterval = setInterval(keepServerAlive, 600000); // 10 minutes
        }
      } else {
        // Pause ping khi tab không active
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
      }
    };

    // Setup initial ping
    keepAliveInterval = setInterval(keepServerAlive, 600000); // 10 minutes

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  return (
    <div>
      <RouterDom />
      <ToastContainer position="top-right" autoClose={1000} />
      <CacheDebugger />
    </div>
  );
}

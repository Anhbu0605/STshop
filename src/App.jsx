/* eslint-disable no-unused-vars */
import React, { useEffect } from "react";
import RouterDom from "./router/RouterDom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function App() {
  useEffect(() => {
    //chống tắt sever 10p call 1 lần
    const keepServerAlive = () => {
      const img = new Image();
      img.src = "https://stshop.onrender.com/";
    };
    setInterval(() => {
      keepServerAlive();
    }, 600000);
  }, []);
  return (
    <div>
      <RouterDom />

      <ToastContainer position="top-right" autoClose={1000} />
    </div>
  );
}

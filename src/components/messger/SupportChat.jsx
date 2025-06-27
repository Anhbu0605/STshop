import { useEffect, useState, useRef, useCallback } from "react";
import { BsChatDots, BsX, BsSend } from "react-icons/bs";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  getSupportChat,
  getSupportChatCreates,
} from "../../service/messger_user";
import { apiService } from "../../service/apiService";

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const statusLogin = useSelector((state) => state.login.status);
  const apiKey = useSelector((state) => state.login.apikey);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const [notification, setNotification] = useState(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const toggleChatWindow = useCallback(() => {
    toast.dismiss();
    if (statusLogin) {
      setIsOpen(prev => !prev);
    } else {
      toast.info("Bạn cần đăng nhập để được hỗ trợ");
    }
  }, [statusLogin]);

  const fetchData = useCallback(async (force = false) => {
    if (!statusLogin || !apiKey) return;

    // Throttle API calls - chỉ gọi nếu đã qua 2 giây từ lần gọi trước
    const now = Date.now();
    if (!force && now - lastFetchTime < 2000) return;

    if (loading) return; // Prevent concurrent calls

    setLoading(true);
    setLastFetchTime(now);

    try {
      const data = await apiService.getChatMessages(apiKey, force ? { forceRefresh: true } : {});

      setNotification(data.unread_count || 0);
      if (data.ok && data.data) {
        // Sắp xếp tin nhắn theo thời gian
        const sortedMessages = data.data.sort((a, b) => {
          return new Date(a.created_at) - new Date(b.created_at);
        });

        // Chỉ update nếu có thay đổi
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(sortedMessages)) {
            setTimeout(scrollToBottom, 100);
            return sortedMessages;
          }
          return prevMessages;
        });
      }
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setLoading(false);
    }
  }, [statusLogin, apiKey, loading, lastFetchTime, scrollToBottom]);

  // Gửi tin nhắn với optimistic update
  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim() === "" || !apiKey) return;

    const tempMessage = {
      id: Date.now(),
      content: inputMessage,
      sender_type: "user",
      created_at: new Date().toISOString(),
      temp: true
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setInputMessage("");
    setTimeout(scrollToBottom, 100);

    try {
      const data = await getSupportChatCreates(apiKey, tempMessage.content);

      if (data.ok) {
        // Refresh messages để lấy dữ liệu thực từ server
        await fetchData(true);
      } else {
        // Remove temp message nếu gửi thất bại
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setInputMessage(tempMessage.content); // Restore message
        toast.error("Không thể gửi tin nhắn");
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setInputMessage(tempMessage.content);
      toast.error("Có lỗi xảy ra khi gửi tin nhắn");
      console.error("Error sending message:", error);
    }
  }, [inputMessage, apiKey, fetchData, scrollToBottom]);

  // Setup interval chỉ khi chat được mở và user đã login
  useEffect(() => {
    if (statusLogin && isOpen) {
      // Fetch ngay lập tức khi mở chat
      fetchData(true);

      // Setup interval với thời gian dài hơn
      intervalRef.current = setInterval(() => {
        fetchData();
      }, 5000); // Tăng từ 3s lên 5s

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear interval khi đóng chat hoặc logout
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [statusLogin, isOpen, fetchData]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isOpen ? (
        <div className="w-[350px] h-[500px] bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="flex flex-row items-center justify-between p-4 bg-blue-500 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <BsChatDots size={20} />
              <h3 className="font-semibold">Hỗ trợ trực tuyến</h3>
            </div>
            <button
              className="p-1 hover:bg-blue-500 rounded-full transition-colors"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <BsX size={20} />
            </button>
          </div>

          <div className="p-4 h-[380px] overflow-y-auto">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <div>Đang tải tin nhắn...</div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BsChatDots size={48} className="mx-auto mb-2 opacity-50" />
                  <div>Chưa có tin nhắn nào</div>
                  <div className="text-sm">Hãy gửi tin nhắn đầu tiên!</div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-4 ${
                    msg.sender_type === "admin" ? "text-left" : "text-right"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg inline-block max-w-[80%] ${
                      msg.sender_type === "admin"
                        ? "bg-gray-100"
                        : "bg-blue-500 text-white"
                    } ${msg.temp ? "opacity-70" : ""}`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                    {msg.temp && (
                      <span className="ml-2 text-blue-500">Đang gửi...</span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t border-gray-200">
            <div className="flex items-center w-full gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleSendMessage();
                  }
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendMessage}
                disabled={loading || inputMessage.trim() === ""}
              >
                <BsSend size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative ">
          <div className="animate-ping h-14 w-14 rounded-full bg-blue-500 opacity-75 absolute "></div>
          <button
            onClick={toggleChatWindow}
            className="z-10 h-14 w-14 relative outline-none rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-500 transition-colors flex items-center justify-center"
          >
            <BsChatDots size={24} />
          </button>
          {notification > 0 && (
            <span className="absolute -top-2 -right-2 z-20 items-center justify-center rounded-full text-sm font-bold text-white bg-red-500 w-6 h-6 flex">
              {notification}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

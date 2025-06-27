import { useEffect, useState, useRef, useCallback } from "react";
import { HiOutlinePaperAirplane } from "react-icons/hi2";
import {
  getChatAdminDetail,
  getChatAdminRender,
  sendMessageAdmin,
} from "../../../service/server/messger_admin";
import { apiService } from "../../../service/apiService";
import Cookies from "js-cookie";

const ChatMessages = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesCache, setMessagesCache] = useState(new Map());
  const intervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const apiKey = Cookies.get("admin_apikey");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Cache messages để tránh gọi API không cần thiết
  const getCachedMessages = useCallback((userId) => {
    return messagesCache.get(userId) || [];
  }, [messagesCache]);

  const setCachedMessages = useCallback((userId, messages) => {
    setMessagesCache(prev => new Map(prev.set(userId, messages)));
  }, []);

  // Fetch users chỉ 1 lần khi component mount với caching
  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      if (loading) return; // Prevent multiple calls

      setLoading(true);
      try {
        const data = await apiService.getChatAdminUsers();
        if (isMounted && data.data) {
          setUsers(data.data.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []); // Chỉ chạy 1 lần khi mount

  // Fetch messages khi chọn user mới - FIXED: Remove dependencies causing re-renders
  useEffect(() => {
    if (!selectedUser) {
      // Clear interval khi không có user được chọn
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setMessages([]);
      return;
    }

    let isMounted = true;
    let fetchInProgress = false; // Prevent concurrent fetches

    const fetchMessages = async (forceRefresh = false) => {
      if (fetchInProgress) {
        console.log('Fetch already in progress, skipping...');
        return;
      }

      fetchInProgress = true;

      try {
        // Kiểm tra cache trước nếu không force refresh
        if (!forceRefresh) {
          const cachedMessages = messagesCache.get(selectedUser.id);
          if (cachedMessages && cachedMessages.length > 0) {
            console.log('Using cached messages for user:', selectedUser.id);
            setMessages(cachedMessages);
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
            fetchInProgress = false;
            return;
          }
        }

        console.log('Fetching messages for user:', selectedUser.id, forceRefresh ? '(force refresh)' : '');

        // Fetch messages mới
        const data = await getChatAdminDetail(selectedUser.id);

        if (isMounted && data.data) {
          setMessages(data.data.messages);
          setMessagesCache(prev => new Map(prev.set(selectedUser.id, data.data.messages)));
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        fetchInProgress = false;
      }
    };

    // Clear interval cũ trước khi tạo mới
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Fetch messages ngay lập tức
    fetchMessages(false);

    // Tạo interval mới với thời gian dài hơn để giảm tải
    intervalRef.current = setInterval(() => {
      if (!isMounted || !selectedUser) return;
      fetchMessages(true); // Force refresh trong interval
    }, 8000); // Tăng lên 8 giây để giảm tải hơn nữa

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedUser?.id]); // CHỈ depend vào selectedUser.id

  // Auto scroll khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Gửi tin nhắn với optimistic update
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedUser) return;

    const tempMessage = {
      id: Date.now(), // Temporary ID
      content: message,
      sender_type: "admin",
      created_at: new Date().toISOString(),
      temp: true // Flag để đánh dấu tin nhắn tạm
    };

    // Optimistic update - thêm tin nhắn vào UI ngay lập tức
    const updatedMessages = [...messages, tempMessage];
    setMessages(updatedMessages);
    setCachedMessages(selectedUser.id, updatedMessages);
    setMessage("");
    scrollToBottom();

    try {
      const data = await sendMessageAdmin(selectedUser, tempMessage.content, apiKey);

      if (data.ok) {
        // Refresh messages để lấy tin nhắn thực từ server
        const { data: refreshData } = await getChatAdminDetail(selectedUser.id);
        setMessages(refreshData.messages);
        setCachedMessages(selectedUser.id, refreshData.messages);
      } else {
        // Nếu gửi thất bại, remove tin nhắn tạm
        const filteredMessages = messages.filter(msg => msg.id !== tempMessage.id);
        setMessages(filteredMessages);
        setCachedMessages(selectedUser.id, filteredMessages);
        setMessage(tempMessage.content); // Restore message
        console.error("Failed to send message:", data.message);
      }
    } catch (error) {
      // Nếu có lỗi, remove tin nhắn tạm và restore
      const filteredMessages = messages.filter(msg => msg.id !== tempMessage.id);
      setMessages(filteredMessages);
      setCachedMessages(selectedUser.id, filteredMessages);
      setMessage(tempMessage.content);
      console.error("Error sending message:", error);
    }
  }, [message, selectedUser, messages, setCachedMessages, scrollToBottom]);

  // Memoized notification component
  const CheckNotification = useCallback(({ status }) => {
    if (!status?.unread_count || status.unread_count < 1) return null;
    return (
      <span className="bg-blue-600 text-white rounded-full px-2 py-1 text-xs">
        {status.unread_count}
      </span>
    );
  }, []);

  // Memoized user selection handler
  const handleUserSelect = useCallback((user) => {
    if (selectedUser?.id === user.id) return; // Prevent unnecessary re-selection
    setSelectedUser(user);
  }, [selectedUser]);
  return (
    <div className="flex h-full bg-gray-100">
      {/* User list */}
      <div className="w-1/4 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Support Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUser?.id === user.id ? "bg-blue-100 border-r-4 border-blue-600" : ""
                }`}
              >
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      selectedUser?.id === user.id ? "text-blue-600" : ""
                    }`}>
                      {user.username}
                    </span>
                    <CheckNotification status={user} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold">{selectedUser.username}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Chưa có tin nhắn nào
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-4 ${
                      message.sender_type === "admin"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_type === "admin"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200"
                      } ${message.temp ? "opacity-70" : ""}`}
                    >
                      <p>{message.content}</p>
                      <span className="text-xs mt-1 block opacity-70">
                        {new Date(message.created_at).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit"
                        })}
                      </span>
                      {message.temp && (
                        <span className="text-xs block opacity-50">Đang gửi...</span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-600"
                >
                  <HiOutlinePaperAirplane className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Chọn một cuộc hội thoại để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;

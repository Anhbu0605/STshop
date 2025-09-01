import { useEffect, useState, useRef, useCallback } from "react";
import { HiOutlinePaperAirplane } from "react-icons/hi2";
import {
  getChatAdminDetail,
  getChatAdminRender,
  sendMessageAdmin,
} from "../../../service/server/messger_admin";
import { apiMonitor } from "../../../utils/apiMonitor";
import Cookies from "js-cookie";

const ChatMessages = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const messagesCache = useRef(new Map());
  const intervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastFetchTime = useRef(0);
  const apiKey = Cookies.get("admin_apikey");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Throttle function để tránh gọi API quá nhanh
  const throttleApiCall = useCallback((func, delay = 2000) => {
    const now = Date.now();
    if (now - lastFetchTime.current < delay) {
      console.log('API call throttled, too soon since last call');
      return Promise.resolve(null);
    }
    lastFetchTime.current = now;
    return func();
  }, []);

  // Fetch users chỉ 1 lần khi component mount
  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      if (loading) return;

      setLoading(true);
      try {
        // Track API call
        if (!apiMonitor.shouldAllowCall('/message_admin', 'GET')) {
          console.warn('Users API call blocked by monitor');
          return;
        }

        apiMonitor.trackCall('/message_admin', 'GET');
        console.log('Fetching users list...');
        const { data } = await getChatAdminRender();
        if (isMounted && data) {
          setUsers(data.users);
          console.log('Users loaded:', data.users.length);
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

  // Fetch messages khi chọn user mới - COMPLETELY REWRITTEN
  useEffect(() => {
    // Clear interval và reset state khi không có user
    if (!selectedUser) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setMessages([]);
      setFetchingMessages(false);
      return;
    }

    let isMounted = true;

    // Function để fetch messages với proper throttling
    const fetchMessages = async (isInitial = false) => {
      // Prevent concurrent calls
      if (fetchingMessages && !isInitial) {
        console.log('Already fetching messages, skipping...');
        return;
      }

      // Throttle API calls (minimum 3 seconds between calls)
      if (!isInitial) {
        const endpoint = `/detail_message_user/${selectedUser.id}`;

        // Check with API monitor
        if (!apiMonitor.shouldAllowCall(endpoint, 'GET')) {
          console.log('Messages API call blocked by monitor');
          return;
        }

        const result = await throttleApiCall(async () => {
          apiMonitor.trackCall(endpoint, 'GET');
          return getChatAdminDetail(selectedUser.id);
        }, 3000);

        if (!result) return; // Throttled

        if (isMounted && result.data) {
          const newMessages = result.data.messages;
          // Only update if messages actually changed
          setMessages(prevMessages => {
            if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
              console.log('Messages updated for user:', selectedUser.id);
              messagesCache.current.set(selectedUser.id, newMessages);
              setTimeout(scrollToBottom, 100);
              return newMessages;
            }
            return prevMessages;
          });
        }
        return;
      }

      // Initial fetch
      setFetchingMessages(true);

      try {
        // Check cache first
        const cached = messagesCache.current.get(selectedUser.id);
        if (cached && cached.length > 0) {
          console.log('Using cached messages for user:', selectedUser.id);
          setMessages(cached);
          setTimeout(scrollToBottom, 100);
          setFetchingMessages(false);
          return;
        }

        console.log('Initial fetch for user:', selectedUser.id);
        const endpoint = `/detail_message_user/${selectedUser.id}`;
        apiMonitor.trackCall(endpoint, 'GET');
        const data = await getChatAdminDetail(selectedUser.id);

        if (isMounted && data.data) {
          setMessages(data.data.messages);
          messagesCache.current.set(selectedUser.id, data.data.messages);
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        if (isMounted) {
          setFetchingMessages(false);
        }
      }
    };

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Initial fetch
    fetchMessages(true);

    // Set up polling interval (longer interval to reduce load)
    intervalRef.current = setInterval(() => {
      if (isMounted && selectedUser) {
        fetchMessages(false);
      }
    }, 10000); // 10 seconds interval

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedUser?.id, throttleApiCall, scrollToBottom]); // Minimal dependencies

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

  // Memoized user selection handler với debouncing
  const handleUserSelect = useCallback((user) => {
    if (selectedUser?.id === user.id) {
      console.log('Same user selected, ignoring...');
      return;
    }

    console.log('Selecting user:', user.id, user.username);

    // Clear any pending operations
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setSelectedUser(user);
  }, [selectedUser?.id]); // Only depend on ID
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

import { useState } from "react";
import { detailOrder } from "../../service/server/oder";
import { FaClock, FaDollarSign, FaRedoAlt, FaStar } from "react-icons/fa";
import { ImCancelCircle } from "react-icons/im";
import OrderDetailModal from "./Modal_history";
import Model_Cancel from "./Model_Cancel";
import ReviewModal from "./Review";
import { addCart } from "../../service/cart_client";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "yellow";
    case "cancel":
      return "red";
    case "completed":
      return "green";
    case "delivery":
      return "blue";
    case "preparing":
      return "purple";
    default:
      return "gray";
  }
};

export default function OrderCard({ order }) {
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const thumbnailImage = order.products[0]?.image_url || "";
  const isActive = ["pending", "preparing", "delivery"].includes(
    order.status.toLowerCase()
  );
  const [orderData, setOrderData] = useState(null);
  const [showModalCancel, setShowModalCancel] = useState(false);
  const handleGetOrderDetail = async (order_id) => {
    const result = await detailOrder(order_id);
    setOrderData(result.data);
  };
  const [Id, orderId] = useState("");
  const apiKey = useSelector((state) => state.login.apikey);

  const hanleAddcart = async (oder) => {
    console.log("oder", oder);
    toast.dismiss();
    setIsLoading(true);
    let result = {};
    for (let i = 0; i < oder.length; i++) {
      result = await addCart(apiKey, {
        id: oder[i].product_id,
        size: oder[i].size,
        color: oder[i].color,
      });
    }

    setIsLoading(false);
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden my-8 hover:shadow-xl transition-shadow duration-300">
        <div className="md:flex">
          <div className="md:w-1/3 relative overflow-hidden group">
            <img
              src={thumbnailImage}
              alt="Order thumbnail"
              className="w-full h-[20rem] object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="p-8 md:w-2/3 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                  setShowModal(true);
                  handleGetOrderDetail(order.order_id);
                }}
              >
                <span className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  Đơn hàng #{order.order_id}
                </span>
              </div>

              <span
                className={`${
                  isActive ? "animate-pulse" : ""
                } px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                  getStatusColor(order.status) === "yellow"
                    ? "bg-yellow-400 text-yellow-900"
                    : getStatusColor(order.status) === "red"
                    ? "bg-red-500 text-white"
                    : getStatusColor(order.status) === "green"
                    ? "bg-green-500 text-white"
                    : getStatusColor(order.status) === "blue"
                    ? "bg-blue-500 text-white"
                    : "bg-purple-500 text-white"
                }`}
              >
                {order.status
                  .toLocaleLowerCase()
                  .replace("completed", "Hoàn thành")
                  .replace("pending", "Chờ xác nhận")
                  .replace("preparing", "Đang chuẩn bị")
                  .replace("delivery", "Đang giao")
                  .replace("cancel", "Đã hủy")}
              </span>
            </div>

            <div className="prose prose-lg max-w-none">
              {order.status.toLocaleLowerCase() !== "cancel" ? (
                <p className="text-gray-600 leading-relaxed">
                  Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng
                  tôi. Chúng tôi rất vinh dự được phục vụ quý khách và cam kết
                  mang đến những trải nghiệm ẩm thực tuyệt vời nhất.
                </p>
              ) : (
                <p className="text-gray-600 leading-relaxed">
                  Chúng tôi thành thật xin lỗi vì sự bất tiện này. Rất tiếc phải
                  thông báo đơn hàng của quý khách đã bị hủy. Chúng tôi luôn cố
                  gắng cải thiện dịch vụ và mong rằng quý khách sẽ tiếp tục ủng
                  hộ trong những lần tiếp theo.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-lg">
                <FaClock
                  className={`w-5 h-5 mr-2 text-${getStatusColor(
                    order.status
                  )}-500`}
                />
                <span>{order.created_at}</span>
              </div>

              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-lg">
                <FaDollarSign className="w-5 h-5 mr-2 text-green-500" />
                <span className="font-bold text-gray-800">
                  {parseInt(order.total_price).toLocaleString()}đ
                </span>
              </div>
            </div>

            {!isActive && (
              <div className="flex flex-wrap gap-4 mt-6">
                <button
                  onClick={() => hanleAddcart(order.products)}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <FaRedoAlt className="mr-2" />
                  )}
                  Đặt lại
                </button>

                {order.review && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <FaStar className="mr-2" />
                    Đánh Giá
                  </button>
                )}
              </div>
            )}

            {isActive && (
              <button
                disabled={["preparing", "delivery"].includes(
                  order.status.toLowerCase()
                )}
                onClick={() => {
                  setShowModalCancel(true);
                  orderId(order.order_id);
                }}
                className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                  ["preparing", "delivery"].includes(order.status.toLowerCase())
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                <ImCancelCircle className="mr-2" />
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <OrderDetailModal
          order={orderData}
          onClose={() => setShowModal(false)}
        />
      )}

      <Model_Cancel
        isOpen={showModalCancel}
        onClose={() => setShowModalCancel(false)}
        order_id={Id}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={order}
      />
    </>
  );
}

/* eslint-disable react/prop-types */
import React from "react";

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <span
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></span>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl transform transition-all duration-300 ease-in-out hover:scale-[1.02]">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chi tiết đơn hàng #{order.order_id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition-colors duration-300"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="border-b pb-6 hover:border-blue-500 transition-colors duration-300">
              <h3 className="font-bold text-xl mb-3 text-blue-600">
                Thông tin đơn hàng
              </h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Ngày đặt:</span>
                  <span className="text-gray-600">{order.created_at}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Trạng thái:</span>
                  <span className="px-3 py-1 rounded-full text-white bg-blue-500">
                    {order.order_status
                      .toLocaleLowerCase()
                      .replace("pending", "Chờ xác nhận")
                      .replace("preparing", "Đang chuẩn bị")
                      .replace("delivery", "Đang giao")
                      .replace("completed", "Hoàn thành")
                      .replace("cancel", "Đã hủy")}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Ghi chú:</span>
                  <span className="italic text-gray-600">
                    {order.shipping_info.note || "Không có ghi chú"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Tổng tiền:</span>
                  <span className="text-green-600 font-semibold">
                    {parseInt(order.total_price).toLocaleString()}đ
                  </span>
                </p>
              </div>
            </div>

            <div className="border-b pb-6 hover:border-blue-500 transition-colors duration-300">
              <h3 className="font-bold text-xl mb-3 text-blue-600">
                Thông tin giao hàng
              </h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Địa chỉ:</span>
                  <span className="text-gray-600">
                    {order.shipping_info.address}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Số điện thoại:</span>
                  <span className="text-gray-600">
                    {order.shipping_info.phone}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-b pb-6 hover:border-blue-500 transition-colors duration-300">
              <h3 className="font-bold text-xl mb-3 text-blue-600">
                Thông tin thanh toán
              </h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Phương thức:</span>
                  <span className="px-3 py-1 rounded-full bg-gray-100">
                    {order.payment.payment_method === "cash"
                      ? "Tiền mặt"
                      : "Thẻ tín dụng"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Mã giảm giá:</span>
                  <span className="text-orange-500">
                    {order.discount.code || "Không có"}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-4 text-blue-600">
                Sản phẩm ({order.products.length})
              </h3>
              <div className="space-y-4">
                {order.products.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 rounded-lg border hover:border-blue-500 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg mb-2">
                        {product.product_name}
                      </p>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          Số lượng:{" "}
                          <span className="font-medium">
                            {product.quantity}
                          </span>{" "}
                          x{" "}
                          <span className="text-green-600">
                            {parseInt(product.price).toLocaleString()}đ
                          </span>
                        </p>
                        <p className="flex items-center gap-3">
                          <span className="text-gray-600">
                            Size:{" "}
                            <span className="font-medium">{product.size}</span>
                          </span>
                          <span className="text-gray-600 flex items-center">
                            Màu:
                            <div
                              className="w-5 h-5 rounded-full ml-2 border-2 border-gray-200"
                              style={{
                                backgroundColor: product.color,
                              }}
                            ></div>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

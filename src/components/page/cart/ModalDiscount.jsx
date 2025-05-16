import React from "react";
import Modal from "./Modal";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { getUiDiscountUser } from "../../../service/discount/discount_user";
import { FaTag, FaClock, FaShoppingCart, FaUser } from "react-icons/fa";

const DiscountButton = ({ code, subtotal, onApply }) => {
  const handleClick = () => {
    if (subtotal < code.minimum_price) {
      toast.dismiss();
      toast.error(`Đơn hàng tối thiểu ${code.minimum_price.toLocaleString()}₫`);
      return;
    }

    if (code.quantity <= 0) {
      toast.dismiss();
      toast.error("Mã giảm giá đã hết lượt sử dụng!");
      return;
    }

    onApply(code);
  };

  return (
    <button
      key={code.id}
      onClick={handleClick}
      className="w-full text-left p-4 hover:bg-blue-50 border border-gray-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FaTag className="text-blue-500" />
            <span className="font-bold text-lg">{code.code}</span>
          </div>
          <p className="text-gray-700 font-medium">{code.name}</p>
          <p className="text-gray-600 text-sm">{code.description}</p>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaShoppingCart className="text-gray-400" />
              <span>Đơn tối thiểu: {code.minimum_price.toLocaleString()}₫</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaClock className="text-gray-400" />
              <span>Thời gian còn lại: {code.days_remaining} ngày</span>
            </div>
          </div>

          {code.days_remaining < 0 && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
              {code.message}
            </p>
          )}

          {code.isUserSpecific && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg w-fit">
              <FaUser />
              <span>Giảm giá dành cho riêng bạn</span>
            </div>
          )}
        </div>

        <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-bold text-lg">
          -{code.discount_percent}%
        </div>
      </div>
    </button>
  );
};

const ModalDiscount = ({
  isOpen,
  onClose,
  discountSystem,
  subtotal,
  onApplyDiscount,
}) => {
  const [discountsUser, setDiscountsUser] = useState([]);
  const profile = useSelector((state) => state.profile.profile);

  useEffect(() => {
    const fetchUserDiscounts = async () => {
      try {
        const response = await getUiDiscountUser(profile.id);
        const formattedDiscounts = response.data.discounts.map((discount) => ({
          ...discount,
          isUserSpecific: true,
          days_remaining: Math.ceil(
            (new Date(discount.valid_to) - new Date()) / (1000 * 60 * 60 * 24)
          ),
          message: discount.days_remaining < 0 ? "Mã giảm giá đã hết hạn" : "",
        }));
        setDiscountsUser(formattedDiscounts);
      } catch (error) {
        toast.error("Không thể tải mã giảm giá người dùng");
      }
    };

    if (profile?.id) {
      fetchUserDiscounts();
    }
  }, [profile]);

  const handleApplyDiscount = (code) => {
    if (subtotal < code.minimum_price) {
      toast.error(`Đơn hàng tối thiểu ${code.minimum_price.toLocaleString()}₫`);
      return;
    }
    if (code.quantity <= 0) {
      toast.error("Mã giảm giá đã hết lượt sử dụng!");
      return;
    }

    onApplyDiscount({
      code: code.code,
      discountPercent: code.discount_percent / 100,
      minOrderValue: code.minimum_price,
    });

    toast.success("Áp dụng mã giảm giá thành công!");
    onClose();
  };

  const validDiscounts = [
    ...(discountsUser || []),
    ...(discountSystem || []),
  ].filter((code) => code.days_remaining > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mã giảm giá">
      <div className="space-y-4 p-2">
        {validDiscounts.length > 0 ? (
          validDiscounts.map((code) => (
            <DiscountButton
              key={code.id}
              code={code}
              subtotal={subtotal}
              onApply={handleApplyDiscount}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <FaTag className="text-gray-400 text-4xl mx-auto mb-3" />
            <p className="text-gray-500 text-lg">
              Không có mã giảm giá khả dụng
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalDiscount;

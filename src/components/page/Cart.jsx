/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import Nav from "../header/Nav";
import PageFooter from "../footer/PageFooter";
import { FaTrashAlt, FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import SupportChat from "../messger/SupportChat";
import { useDispatch, useSelector } from "react-redux";
import { getCartRender } from "../../redux/middlewares/client/cart_middleware";
import Loading from "../util/Loading";
import { toast } from "react-toastify";
import {
  getCartDelete,
  getCartDeleteQuantity,
  addCart,
} from "../../service/cart_client";
import PayCart from "./cart/PayCart";
import { Link } from "react-router-dom";

// Helper functions
const calculateItemPrice = (item) => {
  const basePrice = item.price * item.quantity;
  const discountAmount = (basePrice * item.discount) / 100;
  return basePrice - discountAmount;
};

const calculateTotalPrice = (items) => {
  return items.reduce((sum, item) => {
    const basePrice = item.price * item.quantity;
    const discountAmount = (basePrice * item.discount) / 100;
    return sum + (basePrice - discountAmount);
  }, 0);
};

// Cart Item Component
const CartItem = ({
  item,
  onDelete,
  onUpdateQuantity,
  onDeleteQuantity,
  isSelected,
  onSelect,
}) => {
  const itemPrice = calculateItemPrice(item);
  const discountAmount = (item.price * item.quantity * item.discount) / 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 transition-all hover:shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4">
        <div className="flex items-center mb-4 sm:mb-0">
          {item.warning && (
            <input
              type="checkbox"
              className="w-5 h-5 mr-3 accent-blue-500"
              checked={isSelected}
              onChange={() => onSelect(item.id)}
            />
          )}
          <img
            src={item.image_url}
            alt={item.product_name}
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
          />
        </div>

        <div className="flex-grow">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
            {item.product_name}
          </h3>

          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Màu:</span>
              <span
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-200"
                style={{ backgroundColor: item.color.toLowerCase() }}
              ></span>
            </div>

            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Kích cỡ:</span>
              <span className="font-medium">{item.size}</span>
            </div>
          </div>

          {item.discount > 0 && (
            <div className="bg-red-50 rounded-lg p-2 mb-3 inline-block text-sm sm:text-base">
              <p className="text-red-600 font-medium">Giảm: {item.discount}%</p>
              <p className="text-green-600">
                Tiết kiệm: {discountAmount.toLocaleString("vi-VN")}₫
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-3">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {itemPrice.toLocaleString("vi-VN")}₫
            </p>

            <div className="flex items-center justify-between sm:space-x-4">
              {item.warning ? (
                <div className="flex items-center bg-gray-100 rounded-lg">
                  <button
                    className="p-2 hover:bg-gray-200 rounded-l-lg"
                    onClick={() => onDeleteQuantity(item)}
                  >
                    <FaMinus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <span className="px-4 sm:px-6 font-medium">
                    {item.quantity}
                  </span>
                  <button
                    className="p-2 hover:bg-gray-200 rounded-r-lg"
                    onClick={() => onUpdateQuantity(item)}
                  >
                    <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-red-500 font-bold text-sm sm:text-base">
                  Hết hàng
                </span>
              )}

              <button
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                onClick={() => onDelete(item.id)}
              >
                <FaTrashAlt className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Cart Component
export default function Cart() {
  const dispatch = useDispatch();
  const DataCart = useSelector((state) => state.cart.cartItems);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const apiKey = useSelector((state) => state.login.apikey);

  const fetchCart = async () => {
    try {
      await dispatch(getCartRender(apiKey));
    } catch (error) {
      toast.error("Lỗi khi tải giỏ hàng!");
    }
  };

  useEffect(() => {
    fetchCart();
  }, [apiKey]);

  useEffect(() => {
    if (DataCart) {
      const availableItems = DataCart.filter((item) => item.warning);
      const initialSelected = availableItems.map((item) => item.id);
      setSelectedItems(initialSelected);
    }
  }, [DataCart]);

  useEffect(() => {
    if (DataCart) {
      const selectedProducts = DataCart.filter((item) =>
        selectedItems.includes(item.id)
      );
      const total = calculateTotalPrice(selectedProducts);
      setTotalPrice(total);
    }
  }, [selectedItems, DataCart]);

  const handleCheckboxChange = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const handleSelectAll = () => {
    if (DataCart) {
      const availableItems = DataCart.filter((item) => item.warning);
      if (selectedItems.length === availableItems.length) {
        setSelectedItems([]);
      } else {
        const allAvailableIds = availableItems.map((item) => item.id);
        setSelectedItems(allAvailableIds);
      }
    }
  };

  const handleUpdateQuantity = async (item) => {
    toast.dismiss();
    try {
      const updateItem = await addCart(apiKey, {
        id: item.product_id,
        size: item.size,
        color: item.color,
      });

      if (updateItem.ok) {
        await fetchCart();
      } else {
        toast.error(updateItem.message);
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật số lượng!");
    }
  };

  const handleDeleteQuantity = async (item) => {
    toast.dismiss();
    try {
      if (item.quantity === 1) {
        if (!confirm("Xóa sản phẩm này khỏi giỏ hàng?")) return;
      }
      await getCartDeleteQuantity(item.id);
      await fetchCart();
    } catch (error) {
      toast.error("Lỗi khi giảm số lượng!");
    }
  };

  const handleDelete = async (id) => {
    toast.dismiss();
    try {
      const deleteItem = await getCartDelete(id);
      if (deleteItem.ok) {
        toast.success(deleteItem.message);
        setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
        await fetchCart();
      } else {
        toast.error(deleteItem.message);
      }
    } catch (error) {
      toast.error("Lỗi khi xóa sản phẩm!");
    }
  };

  if (!DataCart) return <Loading />;

  const availableItems = DataCart.filter((item) => item.warning);
  const selectedItemsData = DataCart.filter((item) =>
    selectedItems.includes(item.id)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="fixed top-0 w-full z-50 bg-white shadow-md">
        <Nav />
        <SupportChat />
      </header>

      <main className="w-[95%] sm:w-[90%] mx-auto px-2 sm:px-4 pt-20 sm:pt-24 pb-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <FaShoppingCart className="mr-2 sm:mr-3" /> Giỏ hàng của bạn
              </h2>
              {availableItems.length > 0 && (
                <div className="flex items-center bg-white/20 rounded-lg px-3 sm:px-4 py-1 sm:py-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 accent-blue-500"
                    checked={
                      selectedItems.length === availableItems.length &&
                      availableItems.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                  <span className="text-sm sm:text-base text-white font-medium">
                    Chọn tất cả
                  </span>
                </div>
              )}
            </div>
          </div>

          {DataCart.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <img
                className="w-48 sm:w-64 mx-auto mb-6 sm:mb-8 opacity-50"
                src="https://web.nvnstatic.net/tp/T0213/img/tmp/cart-empty.png?v=3"
                alt="Giỏ hàng trống"
              />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-400 mb-4">
                Giỏ hàng của bạn đang trống
              </h2>
              <Link
                to="/products"
                className="inline-block bg-blue-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-2/3 p-4 sm:p-6">
                <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-2 sm:pr-4">
                  {DataCart.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onUpdateQuantity={handleUpdateQuantity}
                      onDeleteQuantity={handleDeleteQuantity}
                      isSelected={selectedItems.includes(item.id)}
                      onSelect={handleCheckboxChange}
                    />
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-1/3 bg-gray-50 p-4 sm:p-6 lg:sticky lg:top-24">
                {selectedItemsData.length > 0 && (
                  <PayCart items={selectedItemsData} totalPrice={totalPrice} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer>
        <PageFooter />
      </footer>
    </div>
  );
}

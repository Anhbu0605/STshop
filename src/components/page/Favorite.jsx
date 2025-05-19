import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";

import Nav from "../header/Nav";
import PageFooter from "../footer/PageFooter";
import { deleteFavorite, renderFavorite } from "../../service/favorite_api";
import { addCart } from "../../service/cart_client";
import { getDetailProduct } from "../../redux/middlewares/client/detailProduct";

export default function Favorite() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const profile = useSelector((state) => state.profile.profile);
  const dispatch = useDispatch();
  const apiKey = useSelector((state) => state.login.apikey);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const fetchFavorites = async () => {
    try {
      const data = await renderFavorite(profile?.id);
      setFavorites(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách yêu thích:", error);
      toast.error("Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (profile?.id) {
      fetchFavorites();
    }
  }, [profile]);

  // xóa sản phẩm yêu thích
  const handleUnfavorite = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm yêu thích?")) return;
    const data = await deleteFavorite(id);
    if (data.ok) {
      toast.success("Đã xóa sản phẩm yêu thích");
      fetchFavorites();
    } else {
      toast.error("Không thể xóa sản phẩm yêu thích");
    }
  };

  const handleAddToCart = async (product, size, color) => {
    toast.dismiss();
    const result = await addCart(apiKey, {
      id: product.id,
      size: size || "",
      color: color || "",
    });
    if (result.ok) {
      toast.success(result.message);
      setShowModal(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleOpenModal = async (productId) => {
    setSelectedSize("");
    setSelectedColor("");
    setShowModal(true);
    // Lấy chi tiết sản phẩm từ API detail
    const data = await dispatch(getDetailProduct(productId, 1));
    if (data && data.data) {
      setSelectedProduct(data.data);
    }
  };

  return (
    <div className="min-h-screen flex flex-col mt-[5rem]">
      <Nav />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Sản phẩm yêu thích</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : favorites.data.favorites.length < 1 ? (
          <div className="text-center py-12 absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2">
            <FaHeart className="mx-auto text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500 text-lg">
              Bạn chưa có sản phẩm yêu thích nào
            </p>
            <Link
              to="/food"
              className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.data.favorites.map((item) => (
              <div
                key={item.favorite_id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-[12rem] sm:h-[18rem]">
                  <Link
                    to={`/detail/${item.product.name
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/đ/g, "d")
                      .replace(/[^a-z0-9\s-]/g, "")
                      .replace(/\s+/g, "-")
                      .replace(/-+/g, "-")
                      .trim()}/${item.product.id}`}
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <span className="absolute top-2 right-2">
                    <FaHeart
                      className="text-red-500 text-xl"
                      onClick={() => handleUnfavorite(item.favorite_id)}
                    />
                  </span>
                </div>

                <div className="p-4">
                  <Link
                    to={`/detail/${item.product.name
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/đ/g, "d")
                      .replace(/[^a-z0-9\s-]/g, "")
                      .replace(/\s+/g, "-")
                      .replace(/-+/g, "-")
                      .trim()}/${item.product.id}`}
                  >
                    <h3 className="font-semibold text-lg mb-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3">
                    {item.product.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="text-blue-500 font-bold">
                      {parseInt(item.product.price).toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Đã thêm vào yêu thích:{" "}
                    {new Date(item.created_at).toLocaleDateString("vi-VN")}
                  </div>

                  <button
                    className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    onClick={() => handleOpenModal(item.product.id)}
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-80 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Chọn kích thước và màu sắc</h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Kích thước:</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
              >
                <option value="">Chọn size</option>
                {selectedProduct.size && selectedProduct.size.split(',').map(size => (
                  <option key={size.trim()} value={size.trim()}>{size.trim()}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Màu sắc:</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
              >
                <option value="">Chọn màu</option>
                {selectedProduct.type && selectedProduct.type.split(',').map(color => (
                  <option key={color.trim()} value={color.trim()}>{color.trim()}</option>
                ))}
              </select>
            </div>
            <button
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
              disabled={!selectedSize || !selectedColor}
              onClick={() => handleAddToCart(selectedProduct, selectedSize, selectedColor)}
            >
              Xác nhận thêm vào giỏ hàng
            </button>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}

/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import {
  FaCartPlus,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { getUiTopProduct } from "../../../service/ui/ui_topProduct";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { addCart } from "../../../service/cart_client";
import { useSelector } from "react-redux";

export default function TopProducts() {
  const [dataproduct, getDataProduct] = useState([]);
  const navigator = useNavigate();
  const scrollRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const apiKey = useSelector((state) => state.login.apikey);

  const scroll = (scrollOffset) => {
    scrollRef.current.scrollLeft += scrollOffset;
    setTimeout(checkScrollPosition, 100);
  };

  const checkScrollPosition = () => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setIsAtStart(scrollLeft === 0);
    setIsAtEnd(Math.ceil(scrollLeft + clientWidth) >= scrollWidth);
  };

  useEffect(() => {
    const ref = scrollRef.current;
    ref.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => {
      ref.removeEventListener("scroll", checkScrollPosition);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getUiTopProduct();
        if (!data.ok) {
          navigator("/error");
          return;
        }
        getDataProduct(data.data.products);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        navigator("/error");
      }
    }
    fetchData();
  }, [navigator]);

  const generateSeoUrl = (name, id) => {
    return `${name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()}/${id}`;
  };

  return (
    <div>
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            Sản phẩm được đặt nhiều nhất
          </h2>
          <div className="relative">
            {!isAtStart && (
              <button
                onClick={() => scroll(-500)}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg z-10 hover:bg-gray-100 transition duration-300"
                aria-label="Cuộn sang trái"
              >
                <FaChevronLeft className="text-gray-600" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto space-x-6 scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {dataproduct.map((product, index) => (
                <motion.div
                  key={index}
                  className="flex-shrink-0 w-64 md:w-80 bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/detail/${generateSeoUrl(product.name, product.id)}`}
                  >
                    <div className="relative overflow-hidden group">
                      <img
                        src={product.image_url}
                        alt={product.description}
                        className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1.5 text-sm font-bold rounded-full shadow-lg">
                          {product.discount}% GIẢM
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link
                      to={`/detail/${generateSeoUrl(product.name, product.id)}`}
                    >
                      <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-gray-500 line-through text-sm">
                          {product.price.toLocaleString("vi-VN")}đ
                        </p>
                        <p className="text-xl font-bold text-red-600">
                          {(
                            product.price *
                            (1 - product.discount / 100)
                          ).toLocaleString("vi-VN")}
                          đ
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FaStar className="text-yellow-400" />
                        <span className="font-medium">
                          {Number(product.average_rating).toFixed(1)}
                        </span>
                      </div>
                      <span className="font-medium">
                        {product.sold.toLocaleString()} đã bán
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {!isAtEnd && (
              <button
                onClick={() => scroll(500)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg z-10 hover:bg-gray-100 transition duration-300"
                aria-label="Cuộn sang phải"
              >
                <FaChevronRight className="text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

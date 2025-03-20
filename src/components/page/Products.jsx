/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsSearch } from "react-icons/bs"; // Thêm icon search
import Nav from "../header/Nav";
import Loading from "../util/Loading";
import RenderProduct from "./products/RenderProduct";
import PaginationPage from "./products/PaginationPage";
import SearchProduct from "./products/SearchProduct";
import SupportChat from "../messger/SupportChat";
import { getProducts } from "../../redux/middlewares/client/addProduct";
import PageFooter from "../footer/PageFooter";

const Products = () => {
  const dispatch = useDispatch();
  const dataProduct = useSelector((state) => state.product.products);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [productPay, setProductPay] = useState([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dispatch(getProducts("", page));
      setPage(data.data.pagination.total_pages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div className="bg-gray-100">
      <header>
        <Nav />
        <SupportChat />
      </header>
      {loading ? (
        <Loading />
      ) : (
        <>
          <main className="container m-auto px-2 sm:px-4 xl:w-[85%] sm:py-8">
            <div className="flex flex-col pt-[6rem] sm:flex-row justify-between items-center mb-4 sm:mb-8">
              <div className="w-full sm:w-auto">
                <div className="flex items-center relative">
                  <div className="absolute left-3 text-gray-400">
                    <BsSearch size={18} />
                  </div>
                  <SearchProduct />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {dataProduct.length > 0 ? (
                dataProduct.map((product) => (
                  <RenderProduct
                    key={product.id}
                    product={product}
                    idProduct={product.id}
                    data={setProductPay}
                    isOpen={setIsOpen}
                  />
                ))
              ) : (
                <p className="text-center col-span-full">
                  Không có sản phẩm nào hiện có...
                </p>
              )}
            </div>
          </main>

          <footer className="flex justify-center pb-4 sm:pb-6">
            {page > 1 && <PaginationPage page={page} />}
          </footer>
          <PageFooter />
        </>
      )}
    </div>
  );
};

export default Products;

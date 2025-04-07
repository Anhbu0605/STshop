import { FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import PageFooter from "../footer/PageFooter";
import Nav from "../header/Nav";
import TopProducts from "./home/TopProducts";
import { useEffect, useState } from "react";
import { getUiHeader } from "../../service/ui/ui_header";
import OrderingSteps from "./home/OrderingSteps";
import { useNavigate } from "react-router";
import Loading from "../util/Loading";
import SupportChat from "../messger/SupportChat";
import { useNavStore } from "../../zustand/nav";

export default function Home() {
  const [header, setHeader] = useState({});
  const navigate = useNavigate();
  const { value } = useNavStore();

  console.log(value, "value");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getUiHeader();
        if (!data.ok) {
          navigate("/error");
          throw new Error(data.message);
        }
        setHeader(data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, []);

  if (header === null) {
    <Loading />;
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header>
        <Nav />
        <SupportChat />
      </header>

      <main>
        <section className="relative h-screen">
          <img
            className="w-full h-full object-cover"
            src={header.websiteInfo?.logo_url}
            alt={`Banner ${header.websiteInfo?.site_name}`}
          />
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-start">
            <div className="container mx-auto px-4 sm:px-6 md:px-12 text-white">
              <motion.h1
                className="text-4xl sm:text-5xl md:text-9xl font-bold mb-4 sm:mb-8"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* {header.websiteInfo?.site_name} */}
                <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 relative overflow-hidden rounded-full shadow-lg border-4 border-white">
                  <img
                    src={value}
                    alt="logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.h1>

              <motion.p
                className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-3xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {header.websiteInfo?.site_slogan}
              </motion.p>

              <motion.div
                className="mb-6 sm:mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <p className="text-xl sm:text-4xl font-semibold mb-1">
                  {header.delivery?.title}
                </p>
                <p className="text-base sm:text-2xl flex gap-2">
                  <span className="font-semibold">Thời gian mở cửa:</span>
                  {header.websiteInfo?.opening_hours}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section>
          <TopProducts />
        </section>

        <section>
          <OrderingSteps />
        </section>
      </main>

      <footer>
        <PageFooter />
      </footer>
    </div>
  );
}

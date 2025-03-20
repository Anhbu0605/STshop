import { useEffect, useState } from "react";
import { getUiStep } from "../../../service/ui/ui_home_step";
import { DynamicIcon } from "../../util/iconLibraries";
import { Link } from "react-router-dom";

const OrderingSteps = () => {
  const [steps, setSteps] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const getStep = async () => {
      try {
        const response = await getUiStep();
        setTitle("Quy trình đặt hàng");

        const contentSteps = response.steps
          .filter((step) => step.step_number !== "0")
          .sort((a, b) => parseInt(a.order_number) - parseInt(b.order_number));

        setSteps(contentSteps);
      } catch (error) {
        console.error("Không thể tải các bước:", error);
      }
    };
    getStep();
  }, []);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Phần tiêu đề */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 inline-block relative">
            {title}
            <span className="absolute -bottom-5 left-0 w-full h-1 bg-blue-500 transform -translate-y-2 "></span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Hướng dẫn chi tiết giúp bạn đặt hàng nhanh chóng và thuận tiện
          </p>
        </div>

        {/* Timeline cho các bước */}
        <div className="relative">
          {/* Đường kẻ timeline */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200"></div>

          {/* Danh sách các bước */}
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Vòng tròn số bước */}
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 rounded-full bg-blue-600 text-white font-bold items-center justify-center z-10">
                  {step.step_number}
                </div>

                {/* Nội dung bước */}
                <div
                  className={`md:w-5/12 ${
                    index % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                  }`}
                >
                  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                        <DynamicIcon
                          iconName={step.icon}
                          size={24}
                          className="text-white"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                      <div className="md:hidden ml-auto w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {step.step_number}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>

                    {/* Nút với hiệu ứng hover */}
                    <div className="mt-4">
                      <button className="text-blue-600 text-sm font-medium flex items-center group">
                        <span>Tìm hiểu thêm</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="mt-16 text-center">
          <button className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 flex items-center mx-auto">
            <Link to="/products">Đặt hàng ngay</Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default OrderingSteps;

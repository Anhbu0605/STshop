import { useEffect, useState } from "react";
import { getUiAbout } from "../../service/ui/ui_about";
import PageFooter from "../footer/PageFooter";
import Nav from "../header/Nav";
import PropTypes from "prop-types";
import { DynamicIcon } from "../util/iconLibraries";
import SupportChat from "../messger/SupportChat";

const FeatureCard = ({ iconName, title, description }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300">
    <DynamicIcon iconName={iconName} size={50} className="text-blue-500 mb-4" />
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StandardItem = ({ text, iconName = "TiTick" }) => (
  <li className="flex items-center space-x-3 mb-3">
    <DynamicIcon iconName={iconName} size={20} className="text-blue-500" />
    <span className="text-gray-700">{text}</span>
  </li>
);

StandardItem.propTypes = {
  text: PropTypes.string.isRequired,
  iconName: PropTypes.string,
};

export default function About() {
  const [info, setInfo] = useState([]);
  const [session, setSession] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUiAbout();
        setSession(response.session);
        setInfo(response.Info);
      } catch (error) {
        console.error("Failed to fetch about info:", error);
      }
    };
    fetchData();
  }, []);

  const headerInfo = info[0] || {
    name: "",
    description: "",
    color: "",
    id: "",
  };
  const storyInfo = info[1] || { name: "", description: "", color: "", id: "" };

  const features = session.filter((item) => item.description && item.id <= 4);
  const standardsTitle =
    session.find((item) => item.id === "5")?.name || "Tiêu Chúng Tôi";
  const standards = session.filter((item) => item.id > 5 && item.name.trim());

  return (
    <>
      <header>
        <Nav />
        <SupportChat />
      </header>
      <div className="bg-gray-100 min-h-screen py-[6rem]">
        <div className="container mx-auto xl:w-[85%] px-4">
          <div className="p-8 mb-8">
            <h1 className="text-5xl font-bold text-center text-blue-500 mb-4">
              {headerInfo.name}
            </h1>
            <p className="text-center text-gray-600 text-lg">
              {headerInfo.description}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-blue-500 border-b-2 border-blue-200 pb-2">
              {storyInfo.name}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {storyInfo.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                iconName={feature.icon}
                title={feature.name}
                description={feature.description}
              />
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-blue-500 border-b-2 border-blue-200 pb-2">
              {standardsTitle}
            </h2>
            <ul className="space-y-2">
              {standards.map((standard) => (
                <StandardItem
                  key={standard.id}
                  text={standard.name}
                  iconName={standard.icon}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
      <PageFooter />
    </>
  );
}

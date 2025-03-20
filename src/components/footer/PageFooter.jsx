/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { getUiFooter } from "../../service/ui/ui_footer";
import { useNavigate } from "react-router";
import Loading from "../util/Loading";
import { DynamicIcon } from "../util/iconLibraries";

export default function PageFooter() {
  const [footer, setFooter] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getFooter = async () => {
      const res = await getUiFooter();
      if (!res?.ok) {
        navigate("/error");
        return;
      }
      setFooter(res);
    };
    getFooter();
  }, []);

  if (!footer && footer !== Array) {
    <Loading />;
    return null;
  }

  const { companyInfo, contactSection, socialMedia, footerLinks, newsletter } =
    footer;

  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100">
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-gray-100 mb-4">
            {companyInfo.name}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {companyInfo.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-300">
              Về Chúng Tôi
            </h3>
            <div className="flex space-x-4">
              {socialMedia.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  className="hover:text-gray-300 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DynamicIcon iconName={social.icon} className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-300">Liên Hệ</h3>
            <ul className="space-y-4">
              {contactSection.items
                .filter((item) => item.type !== "header")
                .map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center space-x-3 text-sm"
                  >
                    <DynamicIcon
                      iconName={item.icon}
                      className="w-5 h-5 text-gray-500"
                    />
                    <span>{item.content}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-300">Liên Kết</h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    className="text-sm hover:text-gray-300 transition-colors"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-300">
              {newsletter.title}
            </h3>
            <p className="text-sm text-gray-400">{newsletter.description}</p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder={newsletter.placeholder_text}
                className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded font-medium hover:opacity-90 transition-opacity"
              >
                {newsletter.button_text}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-400">{companyInfo.copyright_text}</p>
        </div>
      </div>
    </footer>
  );
}

import React, { useEffect, useState } from "react";
import {
  addContact,
  addSocialMedia,
  deleteContact,
  deleteSocialMedia,
  editContact,
  editSocialMedia,
  updateCompanyInfo,
} from "../../../service/server/layout/api_footer";
import { toast } from "react-toastify";
import { getUiFooter } from "../../../service/ui/ui_footer";
import { Link } from "react-router-dom";
import { MdCancel, MdDeleteForever, MdEdit, MdSave } from "react-icons/md";
import { DynamicIcon } from "../../../components/util/iconLibraries";

export default function FixFooter() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [copyright_text, setCopyrightText] = useState("");
  const [icon, setIcon] = useState("");
  const [link, setLink] = useState("");
  const [iconContact, setIconContact] = useState("");
  const [contentContact, setContentContact] = useState("");
  const [socialMedia, setSocialMedia] = useState([]);
  const [contact, setContact] = useState([]);
  const [editContactId, setEditContactId] = useState(null);
  const [editSocialId, setEditSocialId] = useState(null);
  const [btnEditSocial, setBtnEditSocial] = useState(false);
  const [btnEditContact, setBtnEditContact] = useState(false);
  const [editContactIcon, setEditContactIcon] = useState("");
  const [editContactContent, setEditContactContent] = useState("");
  const [editSocialIcon, setEditSocialIcon] = useState("");
  const [editSocialLink, setEditSocialLink] = useState("");

  const getFooter = async () => {
    const res = await getUiFooter();
    setName(res.companyInfo.name);
    setDescription(res.companyInfo.description);
    setCopyrightText(res.companyInfo.copyright_text);
    setSocialMedia(res.socialMedia);
    setContact(res.contactSection.items);
  };

  useEffect(() => {
    getFooter();
  }, []);

  const handleUpdateCompanyInfo = async (e) => {
    e.preventDefault();
    try {
      toast.dismiss();
      const response = await updateCompanyInfo({
        name,
        description,
        copyright_text,
      });
      if (response.ok) {
        toast.success("Cập nhật thông tin chân trang thành công");
      } else {
        toast.error("Cập nhật thông tin chân trang thất bại");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    }
  };

  const handleAddSocial = async (e) => {
    toast.dismiss();
    e.preventDefault();
    if (!icon || !link) {
      toast.error("Vui lòng nhập đẩy đủ thông tin");
      return;
    }
    const res = await addSocialMedia({
      platform: "",
      icon,
      url: link,
    });
    if (res.ok) {
      toast.success("Thêm mạng xã hội thành công");
      setIcon("");
      setLink("");
      getFooter();
    } else {
      toast.error("Thêm mạng xã hội thất bại");
    }
  };

  const handleDelSocial = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mạng xã hội này không?")) return;
    toast.dismiss();
    const res = await deleteSocialMedia(id);
    if (res.ok) {
      toast.success("Xóa mạng xã hội thành công");
      getFooter();
    } else {
      toast.error("Xóa mạng xã hội thất bại");
    }
  };

  const handleAddContact = async (e) => {
    toast.dismiss();
    e.preventDefault();
    if (!iconContact || !contentContact) {
      toast.error("Vui lòng nhập đẩy đủ thông tin");
      return;
    }
    const res = await addContact({
      title: "",
      icon: iconContact,
      content: contentContact,
      type: "",
    });
    if (res.ok) {
      toast.success("Thêm liên hệ thành công");
      setIconContact("");
      setContentContact("");
      getFooter();
    } else {
      toast.error("Thêm liên hệ thất bại");
    }
  };

  const handleDelContact = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa liên hệ này không?")) return;
    toast.dismiss();

    const res = await deleteContact(id);
    if (res.ok) {
      toast.success("Xóa liên hệ thành công");
      getFooter();
    } else {
      toast.error("Xóa liên hệ thất bại");
    }
  };

  const handleEditContact = async (id) => {
    toast.dismiss();
    setBtnEditContact(true);
    if (!editContactIcon || !editContactContent) {
      toast.error("Vui lòng nhập đẩy đủ thông tin");
      return;
    }
    const res = await editContact(id, {
      title: "",
      icon: editContactIcon,
      content: editContactContent,
      type: "",
    });
    if (res.ok) {
      toast.success("Sửa liên hệ thành công");
      setEditContactId(null);
      setEditContactContent("");
      setEditContactIcon("");
      getFooter();
    } else {
      toast.error("Sửa liên hệ thất bại");
    }
    setBtnEditContact(false);
  };

  const handleEditSocial = async (id) => {
    toast.dismiss();
    setBtnEditSocial(true);
    if (!editSocialIcon || !editSocialLink) {
      toast.error("Vui lòng nhập đẩy đủ thông tin");
      return;
    }
    const res = await editSocialMedia(id, {
      icon: editSocialIcon,
      url: editSocialLink,
      platform: "",
    });
    if (res.ok) {
      toast.success("Sửa mạng xã hội thành công");
      setEditSocialId(null);
      setEditSocialLink("");
      setEditSocialIcon("");
      getFooter();
    } else {
      toast.error("Sửa mạng xã hội thất bại");
    }
    setBtnEditSocial(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className=" mx-auto space-y-10">
        {/* Company Info Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-8 ">
            Thông Tin Chân Trang
          </h2>

          <form onSubmit={handleUpdateCompanyInfo} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-gray-700 font-medium block">
                  Tên công ty
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-200 outline-none"
                  placeholder="Nhập tên công ty"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-gray-700 font-medium block">
                  Bản quyền
                </label>
                <input
                  type="text"
                  value={copyright_text}
                  onChange={(e) => setCopyrightText(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-200 outline-none"
                  placeholder="Nhập bản quyền"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-gray-700 font-medium block">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-200 outline-none"
                placeholder="Nhập mô tả"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition duration-200 transform hover:scale-[1.02]"
            >
              Cập nhật thông tin
            </button>
          </form>
        </div>

        {/* Social Media Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-8">
            Mạng Xã Hội
          </h2>

          <Link
            to="https://react-icons.github.io/react-icons/"
            className="text-blue-600 hover:text-purple-600 transition-colors duration-200 block mb-6"
            target="_blank"
          >
            Xem danh sách icon tại đây
          </Link>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input
                type="text"
                placeholder="Tên icon..."
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-200 outline-none"
              />
              <input
                type="text"
                placeholder="Đường dẫn..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-200 outline-none"
              />
              <button
                onClick={handleAddSocial}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold hover:opacity-90 transition duration-200 transform hover:scale-[1.02]"
              >
                Thêm mới
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Icon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Tên Icon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Đường dẫn
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {socialMedia.map((item, index) =>
                    editSocialId === item.id ? (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <DynamicIcon iconName={item.icon} size={24} />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editSocialIcon}
                            onChange={(e) => setEditSocialIcon(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editSocialLink}
                            onChange={(e) => setEditSocialLink(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => setEditSocialId(null)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                            >
                              <MdCancel size={24} />
                            </button>
                            <button
                              onClick={() => handleEditSocial(item.id)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition duration-200"
                            >
                              {btnEditSocial ? "..." : <MdSave size={24} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <DynamicIcon iconName={item.icon} size={24} />
                        </td>
                        <td className="px-6 py-4 text-gray-700">{item.icon}</td>
                        <td className="px-6 py-4">
                          <Link
                            to={item.url}
                            target="_blank"
                            className="text-blue-600 hover:text-purple-600 transition-colors duration-200"
                          >
                            {item.url}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleDelSocial(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                            >
                              <MdDeleteForever size={24} />
                            </button>
                            <button
                              onClick={() => {
                                setEditSocialId(item.id);
                                setEditSocialIcon(item.icon);
                                setEditSocialLink(item.url);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition duration-200"
                            >
                              <MdEdit size={24} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-8">
            Thông Tin Liên Hệ
          </h2>

          <Link
            to="https://react-icons.github.io/react-icons/"
            className="text-blue-600 hover:text-purple-600 transition-colors duration-200 block mb-6"
            target="_blank"
          >
            Xem danh sách icon tại đây
          </Link>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input
                type="text"
                placeholder="Tên icon..."
                value={iconContact}
                onChange={(e) => setIconContact(e.target.value)}
                className="px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-200 outline-none"
              />
              <input
                type="text"
                placeholder="Nội dung..."
                value={contentContact}
                onChange={(e) => setContentContact(e.target.value)}
                className="px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition duration-200 outline-none"
              />
              <button
                onClick={handleAddContact}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold hover:opacity-90 transition duration-200 transform hover:scale-[1.02]"
              >
                Thêm mới
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Icon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Tên Icon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Thông tin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contact.map((item, index) => (
                    <tr key={index}>
                      {editContactId === item.id ? (
                        <>
                          <td className="px-6 py-4">
                            <DynamicIcon iconName={item.icon} size={24} />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editContactIcon}
                              onChange={(e) =>
                                setEditContactIcon(e.target.value)
                              }
                              className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editContactContent}
                              onChange={(e) =>
                                setEditContactContent(e.target.value)
                              }
                              className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditContactId(null)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                              >
                                <MdCancel size={24} />
                              </button>
                              <button
                                onClick={() => handleEditContact(item.id)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition duration-200"
                              >
                                {btnEditContact ? "..." : <MdSave size={24} />}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <DynamicIcon iconName={item.icon} size={24} />
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {item.icon}
                          </td>
                          <td className="px-6 py-4">{item.content}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleDelContact(item.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                              >
                                <MdDeleteForever size={24} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditContactId(item.id);
                                  setEditContactIcon(item.icon);
                                  setEditContactContent(item.content);
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition duration-200"
                              >
                                <MdEdit size={24} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { FaCopy, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { SePay } from "../../service/sePay";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import Loading from "../util/Loading";
import { addCartPay } from "../../service/cart_client";
import { Link } from "react-router-dom";

const PaySePay = () => {
  const dataPay = useSelector((state) => state.payqr.data);
  const [processedTransactions] = useState(new Set());

  const generateRandomContent = useCallback(() => {
    const prefix = "HD";
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}${timestamp}${random}`;
  }, []);

  const [paymentData, setPaymentData] = useState(() => {
    const initialData = {
      SO_TAI_KHOAN: "96247AB123456789",
      NGAN_HANG: "BIDV",
      TEN_NGUOI_NHAN: "BUI THI TRANG ANH",
      SO_TIEN: dataPay.total_price,
      NOI_DUNG: generateRandomContent(),
    };

    sessionStorage.setItem("paymentData", JSON.stringify(initialData));
    return initialData;
  });

  const [paymentStatus, setPaymentStatus] = useState({
    status: "pending",
    message: "Đang chờ thanh toán",
  });
  const [sePaysData, setSePaysData] = useState(null);
  const [remainingTime, setRemainingTime] = useState(
    Cookies.get("timeSePay") || "15:00"
  );
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [isOrderCreated, setIsOrderCreated] = useState(false);

  const handleCopyToClipboard = useCallback((text, label) => {
    toast.dismiss();
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  }, []);

  // Logic kiểm tra thanh toán và các useEffect giữ nguyên...
  const checkPaymentStatus = useCallback(async () => {
    toast.dismiss();
    if (!sePaysData || !paymentData || isOrderCreated) return false;

    const matchingPayment = sePaysData.find(
      (payment) =>
        payment.transferAmount === paymentData.SO_TIEN &&
        payment.transferType.includes(paymentData.NOI_DUNG) &&
        !processedTransactions.has(payment.referenceCode)
    );

    if (matchingPayment) {
      try {
        processedTransactions.add(matchingPayment.referenceCode);

        if (!isOrderCreated) {
          const result = await addCartPay(dataPay);
          if (result.ok) {
            setPaymentStatus({
              status: "success",
              message: "Thanh toán thành công",
            });
            toast.success("Thanh toán thành công");
            setIsOrderCreated(true);
            setIsTimerActive(false);

            sessionStorage.setItem("paymentCompleted", "true");
            sessionStorage.setItem(
              "processedTransaction",
              matchingPayment.referenceCode
            );

            return true;
          } else {
            processedTransactions.delete(matchingPayment.referenceCode);
            toast.error("Đã có lỗi xảy ra, liên hệ ngay với chúng tôi");
            return false;
          }
        }
      } catch (error) {
        processedTransactions.delete(matchingPayment.referenceCode);
        console.error("Error creating order:", error);
        toast.error("Đã có lỗi xảy ra, liên hệ ngay với chúng tôi");
        return false;
      }
    }
    return false;
  }, [sePaysData, paymentData, isOrderCreated, dataPay, processedTransactions]);

  useEffect(() => {
    const paymentCompleted = sessionStorage.getItem("paymentCompleted");
    const processedTransaction = sessionStorage.getItem("processedTransaction");

    if (paymentCompleted === "true" && processedTransaction) {
      setIsOrderCreated(true);
      setPaymentStatus({
        status: "success",
        message: "Thanh toán thành công",
      });
      setIsTimerActive(false);
      processedTransactions.add(processedTransaction);
    }
  }, []);

  const fetchSePaysData = useCallback(async () => {
    if (isOrderCreated) return;

    try {
      const data = await SePay();
      setSePaysData(data);
      await checkPaymentStatus();
    } catch (error) {
      console.error("Error fetching SePay data:", error);
      setPaymentStatus({
        status: "failed",
        message: "Lỗi tra cứu giao dịch",
      });
    }
  }, [checkPaymentStatus, isOrderCreated]);

  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setRemainingTime((prevTime) => {
        const [minutes, seconds] = prevTime.split(":").map(Number);
        const totalSeconds = minutes * 60 + seconds - 1;

        if (totalSeconds <= 0 || !isTimerActive) {
          clearInterval(interval);
          sessionStorage.removeItem("paymentData");
          setPaymentStatus({
            status: "failed",
            message: "Hết thời gian thanh toán",
          });
          setIsTimerActive(false);
          return "00:00";
        }

        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        const newTime = `${newMinutes}:${
          newSeconds < 10 ? "0" : ""
        }${newSeconds}`;

        Cookies.set("timeSePay", newTime);
        return newTime;
      });

      fetchSePaysData();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchSePaysData, isTimerActive]);

  useEffect(() => {
    return () => {
      if (paymentStatus.status !== "success") {
        sessionStorage.removeItem("paymentCompleted");
        sessionStorage.removeItem("processedTransaction");
      }
    };
  }, [paymentStatus.status]);

  if (!dataPay) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="container mx-auto p-4">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Thanh Toán Đơn Hàng
            </h1>
            <div
              className={`inline-block px-6 py-3 rounded-full ${
                paymentStatus.status === "pending"
                  ? "bg-blue-100 text-blue-700"
                  : paymentStatus.status === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {paymentStatus.status === "pending" && (
                <span className="animate-pulse">⏳</span>
              )}
              {paymentStatus.status === "success" && (
                <FaCheckCircle className="inline" />
              )}
              {paymentStatus.status === "failed" && (
                <FaExclamationCircle className="inline" />
              )}
              <span className="ml-2 font-medium">{paymentStatus.message}</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Panel - QR Code */}
            <div className="flex-1 bg-white rounded-3xl shadow-xl p-8 transform hover:scale-102 transition-transform">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-600 mb-6">
                  Quét Mã QR
                </h2>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl">
                  <img
                    src={`https://qr.sepay.vn/img?acc=${paymentData.SO_TAI_KHOAN}&bank=${paymentData.NGAN_HANG}&amount=${paymentData.SO_TIEN}&des=${paymentData.NOI_DUNG}`}
                    alt="QR Code"
                    className="mx-auto w-full max-w-xs rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Right Panel - Payment Details */}
            <div className="flex-1 bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
                Thông Tin Thanh Toán
              </h2>

              <div className="space-y-4">
                {Object.entries({
                  "👤 Người Nhận": "TEN_NGUOI_NHAN",
                  "💳 Số Tài Khoản": "SO_TAI_KHOAN",
                  "🏦 Ngân Hàng": "NGAN_HANG",
                  "💰 Số Tiền": "SO_TIEN",
                  "📝 Nội Dung": "NOI_DUNG",
                }).map(([label, key]) => (
                  <div
                    key={key}
                    className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">{label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-blue-600">
                          {paymentData[key]}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyToClipboard(paymentData[key], label)
                          }
                          className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                        >
                          <FaCopy className="text-blue-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {paymentStatus.status !== "success" && (
                  <div className="bg-blue-100 p-4 rounded-2xl mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">
                        ⏰ Thời gian còn lại
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {remainingTime}
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-8 flex justify-center items-center text-center">
                  {paymentStatus.status !== "success" && (
                    <Link
                      to="/carts"
                      onClick={() => {
                        setPaymentStatus({
                          status: "failed",
                          message: "Đã hủy thanh toán",
                        });
                        setIsTimerActive(false);
                      }}
                      className={`w-full py-4 rounded-2xl font-bold text-white transition-all bg-red-500 hover:bg-red-600`}
                    >
                      Hủy Thanh Toán
                    </Link>
                  )}
                </div>
                <div className="mt-8">
                  {paymentStatus.status === "success" && (
                    <Link
                      to="/history"
                      className="block text-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Xem lịch sử đơn hàng →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaySePay;

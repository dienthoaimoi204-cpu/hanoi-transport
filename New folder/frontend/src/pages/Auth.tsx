import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api";

// ===== TRANG ĐĂNG NHẬP =====
export const Login = ({ onLogin }: { onLogin: (user: any, token: string) => void }) => {
  const [email, setEmail] = useState("an@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await authService.login(email, password);
      onLogin(data.user, data.token);
      nav("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Đăng Nhập</h1>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap@email.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Mật khẩu</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300">
            Đăng nhập
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

// ===== TRANG ĐĂNG KÝ =====
export const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.register(fullName, email, password, phone);
      setMessage("Đăng ký thành công! Đang chuyển sang đăng nhập...");
      setTimeout(() => nav("/login"), 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Tạo Tài Khoản</h1>
        
        {message && <div className={`p-3 rounded-lg mb-4 text-sm text-center ${message.includes("thành công") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{message}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Họ tên</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nhap@email.com" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Mật khẩu</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Số điện thoại</label>
            <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 mt-2">
            Đăng ký
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};
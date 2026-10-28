import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api";

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
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 20 }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            style={{ width: "100%", padding: 6 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input
            style={{ width: "100%", padding: 6 }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "8px 16px" }}>Login</button>
      </form>
      <p>
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </div>
  );
};

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
      setTimeout(() => nav("/login"), 1000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 20 }}>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Họ tên</label>
          <input style={{ width: "100%", padding: 6 }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input style={{ width: "100%", padding: 6 }} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Mật khẩu</label>
          <input style={{ width: "100%", padding: 6 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Điện thoại</label>
          <input style={{ width: "100%", padding: 6 }} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button type="submit" style={{ padding: "8px 16px" }}>Đăng ký</button>
      </form>
      {message && <p>{message}</p>}
      <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </div>
  );
};
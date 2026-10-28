import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components";
import { Login, Register } from "./pages/Auth";
import {
  Home,
  Profile,
  BuyTicket,
  Payment,
  MyTickets,
  TicketDetail,
  History,
} from "./pages/Main";
import { authService } from "./api";

// ===== AUTH CONTEXT =====
interface AuthCtx {
  user: any;
  loading: boolean;
  setUser: (u: any) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthCtx>({} as AuthCtx);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then((me) =>
        setUser({ id: me.UserId, name: me.FullName, email: me.Email, role: me.Role })
      )
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ===== ROUTER =====
const AppRoutes = () => {
  const { user, loading, setUser, logout } = useAuth();

  const handleLogin = (u: any, token: string) => {
    localStorage.setItem("token", token);
    setUser(u);
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <Home user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route path="/profile" element={<ProtectedRoute user={user} loading={loading}><Profile /></ProtectedRoute>} />
      <Route path="/buy-ticket" element={<ProtectedRoute user={user} loading={loading}><BuyTicket /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute user={user} loading={loading}><Payment /></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute user={user} loading={loading}><MyTickets /></ProtectedRoute>} />
      <Route path="/tickets/:id" element={<ProtectedRoute user={user} loading={loading}><TicketDetail /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute user={user} loading={loading}><History /></ProtectedRoute>} />
    </Routes>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
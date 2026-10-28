import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ===== AUTH =====
export const authService = {
  login: async (email: string, password: string) =>
    (await api.post("/auth/login", { email, password })).data.data,
  register: async (fullName: string, email: string, password: string, phone?: string) =>
    (await api.post("/auth/register", { fullName, email, password, phone })).data.data,
  me: async () => (await api.get("/users/me")).data.data,
  updateMe: async (patch: { fullName?: string; phone?: string }) =>
    (await api.put("/users/me", patch)).data.data,
};

// ===== TICKET =====
export const ticketService = {
  listTypes: async () => (await api.get("/ticket-types")).data.data,
  myTickets: async () => (await api.get("/tickets/me")).data.data,
  detail: async (id: number) => (await api.get(`/tickets/${id}`)).data.data,
};

// ===== ORDER =====
export const orderService = {
  create: async (items: { ticketTypeId: number; quantity: number }[]) =>
    (await api.post("/orders", { items })).data.data,
  myOrders: async () => (await api.get("/orders/me")).data.data,
  detail: async (id: number) => (await api.get(`/orders/${id}`)).data.data,
};

// ===== PAYMENT =====
export const paymentService = {
  pay: async (orderId: number, method = "MOCK") =>
    (await api.post("/payments", { orderId, method })).data.data,
};

// ===== TRIP HISTORY =====
export const tripHistoryService = {
  create: async (payload: { origin: string; destination: string; routeData?: any }) =>
    (await api.post("/trip-histories", payload)).data.data,
  myHistories: async () => (await api.get("/trip-histories/me")).data.data,
};
import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  authService,
  ticketService,
  orderService,
  paymentService,
  tripHistoryService,
} from "../api";

// ===== 1. HOME =====
export const Home = ({ user, onLogout }: { user: any; onLogout: () => void }) => (
  <div style={{ padding: 20 }}>
    <h1>Xin chào, {user?.name}</h1>
    <ul>
      <li><Link to="/buy-ticket">Mua vé</Link></li>
      <li><Link to="/tickets">Vé của tôi</Link></li>
      <li><Link to="/history">Lịch sử (Đơn hàng & Chuyến đi)</Link></li>
      <li><Link to="/profile">Thông tin cá nhân</Link></li>
    </ul>
    <button onClick={onLogout} style={{ marginTop: 20 }}>Đăng xuất</button>
  </div>
);

// ===== 2. PROFILE =====
export const Profile = () => {
  const [me, setMe] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    authService.me().then((u) => {
      setMe(u);
      setFullName(u.FullName);
      setPhone(u.Phone || "");
    });
  }, []);

  const onSave = async () => {
    const updated = await authService.updateMe({ fullName, phone });
    setMe(updated);
    alert("Đã cập nhật thông tin thành công!");
  };

  if (!me) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Thông tin cá nhân</h2>
      <p><b>Email:</b> {me.Email} (Không thể thay đổi)</p>
      <div style={{ marginBottom: 8 }}>
        <label>Họ tên: </label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Số điện thoại: </label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button onClick={onSave} style={{ padding: "6px 12px" }}>Lưu thay đổi</button>
      <p style={{ marginTop: 20 }}><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};

// ===== 3. BUY TICKET (Chia Tab Vé Lượt / Vé Tháng) =====
export const BuyTicket = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const nav = useNavigate();

  useEffect(() => {
    ticketService.listTypes().then(setTypes);
  }, []);

  const onBuy = async () => {
    if (!selected) return alert("Vui lòng chọn loại vé!");
    const order = await orderService.create([{ ticketTypeId: selected, quantity: qty }]);
    nav(`/payment?orderId=${order.orderId}`);
  };

  const singleTickets = types.filter(t => t.Type === "SINGLE");
  const monthlyTickets = types.filter(t => t.Type === "MONTHLY");

  const renderTicketCard = (t: any) => (
    <div key={t.TicketTypeId} style={{ border: selected === t.TicketTypeId ? "2px solid blue" : "1px solid #ccc", padding: 10, marginBottom: 8, cursor: "pointer" }} onClick={() => setSelected(t.TicketTypeId)}>
      <input
        type="radio"
        name="ticket"
        checked={selected === t.TicketTypeId}
        onChange={() => setSelected(t.TicketTypeId)}
      />
      {" "}<b>{t.Name}</b> — {t.Price.toLocaleString()}đ
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Mua vé</h2>
      
      <h3>Vé Lượt (Sử dụng 1 lần)</h3>
      {singleTickets.map(renderTicketCard)}
      
      <h3>Vé Tháng (Sử dụng 30 ngày)</h3>
      {monthlyTickets.map(renderTicketCard)}

      <div style={{ marginTop: 20 }}>
        <label>Số lượng: </label>
        <input type="number" min={1} max={10} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: 60 }} />
      </div>
      
      <button onClick={onBuy} style={{ marginTop: 20, padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
        Tiến hành thanh toán
      </button>
      <p style={{ marginTop: 20 }}><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};

// ===== 4. PAYMENT (Xác nhận thanh toán) =====
export const Payment = () => {
  const [params] = useSearchParams();
  const orderId = Number(params.get("orderId"));
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (orderId) orderService.detail(orderId).then(setOrder);
  }, [orderId]);

  const onPay = async () => {
    setLoading(true);
    try {
      const result = await paymentService.pay(orderId);
      // Chuyển sang trang kết quả và truyền data qua state
      nav(`/payment-result`, { state: { result, order } });
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div style={{ padding: 20 }}>Đang tải đơn hàng...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h2>Xác nhận thanh toán</h2>
      <p>Mã đơn hàng: <b>#{order.OrderId}</b></p>
      <p>Tổng tiền: <b style={{ color: "red" }}>{order.TotalAmount.toLocaleString()}đ</b></p>
      <p>Phương thức: Thanh toán mô phỏng (MOCK)</p>
      <button onClick={onPay} disabled={loading} style={{ padding: "10px 20px", width: "100%", marginTop: 20, background: "green", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
        {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
      </button>
    </div>
  );
};

// ===== 5. PAYMENT RESULT (Kết quả thanh toán) =====
export const PaymentResult = () => {
  const nav = useNavigate();
  // Lấy data được truyền từ trang Payment
  const location = window.history.state?.usr; 
  const result = location?.result;

  if (!result) return <div style={{ padding: 20 }}>Không có dữ liệu thanh toán. <Link to="/">Về trang chủ</Link></div>;

  return (
    <div style={{ padding: 20, textAlign: "center", maxWidth: 500, margin: "50px auto", border: "1px solid #ccc", borderRadius: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
      <h1 style={{ color: "green", fontSize: 60, margin: 0 }}>✔</h1>
      <h2 style={{ color: "green" }}>Thanh toán thành công!</h2>
      <p>Mã giao dịch: <b>{result.transactionCode}</b></p>
      <p>Số lượng vé nhận được: <b>{result.tickets.length}</b></p>
      
      <button onClick={() => nav("/tickets")} style={{ padding: "10px 20px", marginTop: 20, background: "#007bff", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
        Xem vé của tôi ngay
      </button>
    </div>
  );
};

// ===== 6. MY TICKETS (Vé của tôi) =====
export const MyTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    ticketService.myTickets().then(setTickets);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Vé của tôi</h2>
      {tickets.length === 0 && <p>Bạn chưa có vé nào.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tickets.map((t) => (
          <li key={t.TicketId} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}>
            <Link to={`/tickets/${t.TicketId}`} style={{ textDecoration: "none", color: "blue", fontSize: 18 }}>
              <b>{t.TicketCode}</b>
            </Link>
            <br />
            <span>Hạn sử dụng: {new Date(t.ValidTo).toLocaleString()}</span>
            <br />
            <span style={{ color: t.Status === "ACTIVE" ? "green" : "red", fontWeight: "bold" }}>Trạng thái: {t.Status}</span>
          </li>
        ))}
      </ul>
      <p><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};

// ===== 7. TICKET DETAIL (Chi tiết vé & QR) =====
export const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    if (id) ticketService.detail(Number(id)).then(setTicket);
  }, [id]);

  if (!ticket) return <div style={{ padding: 20 }}>Đang tải thông tin vé...</div>;

  // Mã QR hiển thị
  const qrValue = JSON.stringify({ code: ticket.TicketCode, to: ticket.ValidTo });

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>Vé điện tử</h2>
      <p style={{ fontSize: 24, fontWeight: "bold", color: "#007bff" }}>{ticket.TicketCode}</p>
      <div style={{ margin: "30px 0" }}>
        <QRCodeCanvas value={qrValue} size={250} />
      </div>
      <p>Hiệu lực: {new Date(ticket.ValidFrom).toLocaleString()} — {new Date(ticket.ValidTo).toLocaleString()}</p>
      <p>Trạng thái: <b style={{ color: ticket.Status === "ACTIVE" ? "green" : "red" }}>{ticket.Status}</b></p>
      <p style={{ marginTop: 30 }}><Link to="/tickets">← Quay lại danh sách vé</Link></p>
    </div>
  );
};

// ===== 8. HISTORY (Lịch sử chuyến đi & mua vé) =====
export const History = () => {
  const [activeTab, setActiveTab] = useState<"trips" | "orders">("trips");
  const [trips, setTrips] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    tripHistoryService.myHistories().then(setTrips);
    orderService.myOrders().then(setOrders);
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h2>Lịch sử hoạt động</h2>
      
      {/* Thanh chuyển Tab */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <button 
          onClick={() => setActiveTab("trips")} 
          style={{ padding: "10px 20px", fontWeight: activeTab === "trips" ? "bold" : "normal", background: activeTab === "trips" ? "#007bff" : "#eee", color: activeTab === "trips" ? "white" : "black", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          Lịch sử chuyến đi
        </button>
        <button 
          onClick={() => setActiveTab("orders")} 
          style={{ padding: "10px 20px", fontWeight: activeTab === "orders" ? "bold" : "normal", background: activeTab === "orders" ? "#007bff" : "#eee", color: activeTab === "orders" ? "white" : "black", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          Lịch sử mua vé
        </button>
      </div>

      {/* Nội dung Tab Chuyến đi */}
      {activeTab === "trips" && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {trips.length === 0 && <p>Chưa có chuyến đi nào.</p>}
          {trips.map((h) => (
            <li key={h.TripHistoryId} style={{ borderBottom: "1px solid #eee", padding: "10px 0" }}>
              <b style={{ fontSize: 16 }}>{h.Origin} → {h.Destination}</b> 
              <br/>
              <span style={{ color: "gray" }}>{h.StartedAt ? new Date(h.StartedAt).toLocaleString() : ""}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Nội dung Tab Mua vé */}
      {activeTab === "orders" && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.length === 0 && <p>Chưa có giao dịch mua vé nào.</p>}
          {orders.map((o) => (
            <li key={o.OrderId} style={{ borderBottom: "1px solid #eee", padding: "10px 0" }}>
              Mã đơn: <b>#{o.OrderId}</b> 
              <br/> Ngày mua: {new Date(o.CreatedAt).toLocaleString()} 
              <br/> Tổng tiền: <b style={{ color: "red" }}>{o.TotalAmount.toLocaleString()}đ</b> 
              <br/> Trạng thái: <span style={{color: o.Status === "PAID" ? "green" : "orange", fontWeight: "bold"}}>{o.Status}</span>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 30 }}><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};
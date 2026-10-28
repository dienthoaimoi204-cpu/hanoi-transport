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

// ===== HOME =====
export const Home = ({ user, onLogout }: { user: any; onLogout: () => void }) => (
  <div style={{ padding: 20 }}>
    <h1>Xin chào, {user?.name}</h1>
    <ul>
      <li><Link to="/buy-ticket">Mua vé</Link></li>
      <li><Link to="/tickets">Vé của tôi</Link></li>
      <li><Link to="/history">Lịch sử chuyến đi</Link></li>
      <li><Link to="/profile">Profile</Link></li>
    </ul>
    <button onClick={onLogout}>Đăng xuất</button>
  </div>
);

// ===== PROFILE =====
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
    alert("Đã lưu");
  };

  if (!me) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Profile</h2>
      <p>Email: {me.Email}</p>
      <div style={{ marginBottom: 8 }}>
        <label>Họ tên: </label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Điện thoại: </label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button onClick={onSave}>Lưu</button>
      <p><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};

// ===== BUY TICKET =====
export const BuyTicket = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const nav = useNavigate();

  useEffect(() => {
    ticketService.listTypes().then(setTypes);
  }, []);

  const onBuy = async () => {
    if (!selected) return alert("Chọn loại vé");
    const order = await orderService.create([{ ticketTypeId: selected, quantity: qty }]);
    nav(`/payment?orderId=${order.orderId}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Mua vé</h2>
      {types.map((t) => (
        <div key={t.TicketTypeId} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8 }}>
          <label>
            <input
              type="radio"
              name="ticket"
              checked={selected === t.TicketTypeId}
              onChange={() => setSelected(t.TicketTypeId)}
            />
            {" "}<b>{t.Name}</b> — {t.Price.toLocaleString()}đ ({t.Type})
          </label>
        </div>
      ))}
      <div style={{ marginTop: 10 }}>
        Số lượng:{" "}
        <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      </div>
      <button onClick={onBuy} style={{ marginTop: 10, padding: "8px 16px" }}>Tạo đơn hàng</button>
      <p><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};

// ===== PAYMENT =====
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
      await paymentService.pay(orderId);
      await tripHistoryService.create({
        origin: params.get("origin") || "Unknown",
        destination: params.get("destination") || "Unknown",
        routeData: { preference: params.get("preference") || "FASTEST" },
      });
      nav("/tickets");
    } catch (err: any) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Thanh toán mô phỏng</h2>
      <p>Order #{order.OrderId}</p>
      <p>Tổng tiền: <b>{order.TotalAmount.toLocaleString()}đ</b></p>
      <button onClick={onPay} disabled={loading} style={{ padding: "8px 16px" }}>
        {loading ? "Đang xử lý..." : "Thanh toán MOCK"}
      </button>
    </div>
  );
};

// ===== MY TICKETS =====
export const MyTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    ticketService.myTickets().then(setTickets);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Vé của tôi</h2>
      {tickets.length === 0 && <p>Chưa có vé</p>}
      <ul>
        {tickets.map((t) => (
          <li key={t.TicketId}>
            <Link to={`/tickets/${t.TicketId}`}>
              {t.TicketCode} — Hết hạn: {new Date(t.ValidTo).toLocaleString()}
            </Link>
          </li>
        ))}
      </ul>
      <p><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};

// ===== TICKET DETAIL =====
export const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    if (id) ticketService.detail(Number(id)).then(setTicket);
  }, [id]);

  if (!ticket) return <div style={{ padding: 20 }}>Loading...</div>;

  const qrValue = JSON.stringify({ code: ticket.TicketCode, to: ticket.ValidTo });

  return (
    <div style={{ padding: 20 }}>
      <h2>Vé {ticket.TicketCode}</h2>
      <p>
        Hiệu lực: {new Date(ticket.ValidFrom).toLocaleString()} —{" "}
        {new Date(ticket.ValidTo).toLocaleString()}
      </p>
      <p>Trạng thái: {ticket.Status}</p>
      <QRCodeCanvas value={qrValue} size={220} />
      <p><Link to="/tickets">← Danh sách vé</Link></p>
    </div>
  );
};

// ===== HISTORY =====
export const History = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    tripHistoryService.myHistories().then(setItems);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Lịch sử chuyến đi</h2>
      {items.length === 0 && <p>Chưa có chuyến nào</p>}
      <ul>
        {items.map((h) => (
          <li key={h.TripHistoryId}>
            {h.Origin} → {h.Destination} |{" "}
            {h.StartedAt ? new Date(h.StartedAt).toLocaleString() : ""}
          </li>
        ))}
      </ul>
      <p><Link to="/">← Về trang chủ</Link></p>
    </div>
  );
};
import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate, useParams, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  authService, ticketService, orderService, paymentService, tripHistoryService,
} from "../api";

// ===== 1. HOME =====
export const Home = ({ user, onLogout }: { user: any; onLogout: () => void }) => (
  <div className="min-h-screen bg-gray-50">
    {/* Navbar */}
    <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-wide">🚌 Hanoi Transport</h1>
      <div className="flex items-center space-x-4">
        <span>Xin chào, <b>{user?.name}</b></span>
        <button onClick={onLogout} className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold">Đăng xuất</button>
      </div>
    </nav>

    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Bạn muốn đi đâu hôm nay?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/buy-ticket" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition border-l-4 border-blue-500 flex flex-col items-center group">
          <span className="text-5xl mb-3 group-hover:scale-110 transition">🎫</span>
          <h3 className="text-xl font-bold text-gray-800">Mua Vé</h3>
          <p className="text-gray-500 text-center mt-2 text-sm">Đặt vé xe bus, tàu điện ngầm</p>
        </Link>
        <Link to="/tickets" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition border-l-4 border-green-500 flex flex-col items-center group">
          <span className="text-5xl mb-3 group-hover:scale-110 transition">📱</span>
          <h3 className="text-xl font-bold text-gray-800">Vé Của Tôi</h3>
          <p className="text-gray-500 text-center mt-2 text-sm">Xem mã QR và hạn sử dụng vé</p>
        </Link>
        <Link to="/history" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition border-l-4 border-orange-500 flex flex-col items-center group">
          <span className="text-5xl mb-3 group-hover:scale-110 transition">🕒</span>
          <h3 className="text-xl font-bold text-gray-800">Lịch Sử</h3>
          <p className="text-gray-500 text-center mt-2 text-sm">Xem lại các chuyến đi và đơn hàng</p>
        </Link>
        <Link to="/profile" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition border-l-4 border-purple-500 flex flex-col items-center group">
          <span className="text-5xl mb-3 group-hover:scale-110 transition">👤</span>
          <h3 className="text-xl font-bold text-gray-800">Tài Khoản</h3>
          <p className="text-gray-500 text-center mt-2 text-sm">Quản lý thông tin cá nhân</p>
        </Link>
      </div>
    </div>
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

  if (!me) return <div className="p-10 text-center text-gray-500">Đang tải thông tin...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Thông Tin Cá Nhân</h2>
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-6 text-sm">
          <b>Email:</b> {me.Email} (Không thể thay đổi)
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Họ tên</label>
            <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Số điện thoại</label>
            <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button onClick={onSave} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">Lưu thay đổi</button>
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-500 hover:underline">← Về trang chủ</Link>
        </div>
      </div>
    </div>
  );
};

// ===== 3. BUY TICKET =====
export const BuyTicket = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const nav = useNavigate();
  const location = useLocation();
  const routeData = location.state as any;

  useEffect(() => { ticketService.listTypes().then(setTypes); }, []);

  const onBuy = async () => {
    if (!selected) return alert("Vui lòng chọn loại vé!");
    const order = await orderService.create([{ ticketTypeId: selected, quantity: qty }]);
    nav(`/payment?orderId=${order.orderId}`, { state: routeData });
  };

  const singleTickets = types.filter(t => t.Type === "SINGLE");
  const monthlyTickets = types.filter(t => t.Type === "MONTHLY");

  const renderTicketCard = (t: any) => (
    <div 
      key={t.TicketTypeId} 
      className={`border-2 p-4 rounded-lg mb-3 cursor-pointer transition ${selected === t.TicketTypeId ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
      onClick={() => setSelected(t.TicketTypeId)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input type="radio" checked={selected === t.TicketTypeId} readOnly className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-800 text-lg">{t.Name}</span>
        </div>
        <span className="font-bold text-red-600">{t.Price.toLocaleString()}đ</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-10">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Mua Vé</h2>
        
        {routeData && routeData.origin && (
          <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
            <h3 className="font-bold mb-1">Lộ trình của bạn:</h3>
            <p>{routeData.origin} → {routeData.destination}</p>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">Vé Lượt</h3>
          {singleTickets.map(renderTicketCard)}
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">Vé Tháng</h3>
          {monthlyTickets.map(renderTicketCard)}
        </div>

        <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
          <label className="font-bold text-gray-700">Số lượng:</label>
          <input type="number" min={1} max={10} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-20 px-3 py-2 border rounded-lg text-center font-bold" />
        </div>
        
        <button onClick={onBuy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition text-lg shadow-md">
          Tiến hành thanh toán
        </button>
        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-500 hover:text-blue-500">← Quay lại</Link>
        </div>
      </div>
    </div>
  );
};

// ===== 4. PAYMENT =====
export const Payment = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const routeData = location.state as any;
  const orderId = Number(params.get("orderId"));
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => { if (orderId) orderService.detail(orderId).then(setOrder); }, [orderId]);

  const onPay = async (method: string = "MOCK") => {
    setLoading(true);
    try {
      const result = await paymentService.pay(orderId, method);
      if (routeData?.origin && routeData?.destination) {
        await tripHistoryService.create({ origin: routeData.origin, destination: routeData.destination, routeData: { note: "Thanh toán từ tìm đường" } });
      }
      nav(`/payment-result`, { state: { result, order } });
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div className="p-10 text-center">Đang tải đơn hàng...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Thanh Toán</h2>
        <p className="text-gray-500 mb-2">Mã đơn hàng</p>
        <p className="text-3xl font-bold text-gray-800 mb-6">#{order.OrderId}</p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <p className="text-gray-500 mb-1">Tổng tiền cần thanh toán</p>
          <p className="text-4xl font-bold text-red-600">{order.TotalAmount.toLocaleString()}đ</p>
        </div>
        
        <div className="space-y-3">
          <button onClick={() => onPay("MOCK")} disabled={loading} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition text-lg">
            {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </button>
          <button onClick={() => onPay("MOCK_FAILED")} disabled={loading} className="w-full bg-white text-red-500 font-bold py-3 rounded-lg border-2 border-red-500 hover:bg-red-50 transition">
            {loading ? "Đang xử lý..." : "Giả lập thanh toán thất bại"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== 5. PAYMENT RESULT =====
export const PaymentResult = () => {
  const nav = useNavigate();
  const location = window.history.state?.usr; 
  const result = location?.result;

  if (!result) return <div className="p-10 text-center">Không có dữ liệu. <Link to="/" className="text-blue-500">Về trang chủ</Link></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl text-green-600">✔</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Thanh toán thành công!</h2>
        <p className="text-gray-500 mb-2">Mã giao dịch</p>
        <p className="text-lg font-bold text-gray-800 mb-6">{result.transactionCode}</p>
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-8">
          Bạn đã nhận được <b>{result.tickets.length}</b> vé.
        </div>
        
        <button onClick={() => nav("/tickets")} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
          Xem vé của tôi ngay
        </button>
      </div>
    </div>
  );
};

// ===== 6. MY TICKETS =====
export const MyTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => { ticketService.myTickets().then(setTickets); }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Vé Của Tôi</h2>
        {tickets.length === 0 && <p className="text-center text-gray-500 py-10">Bạn chưa có vé nào.</p>}
        <ul className="space-y-4">
          {tickets.map((t) => (
            <li key={t.TicketId} className="border p-5 rounded-xl hover:shadow-md transition bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/tickets/${t.TicketId}`} className="text-xl font-bold text-blue-600 hover:underline">
                    {t.TicketCode}
                  </Link>
                  <p className="text-gray-600 mt-2 text-sm">HSD: {new Date(t.ValidTo).toLocaleString()}</p>
                </div>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${t.Status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {t.Status}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-500 hover:text-blue-500">← Về trang chủ</Link>
        </div>
      </div>
    </div>
  );
};

// ===== 7. TICKET DETAIL =====
export const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => { if (id) ticketService.detail(Number(id)).then(setTicket); }, [id]);

  if (!ticket) return <div className="p-10 text-center">Đang tải thông tin vé...</div>;

  const qrValue = JSON.stringify({ code: ticket.TicketCode, to: ticket.ValidTo });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-t-8 border-blue-500">
        <h2 className="text-xl font-bold text-gray-500 uppercase tracking-widest mb-2">Vé Điện Tử</h2>
        <p className="text-3xl font-black text-blue-600 mb-6">{ticket.TicketCode}</p>
        
        <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 inline-block mb-6">
          <QRCodeCanvas value={qrValue} size={220} />
        </div>
        
        <div className="text-left text-sm space-y-2 mb-8 bg-gray-50 p-4 rounded-lg">
          <p><span className="text-gray-500">Hiệu lực:</span> <br/> <b>{new Date(ticket.ValidFrom).toLocaleString()}</b></p>
          <p><span className="text-gray-500">Hết hạn:</span> <br/> <b>{new Date(ticket.ValidTo).toLocaleString()}</b></p>
          <p className="flex items-center gap-2">
            <span className="text-gray-500">Trạng thái:</span> 
            <span className={`px-2 py-0.5 rounded font-bold text-xs ${ticket.Status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{ticket.Status}</span>
          </p>
        </div>
        
        <Link to="/tickets" className="block w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition">
          ← Quay lại
        </Link>
      </div>
    </div>
  );
};

// ===== 8. HISTORY =====
export const History = () => {
  const [activeTab, setActiveTab] = useState<"trips" | "orders">("trips");
  const [trips, setTrips] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    tripHistoryService.myHistories().then(setTrips);
    orderService.myOrders().then(setOrders);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Lịch Sử Hoạt Động</h2>
        
        {/* Tabs */}
        <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-xl w-fit mx-auto">
          <button 
            onClick={() => setActiveTab("trips")} 
            className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === "trips" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Chuyến đi
          </button>
          <button 
            onClick={() => setActiveTab("orders")} 
            className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === "orders" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Mua vé
          </button>
        </div>

        {activeTab === "trips" && (
          <ul className="space-y-4">
            {trips.length === 0 && <p className="text-center text-gray-500 py-10">Chưa có chuyến đi nào.</p>}
            {trips.map((h) => (
              <li key={h.TripHistoryId} className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                <p className="font-bold text-gray-800 text-lg">{h.Origin} <span className="text-blue-500">→</span> {h.Destination}</p>
                <p className="text-gray-500 text-sm mt-1">{h.StartedAt ? new Date(h.StartedAt).toLocaleString() : ""}</p>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "orders" && (
          <ul className="space-y-4">
            {orders.length === 0 && <p className="text-center text-gray-500 py-10">Chưa có giao dịch mua vé nào.</p>}
            {orders.map((o) => (
              <li key={o.OrderId} className="border p-4 rounded-xl flex justify-between items-center bg-gray-50">
                <div>
                  <p className="font-bold text-gray-800">Đơn hàng #{o.OrderId}</p>
                  <p className="text-gray-500 text-sm">{new Date(o.CreatedAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{o.TotalAmount.toLocaleString()}đ</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${o.Status === "PAID" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{o.Status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 text-center">
          <Link to="/" className="text-gray-500 hover:text-blue-500">← Về trang chủ</Link>
        </div>
      </div>
    </div>
  );
};
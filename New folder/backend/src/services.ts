import {
  userRepo,
  ticketTypeRepo,
  orderRepo,
  paymentRepo,
  ticketRepo,
  tripHistoryRepo,
} from "./repositories"; // Chuyển sang dùng Repo kết nối SQL thật

import {
  hashPassword,
  comparePassword,
  signToken,
  generateTransactionCode,
} from "./utils";

// Hàm tiện ích để ném lỗi (Throw Error) nhanh
const throwErr = (status: number, message: string, errorCode: string) => {
  const err: any = new Error(message);
  err.status = status;
  err.errorCode = errorCode;
  throw err;
};

// ===== 1. AUTHENTICATION (Đăng ký / Đăng nhập) =====
export const authService = {
  register: async (payload: any) => {
    // Kiểm tra email tồn tại chưa (phải await vì gọi DB)
    const existing = await userRepo.findByEmail(payload.email);
    if (existing) throwErr(409, "Email already exists", "EMAIL_EXISTS");

    // Mã hóa mật khẩu
    const hash = await hashPassword(payload.password);
    
    // Lưu vào DB
    const user = await userRepo.create({
      FullName: payload.fullName,
      Email: payload.email,
      PasswordHash: hash,
      Phone: payload.phone || null,
      Role: "USER",
    });
    
    return { userId: user.UserId, email: user.Email };
  },

  login: async (payload: any) => {
    const user = await userRepo.findByEmail(payload.email);
    if (!user) throwErr(401, "Invalid credentials", "INVALID_CREDENTIALS");

    const valid = await comparePassword(payload.password, user.PasswordHash);
    if (!valid) throwErr(401, "Invalid credentials", "INVALID_CREDENTIALS");

    const token = signToken({ userId: user.UserId, role: user.Role });
    return {
      token,
      user: {
        id: user.UserId,
        name: user.FullName,
        email: user.Email,
        role: user.Role,
      },
    };
  },
};

// ===== 2. USER (Thông tin cá nhân) =====
export const userService = {
  getById: async (id: number) => {
    const u = await userRepo.findById(id);
    if (!u) return null;
    // Xóa PasswordHash trước khi trả về Frontend để bảo mật
    const { PasswordHash, ...safeUser } = u;
    return safeUser;
  },
  
  update: async (id: number, patch: any) => {
    const updated = await userRepo.update(id, {
      FullName: patch.fullName,
      Phone: patch.phone,
    });
    if (!updated) return null;
    const { PasswordHash, ...safeUser } = updated;
    return safeUser;
  },
};

// ===== 3. TICKET TYPES (Danh sách loại vé) =====
export const ticketTypeService = {
  list: async () => {
    return await ticketTypeRepo.findAllActive();
  },
};

// ===== 4. ORDER (Tạo đơn hàng) =====
export const orderService = {
  create: async (userId: number, items: any[]) => {
    if (!items?.length) throwErr(400, "Empty order", "EMPTY_ORDER");

    let total = 0;
    const resolved: any[] = [];

    for (const item of items) {
      const tt = await ticketTypeRepo.findById(item.ticketTypeId);
      if (!tt || tt.Status !== "ACTIVE")
        throwErr(404, `Ticket type ${item.ticketTypeId} not found`, "TICKET_TYPE_NOT_FOUND");
      if (item.quantity <= 0)
        throwErr(400, "Quantity must be > 0", "INVALID_QUANTITY");

      total += Number(tt.Price) * item.quantity;
      resolved.push({
        ticketTypeId: tt.TicketTypeId,
        quantity: item.quantity,
        unitPrice: tt.Price,
      });
    }

    const order = await orderRepo.create(userId, total);
    
    for (const r of resolved) {
      await orderRepo.addDetail({
        OrderId: order.OrderId,
        TicketTypeId: r.ticketTypeId,
        Quantity: r.quantity,
        UnitPrice: r.unitPrice,
      });
    }

    return {
      orderId: order.OrderId,
      totalAmount: order.TotalAmount,
      status: order.Status,
    };
  },

  listByUser: async (userId: number) => {
    return await orderRepo.findByUser(userId);
  },

  detail: async (orderId: number, userId: number) => {
    const order = await orderRepo.findById(orderId);
    if (!order || order.UserId !== userId)
      throwErr(404, "Order not found", "ORDER_NOT_FOUND");
      
    const details = await orderRepo.getDetails(orderId);
    return { ...order, details };
  },
};

// ===== 5. PAYMENT (Thanh toán mô phỏng & Sinh vé) =====
export const paymentService = {
  pay: async (userId: number, orderId: number, method: string) => {
    const order = await orderRepo.findById(orderId);
    if (!order || order.UserId !== userId)
      throwErr(404, "Order not found", "ORDER_NOT_FOUND");
    if (order.Status !== "PENDING")
      throwErr(400, "Order is not pending", "ORDER_NOT_PENDING");
    if (method !== "MOCK")
      throwErr(400, "Only MOCK payment supported", "METHOD_NOT_SUPPORTED");

    // Cập nhật trạng thái Order thành PAID
    await orderRepo.updateStatus(orderId, "PAID");

    // Tạo bản ghi Payment
    const payment = await paymentRepo.create({
      OrderId: orderId,
      Amount: order.TotalAmount,
      PaymentMethod: "MOCK",
      Status: "SUCCESS",
      TransactionCode: generateTransactionCode(orderId),
    });

    // Tạo vé (Tickets) dựa trên chi tiết đơn hàng
    const details = await orderRepo.getDetails(orderId);
    const tickets = [];

    for (const d of details) {
      const tt = await ticketTypeRepo.findById(d.TicketTypeId);
      if (!tt) continue;

      for (let i = 0; i < d.Quantity; i++) {
        const validFrom = new Date();
        const validTo = new Date();
        const duration = tt.DurationMinutes ?? 120;
        validTo.setMinutes(validTo.getMinutes() + duration);

        // Sinh mã code ngẫu nhiên (dùng timestamp để không bị trùng)
        const code = `TICKET-${Date.now()}-${i}`;

        const ticket = await ticketRepo.create({
          UserId: userId,
          OrderId: orderId,
          TicketTypeId: tt.TicketTypeId,
          TicketCode: code,
          QRCode: code, // Lưu code, FE tự vẽ QR
          ValidFrom: validFrom,
          ValidTo: validTo,
        });
        tickets.push(ticket);
      }
    }

    return {
      paymentId: payment.PaymentId,
      status: payment.Status,
      transactionCode: payment.TransactionCode,
      tickets,
    };
  },
};

// ===== 6. TICKET (Lấy danh sách và chi tiết vé) =====
export const ticketService = {
  listByUser: async (userId: number) => {
    return await ticketRepo.findByUser(userId);
  },
  
  detail: async (ticketId: number, userId: number) => {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket || ticket.UserId !== userId)
      throwErr(404, "Ticket not found", "TICKET_NOT_FOUND");
    return ticket;
  },
};

// ===== 7. TRIP HISTORY (Lịch sử chuyến đi) =====
export const tripHistoryService = {
  create: async (userId: number, payload: any) => {
    return await tripHistoryRepo.create({
      UserId: userId,
      Origin: payload.origin,
      Destination: payload.destination,
      RouteData: payload.routeData ? JSON.stringify(payload.routeData) : null,
    });
  },
  
  listByUser: async (userId: number) => {
    return await tripHistoryRepo.findByUser(userId);
  },
};
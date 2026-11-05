import { v4 as uuidv4 } from "uuid"; // Vá lỗi 1: Thêm import UUID
import {
  userRepo,
  ticketTypeRepo,
  orderRepo,
  paymentRepo,
  ticketRepo,
  tripHistoryRepo,
} from "./repositories";

import {
  hashPassword,
  comparePassword,
  signToken,
  generateTransactionCode,
} from "./utils";

const throwErr = (status: number, message: string, errorCode: string) => {
  const err: any = new Error(message);
  err.status = status;
  err.errorCode = errorCode;
  throw err;
};

// ===== 1. AUTHENTICATION =====
export const authService = {
  register: async (payload: any) => {
    const existing = await userRepo.findByEmail(payload.email);
    if (existing) throwErr(409, "Email already exists", "EMAIL_EXISTS");

    const hash = await hashPassword(payload.password);
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
      user: { id: user.UserId, name: user.FullName, email: user.Email, role: user.Role },
    };
  },
};

// ===== 2. USER =====
export const userService = {
  getById: async (id: number) => {
    const u = await userRepo.findById(id);
    if (!u) return null;
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

// ===== 3. TICKET TYPES =====
export const ticketTypeService = {
  list: async () => await ticketTypeRepo.findAllActive(),
};

// ===== 4. ORDER =====
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
      resolved.push({ ticketTypeId: tt.TicketTypeId, quantity: item.quantity, unitPrice: tt.Price });
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

    return { orderId: order.OrderId, totalAmount: order.TotalAmount, status: order.Status };
  },

  listByUser: async (userId: number) => await orderRepo.findByUser(userId),

  detail: async (orderId: number, userId: number) => {
    const order = await orderRepo.findById(orderId);
    if (!order || order.UserId !== userId) throwErr(404, "Order not found", "ORDER_NOT_FOUND");
    const details = await orderRepo.getDetails(orderId);
    return { ...order, details };
  },
};

// ===== 5. PAYMENT =====
export const paymentService = {
  pay: async (userId: number, orderId: number, method: string) => {
    const order = await orderRepo.findById(orderId);
    if (!order || order.UserId !== userId)
      throwErr(404, "Order not found", "ORDER_NOT_FOUND");
    if (order.Status !== "PENDING")
      throwErr(400, "Order is not pending", "ORDER_NOT_PENDING");

    // VÁ LỖI 2: Giả lập thanh toán thất bại
    if (method === "MOCK_FAILED") {
      await orderRepo.updateStatus(orderId, "CANCELLED");
      await paymentRepo.create({
        OrderId: orderId,
        Amount: order.TotalAmount,
        PaymentMethod: "MOCK",
        Status: "FAILED",
        TransactionCode: `FAIL-${Date.now()}`,
      });
      throwErr(400, "Thẻ của bạn không đủ số dư (Giả lập thất bại)", "PAYMENT_FAILED");
    }

    if (method !== "MOCK")
      throwErr(400, "Only MOCK payment supported", "METHOD_NOT_SUPPORTED");

    await orderRepo.updateStatus(orderId, "PAID");

    const payment = await paymentRepo.create({
      OrderId: orderId,
      Amount: order.TotalAmount,
      PaymentMethod: "MOCK",
      Status: "SUCCESS",
      TransactionCode: generateTransactionCode(orderId),
    });

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

        // VÁ LỖI 1: Sinh mã vé bằng UUID chống trùng
        const code = `TICKET-${uuidv4().split("-")[0].toUpperCase()}`;

        const ticket = await ticketRepo.create({
          UserId: userId,
          OrderId: orderId,
          TicketTypeId: tt.TicketTypeId,
          TicketCode: code,
          QRCode: code,
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

// ===== 6. TICKET =====
export const ticketService = {
  listByUser: async (userId: number) => await ticketRepo.findByUser(userId),
  detail: async (ticketId: number, userId: number) => {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket || ticket.UserId !== userId) throwErr(404, "Ticket not found", "TICKET_NOT_FOUND");
    return ticket;
  },
};

// ===== 7. TRIP HISTORY =====
export const tripHistoryService = {
  create: async (userId: number, payload: any) => {
    return await tripHistoryRepo.create({
      UserId: userId,
      Origin: payload.origin,
      Destination: payload.destination,
      RouteData: payload.routeData ? JSON.stringify(payload.routeData) : null,
    });
  },
  listByUser: async (userId: number) => await tripHistoryRepo.findByUser(userId),
};
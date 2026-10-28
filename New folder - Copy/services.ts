import QRCode from "qrcode";
import {
  userRepo,
  ticketTypeRepo,
  orderRepo,
  paymentRepo,
  ticketRepo,
  tripHistoryRepo,
} from "./types";
import {
  hashPassword,
  comparePassword,
  signToken,
  generateTicketCode,
  generateTransactionCode,
} from "./utils";

const throwErr = (status: number, message: string, errorCode: string) => {
  const err: any = new Error(message);
  err.status = status;
  err.errorCode = errorCode;
  throw err;
};

// ===== AUTH =====
export const authService = {
  register: async (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    if (userRepo.findByEmail(payload.email))
      throwErr(409, "Email already exists", "EMAIL_EXISTS");

    const hash = await hashPassword(payload.password);
    const user = userRepo.create({
      FullName: payload.fullName,
      Email: payload.email,
      PasswordHash: hash,
      Phone: payload.phone || null,
      Role: "USER",
      CreatedAt: new Date(),
      UpdatedAt: null,
      Status: "ACTIVE",
    });
    return { userId: user.UserId, email: user.Email };
  },

  login: async (payload: { email: string; password: string }) => {
    const user = userRepo.findByEmail(payload.email);
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

// ===== USER =====
export const userService = {
  getById: (id: number) => {
    const u = userRepo.findById(id);
    if (!u) return null;
    const { PasswordHash, ...safe } = u;
    return safe;
  },
  update: (id: number, patch: { fullName?: string; phone?: string }) => {
    const updated = userRepo.update(id, {
      FullName: patch.fullName,
      Phone: patch.phone,
    });
    if (!updated) return null;
    const { PasswordHash, ...safe } = updated;
    return safe;
  },
};

// ===== TICKET TYPE =====
export const ticketTypeService = {
  list: () => ticketTypeRepo.findAllActive(),
};

// ===== ORDER =====
export const orderService = {
  create: (
    userId: number,
    items: { ticketTypeId: number; quantity: number }[]
  ) => {
    if (!items?.length) throwErr(400, "Empty order", "EMPTY_ORDER");

    let total = 0;
    const resolved: { ticketTypeId: number; quantity: number; unitPrice: number }[] = [];

    for (const item of items) {
      const tt = ticketTypeRepo.findById(item.ticketTypeId);
      if (!tt || tt.Status !== "ACTIVE")
        throwErr(404, `Ticket type ${item.ticketTypeId} not found`, "TICKET_TYPE_NOT_FOUND");
      if (item.quantity <= 0)
        throwErr(400, "Quantity must be > 0", "INVALID_QUANTITY");

      total += tt.Price * item.quantity;
      resolved.push({
        ticketTypeId: tt.TicketTypeId,
        quantity: item.quantity,
        unitPrice: tt.Price,
      });
    }

    const order = orderRepo.create(userId, total);
    for (const r of resolved) {
      orderRepo.addDetail({
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

  listByUser: (userId: number) => orderRepo.findByUser(userId),

  detail: (orderId: number, userId: number) => {
    const order = orderRepo.findById(orderId);
    if (!order || order.UserId !== userId)
      throwErr(404, "Order not found", "ORDER_NOT_FOUND");
    return { ...order, details: orderRepo.getDetails(orderId) };
  },
};

// ===== PAYMENT =====
export const paymentService = {
  pay: async (userId: number, orderId: number, method: string) => {
    const order = orderRepo.findById(orderId);
    if (!order || order.UserId !== userId)
      throwErr(404, "Order not found", "ORDER_NOT_FOUND");
    if (order.Status !== "PENDING")
      throwErr(400, "Order is not pending", "ORDER_NOT_PENDING");
    if (method !== "MOCK")
      throwErr(400, "Only MOCK payment supported", "METHOD_NOT_SUPPORTED");

    const payment = paymentRepo.create({
      OrderId: orderId,
      Amount: order.TotalAmount,
      PaymentMethod: "MOCK",
      Status: "SUCCESS",
      TransactionCode: generateTransactionCode(orderId),
      PaidAt: new Date(),
    });

    orderRepo.updateStatus(orderId, "PAID");

    const details = orderRepo.getDetails(orderId);
    const tickets = [];

    for (const d of details) {
      const tt = ticketTypeRepo.findById(d.TicketTypeId);
      if (!tt) continue;

      for (let i = 0; i < d.Quantity; i++) {
        const nextId = (await import("./types")).mockData.counters.ticket;
        const code = generateTicketCode(nextId);

        const validFrom = new Date();
        const validTo = new Date();
        const duration = tt.DurationMinutes ?? 120;
        validTo.setMinutes(validTo.getMinutes() + duration);

        const qrDataUrl = await QRCode.toDataURL(
          JSON.stringify({ ticketCode: code, validTo: validTo.toISOString() })
        );

        const ticket = ticketRepo.create({
          OrderId: orderId,
          TicketTypeId: tt.TicketTypeId,
          TicketCode: code,
          QRCode: qrDataUrl,
          ValidFrom: validFrom,
          ValidTo: validTo,
          Status: "ACTIVE",
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

// ===== TICKET =====
export const ticketService = {
  listByUser: (userId: number) => ticketRepo.findByUser(userId),
  detail: (ticketId: number, userId: number) => {
    const list = ticketRepo.findByUser(userId);
    const ticket = list.find((t) => t.TicketId === ticketId);
    if (!ticket) throwErr(404, "Ticket not found", "TICKET_NOT_FOUND");
    return ticket;
  },
};

// ===== TRIP HISTORY =====
export const tripHistoryService = {
  create: (
    userId: number,
    payload: {
      origin: string;
      destination: string;
      routeData?: any;
      startedAt?: string;
      completedAt?: string;
    }
  ) => {
    return tripHistoryRepo.create({
      UserId: userId,
      Origin: payload.origin,
      Destination: payload.destination,
      RouteData: payload.routeData ? JSON.stringify(payload.routeData) : null,
      StartedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(),
      CompletedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    });
  },
  listByUser: (userId: number) => tripHistoryRepo.findByUser(userId),
};
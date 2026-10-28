// ===== TYPES =====
export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "LOCKED";
export type TicketTypeKind = "SINGLE" | "MONTHLY";
export type OrderStatus = "PENDING" | "PAID" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
export type TicketStatus = "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";

export interface User {
  UserId: number;
  FullName: string;
  Email: string;
  PasswordHash: string;
  Phone?: string | null;
  Role: UserRole;
  CreatedAt: Date;
  UpdatedAt?: Date | null;
  Status: UserStatus;
}

export interface TicketType {
  TicketTypeId: number;
  Name: string;
  TransportTypeId: number;
  Type: TicketTypeKind;
  Price: number;
  DurationMinutes: number | null;
  Description?: string;
  Status: "ACTIVE" | "INACTIVE";
}

export interface Order {
  OrderId: number;
  UserId: number;
  TotalAmount: number;
  Status: OrderStatus;
  CreatedAt: Date;
}

export interface OrderDetail {
  OrderDetailId: number;
  OrderId: number;
  TicketTypeId: number;
  Quantity: number;
  UnitPrice: number;
}

export interface Payment {
  PaymentId: number;
  OrderId: number;
  Amount: number;
  PaymentMethod: "MOCK";
  Status: PaymentStatus;
  TransactionCode?: string | null;
  PaidAt?: Date | null;
}

export interface Ticket {
  TicketId: number;
  OrderId: number;
  TicketTypeId: number;
  TicketCode: string;
  QRCode?: string | null;
  ValidFrom: Date;
  ValidTo: Date;
  Status: TicketStatus;
}

export interface TripHistory {
  TripHistoryId: number;
  UserId: number;
  Origin: string;
  Destination: string;
  RouteData?: string | null;
  StartedAt?: Date | null;
  CompletedAt?: Date | null;
}

// ===== MOCK DATA =====
export const mockData = {
  users: [] as User[],
  ticketTypes: [
    { TicketTypeId: 1, Name: "Vé lượt Bus", TransportTypeId: 1, Type: "SINGLE", Price: 10000, DurationMinutes: 120, Description: "Vé 1 lượt Bus", Status: "ACTIVE" },
    { TicketTypeId: 2, Name: "Vé lượt Metro", TransportTypeId: 2, Type: "SINGLE", Price: 15000, DurationMinutes: 120, Description: "Vé 1 lượt Metro", Status: "ACTIVE" },
    { TicketTypeId: 3, Name: "Vé tháng Bus", TransportTypeId: 1, Type: "MONTHLY", Price: 200000, DurationMinutes: 43200, Description: "Vé tháng Bus", Status: "ACTIVE" },
    { TicketTypeId: 4, Name: "Vé tháng Metro", TransportTypeId: 2, Type: "MONTHLY", Price: 300000, DurationMinutes: 43200, Description: "Vé tháng Metro", Status: "ACTIVE" },
  ] as TicketType[],
  orders: [] as Order[],
  orderDetails: [] as OrderDetail[],
  payments: [] as Payment[],
  tickets: [] as Ticket[],
  tripHistories: [] as TripHistory[],
  counters: {
    user: 1,
    order: 1,
    orderDetail: 1,
    payment: 1,
    ticket: 1,
    tripHistory: 1,
  },
};

// ===== REPOSITORIES (in-memory) =====
export const userRepo = {
  findByEmail: (email: string) =>
    mockData.users.find((u) => u.Email.toLowerCase() === email.toLowerCase()),
  findById: (id: number) => mockData.users.find((u) => u.UserId === id),
  create: (u: Omit<User, "UserId">) => {
    const newUser: User = { ...u, UserId: mockData.counters.user++ };
    mockData.users.push(newUser);
    return newUser;
  },
  update: (id: number, patch: Partial<User>) => {
    const u = mockData.users.find((x) => x.UserId === id);
    if (!u) return undefined;
    Object.assign(u, patch, { UpdatedAt: new Date() });
    return u;
  },
};

export const ticketTypeRepo = {
  findAllActive: () => mockData.ticketTypes.filter((t) => t.Status === "ACTIVE"),
  findById: (id: number) =>
    mockData.ticketTypes.find((t) => t.TicketTypeId === id),
};

export const orderRepo = {
  create: (userId: number, totalAmount: number): Order => {
    const order: Order = {
      OrderId: mockData.counters.order++,
      UserId: userId,
      TotalAmount: totalAmount,
      Status: "PENDING",
      CreatedAt: new Date(),
    };
    mockData.orders.push(order);
    return order;
  },
  addDetail: (detail: Omit<OrderDetail, "OrderDetailId">) => {
    const d: OrderDetail = {
      ...detail,
      OrderDetailId: mockData.counters.orderDetail++,
    };
    mockData.orderDetails.push(d);
    return d;
  },
  findById: (id: number) => mockData.orders.find((o) => o.OrderId === id),
  findByUser: (userId: number) =>
    mockData.orders.filter((o) => o.UserId === userId),
  getDetails: (orderId: number) =>
    mockData.orderDetails.filter((d) => d.OrderId === orderId),
  updateStatus: (id: number, status: OrderStatus) => {
    const o = mockData.orders.find((x) => x.OrderId === id);
    if (o) o.Status = status;
    return o;
  },
};

export const paymentRepo = {
  create: (p: Omit<Payment, "PaymentId">): Payment => {
    const payment: Payment = { ...p, PaymentId: mockData.counters.payment++ };
    mockData.payments.push(payment);
    return payment;
  },
};

export const ticketRepo = {
  create: (t: Omit<Ticket, "TicketId">): Ticket => {
    const ticket: Ticket = { ...t, TicketId: mockData.counters.ticket++ };
    mockData.tickets.push(ticket);
    return ticket;
  },
  findByUser: (userId: number) => {
    const orderIds = mockData.orders
      .filter((o) => o.UserId === userId)
      .map((o) => o.OrderId);
    return mockData.tickets.filter((t) => orderIds.includes(t.OrderId));
  },
  findById: (id: number) => mockData.tickets.find((t) => t.TicketId === id),
};

export const tripHistoryRepo = {
  create: (t: Omit<TripHistory, "TripHistoryId">): TripHistory => {
    const item: TripHistory = {
      ...t,
      TripHistoryId: mockData.counters.tripHistory++,
    };
    mockData.tripHistories.push(item);
    return item;
  },
  findByUser: (userId: number) =>
    mockData.tripHistories.filter((h) => h.UserId === userId),
};
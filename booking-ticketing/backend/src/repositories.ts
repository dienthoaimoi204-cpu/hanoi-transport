import sql from "mssql";
import { getPool } from "./db";

export const userRepo = {
  findByEmail: async (email: string) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("Email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE Email = @Email");
    return result.recordset[0] || null;
  },
  findById: async (id: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, id)
      .query("SELECT * FROM Users WHERE UserId = @UserId");
    return result.recordset[0] || null;
  },
  create: async (user: any) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("FullName", sql.NVarChar, user.FullName)
      .input("Email", sql.VarChar, user.Email)
      .input("PasswordHash", sql.VarChar, user.PasswordHash)
      .input("Phone", sql.VarChar, user.Phone)
      .input("Role", sql.VarChar, user.Role)
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, Phone, Role)
        OUTPUT INSERTED.*
        VALUES (@FullName, @Email, @PasswordHash, @Phone, @Role)
      `);
    return result.recordset[0];
  },
  update: async (id: number, patch: any) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, id)
      .input("FullName", sql.NVarChar, patch.FullName)
      .input("Phone", sql.VarChar, patch.Phone)
      .query(`
        UPDATE Users 
        SET FullName = ISNULL(@FullName, FullName), Phone = ISNULL(@Phone, Phone), UpdatedAt = SYSDATETIME()
        OUTPUT INSERTED.*
        WHERE UserId = @UserId
      `);
    return result.recordset[0] || null;
  }
};

export const ticketTypeRepo = {
  findAllActive: async () => {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM TicketTypes WHERE Status = 'ACTIVE'");
    return result.recordset;
  },
  findById: async (id: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("TicketTypeId", sql.Int, id)
      .query("SELECT * FROM TicketTypes WHERE TicketTypeId = @TicketTypeId");
    return result.recordset[0] || null;
  }
};

export const orderRepo = {
  create: async (userId: number, totalAmount: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .input("TotalAmount", sql.Decimal(12, 2), totalAmount)
      .query(`
        INSERT INTO Orders (UserId, TotalAmount, Status) OUTPUT INSERTED.*
        VALUES (@UserId, @TotalAmount, 'PENDING')
      `);
    return result.recordset[0];
  },
  addDetail: async (detail: any) => {
    const pool = await getPool();
    await pool.request()
      .input("OrderId", sql.Int, detail.OrderId)
      .input("TicketTypeId", sql.Int, detail.TicketTypeId)
      .input("Quantity", sql.Int, detail.Quantity)
      .input("UnitPrice", sql.Decimal(12, 2), detail.UnitPrice)
      .query("INSERT INTO OrderDetails (OrderId, TicketTypeId, Quantity, UnitPrice) VALUES (@OrderId, @TicketTypeId, @Quantity, @UnitPrice)");
  },
  findById: async (id: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("OrderId", sql.Int, id)
      .query("SELECT * FROM Orders WHERE OrderId = @OrderId");
    return result.recordset[0] || null;
  },
  findByUser: async (userId: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .query("SELECT * FROM Orders WHERE UserId = @UserId ORDER BY CreatedAt DESC");
    return result.recordset;
  },
  getDetails: async (orderId: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("OrderId", sql.Int, orderId)
      .query("SELECT * FROM OrderDetails WHERE OrderId = @OrderId");
    return result.recordset;
  },
  updateStatus: async (id: number, status: string) => {
    const pool = await getPool();
    await pool.request()
      .input("OrderId", sql.Int, id)
      .input("Status", sql.VarChar, status)
      .query("UPDATE Orders SET Status = @Status WHERE OrderId = @OrderId");
  }
};

export const paymentRepo = {
  create: async (p: any) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("OrderId", sql.Int, p.OrderId)
      .input("Amount", sql.Decimal(12, 2), p.Amount)
      .input("PaymentMethod", sql.VarChar, p.PaymentMethod)
      .input("Status", sql.VarChar, p.Status)
      .input("TransactionCode", sql.VarChar, p.TransactionCode)
      .query(`
        INSERT INTO Payments (OrderId, Amount, PaymentMethod, Status, TransactionCode, PaidAt)
        OUTPUT INSERTED.* VALUES (@OrderId, @Amount, @PaymentMethod, @Status, @TransactionCode, SYSDATETIME())
      `);
    return result.recordset[0];
  }
};

export const ticketRepo = {
  create: async (t: any) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, t.UserId)
      .input("OrderId", sql.Int, t.OrderId)
      .input("TicketTypeId", sql.Int, t.TicketTypeId)
      .input("TicketCode", sql.VarChar, t.TicketCode)
      .input("QRCode", sql.VarChar, t.QRCode)
      .input("ValidFrom", sql.DateTime2, t.ValidFrom)
      .input("ValidTo", sql.DateTime2, t.ValidTo)
      .query(`
        INSERT INTO Tickets (UserId, OrderId, TicketTypeId, TicketCode, QRCode, ValidFrom, ValidTo) 
        OUTPUT INSERTED.* VALUES (@UserId, @OrderId, @TicketTypeId, @TicketCode, @QRCode, @ValidFrom, @ValidTo)
      `);
    return result.recordset[0];
  },
  findByUser: async (userId: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .query("SELECT * FROM Tickets WHERE UserId = @UserId ORDER BY TicketId DESC");
    return result.recordset;
  },
  findById: async (id: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("TicketId", sql.Int, id)
      .query("SELECT * FROM Tickets WHERE TicketId = @TicketId");
    return result.recordset[0] || null;
  }
};

export const tripHistoryRepo = {
  create: async (t: any) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, t.UserId)
      .input("Origin", sql.NVarChar, t.Origin)
      .input("Destination", sql.NVarChar, t.Destination)
      .input("RouteData", sql.NVarChar, t.RouteData)
      .query(`
        INSERT INTO TripHistories (UserId, Origin, Destination, RouteData, StartedAt)
        OUTPUT INSERTED.* VALUES (@UserId, @Origin, @Destination, @RouteData, SYSDATETIME())
      `);
    return result.recordset[0];
  },
  findByUser: async (userId: number) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .query("SELECT * FROM TripHistories WHERE UserId = @UserId ORDER BY TripHistoryId DESC");
    return result.recordset;
  }
};
USE PublicTransportDB;
GO

-- ==========================================
-- 1. BẢNG USERS (Tài khoản mẫu)
-- Mật khẩu thật là: 123456 (cho cả 2 tài khoản)
-- ==========================================
INSERT INTO Users (FullName, Email, PasswordHash, Phone, Role, Status) VALUES
(N'Nguyen Van An', 'an@example.com', '$2a$10$abcdefghijklmnopqrstuv', '0901000001', 'USER', 'ACTIVE'),
(N'Admin System', 'admin@example.com', '$2a$10$abcdefghijklmnopqrstuv', '0901000000', 'ADMIN', 'ACTIVE');
GO

-- ==========================================
-- 2. BẢNG TICKET TYPES (4 loại vé)
-- ==========================================
INSERT INTO TicketTypes (Name, TransportTypeId, Type, Price, DurationMinutes, Description) VALUES
(N'Vé lượt Bus', 1, 'SINGLE', 10000, 120, N'Vé đi 1 lượt xe buýt'),
(N'Vé lượt Metro', 2, 'SINGLE', 15000, 120, N'Vé đi 1 lượt tàu điện'),
(N'Vé tháng Bus', 1, 'MONTHLY', 200000, 43200, N'Vé sử dụng xe buýt trong 30 ngày'),
(N'Vé tháng Metro', 2, 'MONTHLY', 300000, 43200, N'Vé sử dụng tàu điện trong 30 ngày');
GO

-- ==========================================
-- 3. BẢNG ORDERS (Tạo sẵn 1 đơn hàng mẫu cho User 1)
-- ==========================================
INSERT INTO Orders (UserId, TotalAmount, Status) VALUES
(1, 10000, 'PAID'); 
-- OrderId tự động sinh ra là 1
GO

-- ==========================================
-- 4. BẢNG ORDER DETAILS (Chi tiết đơn hàng 1)
-- ==========================================
INSERT INTO OrderDetails (OrderId, TicketTypeId, Quantity, UnitPrice) VALUES
(1, 1, 1, 10000);
-- Mua 1 vé lượt Bus với giá 10.000đ
GO

-- ==========================================
-- 5. BẢNG PAYMENTS (Thanh toán cho đơn hàng 1)
-- ==========================================
INSERT INTO Payments (OrderId, Amount, PaymentMethod, Status, TransactionCode, PaidAt) VALUES
(1, 10000, 'MOCK', 'SUCCESS', 'MOCK-TXN-000001', SYSDATETIME());
GO

-- ==========================================
-- 6. BẢNG TICKETS (Sinh vé cho đơn hàng 1)
-- ==========================================
INSERT INTO Tickets (UserId, OrderId, TicketTypeId, TicketCode, QRCode, ValidFrom, ValidTo, Status) VALUES
(1, 1, 1, 'TICKET-000001', 'TICKET-000001', SYSDATETIME(), DATEADD(HOUR, 2, SYSDATETIME()), 'ACTIVE');
GO

-- ==========================================
-- 7. BẢNG TRIP HISTORIES (Lịch sử chuyến đi mẫu)
-- ==========================================
INSERT INTO TripHistories (UserId, Origin, Destination, RouteData, StartedAt, CompletedAt) VALUES
(1, N'Hồ Hoàn Kiếm', N'Văn Miếu', N'{"preference":"FASTEST","duration":20}', SYSDATETIME(), SYSDATETIME());
GO
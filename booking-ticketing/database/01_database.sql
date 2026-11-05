-- Tạo Database (Nếu chưa có)
CREATE DATABASE PublicTransportDB;
GO

USE PublicTransportDB;
GO

-- 1. Bảng Users
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    Role VARCHAR(20) NOT NULL DEFAULT 'USER',
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT CK_Users_Role CHECK (Role IN ('USER', 'ADMIN')),
    CONSTRAINT CK_Users_Status CHECK (Status IN ('ACTIVE', 'LOCKED'))
);
GO

-- 2. Bảng TicketTypes
CREATE TABLE TicketTypes (
    TicketTypeId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    TransportTypeId INT NOT NULL, 
    Type VARCHAR(20) NOT NULL,
    Price DECIMAL(12,2) NOT NULL,
    DurationMinutes INT NULL,
    Description NVARCHAR(500),
    Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT CK_TicketTypes_Type CHECK (Type IN ('SINGLE', 'MONTHLY'))
);
GO

-- 3. Bảng Orders
CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TotalAmount DECIMAL(12,2) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT CK_Orders_Status CHECK (Status IN ('PENDING', 'PAID', 'CANCELLED'))
);
GO

-- 4. Bảng OrderDetails
CREATE TABLE OrderDetails (
    OrderDetailId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    TicketTypeId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_OrderDetails_TicketTypes FOREIGN KEY (TicketTypeId) REFERENCES TicketTypes(TicketTypeId),
    CONSTRAINT CK_OrderDetails_Quantity CHECK (Quantity > 0)
);
GO

-- 5. Bảng Payments
CREATE TABLE Payments (
    PaymentId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    PaymentMethod VARCHAR(30) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    TransactionCode VARCHAR(100),
    PaidAt DATETIME2 NULL,
    CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT CK_Payments_Status CHECK (Status IN ('PENDING', 'SUCCESS', 'FAILED'))
);
GO

-- 6. Bảng Tickets
CREATE TABLE Tickets (
    TicketId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL, 
    OrderId INT NOT NULL,
    TicketTypeId INT NOT NULL,
    TicketCode VARCHAR(100) NOT NULL UNIQUE,
    QRCode VARCHAR(500),
    ValidFrom DATETIME2 NOT NULL,
    ValidTo DATETIME2 NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT FK_Tickets_Users FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_Tickets_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_Tickets_TicketTypes FOREIGN KEY (TicketTypeId) REFERENCES TicketTypes(TicketTypeId),
    CONSTRAINT CK_Tickets_Status CHECK (Status IN ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'))
);
GO

-- 7. Bảng TripHistories
CREATE TABLE TripHistories (
    TripHistoryId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Origin NVARCHAR(255) NOT NULL,
    Destination NVARCHAR(255) NOT NULL,
    RouteData NVARCHAR(MAX),
    StartedAt DATETIME2 NULL,
    CompletedAt DATETIME2 NULL,
    CONSTRAINT FK_TripHistories_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- Thêm dữ liệu mẫu cho TicketTypes để test
INSERT INTO TicketTypes (Name, TransportTypeId, Type, Price, DurationMinutes) VALUES
(N'Vé lượt Bus', 1, 'SINGLE', 10000, 120),
(N'Vé lượt Metro', 2, 'SINGLE', 15000, 120),
(N'Vé tháng Bus', 1, 'MONTHLY', 200000, 43200),
(N'Vé tháng Metro', 2, 'MONTHLY', 300000, 43200);
GO
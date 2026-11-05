Hanoi Transport - Hệ thống Giao thông Công cộng Đa phương thức

Đồ án môn học xây dựng hệ thống hỗ trợ tra cứu lộ trình và mua vé giao thông công cộng (Bus, Metro, Xe đạp) tại Hà Nội.

Công nghệ sử dụng
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: SQL Server (chạy qua Docker)
- Authentication: JWT (JSON Web Token)

Cấu trúc thư mục
- `/backend`: Chứa mã nguồn API server.
- `/frontend`: Chứa mã nguồn giao diện web.
- `/database`: Chứa các file script SQL để khởi tạo database và dữ liệu mẫu.

Hướng dẫn cài đặt và chạy

1. Khởi động Database (Docker)
Yêu cầu máy tính đã cài đặt Docker Desktop. Mở Terminal và chạy lệnh sau để tạo SQL Server:
```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=MatKhau123@" -p 1433:1433 --name sql_server_do_an -d mcr.microsoft.com/mssql/server:2022-latest

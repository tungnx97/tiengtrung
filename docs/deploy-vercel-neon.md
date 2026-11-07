# Triển khai Vercel và Neon

Vercel chạy web và API Next.js. Neon lưu tài khoản, phiên đăng nhập và nhật ký trong PostgreSQL. Tiến độ học hiện lưu trên trình duyệt theo tài khoản.

## Tài nguyên đã chuẩn bị

- Neon project `hsk-master`, ID `twilight-mountain-90595723`, khu vực Singapore.
- Branch `production`, ID `br-purple-unit-azsbi0kr`, database `hsk_master`, PostgreSQL 17.
- Đã áp dụng migration `001_accounts.sql` và tạo admin `tungnx`, yêu cầu đổi mật khẩu lần đầu.
- Runtime role `hsk_app` có quyền đọc/ghi dữ liệu trong schema `public`. Database owner `hsk_owner` dùng cho migration.
- Bản build Next.js production đã kiểm tra thành công.
- Vercel project `hsk-master`, ID `prj_ODW7CfoN43sVDOqLjPWIz9yJkDij`, Functions ở Singapore, URL production `https://hsk-master-tungnx.vercel.app`.
- Deployment `dpl_BT97PEbPEvq1hFm27dwYWEsjj8FM` đã đạt trạng thái `READY`. Đã kiểm tra truy cập công khai HTTPS, phiên đăng nhập, xác thực admin qua Neon và kiểm tra dữ liệu đăng ký.

## Kết nối dịch vụ

Kết nối Vercel và Neon trong Codex để có thể tạo project, cấu hình kết nối và triển khai bằng tài khoản của bạn. Khi kết nối đã sẵn sàng, có thể thực hiện các bước dưới đây trong cùng phiên làm việc.

## Chuẩn bị Neon

1. Tạo project Neon, chọn khu vực gần người dùng và khu vực chạy Vercel Functions.
2. Lấy connection string dạng pooled để đặt `DATABASE_URL` của web. Lấy connection string trực tiếp của cùng database để chạy migration.
3. Tạo file `.env.neon.local` trong thư mục `hsk-master` với các biến bên dưới, sử dụng giá trị thực tế từ Neon. File này đã được Git và Vercel CLI bỏ qua.

```dotenv
DATABASE_URL="PASTE_NEON_POOLED_CONNECTION_STRING"
MIGRATION_DATABASE_URL="PASTE_NEON_DIRECT_CONNECTION_STRING"
BOOTSTRAP_ADMIN_USERNAME=tungnx
BOOTSTRAP_ADMIN_PASSWORD="SET_INITIAL_ADMIN_PASSWORD"
```

4. Tạo schema và admin trước khi mở web cho người dùng.

```powershell
npm run db:migrate:neon
npm run db:seed:neon
```

Các lệnh này đọc `.env.neon.local` riêng. Cấu hình PostgreSQL cục bộ nằm trong `.env.local`. Migration có transaction và khóa để tránh hai lần chạy đồng thời. Seed giữ nguyên tài khoản admin nếu username đã tồn tại với role admin. Admin được yêu cầu đổi mật khẩu ở lần đăng nhập đầu.

Xóa `BOOTSTRAP_ADMIN_PASSWORD` khỏi file sau khi seed thành công. Nếu chỉ dùng các kết nối qua Codex, có thể cung cấp giá trị bằng môi trường tiến trình và chạy trực tiếp `scripts/db-migrate.mjs`, `scripts/db-seed.mjs`.

## Triển khai web

Có thể dùng kết nối Vercel trong Codex, Vercel CLI, hoặc import repository vào Vercel. Thư mục gốc triển khai phải là `hsk-master`. Project có `vercel.json` để chọn Next.js và chạy `npm run build:vercel`. Dùng Node.js 24.x trong Project Settings.

Thiết lập environment variables trên Vercel cho môi trường Production.

| Biến | Giá trị |
| --- | --- |
| `DATABASE_URL` | Connection string pooled của database Neon đã migrate và seed. |
| `APP_ORIGIN` | Tùy chọn để giới hạn origin HTTPS cụ thể, ví dụ `https://your-project.vercel.app`. Khi để trống, API kiểm tra origin theo URL của yêu cầu cùng site. |

Sau khi thêm hoặc thay đổi biến môi trường, triển khai lại để áp dụng. Nếu dùng tên miền riêng sau này, cập nhật `APP_ORIGIN` theo tên miền đó rồi triển khai lại. Mỗi Preview deployment có origin và database dành cho môi trường tương ứng.

Khi dùng Vercel CLI, chạy trong thư mục `hsk-master`.

```powershell
npx vercel login
npx vercel link
npx vercel env add DATABASE_URL production
npx vercel env add APP_ORIGIN production
npx vercel --prod
```

Vercel CLI yêu cầu nhập các giá trị ở bước cấu hình. Trên máy hiện tại, Codex có thể dùng Node.js đã được đóng gói để thực hiện các lệnh thay cho npm/npx khi cần.

## Kiểm tra sau triển khai

- Mở URL HTTPS từ một trình duyệt khác, đăng ký tài khoản mới và kiểm tra role `user`.
- Đăng nhập admin, đổi mật khẩu lần đầu và kiểm tra màn hình quản lý tài khoản.
- Kiểm tra đăng xuất và đăng nhập lại.
- Kiểm tra tài khoản mới xuất hiện trong PostgreSQL Neon.

## Kiểm tra build trước khi triển khai

```powershell
npm run build:vercel
npm run start:vercel -- --port 5174
```

Bản build này dùng Next.js production. Lệnh `npm run build` phục vụ bản Sites trước đó.

## Tài liệu gốc

- [Vercel project configuration](https://vercel.com/docs/project-configuration)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Neon cho Node.js](https://neon.com/docs/guides/node)

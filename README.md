# HSK Master

Web học tiếng Trung bằng tiếng Việt, phát triển từ `../mockup.html`. Giao diện giữ bảng tổng quan, màu đỏ–cam, bộ chọn cấp HSK, chế độ sáng/tối và các khu học của mockup.

## Chạy trên máy

Trên máy hiện tại, mở PowerShell ở thư mục dự án và chạy lệnh sau để khởi động cả PostgreSQL và web. Script tự tìm Node.js có sẵn trên máy.

```powershell
.\hsk.cmd
```

Mở `http://127.0.0.1:5173`. Dùng `Ctrl+C` để dừng web, sau đó chạy `.\hsk.cmd stop-db` để dừng PostgreSQL.

### Cài đặt trên máy khác

Cần Node.js 22.13+ và npm. Mở terminal ở thư mục dự án rồi chạy:

```powershell
npm ci
npm run dev
```

Mở địa chỉ `Local` hiện trong terminal (thường là `http://localhost:5173`). Kiểm tra kiểu và tạo bản build:

```powershell
npx tsc --noEmit
npm run build
```

Phần đăng nhập dùng PostgreSQL. Máy hiện tại đã có database local và admin ban đầu. Chạy `npm run db:local:start` trước khi mở web. Xem [thiết kế database và hướng dẫn tài khoản](docs/database.md) để cấu hình máy khác hoặc server.

## Đưa lên online bằng Vercel và Neon

Project đã có `vercel.json` và lệnh `npm run build:vercel` cho Next.js production. Xem [hướng dẫn triển khai Vercel + Neon](docs/deploy-vercel-neon.md) để tạo PostgreSQL online, migration, seed admin và cấu hình biến môi trường.

## Học và ôn

- **Tổng quan**: mục tiêu mỗi ngày, lộ trình HSK 1–6, chuỗi ngày học, biểu đồ 7 ngày và từ mới mỗi ngày.
- **Flashcard**: lật thẻ xem nghĩa, nghe cách đọc, lưu từ và đánh giá mức độ ghi nhớ. Từ đã nhớ có lịch ôn 1, 3, 7, 14, 30 ngày; từ cần học lại đến hạn sau 10 phút.
- **Danh sách từ**: tìm chữ Hán, pinyin hoặc nghĩa tiếng Việt (có hoặc không có dấu), lọc theo chủ đề/trạng thái và xuất CSV theo bộ lọc.
- **Ngữ pháp**: 24 điểm ngữ pháp có cấu trúc, giải thích, câu ví dụ, bản dịch và lưu ý.
- **Luyện tập**: chọn tổng hợp, từ vựng, ngữ pháp hoặc nghe từ. Có đồng hồ đếm ngược, chấm bài, lời giải và lịch sử. Đây là bài tự biên soạn, không phải đề thi thật hay điểm quy đổi HSK.
- **Sao lưu**: tiến độ được lưu tại trình duyệt bằng `localStorage`. Trong Cài đặt học tập, xuất JSON để giữ tiến độ hoặc nhập trên thiết bị khác. Phát âm và câu nghe cần giọng tiếng Trung của thiết bị.

## Nội dung và nguồn

Bộ từ được cập nhật từ sáu tệp `Tuvung/HSK1.md` đến `HSK6.md`. Các tệp là danh sách tích lũy, nên script nhập mỗi từ theo cấp xuất hiện đầu tiên; dữ liệu cũ vẫn được giữ để tránh mất tiến độ. Khi tệp mới để trống nghĩa hoặc ví dụ, ứng dụng dùng dữ liệu cũ nếu có. Các mục chưa có nghĩa được ghi rõ và không đưa vào câu hỏi nhận diện nghĩa. Phiên âm ví dụ trong tệp được tạo tự động, không được nhập làm dữ liệu phát âm cho ứng dụng.

Các mục HSK 1 còn thiếu nghĩa tiếng Việt được bổ sung trong `lib/vocabulary-hsk1-vi.json`; nghĩa trong tệp nguồn vẫn được ưu tiên. Các cấp khác có thể còn nghĩa tiếng Anh.

Chạy `node scripts/import-vocabulary-markdown.mjs` trong thư mục dự án để nhập lại sáu tệp; có thể truyền đường dẫn thư mục chứa tệp làm tham số.

Bộ từ dùng thêm nghĩa, phiên âm và ví dụ từ `Tuvung/HSK1- HSK6.xlsx`. Các mục chưa đủ dữ liệu trong Excel giữ nội dung đã biên soạn hoặc nghĩa tiếng Anh từ Complete HSK Vocabulary. Excel HSK 1 thiếu nghĩa và phiên âm; HSK 3 thiếu chữ Hán ở phần lớn dòng; HSK 4 có cột chữ Hán bị lặp, vì vậy chỉ nhập những dòng có thể đối chiếu. HSK 5 không có câu ví dụ chữ Hán hoàn chỉnh. Nội dung Excel chưa được thẩm định độc lập. Cấp ngữ pháp là cách nhóm nội bộ theo độ khó.

Để nhập lại bảng, cài `openpyxl` trong môi trường Python và chạy `python scripts/import-vocabulary-excel.py` từ thư mục dự án; có thể truyền đường dẫn Excel làm tham số. Script giữ ID theo cấp và chữ Hán để bảo toàn tiến độ đã lưu.

Câu ví dụ còn thiếu được bổ sung khi tìm thấy từ trong một câu song ngữ của bảng; đây là ví dụ tham khảo theo mặt chữ, không phải đối chiếu ngữ nghĩa tự động. Các mục còn thiếu được đánh dấu trên giao diện. Chế độ luyện tổng hợp, từ vựng và nghe gồm 50 câu; chế độ ngữ pháp chỉ gồm các câu ngữ pháp hiện có của cấp đó.

- [Chinese Tests Service (CTI)](https://www.chinesetest.cn/HSK/1?type=3): đề cương và đề mẫu chính thức.
- [Laowai · HSK 2.0](https://laowaiapp.com/hsk/2.0/): nguồn danh sách từ được ghi trong các tệp HSK 1–6.
- [Complete HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary): đối chiếu cấp từ; dự án nguồn sử dụng giấy phép MIT. Không nhúng toàn bộ bộ dữ liệu.
- [MDBG / CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict): đối chiếu từ và pinyin. CC-CEDICT theo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- [OpenLearn – Getting started with Chinese](https://www.open.edu/openlearn/languages/getting-started-chinese-1/content-section-overview) và [Chinese Language Curriculum của Liên Hợp Quốc](https://hr.un.org/sites/hr.un.org/files/Chinese%20Language%20Curriculum_0.pdf): tham khảo chủ điểm và cấu trúc ngữ pháp. Ví dụ, câu hỏi và giải thích tiếng Việt trong web được biên soạn cho dự án.

`lib/content.ts` chứa bộ từ, điểm ngữ pháp và nguồn; `lib/study.ts` xử lý lịch ôn, kiểm tra bản sao lưu và tạo câu hỏi. `app/page.tsx` và `app/globals.css` là giao diện học. Giữ ID của mục từ khi sửa nghĩa hay câu ví dụ để tiến độ cũ vẫn khớp.

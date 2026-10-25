AI TUTOR — MVP 0.2 (GEMINI API)
================================

BẢN NÀY CÓ GÌ?
- Website tiếng Việt chạy trên máy Windows qua máy chủ Node.js cục bộ.
- Kết nối Gemini API ở phía máy chủ; API key được lưu trong .env, không đưa vào app.js/index.html.
- Hướng dẫn Toán theo 4 bước bằng Gemini.
- Tạo 5 bài tập tự luận bằng Gemini.
- Gửi ảnh/PDF bài làm cho Gemini để chấm tham khảo theo barem.
- Nhận dạng giọng nói dựa trên trình duyệt, sau đó gửi câu hỏi đã nhận dạng đến Gemini.

CÁCH CÀI ĐẶT LẦN ĐẦU
1. Cài Node.js bản LTS từ https://nodejs.org/ (nếu máy chưa có).
2. Tạo Gemini API key tại https://aistudio.google.com/apikey . Đăng nhập tài khoản Google.
3. Giải nén toàn bộ thư mục ai-classroom-mvp.
4. Nhấp đúp start.bat. Lần đầu, chương trình tạo tệp .env và mở Notepad.
5. Trong .env, thay PASTE_YOUR_GEMINI_API_KEY_HERE bằng API key của bạn, giữ nguyên phần GEMINI_API_KEY= ở đầu dòng. Lưu tệp và đóng Notepad.
6. Nhấp đúp start.bat lần nữa. Chương trình sẽ cài thư viện cần thiết qua Internet lần đầu và khởi động máy chủ.
7. Mở trình duyệt Chrome/Edge tại http://localhost:3000 . KHÔNG mở index.html bằng cách nhấp đúp khi dùng bản kết nối Gemini.
8. Giữ cửa sổ terminal đang chạy. Khi muốn dừng, nhấn Ctrl+C trong cửa sổ đó.

CÁCH DÙNG
- Giải toán: nhập đề, chọn bước 1–4 bằng thanh bước, rồi nhấn “Hỏi Gemini hướng dẫn”.
- Chấm bài: chọn ảnh JPG/PNG/WEBP hoặc PDF dưới 12 MB, nhấn “Chấm bài bằng Gemini”. Kết quả là đề xuất tham khảo, không phải điểm chính thức.
- Tạo bài tập: chọn chủ đề và độ khó rồi nhấn “Tạo 5 bài tập bằng Gemini”.
- Giọng nói: dùng Chrome/Edge nếu hỗ trợ nhận dạng, nói hoặc nhập câu hỏi rồi nhấn “Gửi câu hỏi này cho Gemini”.

CHI PHÍ
- Node.js và phần mã website không mất phí.
- Gemini API có thể có hạn mức miễn phí hoặc hạn mức tính phí tùy tài khoản, mô hình và khu vực. Kiểm tra hạn mức/chi phí trong Google AI Studio trước khi dùng thường xuyên; không giả định mọi lượt gọi đều miễn phí.

BẢO MẬT
- Không gửi API key cho người khác, không dán key vào app.js/index.html và không tải tệp .env lên GitHub.
- API key chỉ ở .env và máy chủ lắng nghe trên 127.0.0.1 (máy của bạn).
- Khi triển khai website công khai, cần backend/hosting bảo mật, giới hạn lượt gọi, xác thực người dùng và kiểm soát chi phí; không dùng nguyên cấu hình localhost làm website công khai.
- Tệp ảnh/PDF được gửi đến Gemini để phân tích khi bạn bấm nút chấm bài. Không tải lên nếu bài có thông tin cá nhân nhạy cảm.
- Gemini có thể đọc sai chữ viết tay hoặc cho điểm không chính xác. Giáo viên cần kiểm tra kết quả.

CẤU TRÚC
index.html   Giao diện
styles.css   Thiết kế giao diện
app.js       Tương tác trình duyệt và gọi API máy chủ
server.mjs   Máy chủ backend, gọi Gemini và giữ API key
package.json Danh sách thư viện và lệnh chạy
.env         API key riêng của bạn (tự tạo ở lần đầu, không chia sẻ)
start.bat    Khởi động trên Windows

LỖI THƯỜNG GẶP
- “Chưa tìm thấy Node.js”: cài Node.js LTS, rồi đóng/mở lại cửa sổ Windows.
- “Chưa cấu hình GEMINI_API_KEY”: sửa .env, lưu, chạy lại start.bat.
- Lỗi API/quota: kiểm tra key, quyền truy cập Gemini API, mô hình, hạn mức và trang Usage của AI Studio.
- Trang không tải: kiểm tra cửa sổ terminal; dùng http://localhost:3000; đừng đóng cửa sổ server.

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
app.use(express.json({ limit: '18mb' }));

function getClient() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
    const error = new Error('Chưa cấu hình GEMINI_API_KEY. Hãy mở tệp .env và dán API key của bạn.');
    error.status = 503;
    throw error;
  }
  return new GoogleGenAI({ apiKey: key });
}

async function generate(contents, systemInstruction) {
  const ai = getClient();
  const result = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction, temperature: 0.35 },
  });
  const text = result.text?.trim();
  if (!text) throw new Error('Gemini không trả về nội dung. Hãy thử lại.');
  return text;
}

app.get('/api/health', (_req, res) => {
  const configured = Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_API_KEY.trim() !== 'PASTE_YOUR_GEMINI_API_KEY_HERE');
  res.json({ ok: true, configured, model: MODEL });
});

app.post('/api/tutor', async (req, res) => {
  try {
    const problem = String(req.body?.problem || '').trim();
    const step = Number(req.body?.step || 0);
    const studentAnswer = String(req.body?.studentAnswer || '').trim();
    if (!problem) return res.status(400).json({ error: 'Vui lòng nhập đề bài hoặc câu hỏi.' });
    if (problem.length > 12000) return res.status(400).json({ error: 'Nội dung quá dài. Vui lòng rút gọn đề bài.' });
    const stepInstructions = {
      1: 'Chỉ thực hiện BƯỚC 1: phân tích dữ kiện đã cho, điều cần tìm và điều kiện. Kết thúc bằng 1-3 câu hỏi gợi mở; không giải hết bài.',
      2: 'Chỉ thực hiện BƯỚC 2: xác định kiến thức, định nghĩa, công thức hoặc định lý phù hợp và giải thích vì sao. Không đưa toàn bộ lời giải.',
      3: 'Chỉ thực hiện BƯỚC 3: nêu chiến lược giải theo các bước trung gian, để học sinh tự tính hoặc tự chứng minh. Không tiết lộ ngay kết quả cuối.',
      4: 'Chỉ thực hiện BƯỚC 4: hướng dẫn cách kiểm tra điều kiện, phép tính, đơn vị và kết luận. Nếu học sinh chưa đưa đáp án, hãy hỏi em tự kiểm tra trước.',
    };
    const instruction = stepInstructions[step] || 'Trả lời câu hỏi của học sinh bằng tiếng Việt, rõ ràng và phù hợp trình độ. Với bài toán, ưu tiên gợi ý từng bước, không đưa ngay lời giải đầy đủ trừ khi học sinh yêu cầu rõ.';
    const text = await generate(`Đề bài/câu hỏi của học sinh:\n${problem}\n\nCâu trả lời hoặc suy nghĩ hiện tại của học sinh:\n${studentAnswer || '(chưa cung cấp)'}\n\nYêu cầu: ${instruction}\n\nHãy dùng tiêu đề ngắn, công thức dễ đọc và giọng điệu khích lệ. Nếu đề thiếu dữ kiện hoặc mơ hồ, hãy hỏi lại thay vì tự bịa dữ kiện.`, 'Bạn là AI Tutor dạy Toán bằng tiếng Việt. Mục tiêu là giúp học sinh tự suy luận. Không bịa định lý, dữ kiện hoặc kết quả.');
    res.json({ text, model: MODEL });
  } catch (error) {
    console.error('Tutor API error:', error.message);
    res.status(error.status || 502).json({ error: error.message || 'Không gọi được Gemini.' });
  }
});

app.post('/api/exercises', async (req, res) => {
  try {
    const topic = String(req.body?.topic || 'Toán học').slice(0, 200);
    const difficulty = String(req.body?.difficulty || 'Tăng dần từ dễ đến khó').slice(0, 100);
    const text = await generate(`Hãy tạo đúng 5 bài tập TỰ LUẬN mới về chủ đề: ${topic}. Mức độ: ${difficulty}.\n\nVới mỗi bài, trình bày: Bài số; đề bài rõ ràng và đủ dữ kiện; kiến thức mục tiêu; barem điểm tổng 10 điểm với tiêu chí cụ thể; 2-3 gợi ý theo từng bước. KHÔNG đưa lời giải hoàn chỉnh hoặc đáp án cuối cùng. Các bài phải khác nhau về dữ kiện/cách suy luận, phù hợp người học Xác suất thống kê hoặc Toán cơ bản tùy chủ đề. Kiểm tra đề không mâu thuẫn trước khi trả lời.`, 'Bạn là giáo viên Toán cẩn thận. Sinh bài tập tự luận bằng tiếng Việt. Không tạo dữ kiện vô nghĩa và không hiển thị lời giải đầy đủ.');
    res.json({ text, model: MODEL });
  } catch (error) {
    console.error('Exercises API error:', error.message);
    res.status(error.status || 502).json({ error: error.message || 'Không tạo được bài tập.' });
  }
});

app.post('/api/grade', async (req, res) => {
  try {
    const { fileName, mimeType, base64, rubric } = req.body || {};
    if (!base64 || typeof base64 !== 'string') return res.status(400).json({ error: 'Chưa nhận được nội dung tệp. Hãy chọn ảnh hoặc PDF.' });
    if (base64.length > 15 * 1024 * 1024) return res.status(413).json({ error: 'Tệp quá lớn. Hãy chọn tệp nhỏ hơn khoảng 11 MB.' });
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ error: 'Định dạng chưa hỗ trợ. Dùng JPG, PNG, WEBP hoặc PDF.' });
    const rubricText = Array.isArray(rubric) ? rubric.map(r => `- ${String(r.criterion).slice(0,120)}: tối đa ${Number(r.maxScore) || 0} điểm`).join('\n') : '- Hiểu đề: 2; phương pháp: 2; lập luận: 4; kết luận: 2';
    const prompt = `Bạn là trợ lý hỗ trợ giáo viên chấm bài Toán. Hãy đọc bài làm đính kèm (tên tệp: ${String(fileName || 'bài làm').slice(0,160)}) và đưa ra nhận xét chấm điểm THAM KHẢO bằng tiếng Việt.\nBarem tham khảo:\n${rubricText}\n\nTrình bày: (1) nội dung đọc được; (2) bảng điểm từng tiêu chí và tổng điểm; (3) lỗi sai cụ thể theo bước; (4) gợi ý sửa sai nhưng không cần viết lại toàn bộ lời giải. Nếu chữ viết/biểu thức không đọc rõ, nói rõ phần nào không chắc và không đoán. Nếu thiếu đề bài hoặc đáp án tham chiếu, nêu rõ giới hạn. Không khẳng định điểm là chính thức; giáo viên phải duyệt lại.`;
    const text = await generate([{ text: prompt }, { inlineData: { mimeType, data: base64 } }], 'Bạn hỗ trợ chấm bài Toán, công bằng và thận trọng. Không tự bịa nội dung ảnh. Phân biệt rõ điều đọc chắc chắn và điều không chắc chắn. Điểm do AI đề xuất chỉ là tham khảo.');
    res.json({ text, model: MODEL, disclaimer: 'Điểm do AI đề xuất cần giáo viên kiểm tra.' });
  } catch (error) {
    console.error('Grade API error:', error.message);
    res.status(error.status || 502).json({ error: error.message || 'Không phân tích được tệp.' });
  }
});

app.use(express.static(__dirname));
app.listen(PORT, '127.0.0.1', () => {
  console.log(`AI Tutor đang chạy tại http://localhost:${PORT}`);
  console.log(`Mô hình: ${MODEL}`);
  console.log('Giữ cửa sổ này mở khi dùng website. Nhấn Ctrl+C để dừng.');
});

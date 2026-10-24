const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
async function askServer(path, payload) {
  const response = await fetch(path, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  const data = await response.json().catch(()=>({error:'Máy chủ trả về phản hồi không hợp lệ.'}));
  if (!response.ok) throw new Error(data.error || `Lỗi máy chủ (${response.status})`);
  return data;
}
async function renderAiResponse(selector, text) {
  const target = $(selector);
  if (!target) return;
  const source = String(text ?? '');

  // Chờ các thư viện CDN tải xong (nếu có) trước khi hiển thị.
  // Nếu thiếu thư viện, báo rõ để người dùng biết vì sao LaTeX chưa được render.
  if (!window.marked || !window.DOMPurify) {
    target.textContent = source;
    if (!document.getElementById('renderLibraryWarning')) {
      const warning = document.createElement('p');
      warning.id = 'renderLibraryWarning';
      warning.className = 'render-library-warning';
      warning.textContent = 'Chưa tải được thư viện hiển thị Markdown. Hãy kiểm tra Internet/CDN rồi tải lại trang bằng Ctrl + F5.';
      target.appendChild(warning);
    }
    return;
  }

  // Marked chuyển Markdown (tiêu đề, danh sách, bảng) thành HTML.
  const html = window.marked.parse(source, { gfm: true, breaks: true });
  target.innerHTML = window.DOMPurify.sanitize(html);

  // MathJax chuyển $...$, $$...$$, \\(...\\) và \\[...\\] thành công thức toán.
  if (window.MathJax?.typesetPromise) {
    try {
      if (window.MathJax.startup?.promise) await window.MathJax.startup.promise;
      if (window.MathJax.typesetClear) window.MathJax.typesetClear([target]);
      await window.MathJax.typesetPromise([target]);
    } catch (error) {
      console.error('MathJax không thể hiển thị công thức:', error);
    }
  } else if (!document.getElementById('mathLibraryWarning')) {
    const warning = document.createElement('p');
    warning.id = 'mathLibraryWarning';
    warning.className = 'render-library-warning';
    warning.textContent = 'Thư viện công thức toán chưa tải được. Kiểm tra Internet/CDN rồi nhấn Ctrl + F5.';
    target.appendChild(warning);
  }
}
function showAiResult(boxId, statusId, responseId, text, status='Đang xử lý…') {
  $(boxId).classList.remove('hidden'); $(boxId).classList.add('loading');
  $(statusId).textContent=status; renderAiResponse(responseId, text);
}
function finishAiResult(boxId, statusId, responseId, text, status='Hoàn tất') {
  $(boxId).classList.remove('loading'); $(statusId).textContent=status;
  renderAiResponse(responseId, text);
}
function showAiError(boxId, statusId, responseId, error) {
  finishAiResult(boxId,statusId,responseId,'Không gọi được Gemini: '+error.message+'\n\nHãy kiểm tra máy chủ đang chạy, API key trong .env và kết nối Internet.','Lỗi kết nối');
}
const pages = {
  tutor: ['Giải toán theo 4 bước','Học cách tư duy, không chỉ tìm đáp án.'],
  grading: ['Chấm bài','Xem trước bài làm và nhập điểm theo barem mẫu.'],
  practice: ['Tạo bài tập tương tự','Luyện tập thêm với bộ câu hỏi mẫu có sẵn.'],
  voice: ['Trò chuyện bằng giọng nói','Thử nhận dạng và đọc văn bản bằng trình duyệt.'],
  status: ['Trạng thái tính năng','Theo dõi rõ những phần đã hoạt động và chưa kết nối.'],
  home: ['Giải toán theo 4 bước','Học cách tư duy, không chỉ tìm đáp án.']
};
function showPage(name){ if(name==='home') name='tutor'; $$('.page').forEach(p=>p.classList.remove('active')); const page=$('#page-'+name); if(page)page.classList.add('active'); $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===name)); $('#pageTitle').textContent=pages[name][0];$('#pageSubtitle').textContent=pages[name][1];window.scrollTo({top:0,behavior:'smooth'}); }
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$('#globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.toLowerCase();if(q.includes('chấm')||q.includes('pdf')||q.includes('ảnh'))showPage('grading');else if(q.includes('giọng')||q.includes('nói'))showPage('voice');else if(q.includes('bài tập'))showPage('practice');else showPage('tutor');}});
const stepData=[
 {title:'Phân tích đề bài',intro:'Xác định dữ kiện đã cho và điều đề bài yêu cầu.',given:'E(X) = 3 và E(X²) = 13.',find:'Tính phương sai Var(X).',hints:['Đề bài đã cho những đại lượng nào?','Phương sai mô tả đặc điểm gì của biến ngẫu nhiên?','Bạn nhớ công thức liên hệ giữa E(X²), E(X) và Var(X) không?']},
 {title:'Kiến thức cần dùng',intro:'Nhớ lại công thức hoặc định lý phù hợp trước khi tính.',given:'Kỳ vọng E(X) = 3; kỳ vọng bình phương E(X²) = 13.',find:'Chọn công thức tính phương sai.',hints:['Công thức Var(X) = E(X²) − [E(X)]² có phù hợp không?','Bạn đã phân biệt E(X²) với [E(X)]² chưa?','Hãy nêu công thức bằng lời hoặc viết lại bằng ký hiệu.']},
 {title:'Xây dựng chiến lược giải',intro:'Lập kế hoạch từng bước, rồi tự thực hiện phép tính.',given:'Var(X) = E(X²) − [E(X)]².',find:'Thay các dữ kiện đã cho vào công thức.',hints:['Bước đầu tiên là thay E(X²) bằng số nào?','Tiếp theo, cần bình phương giá trị kỳ vọng nào?','Bạn hãy tự tính hiệu của hai đại lượng vừa xác định.']},
 {title:'Kiểm tra và kết luận',intro:'Kiểm tra phép tính và viết kết luận rõ ràng.',given:'Đã có công thức và dữ kiện cần thiết.',find:'Kiểm tra kết quả phương sai và trình bày kết luận.',hints:['Phương sai có thể âm không?','Bạn đã bình phương kỳ vọng trước khi lấy hiệu chưa?','Hãy kiểm tra phép tính và ghi kết luận kèm ký hiệu Var(X).']}
];let currentStep=0;
function renderStep(){const d=stepData[currentStep];$('#stepKicker').textContent=`BƯỚC ${currentStep+1} / 4` ;$('#stepTitle').textContent=d.title;$('#stepIntro').textContent=d.intro;$('#givenText').textContent=d.given;$('#findText').textContent=d.find;$('#hintList').innerHTML=d.hints.map(x=>`<li>${x}</li>`).join('');$$('.step').forEach((b,i)=>{b.classList.toggle('active',i===currentStep);b.classList.toggle('complete',i<currentStep)});$('#prevStep').disabled=currentStep===0;$('#prevStep').style.opacity=currentStep===0?'.45':'1';$('#nextStep').textContent=currentStep===3?'Quay lại bước đầu ↺':'Gợi ý tiếp theo →';}
$$('.step').forEach(b=>b.addEventListener('click',()=>{currentStep=Number(b.dataset.step);renderStep()}));$('#nextStep').addEventListener('click',()=>{currentStep=currentStep===3?0:currentStep+1;renderStep()});$('#prevStep').addEventListener('click',()=>{currentStep=Math.max(0,currentStep-1);renderStep()});
$('#startTutor').addEventListener('click',async()=>{
  const problem=$('#problemInput').value.trim(); if(!problem){alert('Hãy nhập đề toán trước.');return;}
  showAiResult('#aiTutorBox','#tutorAiStatus','#aiTutorResponse','Gemini đang phân tích đề toán…');
  $('#startTutor').disabled=true;
  try{const r=await askServer('/api/tutor',{problem,step:currentStep+1,studentAnswer:$('#studentAnswer').value.trim()});finishAiResult('#aiTutorBox','#tutorAiStatus','#aiTutorResponse',r.text,'Đã nhận phản hồi từ Gemini');}
  catch(e){showAiError('#aiTutorBox','#tutorAiStatus','#aiTutorResponse',e)}finally{$('#startTutor').disabled=false;}
});
function speak(text){if(!('speechSynthesis'in window)){alert('Trình duyệt này chưa hỗ trợ đọc văn bản. Hãy thử Microsoft Edge hoặc Chrome.');return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='vi-VN';window.speechSynthesis.speak(u)}$('#readHint').addEventListener('click',()=>speak(stepData[currentStep].title+'. '+stepData[currentStep].hints.join('. ')));
// Local-only upload preview. Nothing is uploaded to a server.
const fileInput=$('#fileInput'),drop=$('#dropZone');let selectedFile=null;$('#chooseFile').addEventListener('click',()=>fileInput.click());fileInput.addEventListener('change',()=>handleFile(fileInput.files[0]));function handleFile(file){if(!file)return;if(!(file.type.startsWith('image/')||file.type==='application/pdf')){alert('Vui lòng chọn tệp ảnh hoặc PDF.');return;}selectedFile=file;$('#previewArea').classList.remove('hidden');$('#previewName').textContent=file.name;$('#fileInfo').textContent=`Đã chọn: ${file.name} · ${(file.size/1024/1024).toFixed(2)} MB`;const url=URL.createObjectURL(file);$('#filePreview').innerHTML='';if(file.type.startsWith('image/')){const img=document.createElement('img');img.alt='Xem trước bài làm';img.src=url;$('#filePreview').append(img);}else{const frame=document.createElement('iframe');frame.title='Xem trước PDF';frame.src=url;$('#filePreview').append(frame);}$('#previewArea').dataset.url=url;}
$('#removeFile').addEventListener('click',()=>{if($('#previewArea').dataset.url)URL.revokeObjectURL($('#previewArea').dataset.url);$('#previewArea').classList.add('hidden');$('#filePreview').innerHTML='';$('#fileInfo').textContent='';fileInput.value='';selectedFile=null;});['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('dragging')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('dragging')}));drop.addEventListener('drop',e=>handleFile(e.dataTransfer.files[0]));
const rubric=[['Hiểu đề và xác định dữ kiện',2],['Chọn phương pháp phù hợp',2],['Lập luận và các bước giải',4],['Kết luận và trình bày',2]];$('#rubricRows').innerHTML=rubric.map((r,i)=>`<div class="rubric-row"><div><b>${r[0]}</b><small>Điểm tối đa: ${r[1]}</small></div><input aria-label="Điểm ${r[0]}" type="number" min="0" max="${r[1]}" step="0.25" value="0" data-max="${r[1]}" class="rubric-score"></div>`).join('');function sumScores(){let total=0;$$('.rubric-score').forEach(i=>{let v=Number(i.value)||0;const max=Number(i.dataset.max);if(v<0)v=0;if(v>max)v=max;i.value=v;total+=v});$('#totalScore').textContent=Number(total.toFixed(2)).toString();return total;}$('#saveScore').addEventListener('click',()=>{sumScores();$('#saveScore').textContent='Đã tính tổng điểm';setTimeout(()=>$('#saveScore').textContent='Tính tổng điểm',1800)});$$('.rubric-score').forEach(i=>i.addEventListener('input',sumScores));
$('#gradeWithAI').addEventListener('click',async()=>{
  if(!selectedFile){alert('Trước tiên hãy chọn ảnh bài làm hoặc PDF.');return;}
  if(selectedFile.size>12*1024*1024){alert('Tệp quá lớn. Hãy chọn tệp nhỏ hơn 12 MB.');return;}
  showAiResult('#gradeAiBox','#gradeAiStatus','#gradeAiResponse','Đang gửi tệp cho Gemini để phân tích…');$('#gradeWithAI').disabled=true;
  try{const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Không đọc được tệp'));reader.readAsDataURL(selectedFile)});const base64=String(dataUrl).split(',')[1];const r=await askServer('/api/grade',{fileName:selectedFile.name,mimeType:selectedFile.type||'application/pdf',base64,rubric:rubric.map(x=>({criterion:x[0],maxScore:x[1]}))});finishAiResult('#gradeAiBox','#gradeAiStatus','#gradeAiResponse',r.text,'AI chấm tham khảo');}
  catch(e){showAiError('#gradeAiBox','#gradeAiStatus','#gradeAiResponse',e)}finally{$('#gradeWithAI').disabled=false;}
});
const questionBank={variance:[['Bài 1 · Nhận biết','Một biến ngẫu nhiên X có E(X)=2 và E(X²)=8. Hãy tính Var(X).','Gợi ý: Var(X)=E(X²)−[E(X)]².'],['Bài 2 · Cơ bản','Biết E(Y)=4 và Var(Y)=5. Hãy tính E(Y²).','Gợi ý: E(Y²)=Var(Y)+[E(Y)]².'],['Bài 3 · Vận dụng','Biết E(Z)=−2 và E(Z²)=11. Tính phương sai của Z và nhận xét kết quả.','Gợi ý: Bình phương kỳ vọng trước khi lấy hiệu.'],['Bài 4 · Phân tích','Một biến ngẫu nhiên có kỳ vọng bằng 5 và phương sai bằng 9. Tìm E(X²).','Gợi ý: Biến đổi công thức phương sai để tìm E(X²).'],['Bài 5 · Thử thách','Biến ngẫu nhiên X nhận hai giá trị 0 và 2 với xác suất tương ứng 0,25 và 0,75. Hãy tính E(X), E(X²) và Var(X).','Gợi ý: Tính kỳ vọng bằng tổng giá trị nhân xác suất.']],probability:[['Bài 1 · Nhận biết','Gieo một đồng xu cân đối. Tính xác suất xuất hiện mặt ngửa.','Gợi ý: Các kết quả đồng khả năng.'],['Bài 2 · Cơ bản','Gieo một con xúc xắc cân đối. Tính xác suất ra số chẵn.','Gợi ý: Đếm các kết quả thuận lợi.'],['Bài 3 · Vận dụng','Rút ngẫu nhiên một lá từ bộ bài 52 lá. Tính xác suất rút được lá Át.','Gợi ý: Có 4 lá Át trong bộ bài.'],['Bài 4 · Phân tích','Một hộp có 3 bi đỏ và 5 bi xanh. Rút một viên ngẫu nhiên. Tính xác suất rút bi không đỏ.','Gợi ý: Tổng số viên bi là bao nhiêu?'],['Bài 5 · Thử thách','Gieo hai đồng xu cân đối. Tính xác suất có đúng một mặt ngửa. Liệt kê không gian mẫu.','Gợi ý: Liệt kê các cặp kết quả có thể.']],normal:[['Bài 1 · Nhận biết','X có phân phối chuẩn với μ=10, σ=2. Hãy xác định trung bình và độ lệch chuẩn.','Gợi ý: Đọc các tham số từ ký hiệu phân phối.'],['Bài 2 · Cơ bản','X có phân phối chuẩn N(50, 10²). Chuẩn hóa giá trị x=60 thành điểm z.','Gợi ý: z=(x−μ)/σ.'],['Bài 3 · Vận dụng','Điểm kiểm tra có μ=70, σ=5. Hãy chuẩn hóa điểm 80.','Gợi ý: Trừ trung bình rồi chia độ lệch chuẩn.'],['Bài 4 · Phân tích','X có phân phối chuẩn với μ=100, σ=15. Viết biểu thức xác suất P(X<115) theo biến chuẩn Z.','Gợi ý: Chuyển ngưỡng X sang Z.'],['Bài 5 · Thử thách','Chiều cao giả định phân phối chuẩn với μ=170 cm, σ=6 cm. Viết biểu thức tính xác suất chiều cao nằm giữa 164 và 176 cm.','Gợi ý: Chuẩn hóa cả hai cận.']],algebra:[['Bài 1 · Nhận biết','Giải phương trình 2x+6=14.','Gợi ý: Cô lập x bằng các phép biến đổi tương đương.'],['Bài 2 · Cơ bản','Rút gọn biểu thức 3(x+2)−x.','Gợi ý: Phân phối phép nhân rồi gom hạng tử.'],['Bài 3 · Vận dụng','Giải phương trình x²−5x+6=0.','Gợi ý: Tìm hai số có tích 6 và tổng 5.'],['Bài 4 · Phân tích','Tìm x thỏa mãn 2(x−3)=x+4 và kiểm tra kết quả.','Gợi ý: Khai triển ngoặc trước.'],['Bài 5 · Thử thách','Một hình chữ nhật có chu vi 30 cm, chiều dài hơn chiều rộng 3 cm. Lập phương trình và tìm hai kích thước.','Gợi ý: Gọi chiều rộng là x, biểu diễn chiều dài theo x.']]};
$('#generateExercises').addEventListener('click',async()=>{
  const topic=$('#topicSelect').selectedOptions[0].textContent,diff=$('#difficultySelect').selectedOptions[0].textContent;
  $('#exerciseList').innerHTML='<div class="empty-state"><b>Gemini đang tạo 5 bài tập…</b><p>Vui lòng chờ phản hồi.</p></div>';$('#generateExercises').disabled=true;
  try{const r=await askServer('/api/exercises',{topic,difficulty:diff});const card=document.createElement('article');card.className='exercise-card';const h=document.createElement('h3');h.textContent='5 bài tập được Gemini tạo';const pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.style.font='inherit';pre.textContent=r.text;card.append(h,pre);$('#exerciseList').replaceChildren(card);}
  catch(e){$('#exerciseList').innerHTML='';const card=document.createElement('article');card.className='exercise-card';const h=document.createElement('h3');h.textContent='Chưa tạo được bài tập';const p=document.createElement('p');p.textContent=e.message+' — Kiểm tra máy chủ và API key rồi thử lại.';card.append(h,p);$('#exerciseList').append(card);}
  finally{$('#generateExercises').disabled=false;}
});
let recognition=null;const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(SpeechRecognition){recognition=new SpeechRecognition();recognition.lang='vi-VN';recognition.interimResults=true;recognition.continuous=false;recognition.onstart=()=>{$('#voiceStatus').textContent='Đang nghe…';$('#voiceOrb').classList.add('listening');$('#startListening').disabled=true;$('#stopListening').disabled=false;};recognition.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;$('#transcript').value=t;};recognition.onerror=e=>{$('#voiceStatus').textContent='Không thể nhận dạng: '+e.error;};recognition.onend=()=>{$('#voiceOrb').classList.remove('listening');$('#startListening').disabled=false;$('#stopListening').disabled=true;if($('#voiceStatus').textContent==='Đang nghe…')$('#voiceStatus').textContent='Đã dừng nghe';};}else{$('#voiceHelp').textContent='Trình duyệt hiện tại không cung cấp API nhận dạng giọng nói. Bạn vẫn có thể nhập văn bản và dùng tính năng đọc nếu được hỗ trợ.';$('#startListening').title='Thử Chrome hoặc Edge; có thể cần kết nối Internet.';}
$('#startListening').addEventListener('click',()=>{if(!recognition){alert('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy thử Chrome hoặc Microsoft Edge.');return;}try{recognition.start()}catch(e){$('#voiceStatus').textContent='Hãy chờ một chút rồi thử lại.'}});$('#stopListening').addEventListener('click',()=>recognition&&recognition.stop());$('#speakTranscript').addEventListener('click',()=>{const t=$('#transcript').value.trim();if(!t){alert('Hãy nhập hoặc nhận dạng một đoạn văn bản trước.');return;}speak(t)});
$('#askVoiceAI').addEventListener('click',async()=>{const question=$('#transcript').value.trim();if(!question){alert('Hãy nói hoặc nhập câu hỏi trước.');return;}showAiResult('#voiceAiBox','#voiceAiStatus','#voiceAiResponse','Gemini đang trả lời…');$('#askVoiceAI').disabled=true;try{const r=await askServer('/api/tutor',{problem:question,step:0,studentAnswer:''});finishAiResult('#voiceAiBox','#voiceAiStatus','#voiceAiResponse',r.text,'Đã trả lời');}catch(e){showAiError('#voiceAiBox','#voiceAiStatus','#voiceAiResponse',e)}finally{$('#askVoiceAI').disabled=false;}});
// Check whether the local backend is running; never imply AI is connected when it is not.
fetch('/api/health').then(r=>r.json()).then(d=>{if(!d.configured){$('.mvp-tag').innerHTML='<i></i> Máy chủ chạy · Chưa có API key';}}).catch(()=>{$('.mvp-tag').innerHTML='<i></i> Chưa kết nối máy chủ Gemini';});
renderStep();sumScores();

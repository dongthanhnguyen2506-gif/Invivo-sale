import { useState, useRef, useEffect, useCallback } from "react";

// ─── Logo (base64 embedded) ──────────────────────────────────────
const LOGO_URL = "data:image/png;base64,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jJd0tYGHpJG7pkOObsYUi260sljLaOrZRSwMZGGyA77mMG9huOZfKSTx5ALgGp6qoG5d6OjucfImaINkA9T24I9683WigusLptPyy+UNG9JQTkGTHWY3Dg8ermpGyPN8DsXUcj77CsXMaLY227Mx75L10Nrfd5vLrhWspHV05bCSzPSyE8TjIwwE8XfFLTcxTw/JN5jfPbJeI+1Cf6yMn4civfZa6mrGR0FzpaeR9NCRTbwc10jmklsTnZ4DJPIAngMqWvdrrrnapaurkaJ45CIKVu7imbgFzXycAGtHJvUSBzyso47sxxZnf18Qd3YN/isXvs7BJp5cLe8vBVW+WuW11bYzI2aCVvSQTs9GVh5EfmOpR6sWnZWXSjdpuscGl7i+gkd/RTfY+67ljtwq/Ix8cjo5Glr2ktc0jiCOpU5WNAD2aHwPD3uVqNxza7UePWvFERQKVERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERFYN4WvRwDeFTdpDk9YgYeX9p38KgGgucAOJJwFO65LYr023s9Cgp46Yd4aC4/3iVYi+ljn8u/8AIFQyfU5rOfd+dl1aRpGilkqXQTVLZAWSRwtZP5meT48h44jIcD2L0amnZW1sFvoJX1wy0ROliInYTw6IuPFwHDGVL2jUVHFQw0jblLTsYwNAlgMTh1cJYTk/2mlRlhne03XUs75JJaZu7TukfvOM0mQ0knmWgE+wK6Qzo2xtOuvYMzv81UBfjc9w0055BeN4qY7JRvsNukBndwuFS0+m7+rafsjr7Sq4v0kkkkkk8yV+LXyyGQ8BuHBXY48A696LzhjkmlZFCx0kjyGta0ZJPYAvBT2gKern1bQ+RtYXxSdI4v5Bo9L3LyGPpJGs4leyPwMLuClrJpCnit89bql1Vbo+kZDCAADl31jkHh/qvOr0O+3Q1k8N8hdX0UZqWwxNIcIweDic+acdX/tcO0K7GqvFRSUV1qqu3l/SbkjyWNfxyG5+qOpfuzirugvb6G3to5HVjN2Xytpc3cbxPXk8OpbQfK9KIAy+69878td1lrz8x0ZmLrb7brc9N916a7d1FbJbnG1rbrSN3qxrRjp4/wCtA+0PreK6LPUT3a3w0r4KmtFHgR0keIadv7cr88ST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mnm13rCikWbJHRm7SsXsa8WctYobvYdRwUbKkS1c1K7fZTTSBsjnYxxBIZJ4g+rmoG/RWZt3fXXG83mC4B2/GH0e6WEejjqwPUqKpah1HeaSIQtrXTQD+hnAlZ4Ozj2LZHaIlbaVufH2R5qgKExm8Zy4ewfJXKxfJ+pLpBf2boulE0yVVK0calzWncewduQMj/w+ugo5S6zUFbBI58kst2r2OYSTjO6CPXjl61XYNSwNmbNLp+2iVpyJKffgcD2+Y7gps7SanoOiFt4Yxk1b8+PP3qzHU0xF5HZ9hz017vNQSQTg2Y3LtGWv38kt4vGn6ae5XC6NtMc5c+C3GMSdISc46PIDR1dXsXts9zZeqOppnaPaYqgtdUS00phiy05BJPBvM9ar9RquZ0rpoLVbIpXf0z4TNJ/ekJUXcrxdLlwra6eZo5MLsMHc0cB4Kua1kdgwkjhrfmdOTVMKV783AA93lrzKv2odX2uljnip6enqaqoINQ2BxMTyBgb8mAX8OoYHPis/u1yrLpVGorJTI7G60AYaxvU1o5AepcaKpU1stQfq04KzBSxwD6dUREVRWURERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERF//2Q==";

// ─── PASTE YOUR APPS SCRIPT URL HERE ────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
// ─────────────────────────────────────────────────────────────────

// ─── DEFAULT PINs (lần đầu đăng nhập) ───────────────────────────
// NVKD có thể đổi PIN sau khi đăng nhập lần đầu
const DEFAULT_PINS = {
  // Board Management
  'Board Management':      '0000',
  // Sale Managers
  'Trần Ngọc Bảo Trung':  '2301',  // SM HCM
  'Nguyễn Văn Thuyết':    '5750',  // SM HN
  'Huỳnh Ngọc Hải':       '8854',  // SM Gia Lai
  'Hà Ngọc Khuyến':       '8853',  // SM TN-PT
  // NVKD HN
  'Nguyễn Đức Quân':      '1947',
  'Lê Anh Dũng':          '6535',
  'Vương Văn Tiến':       '5318',
  // NVKD HCM
  'Trần Việt Hảo':        '5540',
  'Thúy Kiều':            '6641',
  'Châu Kim Ngân':        '9903',
  'Nguyễn Bá Phú':        '3515',
  // NVKD TN-PT
  'Vũ Thanh Tùng':        '7097',
  // NVKD Gia Lai
  'Ngọc Tuyết':           '6618',
};

// Role definitions
const ROLE_MAP = {
  'Board Management': 'board',     // thấy tất cả mọi thứ
  'Trần Ngọc Bảo Trung': 'sm',    // Sale Manager HCM
  'Nguyễn Văn Thuyết':   'sm',    // Sale Manager HN
  'Huỳnh Ngọc Hải':      'sm',    // Sale Manager Gia Lai
  'Hà Ngọc Khuyến':      'sm',    // Sale Manager TN-PT
};
// không có trong ROLE_MAP → NVKD thường

// ─── CONFIG ───────────────────────────────────────────────────────
const BRANCHES = ["Hà Nội", "Hồ Chí Minh", "Thái Nguyên - Phú Thọ", "Gia Lai"];

// Sale Manager của từng khu vực (hiển thị đầu tiên)
const SALE_MANAGER_BY_BRANCH = {
  "Hà Nội":                "Nguyễn Văn Thuyết",
  "Hồ Chí Minh":           "Trần Ngọc Bảo Trung",
  "Thái Nguyên - Phú Thọ": "Hà Ngọc Khuyến",
  "Gia Lai":                "Huỳnh Ngọc Hải",
};

const SALE_BY_BRANCH = {
  "Hà Nội": [
    "Nguyễn Văn Thuyết",   // Sale Manager
    "Nguyễn Đức Quân", "Lê Anh Dũng", "Vương Văn Tiến",
  ],
  "Hồ Chí Minh": [
    "Trần Ngọc Bảo Trung", // Sale Manager
    "Trần Việt Hảo", "Thúy Kiều", "Châu Kim Ngân", "Nguyễn Bá Phú",
  ],
  "Thái Nguyên - Phú Thọ": [
    "Hà Ngọc Khuyến",      // Sale Manager
    "Vũ Thanh Tùng",
  ],
  "Gia Lai": [
    "Huỳnh Ngọc Hải",      // Sale Manager
    "Ngọc Tuyết",
  ],
};

const DISTRICTS_BY_BRANCH = {
  "Hà Nội": ["Ba Đình","Hoàn Kiếm","Hai Bà Trưng","Đống Đa","Tây Hồ","Cầu Giấy","Thanh Xuân","Hoàng Mai","Long Biên","Nam Từ Liêm","Bắc Từ Liêm","Hà Đông","Gia Lâm","Đông Anh","Sóc Sơn","Thanh Trì","Mê Linh","Thạch Thất","Quốc Oai","Chương Mỹ"],
  "Hồ Chí Minh": ["Quận 1","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8","Quận 10","Quận 11","Quận 12","Bình Thạnh","Tân Bình","Tân Phú","Phú Nhuận","Gò Vấp","Bình Tân","Thủ Đức","Hóc Môn","Củ Chi","Bình Chánh","Nhà Bè","Cần Giờ"],
  "Thái Nguyên - Phú Thọ": ["TP. Thái Nguyên","Phổ Yên","Sông Công","Phú Bình","Đại Từ","Định Hóa","Võ Nhai","Đồng Hỷ","TP. Việt Trì","Phù Ninh","Lâm Thao","Tam Nông","Thanh Sơn","Yên Lập","Cẩm Khê","Thanh Thủy","Hạ Hòa","Đoan Hùng"],
  "Gia Lai": ["TP. Pleiku","An Khê","Ayun Pa","KBang","Đak Đoa","Chư Păh","Ia Grai","Mang Yang","Kông Chro","Đức Cơ","Chư Prông","Chư Sê","Đak Pơ","Ia Pa","Krông Pa","Phú Thiện","Chư Pưh"],
};

const SPECIALTIES = ["Tim mạch","Nội tiết","Thần kinh","Hô hấp","Tiêu hóa","Cơ xương khớp","Da liễu","Sản phụ khoa","Nhi khoa","Ung bướu","Thận - Tiết niệu","Mắt","Tai mũi họng","Răng hàm mặt","Huyết học","Phục hồi chức năng"];
const VISIT_TYPES = ["Giới thiệu sản phẩm","Follow-up","Onboard khách hàng","Ký hợp đồng","Chăm sóc thúc đẩy","Chăm sóc sau bán","Hỗ trợ kỹ thuật"];
const CUSTOMER_TYPES = ["KH mới","KH cũ","KH tái kích hoạt"];
const CONVERSION_EXPECT = ["Cao","Trung bình","Thấp","Không có"];
const RESULTS = ["Quan tâm - hẹn lại","Đồng ý dùng thử","Đã ký hợp đồng","Onboard khách hàng","Chăm sóc thúc đẩy","Chăm sóc sau bán","Từ chối","Không gặp được"];

const RESULT_STYLE = {
  "Đã ký hợp đồng":      { bg:"#e8faf3", color:"#0d7a4e", border:"#0d7a4e" },
  "Onboard khách hàng":  { bg:"#e8f4ff", color:"#0369a1", border:"#0369a1" },
  "Đồng ý dùng thử":     { bg:"#eaf0ff", color:"#1a40b8", border:"#1a40b8" },
  "Quan tâm - hẹn lại":  { bg:"#fff8e6", color:"#b45309", border:"#b45309" },
  "Chăm sóc thúc đẩy":   { bg:"#f5f3ff", color:"#6d28d9", border:"#6d28d9" },
  "Chăm sóc sau bán":    { bg:"#f0fdf4", color:"#15803d", border:"#15803d" },
  "Từ chối":             { bg:"#fef2f2", color:"#c0392b", border:"#c0392b" },
  "Không gặp được":      { bg:"#f4f4f5", color:"#6b7280", border:"#9ca3af" },
};

const BLUE="#1a56db", RED="#c0392b", BLUE_L="#eaf0ff";

// ─── Performance Score Calculator ────────────────────────────────
function calcScore(nvkdEntries, allEntries) {
  if (!nvkdEntries.length) return 0;
  const total = allEntries.length || 1;
  const maxPerPerson = Math.max(...Object.values(
    allEntries.reduce((acc, e) => { acc[e.sale] = (acc[e.sale]||0)+1; return acc; }, {})
  ), 1);

  // 1. Activity Volume Score (25pts)
  const volRatio = nvkdEntries.length / maxPerPerson;
  const volScore = Math.min(25, Math.round(volRatio * 25));

  // 2. Activity Type Score (20pts) — weighted by visit type
  const typeWeights = {
    "Ký hợp đồng":5,"Onboard khách hàng":4,"Chăm sóc thúc đẩy":3,
    "Giới thiệu sản phẩm":3,"Follow-up":2,"Chăm sóc sau bán":2,"Hỗ trợ kỹ thuật":1,
  };
  const rawType = nvkdEntries.reduce((s,e) => s+(typeWeights[e.visitType]||1), 0);
  const maxType = nvkdEntries.length * 5;
  const typeScore = Math.min(20, Math.round((rawType/maxType)*20));

  // 3. Visit Result Score (35pts)
  const resultWeights = {
    "Đã ký hợp đồng":7,"Onboard khách hàng":6,"Đồng ý dùng thử":5,
    "Chăm sóc thúc đẩy":4,"Chăm sóc sau bán":3,"Quan tâm - hẹn lại":2,
    "Từ chối":1,"Không gặp được":0,
  };
  const rawResult = nvkdEntries.reduce((s,e) => s+(resultWeights[e.result]||0), 0);
  const maxResult = nvkdEntries.length * 7;
  const resultScore = Math.min(35, Math.round((rawResult/maxResult)*35));

  // 4. Active Code Score (20pts) — based on conversion expectation
  const convWeights = {"Cao":4,"Trung bình":2,"Thấp":1,"Không có":0};
  const rawConv = nvkdEntries.reduce((s,e) => s+(convWeights[e.conversionExpect]||0), 0);
  const maxConv = nvkdEntries.length * 4;
  const convScore = Math.min(20, Math.round((rawConv/maxConv)*20));

  return volScore + typeScore + resultScore + convScore;
}

// ─── Shared input style ───────────────────────────────────────────
const IS = {
  width:"100%",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:8,
  padding:"10px 13px",color:"#111827",fontSize:16, // 16px prevents iOS auto-zoom
  fontFamily:"'Be Vietnam Pro',sans-serif",outline:"none",
  transition:"border-color .15s",appearance:"none",WebkitAppearance:"none",
};

// ─── Sub-components (defined OUTSIDE App) ────────────────────────
function FG({ label, required, children, span2 }) {
  return (
    <div style={{marginBottom:14, gridColumn: span2?"span 2":undefined}}>
      {label && (
        <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#6b7280",marginBottom:5}}>
          {label}{required && <span style={{color:RED}}> *</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function SL({ color, children }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
      <div style={{width:3,height:18,borderRadius:2,background:color}}/>
      <span style={{fontWeight:700,fontSize:13,color}}>{children}</span>
    </div>
  );
}

function ScoreBar({ score }) {
  const color = score>=75?"#0d7a4e":score>=50?BLUE:score>=30?"#b45309":RED;
  return (
    <div style={{marginTop:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:11,color:"#6b7280",fontWeight:600}}>Performance</span>
        <span style={{fontSize:14,fontWeight:900,color}}>{score}/100</span>
      </div>
      <div style={{height:6,background:"#f1f5f9",borderRadius:3}}>
        <div style={{height:6,width:`${score}%`,borderRadius:3,background:`linear-gradient(90deg,${color},${color}cc)`,transition:"width .7s ease"}}/>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────

// ─── ChangePIN Modal — defined OUTSIDE App to prevent re-renders ─
function ChangePINModal({ show, onClose, onSave, userName }) {
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [msg, setMsg]   = useState("");
  const [saved, setSaved] = useState(false);

  if (!show) return null;

  const handleSave = () => {
    if (!/^\d{4}$/.test(pin1)) { setMsg("PIN phải đúng 4 chữ số."); return; }
    if (pin1 !== pin2) { setMsg("Hai PIN không khớp."); return; }
    onSave(pin1);
    setSaved(true);
    setTimeout(() => { setSaved(false); setPin1(""); setPin2(""); setMsg(""); onClose(); }, 1500);
  };

  const PIN_INPUT = {
    width:"100%", background:"#f8fafc", border:"1.5px solid #e5e7eb",
    borderRadius:8, padding:"12px", fontSize:22, fontFamily:"inherit",
    outline:"none", letterSpacing:10, textAlign:"center", fontWeight:700,
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:16,padding:"28px 24px",maxWidth:320,width:"100%",boxShadow:"0 12px 48px rgba(0,0,0,.2)"}}>
        <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>🔐 Đổi mã PIN</div>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:22}}>
          Tạo mã PIN cá nhân cho tài khoản <strong>{userName}</strong>
        </div>
        {saved
          ? <div style={{fontSize:15,color:"#0d7a4e",fontWeight:800,textAlign:"center",padding:"20px 0"}}>✓ Đổi PIN thành công!</div>
          : <>
              <div style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",marginBottom:6}}>PIN mới</label>
                <input type="password" inputMode="numeric" maxLength={4} style={PIN_INPUT}
                  placeholder="••••" value={pin1}
                  onChange={e => setPin1(e.target.value.replace(/[^0-9]/g,"").slice(0,4))}
                  onFocus={e=>e.target.style.borderColor="#1a56db"}
                  onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                />
              </div>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",marginBottom:6}}>Xác nhận PIN</label>
                <input type="password" inputMode="numeric" maxLength={4} style={PIN_INPUT}
                  placeholder="••••" value={pin2}
                  onChange={e => setPin2(e.target.value.replace(/[^0-9]/g,"").slice(0,4))}
                  onFocus={e=>e.target.style.borderColor="#1a56db"}
                  onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                  onKeyDown={e=>e.key==="Enter"&&handleSave()}
                />
              </div>
              {msg && <div style={{fontSize:12,color:"#c0392b",fontWeight:600,marginBottom:12,padding:"8px 10px",background:"#fef2f2",borderRadius:7}}>⚠ {msg}</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setPin1("");setPin2("");setMsg("");onClose();}}
                  style={{flex:1,background:"#f8fafc",border:"1.5px solid #e5e7eb",borderRadius:8,color:"#6b7280",fontFamily:"inherit",fontWeight:600,fontSize:13,padding:"11px",cursor:"pointer"}}>
                  Để sau
                </button>
                <button onClick={handleSave}
                  style={{flex:2,background:"#1a56db",border:"none",borderRadius:8,color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:13,padding:"11px",cursor:"pointer"}}>
                  Xác nhận
                </button>
              </div>
            </>
        }
      </div>
    </div>
  );
}

export default function App() {
  // ─── Auth ──────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [loginName, setLoginName] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  // Change PIN flow
  const [showChangePIN, setShowChangePIN] = useState(false);
  const [newPin1, setNewPin1] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState("");
  const userRole = currentUser ? (ROLE_MAP[currentUser] || "nvkd") : null;
  const isBoard = userRole === "board";         // sees everything
  const isSaleManager = userRole === "sm";      // sees own branch only
  const isNVKD = userRole === "nvkd";           // sees own data only
  const isManager = isBoard || isSaleManager;   // can see dashboard

  // The branch this user belongs to (SM or NVKD)
  const userBranch = currentUser
    ? Object.keys(SALE_BY_BRANCH).find(b => SALE_BY_BRANCH[b].includes(currentUser))
    : null;

  // Load custom PINs from localStorage (overrides DEFAULT_PINS)
  const getEffectivePins = () => {
    try {
      const saved = localStorage.getItem("iv_pins");
      return saved ? { ...DEFAULT_PINS, ...JSON.parse(saved) } : { ...DEFAULT_PINS };
    } catch(_) { return { ...DEFAULT_PINS }; }
  };

  const saveCustomPin = (name, pin) => {
    try {
      const saved = localStorage.getItem("iv_pins");
      const current = saved ? JSON.parse(saved) : {};
      current[name] = pin;
      localStorage.setItem("iv_pins", JSON.stringify(current));
    } catch(_) {}
  };

  // ─── App state ─────────────────────────────────────────────────
  const [view, setView] = useState("form");
  const [entries, setEntries] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [form, setForm] = useState({
    branch:"", sale:"", date: new Date().toISOString().split("T")[0],
    ctvCode:"", customerName:"", address:"", district:"", phone:"",
    specialty:"", visitType:"", customerType:"", conversionExpect:"", result:"", notes:"",
    photo:null, photoPreview:null, photoBase64:null, photoMime:null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterSale, setFilterSale] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [quickRange, setQuickRange] = useState("all");
  const fileRef = useRef();
  const configured = !APPS_SCRIPT_URL.includes("YOUR_SCRIPT_ID");

  // ─── Login ─────────────────────────────────────────────────────
  const allNVKD = Object.values(SALE_BY_BRANCH).flat();
  const allUsers = ["Board Management", ...allNVKD];

  const handleLogin = () => {
    const name = loginName.trim();
    const pin = loginPin.trim();
    if (!name) { setLoginError("Vui lòng chọn tên."); return; }
    if (!pin || pin.length !== 4) { setLoginError("PIN phải đúng 4 số."); return; }
    const pins = getEffectivePins();
    const validUsers = ["Board Management", ...Object.values(SALE_BY_BRANCH).flat()];
    if (!validUsers.includes(name)) { setLoginError("Tên không hợp lệ."); return; }
    if (pins[name] !== pin) { setLoginError("PIN không đúng. Liên hệ quản lý nếu quên PIN."); return; }
    // Login success
    setCurrentUser(name);
    setLoginError("");
    setLoginPin("");
    // Check if using default PIN → prompt to change
    const savedPins = (() => { try { const s=localStorage.getItem("iv_pins"); return s?JSON.parse(s):{}; } catch(_){return{};} })();
    if (!savedPins[name]) {
      // First time login with default PIN
      setTimeout(() => setShowChangePIN(true), 500);
    }
    if (name !== "Manager") {
      const branch = Object.keys(SALE_BY_BRANCH).find(b => SALE_BY_BRANCH[b].includes(name));
      setForm(prev => ({ ...prev, branch: branch||"", sale: name }));
    }
  };

  const handleChangePIN = () => {
    if (newPin1.length !== 4 || !/^\d{4}$/.test(newPin1)) { setPinChangeMsg("PIN phải đúng 4 chữ số."); return; }
    if (newPin1 !== newPin2) { setPinChangeMsg("Hai PIN không khớp."); return; }
    saveCustomPin(currentUser, newPin1);
    setPinChangeMsg("✓ Đổi PIN thành công!");
    setNewPin1(""); setNewPin2("");
    setTimeout(() => { setShowChangePIN(false); setPinChangeMsg(""); }, 1500);
  };

  // ─── Fetch data from Google Sheet ──────────────────────────────
  const [syncError, setSyncError] = useState("");

  const fetchFromSheet = async () => {
    if (!configured) {
      try { const c = localStorage.getItem("iv3"); if (c) setEntries(JSON.parse(c)); } catch(_) {}
      setSyncError("Chưa kết nối Google Sheet.");
      return;
    }
    setLoadingData(true);
    setSyncError("");
    try {
      // Apps Script doGet — must use no-cors workaround via iframe trick or
      // direct fetch (works when Script is deployed as "Anyone" access)
      const url = APPS_SCRIPT_URL + "?t=" + Date.now();
      const resp = await fetch(url, {
        method: "GET",
        redirect: "follow",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); }
      catch(_) { throw new Error("Phản hồi không phải JSON. Kiểm tra Apps Script URL."); }
      if (json.data && Array.isArray(json.data)) {
        setEntries([...json.data]);
        setLastSync(new Date().toLocaleTimeString("vi-VN"));
        setRefreshKey(k => k + 1);
        setSyncError("");
        try { localStorage.setItem("iv3", JSON.stringify(json.data)); } catch(_) {}
      } else if (json.error) {
        throw new Error(json.error);
      } else {
        throw new Error("Không có dữ liệu từ Sheet.");
      }
    } catch(err) {
      const msg = err.message || "Lỗi không xác định";
      setSyncError(msg.includes("Failed to fetch")
        ? "Không thể kết nối — kiểm tra Apps Script đã deploy với quyền Anyone chưa."
        : msg);
      try { const c = localStorage.getItem("iv3"); if (c) setEntries(JSON.parse(c)); } catch(_) {}
    }
    setLoadingData(false);
  };

  // Load on mount + when switching to dashboard
  useEffect(() => {
    try { const c = localStorage.getItem("iv3"); if (c) setEntries(JSON.parse(c)); } catch(_) {}
    if (configured) fetchFromSheet();
  }, []);

  useEffect(() => {
    if (view === "dashboard" && configured) fetchFromSheet();
  }, [view]);

  const saveLocal = (list) => { try { localStorage.setItem("iv3", JSON.stringify(list)); } catch(_) {} };

  const setField = useCallback((field, val) => {
    setForm(prev => {
      const next = { ...prev, [field]: val };
      if (field === "branch") { next.sale = ""; next.district = ""; }
      return next;
    });
  }, []);

  const handleFocus = useCallback((e) => { e.target.style.borderColor = BLUE; }, []);
  const handleBlur  = useCallback((e) => { e.target.style.borderColor = "#e5e7eb"; }, []);

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(",")[1];
      setForm(prev => ({
        ...prev,
        photo: file,
        photoPreview: dataUrl,
        photoBase64: base64,
        photoMime: file.type || "image/jpeg",
      }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.branch||!form.sale||!form.customerName||!form.phone||!form.specialty||!form.result) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc (*)"); return;
    }
    setSubmitting(true);
    setSubmitting(true);
    const entry = { ...form, id: Date.now(), timestamp: new Date().toLocaleString("vi-VN"), photoUrl:"" };
    const next = [entry, ...entries];
    setEntries(next); saveLocal(next);
    if (configured) {
      try {
        const p = { ...entry };
        delete p.photo; delete p.photoPreview;
        // photoBase64 + photoMime sent for Google Drive upload
        await fetch(APPS_SCRIPT_URL, {
          method:"POST", mode:"no-cors",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify(p)
        });
      } catch(_) {}
    }
    setForm(prev => ({
      branch:prev.branch, sale:prev.sale, date:new Date().toISOString().split("T")[0],
      ctvCode:"", customerName:"", address:"", district:"", phone:"",
      specialty:"", visitType:"", customerType:"", conversionExpect:"", result:"", notes:"",
      photo:null, photoPreview:null, photoBase64:null, photoMime:null,
    }));
    setSubmitting(false); setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // ─── Filtered data ───────────────────────────────────────────────
  // Quick range helper
  const getQuickDates = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2,"0");
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (quickRange==="today") { const t=fmt(now); return {from:t,to:t}; }
    if (quickRange==="week") { const d=new Date(now); d.setDate(d.getDate()-6); return {from:fmt(d),to:fmt(now)}; }
    if (quickRange==="month") { const d=new Date(now); d.setDate(1); return {from:fmt(d),to:fmt(now)}; }
    if (quickRange==="custom") return {from:filterDateFrom,to:filterDateTo};
    return {from:"",to:""};
  };
  const {from:dateFrom, to:dateTo} = getQuickDates();

  // For dashboard: Manager sees all, NVKD sees only their own
  // Scope entries by role:
  // - Board: all entries
  // - Sale Manager: only entries from their branch
  // - NVKD: only their own entries
  const scopedEntries = isBoard
    ? entries
    : isSaleManager
      ? entries.filter(e => e.branch === userBranch)
      : entries.filter(e => e.sale === currentUser);

  const filtered = scopedEntries.filter(e => {
    if (isBoard && filterBranch !== "all" && e.branch !== filterBranch) return false;
    if (isBoard && filterSale !== "all" && e.sale !== filterSale) return false;
    if (isSaleManager && filterSale !== "all" && e.sale !== filterSale) return false;
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });

  // For leaderboard: Board sees all, SM sees own branch, NVKD sees all (for rank context)
  const allFiltered = (isBoard
    ? entries
    : isSaleManager
      ? entries.filter(e => e.branch === userBranch)
      : entries  // NVKD: show full leaderboard for rank context
  ).filter(e => {
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now()-7*86400000).toISOString().split("T")[0];

  const stats = {
    total:    filtered.length,
    newKH:    filtered.filter(e => e.customerType === "KH mới").length,
    oldKH:    filtered.filter(e => ["KH cũ","KH tái kích hoạt"].includes(e.customerType)).length,
    highConv: filtered.filter(e => e.conversionExpect === "Cao").length,
  };

  const byBranch = BRANCHES.map(b => ({
    name: b,
    count:    filtered.filter(e => e.branch === b).length,
    newKH:    filtered.filter(e => e.branch === b && e.customerType === "KH mới").length,
    oldKH:    filtered.filter(e => e.branch === b && ["KH cũ","KH tái kích hoạt"].includes(e.customerType)).length,
    highConv: filtered.filter(e => e.branch === b && e.conversionExpect === "Cao").length,
  })).filter(b => b.count > 0);

  const allSales = [...new Set(entries.map(e => e.sale))];
  const bySale = allSales.map(s => {
    const se = allFiltered.filter(e => e.sale === s);
    const score = calcScore(se, allFiltered);
    return {
      name: s,
      branch: entries.find(e => e.sale === s)?.branch || "",
      count:    se.length,
      today:    se.filter(e => e.date === today).length,
      week:     se.filter(e => e.date >= weekAgo).length,
      newKH:    se.filter(e => e.customerType === "KH mới").length,
      oldKH:    se.filter(e => ["KH cũ","KH tái kích hoạt"].includes(e.customerType)).length,
      highConv: se.filter(e => e.conversionExpect === "Cao").length,
      followUp: se.filter(e => e.visitType === "Follow-up").length,
      topSpec:  (() => {
        const cnt = {}; se.forEach(e => { cnt[e.specialty] = (cnt[e.specialty]||0)+1; });
        return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
      })(),
      score,
    };
  }).filter(x => x.count > 0).sort((a,b) => b.score - a.score);

  const bySpec = SPECIALTIES
    .map(s => ({
      name: s,
      count: filtered.filter(e => e.specialty === s).length,
      high:  filtered.filter(e => e.specialty === s && e.conversionExpect === "Cao").length,
    }))
    .filter(x => x.count > 0)
    .sort((a,b) => b.count - a.count)
    .slice(0, 8);

  const maxSpec = bySpec[0]?.count || 1;
  const maxSaleCount = bySale[0]?.count || 1;

  const genAI = async () => {
    if (!filtered.length) return;
    setLoadingAI(true); setAiSummary("");
    try {
      const ds = filtered.map((e,i) =>
        `${i+1}. CN:${e.branch}|Sale:${e.sale}|Ngày:${e.date}|KH:${e.customerName}|Loại KH:${e.customerType||"—"}|CK:${e.specialty}|Loại:${e.visitType||"—"}|KQ:${e.result}|Kỳ vọng:${e.conversionExpect||"—"}`
      ).join("\n");
      const apiKey = import.meta.env.VITE_ANTHROPIC_KEY || "";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": apiKey,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body: JSON.stringify({
          model:"claude-haiku-4-5-20251001", max_tokens:1400,
          messages:[{role:"user", content:`Bạn là chuyên gia phân tích cho Invivo Lab (4 khu vực: HN, HCM, Thái Nguyên-Phú Thọ, Gia Lai). Dữ liệu:\n\n${ds}\n\nViết báo cáo tiếng Việt cho CEO:\n1. TỔNG QUAN: lượt hoạt động, KH mới, KH cũ, cơ hội cao\n2. SO SÁNH KHU VỰC: điểm mạnh/yếu từng vùng\n3. CƠ HỘI CHUYỂN ĐỔI: top chuyên khoa, top NVKD\n4. RỦI RO: điểm yếu cần xử lý ngay\n5. HÀNH ĐỘNG TUẦN TỚI: 3 việc cụ thể\n\nSúc tích, có số liệu thực tế.`}]
        })
      });
      const j = await resp.json();
      if (j.error) { setAiSummary("Lỗi API: " + j.error.message); }
      else { setAiSummary(j.content?.[0]?.text || "Không thể tạo báo cáo."); }
    } catch(err) { setAiSummary("Lỗi kết nối: " + err.message); }
    setLoadingAI(false);
  };

  const branchShort = (b) => {
    if (b==="Hà Nội") return "HN";
    if (b==="Hồ Chí Minh") return "HCM";
    if (b==="Thái Nguyên - Phú Thọ") return "TN-PT";
    if (b==="Gia Lai") return "GL";
    return b.slice(0,4);
  };
  const branchColor = (b) => {
    if (b==="Hà Nội") return {bg:"#fff8e6",color:"#b45309",border:"#b45309"};
    if (b==="Hồ Chí Minh") return {bg:BLUE_L,color:BLUE,border:BLUE};
    if (b==="Thái Nguyên - Phú Thọ") return {bg:"#f0fdf4",color:"#15803d",border:"#15803d"};
    return {bg:"#fdf4ff",color:"#7e22ce",border:"#7e22ce"};
  };

  // ─── Login screen ───────────────────────────────────────────────
  if (!currentUser) {
    // Shared input style for login - explicit font stack to prevent browser default serif
    const loginInput = {
      width:"100%", boxSizing:"border-box",
      background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:9,
      padding:"12px 14px", color:"#111827", fontSize:16,
      fontFamily:"'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
      outline:"none", appearance:"none", WebkitAppearance:"none", display:"block",
    };
    return (
      <div style={{fontFamily:"'Be Vietnam Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif",minHeight:"100vh",background:"linear-gradient(150deg,#f0f4ff 0%,#fff5f5 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",boxSizing:"border-box"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
          *{box-sizing:border-box}
          .login-card *{font-family:'Be Vietnam Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif !important}
          .login-input{width:100%;display:block;box-sizing:border-box;background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:9px;padding:12px 14px;color:#111827;font-size:16px;font-family:'Be Vietnam Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif !important;outline:none;appearance:none;-webkit-appearance:none;transition:border-color .15s}
          .login-input:focus{border-color:#1a56db}
          .login-btn{width:100%;background:#1a56db;border:none;border-radius:9px;color:#fff;font-family:'Be Vietnam Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif !important;font-weight:700;font-size:16px;padding:14px;cursor:pointer;box-shadow:0 4px 14px rgba(26,86,219,.3);transition:all .2s}
          .login-btn:hover{background:#1648c8;transform:translateY(-1px)}
          .login-label{display:block;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;font-family:'Be Vietnam Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif !important}
        `}</style>
        <div className="login-card" style={{background:"#fff",borderRadius:20,padding:"36px 28px",maxWidth:420,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,.1)",border:"1.5px solid #e5e7eb"}}>

          {/* Real logo image */}
          <div style={{textAlign:"center",marginBottom:28}}>
            <img
              src={LOGO_URL}
              alt="Invivo Lab"
              style={{maxWidth:200,width:"100%",height:"auto",display:"inline-block"}}
            />
            <div style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginTop:10}}>
              Sales Activity System
            </div>
          </div>

          <div style={{fontSize:17,fontWeight:800,color:"#111827",marginBottom:4}}>Đăng nhập</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:22}}>Chọn tên và nhập mã PIN 4 số của bạn</div>

          {/* Name dropdown */}
          <div style={{marginBottom:14}}>
            <label className="login-label">Họ tên</label>
            <select className="login-input" value={loginName} onChange={e=>setLoginName(e.target.value)}>
              <option value="">-- Chọn tên của bạn --</option>
              <option value="Board Management">👑 Board Management — Ban lãnh đạo</option>
              {Object.entries(SALE_BY_BRANCH).map(([branch, names]) => (
                <optgroup key={branch} label={`📍 ${branch}`}>
                  {names.map(n => (
                    <option key={n} value={n}>
                      {SALE_MANAGER_BY_BRANCH[branch]===n ? `⭐ ${n} — Sale Manager` : n}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* PIN input */}
          <div style={{marginBottom:18}}>
            <label className="login-label">Mã PIN</label>
            <input
              type="password" inputMode="numeric" maxLength={4}
              className="login-input"
              placeholder="4 chữ số" value={loginPin}
              onChange={e=>setLoginPin(e.target.value.replace(/[^0-9]/g,"").slice(0,4))}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            />
          </div>

          {loginError && (
            <div style={{fontSize:13,color:RED,marginBottom:14,fontWeight:600,padding:"10px 14px",background:"#fef2f2",borderRadius:8,border:"1px solid #fca5a5"}}>
              ⚠ {loginError}
            </div>
          )}

          <button className="login-btn" onClick={handleLogin}>
            Đăng nhập →
          </button>

          <div style={{marginTop:18,padding:"12px 14px",background:"#f8fafc",borderRadius:8,fontSize:12,color:"#6b7280",lineHeight:1.8}}>
            <strong style={{color:"#374151"}}>Lần đầu đăng nhập?</strong><br/>
            Dùng mã PIN do quản lý cấp. Sau khi vào, bạn có thể đổi PIN cá nhân.
          </div>
        </div>
      </div>
    );
  }

  // ─── Change PIN modal ─────────────────────────────────────────
  return (
    <div style={{fontFamily:"'Be Vietnam Pro',sans-serif",minHeight:"100vh",background:"#f8fafc",color:"#111827"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
        .nav-btn{background:transparent;border:1.5px solid #e5e7eb;border-radius:8px;color:#6b7280;font-family:inherit;font-size:13px;padding:7px 16px;cursor:pointer;font-weight:600;transition:all .15s}
        .nav-btn:hover{border-color:${BLUE};color:${BLUE}}
        .nav-btn.on{background:${BLUE};border-color:${BLUE};color:#fff}
        .card{background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:22px}
        .scard{background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:16px 18px}
        .rbtn{padding:7px 14px;border-radius:20px;border:1.5px solid #e5e7eb;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;background:#fff;color:#6b7280}
        .rbtn:hover{transform:translateY(-1px)}
        .bar-bg{height:6px;background:#f1f5f9;border-radius:3px;margin-top:5px}
        .bar-blue{height:6px;border-radius:3px;background:linear-gradient(90deg,${BLUE},#3b82f6);transition:width .6s}
        .bar-red{height:6px;border-radius:3px;background:linear-gradient(90deg,${RED},#f87171);transition:width .6s}
        .toast{position:fixed;top:18px;right:18px;background:#fff;border:2px solid #0d7a4e;border-radius:10px;padding:12px 18px;color:#0d7a4e;font-weight:700;font-size:13px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.1);animation:pop .2s ease}
        @keyframes pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .ai-box{background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:10px;padding:18px;white-space:pre-wrap;font-size:13px;line-height:1.8;color:#374151}
        .photo-drop{border:2px dashed #e5e7eb;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all .2s;background:#fafafa}
        .photo-drop:hover{border-color:${BLUE};background:${BLUE_L}}
        .sec{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#9ca3af;margin-bottom:14px}
        .divl{height:1px;background:#f1f5f9;margin:18px 0}
        .btn-primary{background:${BLUE};border:none;border-radius:9px;color:#fff;font-family:inherit;font-weight:700;font-size:15px;padding:13px;cursor:pointer;transition:all .2s;width:100%}
        .btn-primary:hover{background:#1648c8;box-shadow:0 6px 20px rgba(26,86,219,.3)}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
        .btn-ai{background:${RED};border:none;border-radius:8px;color:#fff;font-family:inherit;font-weight:700;font-size:12px;padding:9px 16px;cursor:pointer;transition:all .2s;white-space:nowrap}
        .btn-ai:hover{background:#a93226}
        .btn-ai:disabled{opacity:.5;cursor:not-allowed}
        .btn-sm{background:#fff;border:1.5px solid #e5e7eb;border-radius:7px;color:#6b7280;font-family:inherit;font-size:12px;padding:6px 12px;cursor:pointer;font-weight:600}
        .btn-sm:hover{border-color:${RED};color:${RED}}
        .chip{display:inline-block;padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;border:1.5px solid;white-space:nowrap}
        table{width:100%;border-collapse:collapse}
        th{padding:9px 10px;text-align:left;color:#9ca3af;font-weight:700;font-size:10px;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;border-bottom:1.5px solid #f1f5f9}
        td{padding:8px 10px;border-bottom:1px solid #f8fafc;font-size:12.5px;vertical-align:middle}
        tr:hover td{background:#fafafa}
        input,select,textarea{font-family:'Be Vietnam Pro',sans-serif}
        .heatmap-row:hover{background:#f8fafc}
        .score-high{color:#0d7a4e;font-weight:900}
        .score-mid{color:${BLUE};font-weight:900}
        .score-low{color:#b45309;font-weight:900}
        .score-bad{color:${RED};font-weight:900}
        @media (max-width:640px){.desktop-nav{display:none!important}.mobile-tabs{display:flex!important}}
        @media (min-width:641px){.mobile-tabs{display:none!important}.desktop-nav{display:flex!important}}
      `}</style>

      {/* TOPBAR — top bar with logo + user info */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #e5e7eb",padding:"0 16px",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
              <div style={{width:6,height:28,borderRadius:2,background:BLUE}}/>
              <div style={{width:6,height:28,borderRadius:2,background:RED}}/>
            </div>
            <div style={{fontWeight:900,fontSize:15,letterSpacing:"-.02em",lineHeight:1}}>
              <span style={{color:"#111827"}}>Invivo</span>{" "}
              <span style={{color:RED}}>Lab</span>
            </div>
          </div>

          {/* Desktop nav tabs (hidden on mobile via CSS) */}
          <div className="desktop-nav" style={{display:"flex",gap:6,alignItems:"center"}}>
            <button className={`nav-btn ${view==="form"?"on":""}`} onClick={()=>setView("form")}>📝 Nhập liệu</button>
            <button className={`nav-btn ${view==="dashboard"?"on":""}`} onClick={()=>setView("dashboard")}>
              📊 Dashboard{entries.length>0&&<span style={{marginLeft:5,background:view==="dashboard"?"rgba(255,255,255,.25)":BLUE,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:800}}>{entries.length}</span>}
            </button>
          </div>

          {/* User info + actions */}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{fontSize:11,color:"#6b7280",fontWeight:600,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {isBoard?"👑":isSaleManager?"⭐":"👤"} {currentUser==="Board Management"?"Board":currentUser.split(" ").pop()}
            </div>
            <button onClick={()=>setShowChangePIN(true)}
              style={{background:"transparent",border:"1px solid #e5e7eb",borderRadius:6,color:"#6b7280",fontSize:11,padding:"5px 8px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,flexShrink:0}}>
              🔐
            </button>
            <button onClick={()=>{setCurrentUser(null);setLoginPin("");setLoginName("");setAiSummary("");}}
              style={{background:"transparent",border:"1px solid #e5e7eb",borderRadius:6,color:"#9ca3af",fontSize:11,padding:"5px 8px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,flexShrink:0}}>
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM TAB BAR — mobile only */}
      <div className="mobile-tabs" style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1.5px solid #e5e7eb",zIndex:50,display:"flex",boxShadow:"0 -2px 12px rgba(0,0,0,.06)"}}>
        <button onClick={()=>setView("form")}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 0 8px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",
            color:view==="form"?BLUE:"#9ca3af",borderTop:view==="form"?`2px solid ${BLUE}`:"2px solid transparent"}}>
          <span style={{fontSize:22}}>📝</span>
          <span style={{fontSize:10,fontWeight:700,marginTop:2}}>Nhập liệu</span>
        </button>
        <button onClick={()=>setView("dashboard")}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 0 8px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",
            color:view==="dashboard"?BLUE:"#9ca3af",borderTop:view==="dashboard"?`2px solid ${BLUE}`:"2px solid transparent"}}>
          <span style={{fontSize:22}}>📊</span>
          <span style={{fontSize:10,fontWeight:700,marginTop:2}}>Dashboard{entries.length>0?` (${entries.length})`:""}</span>
        </button>
      </div>

      <ChangePINModal
        show={showChangePIN}
        onClose={() => { setShowChangePIN(false); setPinChangeMsg(""); }}
        onSave={(pin) => { saveCustomPin(currentUser, pin); }}
        userName={currentUser}
      />
      {submitted && <div className="toast">✅ Đã ghi nhận hoạt động!</div>}

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 16px 90px"}}> {/* 90px bottom = space for mobile tab bar */}

        {/* ══════════ FORM ══════════ */}
        {view === "form" && (
          <>
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{width:4,height:24,borderRadius:2,background:BLUE}}/>
                <h1 style={{fontSize:22,fontWeight:900,letterSpacing:"-.025em"}}>Báo cáo hoạt động Sale</h1>
              </div>
              <p style={{color:"#6b7280",fontSize:13,marginLeft:14}}>Điền đầy đủ sau mỗi lần thăm khách hàng</p>
            </div>

            <div className="card">
              {/* Section 1: NVKD */}
              <SL color={BLUE}>Thông tin NVKD</SL>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FG label="Khu vực" required>
                  <select style={IS} value={form.branch} onChange={e=>setField("branch",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}>
                    <option value="">-- Chọn khu vực --</option>
                    {BRANCHES.map(b=><option key={b}>{b}</option>)}
                  </select>
                </FG>
                <FG label="NVKD phụ trách" required>
                  <select style={IS} value={form.sale} onChange={e=>setField("sale",e.target.value)} disabled={!form.branch} onFocus={handleFocus} onBlur={handleBlur}>
                    <option value="">-- Chọn NVKD --</option>
                    {(SALE_BY_BRANCH[form.branch]||[]).map(s=><option key={s}>{s}</option>)}
                  </select>
                </FG>
                <FG label="Ngày thăm" required>
                  <input type="date" style={IS} value={form.date} onChange={e=>setField("date",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}/>
                </FG>
                <FG label="Mã CTV">
                  <input style={IS} placeholder="VD: CTV-HCM-001..." value={form.ctvCode} onChange={e=>setField("ctvCode",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}/>
                </FG>
              </div>

              <div className="divl"/>
              {/* Section 2: KH */}
              <SL color={RED}>Thông tin khách hàng</SL>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FG label="Tên khách hàng / Bác sĩ" required span2>
                  <input style={IS} placeholder="BS. Nguyễn Thị Lan..." value={form.customerName} onChange={e=>setField("customerName",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}/>
                </FG>
                <FG label="Số điện thoại" required>
                  <input style={IS} placeholder="09xx..." value={form.phone} onChange={e=>setField("phone",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}/>
                </FG>
                <FG label="Chuyên khoa" required>
                  <select style={IS} value={form.specialty} onChange={e=>setField("specialty",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}>
                    <option value="">-- Chọn --</option>
                    {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </FG>
                <FG label="Quận / Tỉnh" required>
                  <select style={IS} value={form.district} onChange={e=>setField("district",e.target.value)} disabled={!form.branch} onFocus={handleFocus} onBlur={handleBlur}>
                    <option value="">-- Chọn quận/tỉnh --</option>
                    {(DISTRICTS_BY_BRANCH[form.branch]||[]).map(d=><option key={d}>{d}</option>)}
                  </select>
                </FG>
                <FG label="Địa chỉ phòng khám">
                  <input style={IS} placeholder="Số nhà, đường..." value={form.address} onChange={e=>setField("address",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}/>
                </FG>
              </div>

              <div className="divl"/>
              {/* Section 3: Kết quả */}
              <SL color="#b45309">Kết quả hoạt động</SL>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FG label="Loại hoạt động">
                  <select style={IS} value={form.visitType} onChange={e=>setField("visitType",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}>
                    <option value="">-- Chọn --</option>
                    {VISIT_TYPES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </FG>
                <FG label="Loại khách hàng">
                  <select style={IS} value={form.customerType} onChange={e=>setField("customerType",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}>
                    <option value="">-- Chọn --</option>
                    {CUSTOMER_TYPES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </FG>
              </div>

              <FG label="Kỳ vọng chuyển đổi">
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                  {CONVERSION_EXPECT.map(r => {
                    const active = form.conversionExpect === r;
                    const colors = {Cao:{bg:"#e8faf3",c:"#0d7a4e",b:"#0d7a4e"},Trung_bình:{bg:BLUE_L,c:BLUE,b:BLUE},Thấp:{bg:"#fff8e6",c:"#b45309",b:"#b45309"},"Không có":{bg:"#f4f4f5",c:"#6b7280",b:"#9ca3af"}};
                    const key = r.replace(" ","_");
                    const s = colors[key]||colors["Không có"];
                    return (
                      <button key={r} className="rbtn" onClick={()=>setField("conversionExpect",r)}
                        style={{background:active?s.bg:"#fff",borderColor:active?s.b:"#e5e7eb",color:active?s.c:"#6b7280"}}>
                        {r==="Cao"?"🔥":r==="Trung bình"?"⭐":r==="Thấp"?"📌":"—"} {r}
                      </button>
                    );
                  })}
                </div>
              </FG>

              <FG label="Kết quả thăm" required>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                  {RESULTS.map(r => {
                    const s = RESULT_STYLE[r]||{bg:"#f4f4f5",color:"#6b7280",border:"#9ca3af"};
                    const active = form.result === r;
                    return (
                      <button key={r} className="rbtn" onClick={()=>setField("result",r)}
                        style={{background:active?s.bg:"#fff",borderColor:active?s.border:"#e5e7eb",color:active?s.color:"#6b7280"}}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </FG>

              <FG label="Ghi chú">
                <textarea style={{...IS,resize:"vertical"}} rows={3} placeholder="Phản hồi KH, bước tiếp theo..." value={form.notes} onChange={e=>setField("notes",e.target.value)} onFocus={handleFocus} onBlur={handleBlur}/>
              </FG>

              <FG label="Ảnh chứng minh">
                <div className="photo-drop" onClick={()=>fileRef.current.click()}>
                  {form.photoPreview
                    ?<img src={form.photoPreview} alt="" style={{maxHeight:130,borderRadius:7,objectFit:"cover"}}/>
                    :<div style={{color:"#9ca3af"}}>
                      <div style={{fontSize:28,marginBottom:6}}>📷</div>
                      <div style={{fontSize:13,fontWeight:600}}>Chụp hoặc tải ảnh lên</div>
                      <div style={{fontSize:11,marginTop:3,color:"#d1d5db"}}>Ảnh tại điểm thăm KH</div>
                    </div>
                  }
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhoto}/>
                </div>
              </FG>

              <button className="btn-primary" onClick={submit} disabled={submitting}>
                {submitting?"Đang lưu...":"✓  Ghi nhận hoạt động"}
              </button>
              <div style={{marginTop:10,textAlign:"center",fontSize:11,fontWeight:600,color:configured?"#0d7a4e":"#b45309"}}>
                {configured?"✓ Kết nối Google Sheet · Tự động đồng bộ":"⚠ Chưa kết nối Google Sheet · Data lưu tạm trên trình duyệt"}
              </div>
            </div>
          </>
        )}

        {/* ══════════ DASHBOARD ══════════ */}
        {view === "dashboard" && (
          <>
            {/* Header */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{width:4,height:24,borderRadius:2,background:RED}}/>
                  <h1 style={{fontSize:22,fontWeight:900,letterSpacing:"-.025em"}}>Sales Dashboard</h1>
                </div>
                <p style={{color:"#6b7280",fontSize:13,marginLeft:14}}>
                  {isBoard
                    ? "Invivo Lab · Toàn quốc · Real-time"
                    : isSaleManager
                      ? `${userBranch} · Real-time`
                      : `Xin chào, ${currentUser} 👋`}
                  {(dateFrom||dateTo)&&<span style={{marginLeft:8,color:BLUE,fontWeight:700}}>
                    · {dateFrom||"…"} → {dateTo||"…"}
                  </span>}
                </p>
              </div>
            </div>

            {/* Filter bar */}
            <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
                {/* Board sees branch filter; SM sees fixed branch label */}
                {isBoard && (
                  <select style={{...IS,width:"auto",fontSize:12,padding:"7px 11px"}} value={filterBranch} onChange={e=>{setFilterBranch(e.target.value);setFilterSale("all");}}>
                    <option value="all">🏢 Tất cả khu vực</option>
                    {BRANCHES.map(b=><option key={b}>{b}</option>)}
                  </select>
                )}
                {isSaleManager && (
                  <div style={{padding:"7px 12px",background:"#eaf0ff",borderRadius:8,fontSize:12,fontWeight:700,color:BLUE,border:"1.5px solid #bfdbfe"}}>
                    📍 {userBranch}
                  </div>
                )}
                {/* NVKD filter: Board by branch, SM by nvkd in own branch */}
                {(isBoard || isSaleManager) && (
                  <select style={{...IS,width:"auto",fontSize:12,padding:"7px 11px"}} value={filterSale} onChange={e=>setFilterSale(e.target.value)}>
                    <option value="all">👤 Tất cả NVKD</option>
                    {(isSaleManager
                      ? SALE_BY_BRANCH[userBranch] || []
                      : filterBranch!=="all" ? SALE_BY_BRANCH[filterBranch] : allSales
                    ).map(s=><option key={s}>{s}</option>)}
                  </select>
                )}
                {(filterBranch!=="all"||filterSale!=="all"||quickRange!=="all")&&
                  <button className="btn-sm" onClick={()=>{setFilterBranch("all");setFilterSale("all");setQuickRange("all");setFilterDateFrom("");setFilterDateTo("");}}>✕ Reset</button>}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em",marginRight:4}}>Thời gian:</span>
                {[
                  {key:"all",label:"Tất cả"},
                  {key:"today",label:"Hôm nay"},
                  {key:"week",label:"7 ngày"},
                  {key:"month",label:"Tháng này"},
                  {key:"custom",label:"Tùy chọn 📅"},
                ].map(({key,label})=>(
                  <button key={key} onClick={()=>setQuickRange(key)}
                    style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                      background:quickRange===key?BLUE:"#fff",borderColor:quickRange===key?BLUE:"#e5e7eb",color:quickRange===key?"#fff":"#6b7280"}}>
                    {label}
                  </button>
                ))}
                {quickRange==="custom"&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:4,flexWrap:"wrap"}}>
                    <input type="date" style={{...IS,width:"auto",fontSize:12,padding:"6px 10px"}} value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)}/>
                    <span style={{color:"#9ca3af",fontWeight:700}}>→</span>
                    <input type="date" style={{...IS,width:"auto",fontSize:12,padding:"6px 10px"}} value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)}/>
                  </div>
                )}
              </div>
            </div>

                        {/* Sync bar */}
            <div style={{marginBottom:14,padding:"10px 14px",borderRadius:8,border:"1px solid",
              background: syncError ? "#fef2f2" : configured ? "#f0f7ff" : "#f8fafc",
              borderColor: syncError ? "#fca5a5" : configured ? "#dbeafe" : "#e5e7eb",
              display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
              <div style={{fontSize:12,fontWeight:600,color:syncError?RED:configured?"#1a56db":"#9ca3af",flex:1}}>
                {loadingData
                  ? "⏳ Đang tải dữ liệu từ Google Sheet..."
                  : syncError
                    ? `⚠ ${syncError}`
                    : lastSync
                      ? `✓ Cập nhật lúc ${lastSync} · ${entries.length} hoạt động`
                      : configured ? "Chưa đồng bộ — bấm Làm mới" : "⚠ Chưa kết nối Google Sheet"}
              </div>
              {configured && (
                <button onClick={fetchFromSheet} disabled={loadingData}
                  style={{background:loadingData?"#9ca3af":BLUE,border:"none",borderRadius:6,color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:11,padding:"6px 14px",cursor:loadingData?"not-allowed":"pointer",whiteSpace:"nowrap"}}>
                  🔄 Làm mới
                </button>
              )}
            </div>

            {/* KPI 4 ô */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[
                {label:"Lượt hoạt động", val:stats.total,    color:BLUE,      bg:BLUE_L,    icon:"🏃"},
                {label:"KH mới",         val:stats.newKH,    color:"#0d7a4e", bg:"#e8faf3", icon:"🆕"},
                {label:"KH cũ / Tái KH", val:stats.oldKH,    color:"#b45309", bg:"#fff8e6", icon:"🔄"},
                {label:"Cơ hội cao",     val:stats.highConv, color:RED,       bg:"#fef2f2", icon:"🔥"},
              ].map(({label,val,color,bg,icon})=>(
                <div key={label} className="scard" style={{borderLeft:`4px solid ${color}`}}>
                  <div style={{fontSize:20,marginBottom:8}}>{icon}</div>
                  <div style={{fontSize:32,fontWeight:900,color,letterSpacing:"-.02em",lineHeight:1}}>{val}</div>
                  <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginTop:6,textTransform:"uppercase",letterSpacing:".07em"}}>{label}</div>
                </div>
              ))}
            </div>

            {(isBoard || isSaleManager) && <div className="card" style={{marginBottom:14}}>
              <div className="sec">So sánh khu vực</div>
              {byBranch.length === 0
                ?<div style={{color:"#d1d5db",fontSize:13}}>Chưa có dữ liệu</div>
                :<div style={{overflowX:"auto"}}>
                  <table>
                    <thead>
                      <tr>
                        <th>Khu vực</th>
                        <th>Lượt HĐ</th>
                        <th>KH mới</th>
                        <th>KH cũ / Tái KH</th>
                        <th>Cơ hội cao</th>
                        <th>Tỷ lệ cơ hội</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byBranch.map(b => {
                        const bc = branchColor(b.name);
                        const ratio = b.count ? Math.round((b.highConv/b.count)*100) : 0;
                        return (
                          <tr key={b.name}>
                            <td><span className="chip" style={{background:bc.bg,color:bc.color,borderColor:bc.border}}>{branchShort(b.name)}</span> <span style={{marginLeft:6,fontWeight:600}}>{b.name}</span></td>
                            <td style={{fontWeight:700,color:BLUE}}>{b.count}</td>
                            <td style={{fontWeight:700,color:"#0d7a4e"}}>{b.newKH}</td>
                            <td style={{fontWeight:700,color:"#b45309"}}>{b.oldKH}</td>
                            <td style={{fontWeight:700,color:RED}}>{b.highConv}</td>
                            <td>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{flex:1,height:6,background:"#f1f5f9",borderRadius:3}}>
                                  <div style={{height:6,width:`${ratio}%`,borderRadius:3,background:`linear-gradient(90deg,${RED},#f87171)`}}/>
                                </div>
                                <span style={{fontSize:12,fontWeight:700,color:RED,width:32}}>{ratio}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </div>

            }

            {/* Leaderboard NVKD */}
            <div className="card" style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div className="sec" style={{marginBottom:0}}>Bảng xếp hạng NVKD</div>
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>Performance Score = Volume(25) + Type(20) + Result(35) + Conversion(20)</div>
              </div>
              {bySale.length===0
                ?<div style={{color:"#d1d5db",fontSize:13}}>Chưa có dữ liệu</div>
                :<div>
                  {bySale.map((s,i)=>{
                    const bc = branchColor(s.branch);
                    const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;
                    const scoreColor = s.score>=75?"#0d7a4e":s.score>=50?BLUE:s.score>=30?"#b45309":RED;
                    const cardBg = i===0?"#fffbeb":i===1?"#f8fafc":i===2?"#fdf4ff":"#fff";
                    const cardBorder = i===0?"#fde68a":i===1?"#e5e7eb":i===2?"#e9d5ff":"#f1f5f9";
                    return (
                      <div key={s.name} style={{padding:"14px 16px",borderRadius:10,marginBottom:8,background:cardBg,border:`1.5px solid ${cardBorder}`}}>
                        {/* Row 1: rank + name + score */}
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                          <div style={{fontSize:i<3?20:14,fontWeight:900,width:28,textAlign:"center",flexShrink:0}}>{medal}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:800,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                            <span className="chip" style={{background:bc.bg,color:bc.color,borderColor:bc.border,fontSize:9,marginTop:2,display:"inline-block"}}>{branchShort(s.branch)}</span>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:20,fontWeight:900,color:scoreColor,lineHeight:1}}>{s.score}</div>
                            <div style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>/100</div>
                          </div>
                        </div>
                        {/* Score bar */}
                        <div style={{height:6,background:"#f1f5f9",borderRadius:3,marginBottom:10,overflow:"hidden"}}>
                          <div style={{height:6,width:`${s.score}%`,borderRadius:3,background:`linear-gradient(90deg,${scoreColor},${scoreColor}88)`,transition:"width .7s ease"}}/>
                        </div>
                        {/* Row 2: stats grid */}
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,textAlign:"center"}}>
                          {[
                            {label:"HĐ",val:s.count,color:BLUE},
                            {label:"KH mới",val:s.newKH,color:"#0d7a4e"},
                            {label:"KH cũ",val:s.oldKH,color:"#b45309"},
                            {label:"🔥 Cao",val:s.highConv,color:RED},
                            {label:"Follow",val:s.followUp,color:"#6b7280"},
                          ].map(({label,val,color})=>(
                            <div key={label} style={{background:"#f8fafc",borderRadius:6,padding:"6px 2px"}}>
                              <div style={{fontSize:16,fontWeight:900,color}}>{val}</div>
                              <div style={{fontSize:9,color:"#9ca3af",fontWeight:600,marginTop:1}}>{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </div>

            {/* Chuyên khoa */}
            <div className="card" style={{marginBottom:14}}>
              <div className="sec">Chuyên khoa tiếp cận</div>
              {bySpec.length===0
                ?<div style={{color:"#d1d5db",fontSize:13}}>Chưa có dữ liệu</div>
                :<div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:20}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:12,textTransform:"uppercase",letterSpacing:".06em"}}>Top theo số lượt</div>
                    {bySpec.map(({name,count})=>(
                      <div key={name} style={{marginBottom:11}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                          <span style={{fontWeight:500}}>{name}</span>
                          <span style={{fontWeight:700,color:BLUE}}>{count}</span>
                        </div>
                        <div className="bar-bg"><div className="bar-blue" style={{width:`${(count/maxSpec)*100}%`}}/></div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:12,textTransform:"uppercase",letterSpacing:".06em"}}>Top theo cơ hội cao 🔥</div>
                    {[...bySpec].sort((a,b)=>b.high-a.high).filter(x=>x.high>0).map(({name,high,count})=>(
                      <div key={name} style={{marginBottom:11}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                          <span style={{fontWeight:500}}>{name}</span>
                          <span style={{fontWeight:700,color:RED}}>{high}<span style={{color:"#9ca3af",fontWeight:400,fontSize:11}}> / {count}</span></span>
                        </div>
                        <div className="bar-bg"><div className="bar-red" style={{width:`${(high/(stats.highConv||1))*100}%`}}/></div>
                      </div>
                    ))}
                    {bySpec.every(x=>x.high===0)&&<div style={{color:"#d1d5db",fontSize:13}}>Chưa có cơ hội cao</div>}
                  </div>
                  </div>
                {/* Summary table */}
                <div style={{marginTop:20,borderTop:"1px solid #f1f5f9",paddingTop:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>Bảng tổng hợp chuyên khoa</div>
                  <div style={{overflowX:"auto"}}>
                    <table>
                      <thead>
                        <tr>
                          <th>Chuyên khoa</th>
                          <th style={{textAlign:"center"}}>Số lượt</th>
                          <th style={{textAlign:"center"}}>KH mới</th>
                          <th style={{textAlign:"center"}}>KH cũ</th>
                          <th style={{textAlign:"center"}}>Cơ hội cao</th>
                          <th>Phân bổ KH</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bySpec.map(({name,count,high})=>{
                          const newKH=filtered.filter(e=>e.specialty===name&&e.customerType==="KH mới").length;
                          const oldKH=filtered.filter(e=>e.specialty===name&&["KH cũ","KH tái kích hoạt"].includes(e.customerType)).length;
                          return (
                            <tr key={name}>
                              <td style={{fontWeight:600}}>{name}</td>
                              <td style={{textAlign:"center",fontWeight:800,color:BLUE}}>{count}</td>
                              <td style={{textAlign:"center",fontWeight:700,color:"#0d7a4e"}}>{newKH}</td>
                              <td style={{textAlign:"center",fontWeight:700,color:"#b45309"}}>{oldKH}</td>
                              <td style={{textAlign:"center",fontWeight:700,color:RED}}>🔥 {high}</td>
                              <td>
                                <div style={{display:"flex",gap:2,alignItems:"center",height:10}}>
                                  {newKH>0&&<div style={{height:10,width:`${(newKH/count)*100}%`,background:"#0d7a4e",borderRadius:"3px 0 0 3px",minWidth:4}}/>}
                                  {oldKH>0&&<div style={{height:10,width:`${(oldKH/count)*100}%`,background:"#f59e0b",minWidth:4}}/>}
                                  {(count-newKH-oldKH)>0&&<div style={{height:10,flex:1,background:"#e5e7eb",borderRadius:"0 3px 3px 0",minWidth:4}}/>}
                                </div>
                                <div style={{fontSize:9,color:"#9ca3af",marginTop:2,display:"flex",gap:6}}>
                                  <span style={{color:"#0d7a4e"}}>■ Mới</span>
                                  <span style={{color:"#f59e0b"}}>■ Cũ</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>
              }
            </div>

            {/* Sale Manager detail table — own branch */}
            {isSaleManager && (
              <div className="card" style={{marginBottom:14}}>
                <div className="sec">Chi tiết hoạt động — {userBranch} ({filtered.length})</div>
                {filtered.length===0
                  ?<div style={{color:"#d1d5db",fontSize:13,textAlign:"center",padding:"20px 0"}}>Chưa có dữ liệu.</div>
                  :<div style={{overflowX:"auto"}}>
                    <table>
                      <thead>
                        <tr>{["Ngày","NVKD","Khách hàng","Quận/Tỉnh","CK","Loại KH","Kỳ vọng","Kết quả","Ảnh"].map(h=><th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filtered.map(e=>{
                          const tag=RESULT_STYLE[e.result]||{bg:"#f4f4f5",color:"#6b7280",border:"#9ca3af"};
                          const cvColor=e.conversionExpect==="Cao"?RED:e.conversionExpect==="Trung bình"?BLUE:"#9ca3af";
                          return(
                            <tr key={e.id||e.timestamp}>
                              <td style={{color:"#6b7280",whiteSpace:"nowrap"}}>{e.date}</td>
                              <td style={{fontWeight:600}}>{e.sale}</td>
                              <td>
                                <div style={{fontWeight:600}}>{e.customerName}</div>
                                {e.phone&&<div style={{fontSize:11,color:"#9ca3af"}}>{e.phone}</div>}
                              </td>
                              <td style={{color:"#6b7280",fontSize:12}}>{e.district||"—"}</td>
                              <td style={{color:"#6b7280",fontSize:12}}>{e.specialty}</td>
                              <td><span className="chip" style={{background:"#f1f5f9",color:"#374151",borderColor:"#e5e7eb",fontSize:10}}>{e.customerType||"—"}</span></td>
                              <td style={{fontWeight:700,color:cvColor,fontSize:12}}>{e.conversionExpect==="Cao"?"🔥":e.conversionExpect==="Trung bình"?"⭐":"—"} {e.conversionExpect||"—"}</td>
                              <td><span className="chip" style={{background:tag.bg,color:tag.color,borderColor:tag.border}}>{e.result}</span></td>
                              <td style={{textAlign:"center"}}>
                                {e.photoUrl
                                  ?<a href={e.photoUrl} target="_blank" rel="noreferrer"
                                    style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",background:"#eaf0ff",borderRadius:6,color:"#1a56db",fontSize:11,fontWeight:700,textDecoration:"none",border:"1px solid #bfdbfe"}}>
                                    📷 Xem
                                  </a>
                                  :<span style={{color:"#d1d5db",fontSize:11}}>—</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            )}

            {isBoard && <div className="card" style={{marginBottom:14,borderTop:`3px solid ${RED}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:aiSummary?16:0}}>
                <div>
                  <div className="sec" style={{marginBottom:3}}>AI Executive Report</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>Phân tích toàn bộ dữ liệu 4 khu vực — dành cho CEO</div>
                </div>
                <button className="btn-ai" onClick={genAI} disabled={loadingAI||!filtered.length}>
                  {loadingAI?"⏳ Đang phân tích...":"✨ Tạo báo cáo AI"}
                </button>
              </div>
              {aiSummary&&<div className="ai-box">{aiSummary}</div>}
              {!aiSummary&&<div style={{fontSize:12,color:"#d1d5db",fontStyle:"italic",paddingTop:12}}>
                {!filtered.length?"Nhập ít nhất 1 hoạt động để tạo báo cáo.":"Bấm nút để AI tổng hợp và xuất executive report."}
              </div>}
            </div>

            }

            {isBoard && <div className="card">
              <div className="sec">Chi tiết hoạt động ({filtered.length})</div>
              {filtered.length===0
                ?<div style={{color:"#d1d5db",fontSize:13,textAlign:"center",padding:"28px 0"}}>Chưa có dữ liệu.</div>
                :<div style={{overflowX:"auto"}}>
                  <table>
                    <thead>
                      <tr>{["KV","Ngày","NVKD","Mã CTV","Khách hàng","Quận/Tỉnh","CK","Loại KH","Kỳ vọng","Kết quả","Ảnh"].map(h=><th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filtered.map(e=>{
                        const tag = RESULT_STYLE[e.result]||{bg:"#f4f4f5",color:"#6b7280",border:"#9ca3af"};
                        const bc = branchColor(e.branch);
                        const cvColor = e.conversionExpect==="Cao"?RED:e.conversionExpect==="Trung bình"?BLUE:e.conversionExpect==="Thấp"?"#b45309":"#9ca3af";
                        return (
                          <tr key={e.id}>
                            <td><span className="chip" style={{background:bc.bg,color:bc.color,borderColor:bc.border,fontSize:9}}>{branchShort(e.branch)}</span></td>
                            <td style={{color:"#6b7280",whiteSpace:"nowrap"}}>{e.date}</td>
                            <td style={{fontWeight:600}}>{e.sale}</td>
                            <td style={{color:"#9ca3af",fontSize:11}}>{e.ctvCode||"—"}</td>
                            <td>
                              <div style={{fontWeight:600}}>{e.customerName}</div>
                              {e.phone&&<div style={{fontSize:11,color:"#9ca3af"}}>{e.phone}</div>}
                            </td>
                            <td style={{color:"#6b7280",fontSize:12}}>{e.district||"—"}</td>
                            <td style={{color:"#6b7280",fontSize:12}}>{e.specialty}</td>
                            <td><span className="chip" style={{background:"#f1f5f9",color:"#374151",borderColor:"#e5e7eb",fontSize:10}}>{e.customerType||"—"}</span></td>
                            <td><span style={{fontWeight:700,color:cvColor,fontSize:12}}>{e.conversionExpect==="Cao"?"🔥":e.conversionExpect==="Trung bình"?"⭐":e.conversionExpect==="Thấp"?"📌":"—"} {e.conversionExpect||"—"}</span></td>
                            <td><span className="chip" style={{background:tag.bg,color:tag.color,borderColor:tag.border}}>{e.result}</span></td>
                            <td style={{textAlign:"center"}}>
                              {e.photoUrl
                                ?<a href={e.photoUrl} target="_blank" rel="noreferrer"
                                  style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",background:"#eaf0ff",borderRadius:6,color:"#1a56db",fontSize:11,fontWeight:700,textDecoration:"none",border:"1px solid #bfdbfe"}}>
                                  📷 Xem
                                </a>
                                :<span style={{color:"#d1d5db",fontSize:11}}>—</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </div>}
          </>
        )}
      </div>
    </div>
  );
}

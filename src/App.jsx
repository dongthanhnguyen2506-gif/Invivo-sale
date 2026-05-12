import { useState, useRef, useEffect, useCallback } from "react";

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
    photo:null, photoPreview:null,
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
    reader.onload = (ev) => setForm(prev => ({ ...prev, photo: file, photoPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.branch||!form.sale||!form.customerName||!form.phone||!form.specialty||!form.result) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc (*)"); return;
    }
    setSubmitting(true);
    const entry = { ...form, id: Date.now(), timestamp: new Date().toLocaleString("vi-VN") };
    const next = [entry, ...entries];
    setEntries(next); saveLocal(next);
    if (configured) {
      try {
        const p = { ...entry }; delete p.photo; delete p.photoPreview;
        await fetch(APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body: JSON.stringify(p) });
      } catch(_) {}
    }
    setForm(prev => ({
      branch:prev.branch, sale:prev.sale, date:new Date().toISOString().split("T")[0],
      ctvCode:"", customerName:"", address:"", district:"", phone:"",
      specialty:"", visitType:"", customerType:"", conversionExpect:"", result:"", notes:"",
      photo:null, photoPreview:null,
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
    const IS2 = {width:"100%",background:"#f8fafc",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"12px 14px",color:"#111827",fontSize:14,fontFamily:"'Be Vietnam Pro',sans-serif",outline:"none"};
    return (
      <div style={{fontFamily:"'Be Vietnam Pro',sans-serif",minHeight:"100vh",background:"linear-gradient(135deg,#eef2ff,#fff1f2)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#fff",borderRadius:20,padding:"36px 32px",maxWidth:400,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,.1)",border:"1.5px solid #e5e7eb"}}>
          {/* Logo - centered, large */}
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:3,marginBottom:10}}>
              <div style={{width:8,height:48,borderRadius:4,background:BLUE}}/>
              <div style={{width:8,height:48,borderRadius:4,background:RED}}/>
            </div>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:"-.03em",lineHeight:1}}>
              <span style={{color:"#111827"}}>Invivo</span>{" "}
              <span style={{color:RED}}>Lab</span>
            </div>
            <div style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginTop:6}}>
              Sales Activity System
            </div>
          </div>

          <div style={{fontSize:16,fontWeight:800,color:"#111827",marginBottom:4}}>Đăng nhập</div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:22}}>Chọn tên và nhập mã PIN 4 số của bạn</div>

          {/* Name dropdown */}
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:".07em",textTransform:"uppercase",marginBottom:5}}>Họ tên</label>
            <select style={IS2} value={loginName} onChange={e=>setLoginName(e.target.value)}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}>
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
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:".07em",textTransform:"uppercase",marginBottom:5}}>Mã PIN</label>
            <input type="password" inputMode="numeric" maxLength={4} style={IS2}
              placeholder="4 chữ số" value={loginPin}
              onChange={e=>setLoginPin(e.target.value.replace(/\D/g,"").slice(0,4))}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
          </div>

          {loginError && <div style={{fontSize:12,color:RED,marginBottom:12,fontWeight:600,padding:"8px 12px",background:"#fef2f2",borderRadius:7}}>⚠ {loginError}</div>}

          <button onClick={handleLogin}
            style={{width:"100%",background:BLUE,border:"none",borderRadius:9,color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:15,padding:"13px",cursor:"pointer",boxShadow:"0 4px 14px rgba(26,86,219,.3)"}}>
            Đăng nhập →
          </button>

          <div style={{marginTop:18,padding:"12px 14px",background:"#f8fafc",borderRadius:8,fontSize:11,color:"#6b7280",lineHeight:1.8}}>
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
                        <tr>{["Ngày","NVKD","Khách hàng","Quận/Tỉnh","CK","Loại KH","Kỳ vọng","Kết quả"].map(h=><th key={h}>{h}</th>)}</tr>
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
                      <tr>{["KV","Ngày","NVKD","Mã CTV","Khách hàng","Quận/Tỉnh","CK","Loại KH","Kỳ vọng","Kết quả"].map(h=><th key={h}>{h}</th>)}</tr>
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

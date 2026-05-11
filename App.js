import { useState, useRef, useEffect } from "react";

// ─── Paste Google Apps Script URL vào đây sau khi deploy ───
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
// ────────────────────────────────────────────────────────────

const BRANCHES = ["Hà Nội", "Hồ Chí Minh"];

const SALE_BY_BRANCH = {
  "Hà Nội": ["Nguyễn Văn Thuyết", "Nguyễn Đức Quân", "Lê Anh Dũng", "Vương Văn Tiến"],
  "Hồ Chí Minh": ["Trần Việt Hảo", "Thúy Kiều", "Châu Kim Ngân", "Nguyễn Bá Phú"],
};

const SPECIALTIES = ["Tim mạch", "Nội tiết", "Thần kinh", "Hô hấp", "Tiêu hóa", "Cơ xương khớp", "Da liễu", "Sản phụ khoa", "Nhi khoa", "Ung bướu"];
const VISIT_TYPES = ["Giới thiệu sản phẩm", "Follow-up", "Ký hợp đồng", "Hỗ trợ kỹ thuật", "Chăm sóc sau bán"];
const RESULTS = ["Quan tâm - hẹn lại", "Đồng ý dùng thử", "Đã ký hợp đồng", "Từ chối", "Không gặp được"];

const RESULT_TAG = {
  "Đã ký hợp đồng":    { bg: "rgba(52,211,153,0.13)",  color: "#34d399" },
  "Đồng ý dùng thử":   { bg: "rgba(79,110,247,0.13)",  color: "#7c9ef7" },
  "Quan tâm - hẹn lại":{ bg: "rgba(251,191,36,0.13)",  color: "#fbbf24" },
  "Từ chối":            { bg: "rgba(248,113,113,0.13)", color: "#f87171" },
  "Không gặp được":     { bg: "rgba(100,116,139,0.13)", color: "#94a3b8" },
};

export default function InVivoApp() {
  const [view, setView] = useState("form");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    branch: "", sale: "",
    date: new Date().toISOString().split("T")[0],
    customerName: "", address: "", phone: "",
    specialty: "", visitType: "", result: "",
    activeCodes: "", notes: "",
    photo: null, photoPreview: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterSale, setFilterSale] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const fileRef = useRef();
  const scriptConfigured = !APPS_SCRIPT_URL.includes("YOUR_SCRIPT_ID");

  useEffect(() => {
    try {
      const cached = localStorage.getItem("invivo_entries");
      if (cached) setEntries(JSON.parse(cached));
    } catch (_) {}
  }, []);

  const saveLocal = (e) => {
    try { localStorage.setItem("invivo_entries", JSON.stringify(e)); } catch (_) {}
  };

  const handleChange = (field, val) => {
    setForm((f) => {
      const next = { ...f, [field]: val };
      if (field === "branch") next.sale = "";
      return next;
    });
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: file, photoPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const syncToSheet = async (entry) => {
    if (!scriptConfigured) return;
    try {
      const payload = { ...entry };
      delete payload.photo; delete payload.photoPreview;
      await fetch(APPS_SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (_) {}
  };

  const handleSubmit = async () => {
    if (!form.branch || !form.sale || !form.customerName || !form.phone || !form.specialty || !form.result) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }
    setSubmitting(true);
    const entry = { ...form, id: Date.now(), timestamp: new Date().toLocaleString("vi-VN") };
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    saveLocal(newEntries);
    await syncToSheet(entry);
    setForm((f) => ({
      branch: f.branch, sale: f.sale,
      date: new Date().toISOString().split("T")[0],
      customerName: "", address: "", phone: "",
      specialty: "", visitType: "", result: "",
      activeCodes: "", notes: "", photo: null, photoPreview: null,
    }));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const filtered = entries.filter((e) => {
    if (filterBranch !== "all" && e.branch !== filterBranch) return false;
    if (filterSale !== "all" && e.sale !== filterSale) return false;
    if (filterDate && e.date !== filterDate) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    active: filtered.reduce((s, e) => s + (parseInt(e.activeCodes) || 0), 0),
    positive: filtered.filter(e => ["Đồng ý dùng thử","Đã ký hợp đồng","Quan tâm - hẹn lại"].includes(e.result)).length,
    signed: filtered.filter(e => e.result === "Đã ký hợp đồng").length,
  };

  const byBranch = BRANCHES.map(b => ({
    name: b,
    count: filtered.filter(e => e.branch === b).length,
    active: filtered.filter(e => e.branch === b).reduce((s, e) => s + (parseInt(e.activeCodes) || 0), 0),
    signed: filtered.filter(e => e.branch === b && e.result === "Đã ký hợp đồng").length,
  }));

  const bySpecialty = SPECIALTIES
    .map(s => ({ name: s, count: filtered.filter(e => e.specialty === s).length }))
    .filter(x => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);

  const allSales = [...new Set(entries.map(e => e.sale))];
  const bySale = allSales.map(s => ({
    name: s,
    branch: entries.find(e => e.sale === s)?.branch,
    count: filtered.filter(e => e.sale === s).length,
    active: filtered.filter(e => e.sale === s).reduce((sum, e) => sum + (parseInt(e.activeCodes) || 0), 0),
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);

  const maxVisit = bySale[0]?.count || 1;

  const generateAI = async () => {
    if (filtered.length === 0) return;
    setLoadingAI(true); setAiSummary("");
    try {
      const dataStr = filtered.map((e, i) =>
        `${i+1}. CN:${e.branch}|Sale:${e.sale}|Ngày:${e.date}|KH:${e.customerName}|CK:${e.specialty}|Loại:${e.visitType||"—"}|KQ:${e.result}|Active:${e.activeCodes||0}|Note:${e.notes||"—"}`
      ).join("\n");
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1200,
          messages: [{ role: "user", content: `Bạn là chuyên gia phân tích kinh doanh cho Invivo Lab. Dữ liệu:\n\n${dataStr}\n\nViết báo cáo tiếng Việt cho CEO gồm:\n1. TỔNG QUAN: lượt thăm, mã active, tỷ lệ chuyển đổi\n2. SO SÁNH HN vs HCM\n3. TOP HIỆU SUẤT: sale nổi bật, chuyên khoa tiềm năng\n4. RỦI RO cần chú ý\n5. HÀNH ĐỘNG: 3 việc cụ thể tuần tới\n\nSúc tích, có số liệu thực tế.` }]
        })
      });
      const json = await resp.json();
      setAiSummary(json.content?.[0]?.text || "Không thể tạo báo cáo.");
    } catch (_) { setAiSummary("Lỗi kết nối AI."); }
    setLoadingAI(false);
  };

  return (
    <div style={{ fontFamily:"'Be Vietnam Pro',sans-serif", minHeight:"100vh", background:"#080c18", color:"#dde1f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#080c18}::-webkit-scrollbar-thumb{background:#1e2540;border-radius:3px}
        .fi{width:100%;background:#0f1426;border:1px solid #1c2340;border-radius:9px;padding:10px 13px;color:#dde1f0;font-size:14px;font-family:inherit;transition:border-color .2s;appearance:none;-webkit-appearance:none}
        .fi:focus{border-color:#4f6ef7;outline:none}
        .fi::placeholder{color:#303858}
        select.fi option{background:#0f1426}
        .lbl{display:block;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#3a4565;margin-bottom:5px}
        .btn-primary{background:linear-gradient(135deg,#4f6ef7,#7c5cbf);border:none;border-radius:9px;color:#fff;font-family:inherit;font-weight:700;font-size:14px;padding:12px 24px;cursor:pointer;transition:all .2s}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(79,110,247,.4)}
        .btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none}
        .btn-outline{background:transparent;border:1px solid #1e2a45;border-radius:7px;color:#5a6490;font-family:inherit;font-size:12px;padding:7px 14px;cursor:pointer;transition:all .2s;font-weight:600}
        .btn-outline:hover{border-color:#4f6ef7;color:#4f6ef7}
        .btn-outline.on{background:#4f6ef7;border-color:#4f6ef7;color:#fff}
        .card{background:#0d1220;border:1px solid #141d34;border-radius:14px;padding:20px}
        .scard{background:#0d1220;border:1px solid #141d34;border-radius:12px;padding:16px 18px}
        .chip{display:inline-block;padding:3px 10px;border-radius:16px;font-size:10.5px;font-weight:700}
        .bb{height:5px;background:#0f1424;border-radius:3px;margin-top:5px}
        .bf{height:5px;border-radius:3px;background:linear-gradient(90deg,#4f6ef7,#9c6ef7);transition:width .7s ease}
        .toast{position:fixed;top:18px;right:18px;background:#071c10;border:1px solid #34d399;border-radius:10px;padding:11px 17px;color:#34d399;font-weight:700;font-size:13px;z-index:999;animation:pop .2s ease}
        @keyframes pop{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
        .ai-box{background:#050d1a;border:1px solid #122038;border-radius:10px;padding:18px;white-space:pre-wrap;font-size:13px;line-height:1.82;color:#a8b8d0}
        .rbtn{padding:7px 13px;border-radius:18px;border:1px solid;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
        .sec{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#2e3860;margin-bottom:14px}
        .bb2{height:1px;background:#101828;margin:16px 0}
        .photo-drop{border:2px dashed #1c2a45;border-radius:10px;padding:18px;text-align:center;cursor:pointer;transition:border-color .2s}
        .photo-drop:hover{border-color:#4f6ef7}
      `}</style>

      {/* NAV */}
      <div style={{ background:"#090d1c", borderBottom:"1px solid #131c30", padding:"0 20px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:940, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#4f6ef7,#9c6ef7)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13 }}>IV</div>
            <div>
              <div style={{ fontWeight:800, fontSize:14.5, letterSpacing:"-.02em" }}>Invivo Lab</div>
              <div style={{ fontSize:9, color:"#252e50", fontWeight:700, letterSpacing:".09em", textTransform:"uppercase" }}>Sales Activity · Hà Nội & Hồ Chí Minh</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button className={`btn-outline ${view==="form"?"on":""}`} onClick={()=>setView("form")}>📝 Nhập liệu</button>
            <button className={`btn-outline ${view==="dashboard"?"on":""}`} onClick={()=>setView("dashboard")}>
              📊 Dashboard
              {entries.length > 0 && <span style={{ marginLeft:5, background:"#4f6ef7", color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:9.5, fontWeight:800 }}>{entries.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {submitted && (
        <div className="toast">✓ Đã ghi nhận · {scriptConfigured ? "Đã sync Google Sheet" : "Lưu tạm trên trình duyệt"}</div>
      )}

      <div style={{ maxWidth:940, margin:"0 auto", padding:"26px 20px" }}>

        {/* ══ FORM ══ */}
        {view === "form" && (
          <>
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontSize:21, fontWeight:900, letterSpacing:"-.025em" }}>Báo cáo hoạt động Sale</h1>
              <p style={{ color:"#353e62", fontSize:13, marginTop:3 }}>Điền sau mỗi lần thăm khách hàng</p>
            </div>
            <div className="card">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13, marginBottom:13 }}>
                <div>
                  <label className="lbl">Chi nhánh *</label>
                  <select className="fi" value={form.branch} onChange={e=>handleChange("branch",e.target.value)}>
                    <option value="">-- Chọn chi nhánh --</option>
                    {BRANCHES.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">NVKD phụ trách *</label>
                  <select className="fi" value={form.sale} onChange={e=>handleChange("sale",e.target.value)} disabled={!form.branch}>
                    <option value="">-- Chọn NVKD --</option>
                    {(SALE_BY_BRANCH[form.branch]||[]).map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:13 }}>
                <label className="lbl">Ngày thăm *</label>
                <input type="date" className="fi" value={form.date} onChange={e=>handleChange("date",e.target.value)} />
              </div>
              <div className="bb2" />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13, marginBottom:13 }}>
                <div style={{ gridColumn:"span 2" }}>
                  <label className="lbl">Tên khách hàng / Bác sĩ *</label>
                  <input className="fi" placeholder="BS. Nguyễn Thị Lan..." value={form.customerName} onChange={e=>handleChange("customerName",e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Số điện thoại *</label>
                  <input className="fi" placeholder="09xx..." value={form.phone} onChange={e=>handleChange("phone",e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Chuyên khoa *</label>
                  <select className="fi" value={form.specialty} onChange={e=>handleChange("specialty",e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:"span 2" }}>
                  <label className="lbl">Địa chỉ phòng khám</label>
                  <input className="fi" placeholder="Số nhà, đường, quận..." value={form.address} onChange={e=>handleChange("address",e.target.value)} />
                </div>
              </div>
              <div className="bb2" />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13, marginBottom:13 }}>
                <div>
                  <label className="lbl">Loại hoạt động</label>
                  <select className="fi" value={form.visitType} onChange={e=>handleChange("visitType",e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {VISIT_TYPES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Số mã active</label>
                  <input type="number" className="fi" placeholder="0" min="0" value={form.activeCodes} onChange={e=>handleChange("activeCodes",e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="lbl">Kết quả thăm *</label>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:5 }}>
                  {RESULTS.map(r=>{
                    const tag = RESULT_TAG[r];
                    const active = form.result===r;
                    return (
                      <button key={r} className="rbtn" onClick={()=>handleChange("result",r)}
                        style={{ background:active?tag.bg:"transparent", borderColor:active?tag.color:"#1e2a45", color:active?tag.color:"#454e6e" }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="lbl">Ghi chú</label>
                <textarea className="fi" rows={3} placeholder="Phản hồi KH, bước tiếp theo..." value={form.notes} onChange={e=>handleChange("notes",e.target.value)} style={{ resize:"vertical" }} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label className="lbl">Ảnh chứng minh</label>
                <div className="photo-drop" onClick={()=>fileRef.current.click()}>
                  {form.photoPreview
                    ? <img src={form.photoPreview} alt="" style={{ maxHeight:130, borderRadius:7, objectFit:"cover" }} />
                    : <div style={{ color:"#2a3458" }}>
                        <div style={{ fontSize:26, marginBottom:5 }}>📷</div>
                        <div style={{ fontSize:13 }}>Chụp hoặc tải ảnh lên</div>
                        <div style={{ fontSize:11, marginTop:3, color:"#1e2840" }}>Ảnh tại điểm thăm KH</div>
                      </div>
                  }
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handlePhoto} />
                </div>
              </div>
              <button className="btn-primary" style={{ width:"100%", fontSize:15 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Đang lưu..." : "✓  Ghi nhận hoạt động"}
              </button>
              <div style={{ marginTop:10, textAlign:"center", fontSize:11, color:scriptConfigured?"#34d399":"#fbbf24" }}>
                {scriptConfigured ? "✓ Kết nối Google Sheet · Tự động đồng bộ" : "⚠ Chưa kết nối Google Sheet · Data lưu tạm trên trình duyệt"}
              </div>
            </div>
          </>
        )}

        {/* ══ DASHBOARD ══ */}
        {view === "dashboard" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22, flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:21, fontWeight:900, letterSpacing:"-.025em" }}>Sales Dashboard</h1>
                <p style={{ color:"#353e62", fontSize:13, marginTop:3 }}>Invivo Lab · Toàn quốc · Real-time</p>
              </div>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                <select className="fi" style={{ width:"auto", fontSize:12, padding:"7px 11px" }} value={filterBranch}
                  onChange={e=>{ setFilterBranch(e.target.value); setFilterSale("all"); }}>
                  <option value="all">🏢 Tất cả chi nhánh</option>
                  {BRANCHES.map(b=><option key={b}>{b}</option>)}
                </select>
                <select className="fi" style={{ width:"auto", fontSize:12, padding:"7px 11px" }} value={filterSale} onChange={e=>setFilterSale(e.target.value)}>
                  <option value="all">👤 Tất cả NVKD</option>
                  {(filterBranch!=="all" ? SALE_BY_BRANCH[filterBranch] : allSales).map(s=><option key={s}>{s}</option>)}
                </select>
                <input type="date" className="fi" style={{ width:"auto", fontSize:12, padding:"7px 11px" }} value={filterDate} onChange={e=>setFilterDate(e.target.value)} />
                {(filterBranch!=="all"||filterSale!=="all"||filterDate) &&
                  <button className="btn-outline" onClick={()=>{ setFilterBranch("all"); setFilterSale("all"); setFilterDate(""); }}>✕ Reset</button>}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
              {[
                { label:"Lượt thăm", val:stats.total, color:"#4f6ef7", icon:"🏃" },
                { label:"Mã active", val:stats.active, color:"#34d399", icon:"✅" },
                { label:"KH tích cực", val:stats.positive, color:"#fbbf24", icon:"⭐" },
                { label:"Hợp đồng ký", val:stats.signed, color:"#f87171", icon:"📄" },
              ].map(({ label,val,color,icon })=>(
                <div key={label} className="scard">
                  <div style={{ fontSize:18, marginBottom:6 }}>{icon}</div>
                  <div style={{ fontSize:28, fontWeight:900, color, letterSpacing:"-.02em", lineHeight:1 }}>{val}</div>
                  <div style={{ fontSize:9.5, color:"#353e62", fontWeight:700, marginTop:4, textTransform:"uppercase", letterSpacing:".07em" }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {byBranch.map(({ name,count,active,signed })=>(
                <div key={name} className="scard" style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:name==="Hà Nội"?"rgba(251,191,36,.1)":"rgba(79,110,247,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:800, color:name==="Hà Nội"?"#fbbf24":"#7c9ef7" }}>
                    {name==="Hà Nội"?"HN":"HCM"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14.5, color:"#c8d0e4" }}>{name}</div>
                    <div style={{ fontSize:11, color:"#353e62", marginTop:3 }}>{count} lượt · {active} active · {signed} HĐ</div>
                  </div>
                  <div style={{ fontSize:28, fontWeight:900, color:name==="Hà Nội"?"#fbbf24":"#7c9ef7" }}>{count}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div className="card">
                <div className="sec">Chuyên khoa tiếp cận</div>
                {bySpecialty.length===0
                  ? <div style={{ color:"#1e2840", fontSize:13 }}>Chưa có dữ liệu</div>
                  : bySpecialty.map(({ name,count })=>(
                    <div key={name} style={{ marginBottom:11 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5 }}>
                        <span style={{ color:"#9aa8c0" }}>{name}</span>
                        <span style={{ fontWeight:700, color:"#4f6ef7" }}>{count}</span>
                      </div>
                      <div className="bb"><div className="bf" style={{ width:`${(count/stats.total)*100}%` }}/></div>
                    </div>
                  ))}
              </div>
              <div className="card">
                <div className="sec">Hiệu suất NVKD</div>
                {bySale.length===0
                  ? <div style={{ color:"#1e2840", fontSize:13 }}>Chưa có dữ liệu</div>
                  : bySale.map(({ name,branch,count,active },i)=>(
                    <div key={name} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:11 }}>
                      <div style={{ width:23, height:23, borderRadius:"50%", background:i===0?"linear-gradient(135deg,#fbbf24,#f59e0b)":"#101826", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:i===0?"#0a0e1a":"#2e3860", flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:12.5, fontWeight:600, color:"#b0bcd0" }}>{name}</span>
                          <span style={{ padding:"1px 7px", borderRadius:10, fontSize:9, fontWeight:800, ...(branch==="Hà Nội"?{background:"rgba(251,191,36,.1)",color:"#fbbf24"}:{background:"rgba(79,110,247,.1)",color:"#7c9ef7"}) }}>
                            {branch==="Hà Nội"?"HN":"HCM"}
                          </span>
                        </div>
                        <div style={{ fontSize:10, color:"#252e4a", marginTop:1 }}>{active} mã active</div>
                        <div className="bb"><div className="bf" style={{ width:`${(count/maxVisit)*100}%`, background:i===0?"linear-gradient(90deg,#fbbf24,#f59e0b)":"linear-gradient(90deg,#4f6ef7,#9c6ef7)" }}/></div>
                      </div>
                      <div style={{ fontSize:16, fontWeight:900, color:i===0?"#fbbf24":"#4f6ef7", width:22, textAlign:"right" }}>{count}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:aiSummary?14:0 }}>
                <div>
                  <div className="sec" style={{ marginBottom:3 }}>AI Executive Report</div>
                  <div style={{ fontSize:12, color:"#252e4a" }}>Phân tích toàn bộ data HN & HCM — dành cho CEO/Quản lý</div>
                </div>
                <button className="btn-primary" style={{ padding:"9px 16px", fontSize:12 }} onClick={generateAI} disabled={loadingAI||filtered.length===0}>
                  {loadingAI ? "⏳ Đang phân tích..." : "✨ Tạo báo cáo AI"}
                </button>
              </div>
              {aiSummary && <div className="ai-box">{aiSummary}</div>}
              {!aiSummary && <div style={{ fontSize:12, color:"#1e2840", fontStyle:"italic", paddingTop:12 }}>
                {filtered.length===0 ? "Nhập ít nhất 1 hoạt động để tạo báo cáo." : "Bấm nút để AI tổng hợp và xuất executive report."}
              </div>}
            </div>

            <div className="card">
              <div className="sec">Chi tiết hoạt động ({filtered.length})</div>
              {filtered.length===0
                ? <div style={{ color:"#1e2840", fontSize:13, textAlign:"center", padding:"24px 0" }}>Chưa có dữ liệu.</div>
                : <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #101828" }}>
                          {["CN","Ngày","NVKD","Khách hàng","Chuyên khoa","Active","Kết quả"].map(h=>(
                            <th key={h} style={{ padding:"8px 10px", textAlign:"left", color:"#252e4a", fontWeight:700, fontSize:9.5, letterSpacing:".07em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((e)=>{
                          const tag = RESULT_TAG[e.result]||{ bg:"transparent", color:"#5a6490" };
                          return (
                            <tr key={e.id} style={{ borderBottom:"1px solid #0b1020" }}>
                              <td style={{ padding:"9px 10px" }}>
                                <span style={{ padding:"2px 8px", borderRadius:10, fontSize:9.5, fontWeight:800, ...(e.branch==="Hà Nội"?{background:"rgba(251,191,36,.1)",color:"#fbbf24"}:{background:"rgba(79,110,247,.1)",color:"#7c9ef7"}) }}>
                                  {e.branch==="Hà Nội"?"HN":"HCM"}
                                </span>
                              </td>
                              <td style={{ padding:"9px 10px", color:"#505870", whiteSpace:"nowrap" }}>{e.date}</td>
                              <td style={{ padding:"9px 10px", fontWeight:600, color:"#a0aac0" }}>{e.sale}</td>
                              <td style={{ padding:"9px 10px" }}>
                                <div style={{ fontWeight:600, color:"#c0c8e0" }}>{e.customerName}</div>
                                {e.phone && <div style={{ fontSize:10, color:"#252e4a" }}>{e.phone}</div>}
                              </td>
                              <td style={{ padding:"9px 10px", color:"#505870" }}>{e.specialty}</td>
                              <td style={{ padding:"9px 10px", fontWeight:700, color:"#34d399", textAlign:"center" }}>{e.activeCodes||"—"}</td>
                              <td style={{ padding:"9px 10px" }}>
                                <span className="chip" style={{ background:tag.bg, color:tag.color }}>{e.result}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}

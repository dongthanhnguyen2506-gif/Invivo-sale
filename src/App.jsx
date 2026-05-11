import { useState, useRef, useEffect } from "react";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

const BRANCHES = ["Hà Nội", "Hồ Chí Minh"];
const SALE_BY_BRANCH = {
  "Hà Nội": ["Nguyễn Văn Thuyết", "Nguyễn Đức Quân", "Lê Anh Dũng", "Vương Văn Tiến"],
  "Hồ Chí Minh": ["Trần Việt Hảo", "Thúy Kiều", "Châu Kim Ngân", "Nguyễn Bá Phú"],
};
const SPECIALTIES = ["Tim mạch","Nội tiết","Thần kinh","Hô hấp","Tiêu hóa","Cơ xương khớp","Da liễu","Sản phụ khoa","Nhi khoa","Ung bướu"];
const VISIT_TYPES = ["Giới thiệu sản phẩm","Follow-up","Ký hợp đồng","Hỗ trợ kỹ thuật","Chăm sóc sau bán"];
const RESULTS = ["Quan tâm - hẹn lại","Đồng ý dùng thử","Đã ký hợp đồng","Từ chối","Không gặp được"];
const RESULT_STYLE = {
  "Đã ký hợp đồng":    { bg:"#e8faf3", color:"#0d7a4e", border:"#0d7a4e" },
  "Đồng ý dùng thử":   { bg:"#eaf0ff", color:"#1a40b8", border:"#1a40b8" },
  "Quan tâm - hẹn lại":{ bg:"#fff8e6", color:"#b45309", border:"#b45309" },
  "Từ chối":            { bg:"#fef2f2", color:"#c0392b", border:"#c0392b" },
  "Không gặp được":     { bg:"#f4f4f5", color:"#6b7280", border:"#9ca3af" },
};

const BLUE = "#1a56db";
const RED  = "#c0392b";
const BLUE_L = "#eaf0ff";
const RED_L  = "#fef2f2";

export default function App() {
  const [view, setView] = useState("form");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    branch:"", sale:"", date: new Date().toISOString().split("T")[0],
    ctvCode:"", customerName:"", address:"", phone:"",
    specialty:"", visitType:"", result:"", activeCodes:"", notes:"",
    photo:null, photoPreview:null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterSale, setFilterSale] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const fileRef = useRef();
  const configured = !APPS_SCRIPT_URL.includes("YOUR_SCRIPT_ID");

  useEffect(()=>{
    try{ const c=localStorage.getItem("iv2"); if(c) setEntries(JSON.parse(c)); }catch(_){}
  },[]);

  const save = (e)=>{ try{ localStorage.setItem("iv2",JSON.stringify(e)); }catch(_){} };

  const set = (f,v)=>setForm(p=>{ const n={...p,[f]:v}; if(f==="branch") n.sale=""; return n; });

  const handlePhoto = (e)=>{
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=(ev)=>setForm(p=>({...p,photo:file,photoPreview:ev.target.result}));
    r.readAsDataURL(file);
  };

  const submit = async()=>{
    if(!form.branch||!form.sale||!form.customerName||!form.phone||!form.specialty||!form.result){
      alert("Vui lòng điền đầy đủ các trường bắt buộc (*)"); return;
    }
    setSubmitting(true);
    const entry={...form, id:Date.now(), timestamp:new Date().toLocaleString("vi-VN")};
    const next=[entry,...entries]; setEntries(next); save(next);
    if(configured){
      try{
        const p={...entry}; delete p.photo; delete p.photoPreview;
        await fetch(APPS_SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
      }catch(_){}
    }
    setForm(p=>({branch:p.branch,sale:p.sale,date:new Date().toISOString().split("T")[0],ctvCode:"",customerName:"",address:"",phone:"",specialty:"",visitType:"",result:"",activeCodes:"",notes:"",photo:null,photoPreview:null}));
    setSubmitting(false); setSubmitted(true); setTimeout(()=>setSubmitted(false),3000);
  };

  const filtered = entries.filter(e=>{
    if(filterBranch!=="all"&&e.branch!==filterBranch) return false;
    if(filterSale!=="all"&&e.sale!==filterSale) return false;
    if(filterDate&&e.date!==filterDate) return false;
    return true;
  });

  const stats={
    total:filtered.length,
    active:filtered.reduce((s,e)=>s+(parseInt(e.activeCodes)||0),0),
    positive:filtered.filter(e=>["Đồng ý dùng thử","Đã ký hợp đồng","Quan tâm - hẹn lại"].includes(e.result)).length,
    signed:filtered.filter(e=>e.result==="Đã ký hợp đồng").length,
  };

  const byBranch=BRANCHES.map(b=>({
    name:b, count:filtered.filter(e=>e.branch===b).length,
    active:filtered.filter(e=>e.branch===b).reduce((s,e)=>s+(parseInt(e.activeCodes)||0),0),
    signed:filtered.filter(e=>e.branch===b&&e.result==="Đã ký hợp đồng").length,
  }));

  const bySpec=SPECIALTIES.map(s=>({name:s,count:filtered.filter(e=>e.specialty===s).length}))
    .filter(x=>x.count>0).sort((a,b)=>b.count-a.count).slice(0,6);

  const allSales=[...new Set(entries.map(e=>e.sale))];
  const bySale=allSales.map(s=>({
    name:s, branch:entries.find(e=>e.sale===s)?.branch,
    count:filtered.filter(e=>e.sale===s).length,
    active:filtered.filter(e=>e.sale===s).reduce((sum,e)=>sum+(parseInt(e.activeCodes)||0),0),
  })).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
  const maxV=bySale[0]?.count||1;

  const genAI=async()=>{
    if(!filtered.length) return;
    setLoadingAI(true); setAiSummary("");
    try{
      const ds=filtered.map((e,i)=>`${i+1}. CN:${e.branch}|Sale:${e.sale}|CTV:${e.ctvCode||"—"}|Ngày:${e.date}|KH:${e.customerName}|CK:${e.specialty}|KQ:${e.result}|Active:${e.activeCodes||0}`).join("\n");
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,
          messages:[{role:"user",content:`Bạn là chuyên gia phân tích cho Invivo Lab. Dữ liệu:\n\n${ds}\n\nViết báo cáo tiếng Việt cho CEO:\n1. TỔNG QUAN\n2. SO SÁNH HN vs HCM\n3. TOP HIỆU SUẤT\n4. RỦI RO\n5. HÀNH ĐỘNG TUẦN TỚI\n\nSúc tích, có số liệu.`}]})
      });
      const j=await r.json(); setAiSummary(j.content?.[0]?.text||"Không thể tạo báo cáo.");
    }catch(_){ setAiSummary("Lỗi kết nối AI."); }
    setLoadingAI(false);
  };

  const FI = ({label,required,children})=>(
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#6b7280",marginBottom:5}}>{label}{required&&<span style={{color:RED}}> *</span>}</label>}
      {children}
    </div>
  );

  const input = {width:"100%",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"10px 13px",color:"#111827",fontSize:14,fontFamily:"inherit",outline:"none",transition:"border-color .15s",appearance:"none",WebkitAppearance:"none"};
  const inputFocus = (e)=>e.target.style.borderColor=BLUE;
  const inputBlur  = (e)=>e.target.style.borderColor="#e5e7eb";

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
        .rbtn{padding:7px 14px;border-radius:20px;border:1.5px solid;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;background:#fff}
        .rbtn:hover{transform:translateY(-1px)}
        .bar-bg{height:6px;background:#f1f5f9;border-radius:3px;margin-top:5px}
        .bar-fill{height:6px;border-radius:3px;background:linear-gradient(90deg,${BLUE},#3b82f6);transition:width .6s ease}
        .toast{position:fixed;top:18px;right:18px;background:#fff;border:2px solid #0d7a4e;border-radius:10px;padding:12px 18px;color:#0d7a4e;font-weight:700;font-size:13px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.1);animation:pop .2s ease}
        @keyframes pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .ai-box{background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:10px;padding:18px;white-space:pre-wrap;font-size:13px;line-height:1.8;color:#374151}
        .photo-drop{border:2px dashed #e5e7eb;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all .2s;background:#fafafa}
        .photo-drop:hover{border-color:${BLUE};background:${BLUE_L}}
        .sec{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#9ca3af;margin-bottom:14px}
        .div{height:1px;background:#f1f5f9;margin:16px 0}
        .btn-primary{background:${BLUE};border:none;border-radius:9px;color:#fff;font-family:inherit;font-weight:700;font-size:15px;padding:13px;cursor:pointer;transition:all .2s;width:100%}
        .btn-primary:hover{background:#1648c8;box-shadow:0 6px 20px rgba(26,86,219,.3)}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .btn-ai{background:${RED};border:none;border-radius:8px;color:#fff;font-family:inherit;font-weight:700;font-size:12px;padding:9px 16px;cursor:pointer;transition:all .2s}
        .btn-ai:hover{background:#a93226}
        .btn-ai:disabled{opacity:.5;cursor:not-allowed}
        .btn-sm{background:#fff;border:1.5px solid #e5e7eb;border-radius:7px;color:#6b7280;font-family:inherit;font-size:12px;padding:6px 12px;cursor:pointer;font-weight:600;transition:all .15s}
        .btn-sm:hover{border-color:${RED};color:${RED}}
        .chip{display:inline-block;padding:3px 10px;border-radius:14px;font-size:10.5px;font-weight:700;border:1.5px solid}
        .hn{background:#fff8e6;color:#b45309;border-color:#b45309}
        .hcm{background:${BLUE_L};color:${BLUE};border-color:${BLUE}}
        th{padding:9px 10px;text-align:left;color:#9ca3af;font-weight:700;font-size:10px;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;border-bottom:1.5px solid #f1f5f9}
        td{padding:9px 10px;border-bottom:1px solid #f8fafc;font-size:13px}
        tr:hover td{background:#fafafa}
      `}</style>

      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #e5e7eb",padding:"0 24px",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:2}}>
              <div style={{width:10,height:36,borderRadius:3,background:BLUE}}/>
              <div style={{width:10,height:36,borderRadius:3,background:RED,marginLeft:2}}/>
            </div>
            <div>
              <div style={{fontWeight:900,fontSize:16,letterSpacing:"-.02em",color:"#111827"}}>
                Invivo <span style={{color:BLUE}}>Lab</span>
              </div>
              <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,letterSpacing:".09em",textTransform:"uppercase"}}>Sales Activity · HN & HCM</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button className={`nav-btn ${view==="form"?"on":""}`} onClick={()=>setView("form")}>📝 Nhập liệu</button>
            <button className={`nav-btn ${view==="dashboard"?"on":""}`} onClick={()=>setView("dashboard")}>
              📊 Dashboard
              {entries.length>0&&<span style={{marginLeft:6,background:view==="dashboard"?"rgba(255,255,255,.25)":BLUE,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:800}}>{entries.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {submitted&&<div className="toast">✅ Đã ghi nhận hoạt động!</div>}

      <div style={{maxWidth:960,margin:"0 auto",padding:"28px 24px"}}>

        {/* ══ FORM ══ */}
        {view==="form"&&(
          <>
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{width:4,height:24,borderRadius:2,background:BLUE}}/>
                <h1 style={{fontSize:22,fontWeight:900,letterSpacing:"-.025em"}}>Báo cáo hoạt động Sale</h1>
              </div>
              <p style={{color:"#6b7280",fontSize:13,marginLeft:14}}>Điền đầy đủ sau mỗi lần thăm khách hàng</p>
            </div>

            <div className="card">
              {/* Thông tin NVKD */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <div style={{width:3,height:18,borderRadius:2,background:BLUE}}/>
                <span style={{fontWeight:700,fontSize:13,color:BLUE}}>Thông tin NVKD</span>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FI label="Chi nhánh" required>
                  <select style={input} value={form.branch} onChange={e=>set("branch",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="">-- Chọn chi nhánh --</option>
                    {BRANCHES.map(b=><option key={b}>{b}</option>)}
                  </select>
                </FI>
                <FI label="NVKD phụ trách" required>
                  <select style={input} value={form.sale} onChange={e=>set("sale",e.target.value)} disabled={!form.branch} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="">-- Chọn NVKD --</option>
                    {(SALE_BY_BRANCH[form.branch]||[]).map(s=><option key={s}>{s}</option>)}
                  </select>
                </FI>
                <FI label="Ngày thăm" required>
                  <input type="date" style={input} value={form.date} onChange={e=>set("date",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}/>
                </FI>
                <FI label="Mã CTV">
                  <input style={input} placeholder="VD: CTV-001..." value={form.ctvCode} onChange={e=>set("ctvCode",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}/>
                </FI>
              </div>

              <div className="div"/>

              {/* Thông tin KH */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <div style={{width:3,height:18,borderRadius:2,background:RED}}/>
                <span style={{fontWeight:700,fontSize:13,color:RED}}>Thông tin khách hàng</span>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FI label="Tên khách hàng / Bác sĩ" required>
                  <input style={{...input,gridColumn:"span 2"}} placeholder="BS. Nguyễn Thị Lan..." value={form.customerName} onChange={e=>set("customerName",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}/>
                </FI>
                <FI label="Số điện thoại" required>
                  <input style={input} placeholder="09xx..." value={form.phone} onChange={e=>set("phone",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}/>
                </FI>
                <FI label="Chuyên khoa" required>
                  <select style={input} value={form.specialty} onChange={e=>set("specialty",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="">-- Chọn --</option>
                    {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </FI>
                <div style={{gridColumn:"span 2"}}>
                  <FI label="Địa chỉ phòng khám">
                    <input style={input} placeholder="Số nhà, đường, quận..." value={form.address} onChange={e=>set("address",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}/>
                  </FI>
                </div>
              </div>

              <div className="div"/>

              {/* Kết quả */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <div style={{width:3,height:18,borderRadius:2,background:"#f59e0b"}}/>
                <span style={{fontWeight:700,fontSize:13,color:"#b45309"}}>Kết quả hoạt động</span>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FI label="Loại hoạt động">
                  <select style={input} value={form.visitType} onChange={e=>set("visitType",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="">-- Chọn --</option>
                    {VISIT_TYPES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </FI>
                <FI label="Số mã active">
                  <input type="number" style={input} placeholder="0" min="0" value={form.activeCodes} onChange={e=>set("activeCodes",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}/>
                </FI>
              </div>

              <FI label="Kết quả thăm" required>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                  {RESULTS.map(r=>{
                    const s=RESULT_STYLE[r]; const active=form.result===r;
                    return <button key={r} className="rbtn" onClick={()=>set("result",r)}
                      style={{background:active?s.bg:"#fff",borderColor:active?s.border:"#e5e7eb",color:active?s.color:"#6b7280"}}>
                      {r}
                    </button>;
                  })}
                </div>
              </FI>

              <FI label="Ghi chú">
                <textarea style={{...input,resize:"vertical"}} rows={3} placeholder="Phản hồi KH, bước tiếp theo..." value={form.notes} onChange={e=>set("notes",e.target.value)} onFocus={inputFocus} onBlur={inputBlur}/>
              </FI>

              <FI label="Ảnh chứng minh">
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
              </FI>

              <button className="btn-primary" onClick={submit} disabled={submitting}>
                {submitting?"Đang lưu...":"✓  Ghi nhận hoạt động"}
              </button>

              <div style={{marginTop:10,textAlign:"center",fontSize:11,color:configured?"#0d7a4e":"#b45309",fontWeight:600}}>
                {configured?"✓ Kết nối Google Sheet · Tự động đồng bộ":"⚠ Chưa kết nối Google Sheet · Data lưu tạm trên trình duyệt"}
              </div>
            </div>
          </>
        )}

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{width:4,height:24,borderRadius:2,background:RED}}/>
                  <h1 style={{fontSize:22,fontWeight:900,letterSpacing:"-.025em"}}>Sales Dashboard</h1>
                </div>
                <p style={{color:"#6b7280",fontSize:13,marginLeft:14}}>Invivo Lab · Toàn quốc · Real-time</p>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <select style={{...input,width:"auto",fontSize:12,padding:"7px 11px"}} value={filterBranch} onChange={e=>{setFilterBranch(e.target.value);setFilterSale("all");}}>
                  <option value="all">🏢 Tất cả chi nhánh</option>
                  {BRANCHES.map(b=><option key={b}>{b}</option>)}
                </select>
                <select style={{...input,width:"auto",fontSize:12,padding:"7px 11px"}} value={filterSale} onChange={e=>setFilterSale(e.target.value)}>
                  <option value="all">👤 Tất cả NVKD</option>
                  {(filterBranch!=="all"?SALE_BY_BRANCH[filterBranch]:allSales).map(s=><option key={s}>{s}</option>)}
                </select>
                <input type="date" style={{...input,width:"auto",fontSize:12,padding:"7px 11px"}} value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
                {(filterBranch!=="all"||filterSale!=="all"||filterDate)&&
                  <button className="btn-sm" onClick={()=>{setFilterBranch("all");setFilterSale("all");setFilterDate("");}}>✕ Reset</button>}
              </div>
            </div>

            {/* KPI */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[
                {label:"Lượt thăm",val:stats.total,color:BLUE,bg:BLUE_L,icon:"🏃"},
                {label:"Mã active",val:stats.active,color:"#0d7a4e",bg:"#e8faf3",icon:"✅"},
                {label:"KH tích cực",val:stats.positive,color:"#b45309",bg:"#fff8e6",icon:"⭐"},
                {label:"Hợp đồng",val:stats.signed,color:RED,bg:RED_L,icon:"📄"},
              ].map(({label,val,color,bg,icon})=>(
                <div key={label} className="scard" style={{borderLeft:`4px solid ${color}`}}>
                  <div style={{fontSize:20,marginBottom:8}}>{icon}</div>
                  <div style={{fontSize:30,fontWeight:900,color,letterSpacing:"-.02em",lineHeight:1}}>{val}</div>
                  <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginTop:5,textTransform:"uppercase",letterSpacing:".07em"}}>{label}</div>
                </div>
              ))}
            </div>

            {/* Branch compare */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              {byBranch.map(({name,count,active,signed})=>(
                <div key={name} className="scard" style={{display:"flex",alignItems:"center",gap:14,borderTop:`3px solid ${name==="Hà Nội"?"#b45309":BLUE}`}}>
                  <div style={{width:44,height:44,borderRadius:10,background:name==="Hà Nội"?"#fff8e6":BLUE_L,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:name==="Hà Nội"?"#b45309":BLUE}}>
                    {name==="Hà Nội"?"HN":"HCM"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15}}>{name}</div>
                    <div style={{fontSize:11,color:"#6b7280",marginTop:3}}>{count} lượt · {active} active · {signed} hợp đồng</div>
                  </div>
                  <div style={{fontSize:30,fontWeight:900,color:name==="Hà Nội"?"#b45309":BLUE}}>{count}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              {/* Specialty */}
              <div className="card">
                <div className="sec">Chuyên khoa tiếp cận</div>
                {bySpec.length===0
                  ?<div style={{color:"#d1d5db",fontSize:13}}>Chưa có dữ liệu</div>
                  :bySpec.map(({name,count})=>(
                    <div key={name} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                        <span style={{color:"#374151",fontWeight:500}}>{name}</span>
                        <span style={{fontWeight:700,color:BLUE}}>{count}</span>
                      </div>
                      <div className="bar-bg"><div className="bar-fill" style={{width:`${(count/stats.total)*100}%`}}/></div>
                    </div>
                  ))}
              </div>

              {/* Sale leaderboard */}
              <div className="card">
                <div className="sec">Hiệu suất NVKD</div>
                {bySale.length===0
                  ?<div style={{color:"#d1d5db",fontSize:13}}>Chưa có dữ liệu</div>
                  :bySale.map(({name,branch,count,active},i)=>(
                    <div key={name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                      <div style={{width:24,height:24,borderRadius:"50%",background:i===0?"linear-gradient(135deg,#f59e0b,#d97706)":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:i===0?"#fff":"#9ca3af",flexShrink:0}}>{i+1}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:13,fontWeight:600,color:"#111827"}}>{name}</span>
                          <span className={`chip ${branch==="Hà Nội"?"hn":"hcm"}`} style={{fontSize:9}}>{branch==="Hà Nội"?"HN":"HCM"}</span>
                        </div>
                        <div style={{fontSize:10,color:"#9ca3af",marginTop:1}}>{active} mã active</div>
                        <div className="bar-bg"><div className="bar-fill" style={{width:`${(count/maxV)*100}%`,background:i===0?"linear-gradient(90deg,#f59e0b,#d97706)":"linear-gradient(90deg,#1a56db,#3b82f6)"}}/></div>
                      </div>
                      <div style={{fontSize:18,fontWeight:900,color:i===0?"#d97706":BLUE,width:24,textAlign:"right"}}>{count}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* AI Report */}
            <div className="card" style={{marginBottom:14,borderTop:`3px solid ${RED}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:aiSummary?16:0}}>
                <div>
                  <div className="sec" style={{marginBottom:3}}>AI Executive Report</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>Phân tích toàn bộ dữ liệu HN & HCM — dành cho CEO</div>
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

            {/* Table */}
            <div className="card">
              <div className="sec">Chi tiết hoạt động ({filtered.length})</div>
              {filtered.length===0
                ?<div style={{color:"#d1d5db",fontSize:13,textAlign:"center",padding:"28px 0"}}>Chưa có dữ liệu. Nhập từ tab "Nhập liệu".</div>
                :<div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr>
                        {["CN","Ngày","NVKD","Mã CTV","Khách hàng","Chuyên khoa","Active","Kết quả"].map(h=><th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(e=>{
                        const tag=RESULT_STYLE[e.result]||{bg:"#f4f4f5",color:"#6b7280",border:"#9ca3af"};
                        return(
                          <tr key={e.id}>
                            <td><span className={`chip ${e.branch==="Hà Nội"?"hn":"hcm"}`}>{e.branch==="Hà Nội"?"HN":"HCM"}</span></td>
                            <td style={{color:"#6b7280",whiteSpace:"nowrap"}}>{e.date}</td>
                            <td style={{fontWeight:600,color:"#111827"}}>{e.sale}</td>
                            <td style={{color:"#6b7280",fontSize:12}}>{e.ctvCode||"—"}</td>
                            <td>
                              <div style={{fontWeight:600,color:"#111827"}}>{e.customerName}</div>
                              {e.phone&&<div style={{fontSize:11,color:"#9ca3af"}}>{e.phone}</div>}
                            </td>
                            <td style={{color:"#6b7280"}}>{e.specialty}</td>
                            <td style={{fontWeight:700,color:"#0d7a4e",textAlign:"center"}}>{e.activeCodes||"—"}</td>
                            <td><span className="chip" style={{background:tag.bg,color:tag.color,borderColor:tag.border}}>{e.result}</span></td>
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

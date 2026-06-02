import { useState, useEffect, useCallback } from "react";
import { CTV_ACTIVE_DATA } from "./ctvActive.js";
import { KYCDrawer, CUSTOMER_TIERS, WALLET_RANGES, syncCRMToSheet } from "./KYC.jsx";

// ─── Pipeline stages ─────────────────────────────────────────────
export const PIPELINE_STAGES = [
  { id:"new",      label:"Mới",       color:"#6b7280", bg:"#f4f4f5",   icon:"🆕" },
  { id:"interest", label:"Quan tâm",  color:"#b45309", bg:"#fff8e6",   icon:"⭐" },
  { id:"trial",    label:"Dùng thử",  color:"#1a56db", bg:"#eaf0ff",   icon:"🔬" },
  { id:"signed",   label:"Ký HĐ",     color:"#0d7a4e", bg:"#e8faf3",   icon:"📄" },
  { id:"onboard",  label:"Onboard",   color:"#7c3aed", bg:"#f5f3ff",   icon:"🚀" },
  { id:"care",     label:"Chăm sóc",  color:"#0369a1", bg:"#e0f2fe",   icon:"💙" },
];

const BLUE = "#1a56db";
const RED  = "#c0392b";

// ─── Helpers ─────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (dateStr) => {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

function stageOf(stage) {
  return PIPELINE_STAGES.find(s => s.id === stage) || PIPELINE_STAGES[0];
}

// ─── Components defined OUTSIDE CRM ─────────────────────────────

function StageChip({ stageId, size = "sm" }) {
  const s = stageOf(stageId);
  const pad = size === "lg" ? "5px 14px" : "3px 10px";
  const fs  = size === "lg" ? 13 : 11;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:pad, borderRadius:20, fontSize:fs, fontWeight:700,
      background:s.bg, color:s.color, border:`1.5px solid ${s.color}`,
      whiteSpace:"nowrap",
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function ReminderBadge({ nextFollowUp }) {
  const days = daysAgo(nextFollowUp);
  if (!nextFollowUp) return null;
  const overdue = new Date(nextFollowUp) < new Date(today());
  const dueToday = nextFollowUp === today();
  if (!overdue && !dueToday && days < -3) return null;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700,
      background: overdue ? "#fef2f2" : dueToday ? "#fff8e6" : "#f0fdf4",
      color: overdue ? RED : dueToday ? "#b45309" : "#0d7a4e",
      border: `1px solid ${overdue ? "#fca5a5" : dueToday ? "#fcd34d" : "#86efac"}`,
    }}>
      {overdue ? "⚠ Quá hạn" : dueToday ? "📅 Hôm nay" : "✓ Sắp tới"}
    </span>
  );
}

function KHCard({ kh, onEdit, onAddActivity, onOpenKYC }) {
  const stage = stageOf(kh.stage);
  const lastActivity = kh.activities?.[kh.activities.length - 1];
  const daysSinceLast = lastActivity ? daysAgo(lastActivity.date) : null;

  return (
    <div style={{
      background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:12,
      padding:"14px 16px", marginBottom:8,
      borderLeft:`3px solid ${stage.color}`,
      transition:"box-shadow .15s",
    }}
    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
    onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
    >
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap"}}>
            <span style={{fontWeight:700, fontSize:14, color:"#111827"}}>{kh.name}</span>
            <StageChip stageId={kh.stage} />
            {kh.poolData && <span style={{padding:"1px 7px",background:"#f5f3ff",borderRadius:8,fontSize:9,fontWeight:700,color:"#7c3aed",border:"1px solid #e9d5ff"}}>🏢 Pool</span>}
            <ReminderBadge nextFollowUp={kh.nextFollowUp} />
          </div>
          <div style={{fontSize:12, color:"#6b7280", marginBottom:2}}>
            {kh.specialty && <span>🩺 {kh.specialty}</span>}
            {kh.specialty && kh.district && <span style={{margin:"0 6px"}}>·</span>}
            {kh.district && <span>📍 {kh.district}</span>}
          </div>
          <div style={{fontSize:12, color:"#9ca3af"}}>
            {kh.phone && <span>📞 {kh.phone}</span>}
            {kh.nvkd && <span style={{marginLeft:10}}>👤 {kh.nvkd}</span>}
          </div>
          {daysSinceLast !== null && (
            <div style={{fontSize:11, color:"#9ca3af", marginTop:4}}>
              Hoạt động gần nhất: {daysSinceLast === 0 ? "hôm nay" : `${daysSinceLast} ngày trước`}
              {lastActivity && ` · ${lastActivity.result}`}
            </div>
          )}
        </div>
        <div style={{display:"flex", gap:6, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end"}}>
          <button onClick={()=>onOpenKYC(kh)}
            style={{padding:"5px 10px", background: kh.kyc?.tier ? "#f5f3ff" : "#f8fafc", border:`1px solid ${kh.kyc?.tier ? "#7c3aed" : "#e5e7eb"}`, borderRadius:7, color: kh.kyc?.tier ? "#7c3aed" : "#6b7280", fontSize:11, fontWeight:700, cursor:"pointer"}}>
            📋 KYC{kh.kyc?.tier ? ` · ${kh.kyc.tier}` : ""}
          </button>
          <button onClick={()=>onAddActivity(kh)}
            style={{padding:"5px 10px", background:"#eaf0ff", border:"1px solid #bfdbfe", borderRadius:7, color:BLUE, fontSize:11, fontWeight:700, cursor:"pointer"}}>
            + HĐ
          </button>
          <button onClick={()=>onEdit(kh)}
            style={{padding:"5px 10px", background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:7, color:"#6b7280", fontSize:11, fontWeight:600, cursor:"pointer"}}>
            ✏️
          </button>
        </div>
      </div>
      {kh.nextFollowUp && (
        <div style={{marginTop:8, padding:"6px 10px", background:"#f8fafc", borderRadius:7, fontSize:11, color:"#6b7280"}}>
          📅 Follow-up: <strong style={{color:"#374151"}}>{kh.nextFollowUp}</strong>
          {kh.followUpNote && <span style={{marginLeft:6, color:"#9ca3af"}}>· {kh.followUpNote}</span>}
        </div>
      )}
    </div>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:16,padding:"24px 22px",maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontWeight:800,fontSize:16,color:"#111827"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9ca3af",padding:"2px 6px"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const FI_STYLE = {
  width:"100%", background:"#f8fafc", border:"1.5px solid #e5e7eb",
  borderRadius:8, padding:"10px 12px", color:"#111827", fontSize:14,
  fontFamily:"inherit", outline:"none", appearance:"none", WebkitAppearance:"none",
};
const LBL_STYLE = {
  display:"block", fontSize:10, fontWeight:700, color:"#6b7280",
  letterSpacing:".08em", textTransform:"uppercase", marginBottom:5,
};

// ─── Main CRM Component ──────────────────────────────────────────
export default function CRM({ entries, currentUser, isBoard, isSaleManager, isNVKD, userBranch, SALE_BY_BRANCH, BRANCHES, SPECIALTIES }) {

  const [customers, setCustomers] = useState([]);
  const [crmView, setCrmView] = useState("list"); // list | pipeline | reminders
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterNVKD, setFilterNVKD] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedKH, setSelectedKH] = useState(null);
  const [khForm, setKhForm] = useState({});
  const [actForm, setActForm] = useState({ date: today(), type:"", result:"", note:"", nextFollowUp:"", followUpNote:"" });
  const [saveMsg, setSaveMsg] = useState("");
  const [kycKH, setKycKH] = useState(null); // KH currently open in KYC drawer

  // Load from localStorage — seed CTV active data if first time
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iv_crm");
      const hasSeeded = localStorage.getItem("iv_crm_seeded");
      if (saved && hasSeeded) {
        setCustomers(JSON.parse(saved));
      } else {
        setCustomers(CTV_ACTIVE_DATA);
        try { localStorage.setItem("iv_crm", JSON.stringify(CTV_ACTIVE_DATA)); } catch(_) {}
        localStorage.setItem("iv_crm_seeded", "1");
      }
    } catch(_) {
      setCustomers(CTV_ACTIVE_DATA);
    }
  }, []);

  const save = (list) => {
    setCustomers(list);
    try { localStorage.setItem("iv_crm", JSON.stringify(list)); } catch(_) {}
  };

  const saveKYC = (updatedKH) => {
    const updated = customers.map(k => k.id === updatedKH.id ? updatedKH : k);
    save(updated);
    setKycKH(updatedKH);
    // KYC.jsx handleSave already calls syncKYCToSheet — no need to duplicate
  };

  // Auto-import new customers from activities
  useEffect(() => {
    if (!entries.length) return;
    setCustomers(prev => {
      const existing = new Set(prev.map(k => k.phone));
      const newKHs = [];
      const seen = new Set();
      entries.forEach(e => {
        if (!e.phone || existing.has(e.phone) || seen.has(e.phone)) return;
        seen.add(e.phone);
        // Map result to stage
        const stageMap = {
          "Đã ký hợp đồng":"signed", "Onboard khách hàng":"onboard",
          "Đồng ý dùng thử":"trial", "Quan tâm - hẹn lại":"interest",
          "Chăm sóc sau bán":"care", "Chăm sóc thúc đẩy":"care",
        };
        const stage = stageMap[e.result] || "new";
        newKHs.push({
          id: `kh_${e.phone}_${Date.now()}`,
          name: e.customerName || "",
          phone: e.phone || "",
          specialty: e.specialty || "",
          district: e.district || "",
          address: e.address || "",
          branch: e.branch || "",
          nvkd: e.sale || "",
          stage,
          nextFollowUp: "",
          followUpNote: "",
          ctvCode: e.ctvCode || "",
          createdAt: e.date || today(),
          activities: [{
            date: e.date || today(),
            type: e.visitType || "",
            result: e.result || "",
            note: e.notes || "",
            nvkd: e.sale || "",
          }],
        });
      });
      if (!newKHs.length) return prev;
      const updated = [...prev, ...newKHs];
      try { localStorage.setItem("iv_crm", JSON.stringify(updated)); } catch(_) {}
      return updated;
    });
  }, [entries]);

  // Scope by role — Pool data đã bỏ, chỉ còn active
  const visibleCustomers = customers;  // hide pool from SM and NVKD

  const scopedCustomers = isBoard
    ? visibleCustomers
    : isSaleManager
      ? visibleCustomers.filter(k => k.branch === userBranch)
      : visibleCustomers.filter(k => k.nvkd === currentUser); // NVKD: own only

  // Filter
  const filtered = scopedCustomers.filter(k => {
    if (filterStage !== "all" && k.stage !== filterStage) return false;
    if (filterNVKD !== "all" && k.nvkd !== filterNVKD) return false;
    if (search && !k.name.toLowerCase().includes(search.toLowerCase()) &&
        !k.phone.includes(search) && !(k.specialty||"").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Reminders: overdue or due within 3 days
  const reminders = scopedCustomers.filter(k => {
    if (!k.nextFollowUp) return false;
    const d = new Date(k.nextFollowUp);
    const diff = (d - new Date()) / 86400000;
    return diff <= 3;
  }).sort((a,b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp));

  const openAdd = () => {
    setKhForm({ stage:"new", branch: userBranch||"", nvkd: isNVKD ? currentUser : "" });
    setShowAddModal(true);
  };

  const openEdit = (kh) => { setSelectedKH(kh); setKhForm({...kh}); setShowEditModal(true); };
  const openKYC = (kh) => setKycKH(kh);

  const openActivity = (kh) => {
    setSelectedKH(kh);
    setActForm({ date:today(), type:"", result:"", note:"", nextFollowUp:"", followUpNote:"", nvkd: isNVKD ? currentUser : kh.nvkd });
    setShowActivityModal(true);
  };

  const handleSaveKH = () => {
    if (!khForm.name || !khForm.phone) { setSaveMsg("Vui lòng nhập tên và SĐT"); return; }
    const newKH = { ...khForm, id: khForm.id || `kh_${Date.now()}`, activities: khForm.activities || [], createdAt: khForm.createdAt || today() };
    const updated = showAddModal
      ? [...customers, newKH]
      : customers.map(k => k.id === newKH.id ? newKH : k);
    save(updated);
    setShowAddModal(false); setShowEditModal(false); setSaveMsg("");
  };

  const handleSaveActivity = () => {
    if (!actForm.result) { setSaveMsg("Vui lòng chọn kết quả"); return; }
    const stageMap = {
      "Đã ký hợp đồng":"signed","Onboard khách hàng":"onboard",
      "Đồng ý dùng thử":"trial","Quan tâm - hẹn lại":"interest",
      "Chăm sóc sau bán":"care","Chăm sóc thúc đẩy":"care","Từ chối":"new",
    };
    const updated = customers.map(k => {
      if (k.id !== selectedKH.id) return k;
      return {
        ...k,
        stage: stageMap[actForm.result] || k.stage,
        nextFollowUp: actForm.nextFollowUp || k.nextFollowUp,
        followUpNote: actForm.followUpNote || k.followUpNote,
        activities: [...(k.activities||[]), { ...actForm }],
      };
    });
    save(updated);
    // Sync CRM stage to Sheet
    const updatedKH = updated.find(k => k.id === selectedKH.id);
    if (updatedKH) syncCRMToSheet(updatedKH).catch(()=>{});
    setShowActivityModal(false); setSaveMsg("");
  };

  const handleDeleteKH = (id) => {
    if (!window.confirm("Xoá khách hàng này?")) return;
    save(customers.filter(k => k.id !== id));
    setShowEditModal(false);
  };

  const allNVKDs = [...new Set(customers.map(k=>k.nvkd).filter(Boolean))];

  // Stats
  const stats = PIPELINE_STAGES.map(s => ({
    ...s, count: filtered.filter(k=>k.stage===s.id).length
  }));

  const RESULT_OPTS = ["Quan tâm - hẹn lại","Đồng ý dùng thử","Đã ký hợp đồng","Onboard khách hàng","Chăm sóc thúc đẩy","Chăm sóc sau bán","Từ chối","Không gặp được"];
  const VISIT_TYPES = ["Giới thiệu sản phẩm","Follow-up","Onboard khách hàng","Ký hợp đồng","Chăm sóc thúc đẩy","Chăm sóc sau bán","Hỗ trợ kỹ thuật"];

  return (
    <div>
      {/* KYC Drawer */}
      {kycKH && (
        <KYCDrawer
          kh={kycKH}
          onSave={saveKYC}
          onClose={()=>setKycKH(null)}
          canEditTier={isBoard||isSaleManager}
          currentUser={currentUser}
        />
      )}

      {/* Important dates reminder banner */}
      {(() => {
        const today = new Date();
        const todayMMDD = `${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
        const upcoming = scopedCustomers.filter(k => {
          const d1 = k.kyc?.anniversaryDate;
          const d2 = k.kyc?.birthdayDate;
          const check = (d) => {
            if (!d) return false;
            const mmdd = d.substring(5);
            const diff = (new Date(new Date().getFullYear()+"-"+mmdd) - today) / 86400000;
            return diff >= 0 && diff <= 7;
          };
          return check(d1) || check(d2);
        });
        if (!upcoming.length) return null;
        return (
          <div style={{marginBottom:16,padding:"10px 14px",background:"#fffbeb",borderRadius:10,border:"1.5px solid #fcd34d",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:18}}>🎂</span>
            <div style={{flex:1}}>
              <span style={{fontWeight:700,fontSize:13,color:"#b45309"}}>Ngày quan trọng sắp tới: </span>
              {upcoming.map((k,i) => (
                <span key={k.id} style={{fontSize:12,color:"#92400e"}}>
                  {i>0&&" · "}<strong>{k.name}</strong>
                  {k.kyc?.anniversaryDate && ` (${k.kyc.anniversaryNote||"Kỷ niệm"}: ${k.kyc.anniversaryDate.substring(5)})`}
                  {k.kyc?.birthdayDate && ` (Sinh nhật ${k.kyc.birthdayName||"BS"}: ${k.kyc.birthdayDate.substring(5)})`}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* CRM Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:4,height:24,borderRadius:2,background:"#7c3aed"}}/>
            <h1 style={{fontSize:21,fontWeight:900,letterSpacing:"-.025em"}}>CRM Khách hàng</h1>
          </div>
          <p style={{color:"#6b7280",fontSize:13,marginLeft:14}}>
            {scopedCustomers.length} KH active · {reminders.length > 0 ? <span style={{color:RED,fontWeight:700}}>⚠ {reminders.length} cần follow-up</span> : "Không có reminder"}
          </p>
        </div>
        <button onClick={openAdd}
          style={{background:BLUE,border:"none",borderRadius:9,color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:13,padding:"10px 18px",cursor:"pointer",boxShadow:"0 4px 12px rgba(26,86,219,.3)"}}>
          + Thêm khách hàng
        </button>
      </div>

      {/* Pipeline summary pills */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {stats.map(s=>(
          <button key={s.id} onClick={()=>setFilterStage(filterStage===s.id?"all":s.id)}
            style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${filterStage===s.id?s.color:"#e5e7eb"}`,background:filterStage===s.id?s.bg:"#fff",color:filterStage===s.id?s.color:"#6b7280",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
            {s.icon} {s.label} <span style={{fontWeight:900,marginLeft:4}}>{s.count}</span>
          </button>
        ))}
      </div>

      {/* Search + filters + view toggle */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="🔍 Tìm tên, SĐT, chuyên khoa..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...FI_STYLE, flex:1, minWidth:180, fontSize:13, padding:"8px 12px"}}/>
        {(isBoard||isSaleManager) && (
          <select value={filterNVKD} onChange={e=>setFilterNVKD(e.target.value)}
            style={{...FI_STYLE,width:"auto",fontSize:12,padding:"8px 11px"}}>
            <option value="all">👤 Tất cả NVKD</option>
            {isBoard && <option value="Invivo Pool Data">🏢 Invivo Pool Data</option>}
            {allNVKDs.filter(n => n !== "Invivo Pool Data").map(n=><option key={n}>{n}</option>)}
          </select>
        )}
        <div style={{display:"flex",gap:4}}>
          {[{id:"list",icon:"☰"},{id:"pipeline",icon:"⬛"},{id:"reminders",icon:"🔔"}].map(v=>(
            <button key={v.id} onClick={()=>setCrmView(v.id)}
              style={{padding:"8px 12px",borderRadius:8,border:"1.5px solid",fontSize:13,cursor:"pointer",fontFamily:"inherit",
                background:crmView===v.id?BLUE:"#fff",borderColor:crmView===v.id?BLUE:"#e5e7eb",color:crmView===v.id?"#fff":"#6b7280"}}>
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {crmView==="list" && (
        <div>
          {filtered.length===0
            ? <div style={{textAlign:"center",padding:"40px 0",color:"#d1d5db",fontSize:14}}>
                Chưa có khách hàng. Bấm "+ Thêm" hoặc nhập activity để auto-import.
              </div>
            : filtered.map(kh=>(
              <KHCard key={kh.id} kh={kh} onEdit={openEdit} onAddActivity={openActivity} onOpenKYC={openKYC}/>
            ))
          }
        </div>
      )}

      {/* ── PIPELINE VIEW ── */}
      {crmView==="pipeline" && (
        <div style={{overflowX:"auto",paddingBottom:8}}>
          <div style={{display:"flex",gap:12,minWidth:900}}>
            {PIPELINE_STAGES.map(stage=>{
              const stageKHs = filtered.filter(k=>k.stage===stage.id);
              return (
                <div key={stage.id} style={{flex:1,minWidth:140}}>
                  <div style={{padding:"8px 12px",borderRadius:"10px 10px 0 0",background:stage.bg,border:`1.5px solid ${stage.color}`,borderBottom:"none",marginBottom:0}}>
                    <div style={{fontSize:12,fontWeight:800,color:stage.color}}>{stage.icon} {stage.label}</div>
                    <div style={{fontSize:20,fontWeight:900,color:stage.color,lineHeight:1.2}}>{stageKHs.length}</div>
                  </div>
                  <div style={{borderLeft:`1.5px solid ${stage.color}`,borderRight:`1.5px solid ${stage.color}`,borderBottom:`1.5px solid ${stage.color}`,borderRadius:"0 0 10px 10px",padding:8,minHeight:120}}>
                    {stageKHs.map(kh=>(
                      <div key={kh.id} onClick={()=>openEdit(kh)}
                        style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 10px",marginBottom:6,cursor:"pointer",fontSize:12}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        <div style={{fontWeight:700,color:"#111827",marginBottom:2}}>{kh.name}</div>
                        <div style={{color:"#6b7280"}}>{kh.specialty||"—"}</div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:3}}>
                          <span style={{color:"#9ca3af",fontSize:11}}>{kh.nvkd}</span>
                          {kh.kyc?.tier && <span style={{fontSize:10,fontWeight:800,color:"#7c3aed",background:"#f5f3ff",padding:"1px 6px",borderRadius:8}}>{kh.kyc.tier}</span>}
                        </div>
                        {kh.nextFollowUp && <ReminderBadge nextFollowUp={kh.nextFollowUp}/>}
                      </div>
                    ))}
                    {stageKHs.length===0 && <div style={{color:"#e5e7eb",fontSize:12,textAlign:"center",padding:"16px 0"}}>Trống</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REMINDERS VIEW ── */}
      {crmView==="reminders" && (
        <div>
          {reminders.length===0
            ? <div style={{textAlign:"center",padding:"40px 0",color:"#d1d5db",fontSize:14}}>Không có reminder nào trong 3 ngày tới 🎉</div>
            : reminders.map(kh=>{
                const overdue = new Date(kh.nextFollowUp) < new Date(today());
                return (
                  <div key={kh.id} style={{background:"#fff",border:`1.5px solid ${overdue?"#fca5a5":"#fde68a"}`,borderRadius:12,padding:"14px 16px",marginBottom:8,borderLeft:`4px solid ${overdue?RED:"#f59e0b"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                          <span style={{fontWeight:700,fontSize:14}}>{kh.name}</span>
                          <StageChip stageId={kh.stage}/>
                          <ReminderBadge nextFollowUp={kh.nextFollowUp}/>
                        </div>
                        <div style={{fontSize:12,color:"#6b7280"}}>
                          📞 {kh.phone} · 🩺 {kh.specialty||"—"} · 👤 {kh.nvkd}
                        </div>
                        {kh.followUpNote && <div style={{fontSize:12,color:"#374151",marginTop:4}}>📝 {kh.followUpNote}</div>}
                        <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>Follow-up: <strong>{kh.nextFollowUp}</strong></div>
                      </div>
                      <button onClick={()=>openActivity(kh)}
                        style={{padding:"6px 14px",background:BLUE,border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                        Ghi nhận
                      </button>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── ADD / EDIT KH MODAL ── */}
      <Modal show={showAddModal||showEditModal} onClose={()=>{setShowAddModal(false);setShowEditModal(false);setSaveMsg("");}} title={showAddModal?"Thêm khách hàng mới":"Chỉnh sửa khách hàng"}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"span 2"}}>
            <label style={LBL_STYLE}>Tên KH / Bác sĩ *</label>
            <input style={FI_STYLE} placeholder="BS. Nguyễn Thị Lan..." value={khForm.name||""} onChange={e=>setKhForm(f=>({...f,name:e.target.value}))}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Số điện thoại *</label>
            <input style={FI_STYLE} placeholder="09xx..." value={khForm.phone||""} onChange={e=>setKhForm(f=>({...f,phone:e.target.value}))}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Chuyên khoa</label>
            <select style={FI_STYLE} value={khForm.specialty||""} onChange={e=>setKhForm(f=>({...f,specialty:e.target.value}))}>
              <option value="">-- Chọn --</option>
              {(SPECIALTIES||[]).map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL_STYLE}>Khu vực</label>
            <select style={FI_STYLE} value={khForm.branch||""} onChange={e=>setKhForm(f=>({...f,branch:e.target.value}))}>
              <option value="">-- Chọn --</option>
              {(BRANCHES||[]).map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL_STYLE}>NVKD phụ trách</label>
            <input style={FI_STYLE} placeholder="Tên NVKD..." value={khForm.nvkd||""} onChange={e=>setKhForm(f=>({...f,nvkd:e.target.value}))}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Giai đoạn pipeline</label>
            <select style={FI_STYLE} value={khForm.stage||"new"} onChange={e=>setKhForm(f=>({...f,stage:e.target.value}))}>
              {PIPELINE_STAGES.map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
            </select>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label style={LBL_STYLE}>Địa chỉ</label>
            <input style={FI_STYLE} placeholder="Số nhà, đường, quận..." value={khForm.address||""} onChange={e=>setKhForm(f=>({...f,address:e.target.value}))}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Follow-up tiếp theo</label>
            <input type="date" style={FI_STYLE} value={khForm.nextFollowUp||""} onChange={e=>setKhForm(f=>({...f,nextFollowUp:e.target.value}))}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Ghi chú follow-up</label>
            <input style={FI_STYLE} placeholder="Nội dung cần làm..." value={khForm.followUpNote||""} onChange={e=>setKhForm(f=>({...f,followUpNote:e.target.value}))}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
          </div>
        </div>
        {saveMsg && <div style={{marginTop:10,fontSize:12,color:RED,fontWeight:600}}>⚠ {saveMsg}</div>}
        <div style={{display:"flex",gap:8,marginTop:18}}>
          {showEditModal && (
            <button onClick={()=>handleDeleteKH(khForm.id)}
              style={{padding:"10px 16px",background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,color:RED,fontFamily:"inherit",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              Xoá
            </button>
          )}
          <button onClick={()=>{setShowAddModal(false);setShowEditModal(false);setSaveMsg("");}}
            style={{flex:1,padding:"11px",background:"#f8fafc",border:"1.5px solid #e5e7eb",borderRadius:9,color:"#6b7280",fontFamily:"inherit",fontWeight:600,fontSize:13,cursor:"pointer"}}>
            Huỷ
          </button>
          <button onClick={handleSaveKH}
            style={{flex:2,padding:"11px",background:BLUE,border:"none",borderRadius:9,color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {showAddModal?"Thêm khách hàng":"Lưu thay đổi"}
          </button>
        </div>
        {/* Activity history */}
        {showEditModal && khForm.activities?.length > 0 && (
          <div style={{marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:14}}>
            <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Lịch sử hoạt động ({khForm.activities.length})</div>
            {[...khForm.activities].reverse().map((a,i)=>(
              <div key={i} style={{padding:"8px 10px",background:"#f8fafc",borderRadius:8,marginBottom:6,fontSize:12}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontWeight:600,color:"#374151"}}>{a.result||"—"}</span>
                  <span style={{color:"#9ca3af"}}>{a.date}</span>
                </div>
                {a.type && <div style={{color:"#6b7280",marginTop:2}}>{a.type}</div>}
                {a.note && <div style={{color:"#9ca3af",marginTop:2}}>"{a.note}"</div>}
                {a.nvkd && <div style={{color:"#9ca3af",fontSize:11,marginTop:2}}>👤 {a.nvkd}</div>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── ADD ACTIVITY MODAL ── */}
      <Modal show={showActivityModal} onClose={()=>{setShowActivityModal(false);setSaveMsg("");}} title={`Ghi nhận hoạt động · ${selectedKH?.name||""}`}>
        <div style={{marginBottom:12,padding:"8px 12px",background:"#f8fafc",borderRadius:8,fontSize:12,color:"#6b7280"}}>
          Giai đoạn hiện tại: <StageChip stageId={selectedKH?.stage||"new"} size="sm"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={LBL_STYLE}>Ngày *</label>
            <input type="date" style={FI_STYLE} value={actForm.date} onChange={e=>setActForm(f=>({...f,date:e.target.value}))}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Loại hoạt động</label>
            <select style={FI_STYLE} value={actForm.type} onChange={e=>setActForm(f=>({...f,type:e.target.value}))}>
              <option value="">-- Chọn --</option>
              {VISIT_TYPES.map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label style={LBL_STYLE}>Kết quả *</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {RESULT_OPTS.map(r=>(
                <button key={r} onClick={()=>setActForm(f=>({...f,result:r}))}
                  style={{padding:"6px 12px",borderRadius:16,border:"1.5px solid",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                    background:actForm.result===r?"#eaf0ff":"#fff",
                    borderColor:actForm.result===r?BLUE:"#e5e7eb",
                    color:actForm.result===r?BLUE:"#6b7280"}}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label style={LBL_STYLE}>Ghi chú</label>
            <textarea style={{...FI_STYLE,resize:"vertical"}} rows={2} placeholder="Phản hồi, cam kết KH..." value={actForm.note} onChange={e=>setActForm(f=>({...f,note:e.target.value}))}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Follow-up tiếp theo</label>
            <input type="date" style={FI_STYLE} value={actForm.nextFollowUp} onChange={e=>setActForm(f=>({...f,nextFollowUp:e.target.value}))}/>
          </div>
          <div>
            <label style={LBL_STYLE}>Ghi chú follow-up</label>
            <input style={FI_STYLE} placeholder="Việc cần làm..." value={actForm.followUpNote} onChange={e=>setActForm(f=>({...f,followUpNote:e.target.value}))}
              onFocus={e=>e.target.style.borderColor=BLUE} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
          </div>
        </div>
        {saveMsg && <div style={{marginTop:8,fontSize:12,color:RED,fontWeight:600}}>⚠ {saveMsg}</div>}
        <div style={{display:"flex",gap:8,marginTop:18}}>
          <button onClick={()=>{setShowActivityModal(false);setSaveMsg("");}}
            style={{flex:1,padding:"11px",background:"#f8fafc",border:"1.5px solid #e5e7eb",borderRadius:9,color:"#6b7280",fontFamily:"inherit",fontWeight:600,fontSize:13,cursor:"pointer"}}>
            Huỷ
          </button>
          <button onClick={handleSaveActivity}
            style={{flex:2,padding:"11px",background:BLUE,border:"none",borderRadius:9,color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            Ghi nhận
          </button>
        </div>
      </Modal>
    </div>
  );
}

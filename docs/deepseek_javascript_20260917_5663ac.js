const DEVICE_ID = new URLSearchParams(location.search).get("id") || "0D344944";
const DATA_URL  = `data/${DEVICE_ID}.json`;
const REFRESH   = 30_000;

const $ = id => document.getElementById(id);
const fmt = (v, d=1) => (v==null||isNaN(v)) ? "—" : Number(v).toFixed(d);

let socChart;

function initChart(){
  const ctx = $("socChart").getContext("2d");
  const grad = ctx.createLinearGradient(0,0,0,220);
  grad.addColorStop(0,"rgba(34,211,238,.55)");
  grad.addColorStop(1,"rgba(34,211,238,0)");
  socChart = new Chart(ctx,{
    type:"line",
    data:{labels:[],datasets:[{
      data:[],borderColor:"#22d3ee",borderWidth:2,
      backgroundColor:grad,fill:true,tension:.35,pointRadius:0
    }]},
    options:{
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.y}%`}}},
      scales:{
        y:{min:0,max:100,grid:{color:"#1e2b48"},ticks:{color:"#8aa0c2",callback:v=>v+"%"}},
        x:{grid:{display:false},ticks:{color:"#8aa0c2",maxTicksLimit:8}}
      },
      maintainAspectRatio:false,responsive:true,animation:{duration:400}
    }
  });
}

function fmtUptime(s){
  s = Math.floor(s||0);
  const d = Math.floor(s/86400), h = Math.floor(s%86400/3600), m = Math.floor(s%3600/60);
  return `${d}n ${h}h ${m}p`;
}

function render(d){
  $("deviceId").textContent = d.device || "—";
  $("pvNow").textContent   = fmt(d.pv,0);
  $("loadNow").textContent = fmt(d.load,0);
  $("gridNow").textContent = fmt(d.grid_w,0);
  $("socNow").textContent  = fmt(d.soc,0);
  $("socFill").style.width = Math.max(0, Math.min(100, d.soc||0)) + "%";
  $("battStatus").textContent = d.batt_status || "—";

  $("pvDay").textContent     = fmt(d.pv_day) + " kWh";
  $("loadDay").textContent   = fmt(d.load_day) + " kWh";
  $("fromGrid").textContent  = fmt(d.from_grid) + " kWh";
  $("toGrid").textContent    = fmt(d.to_grid) + " kWh";
  $("battChg").textContent   = fmt(d.batt_chg_day) + " kWh";
  $("battDis").textContent   = fmt(d.batt_dis_day) + " kWh";

  $("battV").textContent = fmt(d.batt_v) + " V";
  $("battA").textContent = fmt(d.batt_a) + " A";
  $("battT").textContent = fmt(d.batt_t) + " °C";
  $("battSt").textContent = d.batt_status || "—";

  $("gridV").textContent  = fmt(d.grid_v) + " V";
  $("gridHz").textContent = fmt(d.grid_hz,2) + " Hz";
  $("gridW").textContent  = fmt(d.grid_w,0) + " W";

  $("espT").textContent    = fmt(d.esp_temp) + " °C";
  $("espRssi").textContent = fmt(d.rssi,0) + " dBm";
  $("espHeap").textContent = fmt(d.esp_heap,0) + " KB";
  $("espUp").textContent   = fmtUptime(d.uptime);
  $("espSt").textContent   = d.status || "—";

  const t = new Date((d.ts||0)*1000);
  $("lastUpdate").textContent = "Cập nhật " + t.toLocaleTimeString("vi-VN");
  $("footTs").textContent = t.toLocaleString("vi-VN");

  // Kiểm tra online: nếu dữ liệu < 5 phút
  const fresh = (Date.now()/1000 - (d.ts||0)) < 300;
  $("online").classList.toggle("on", fresh);

  // Chart
  const hist = Array.isArray(d.history) ? d.history : [];
  const n = hist.length;
  socChart.data.labels = hist.map((_,i)=>{
    const secAgo = (n - i) * 5 * 60;
    const t = new Date(Date.now() - secAgo*1000);
    return t.getHours().toString().padStart(2,"0") + ":" +
           t.getMinutes().toString().padStart(2,"0");
  });
  socChart.data.datasets[0].data = hist;
  socChart.update("none");

  if (hist.length){
    const min = Math.min(...hist), max = Math.max(...hist);
    $("socRange").textContent = `${min}% – ${max}%`;
  }
}

async function load(){
  try{
    const r = await fetch(DATA_URL + "?t=" + Date.now(), {cache:"no-store"});
    if (!r.ok) throw new Error("HTTP " + r.status);
    render(await r.json());
  }catch(e){
    $("lastUpdate").textContent = "Không tải được dữ liệu";
    $("online").classList.remove("on");
    console.error(e);
  }
}

initChart();
load();
setInterval(load, REFRESH);
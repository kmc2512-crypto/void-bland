const state = {
  mode: 'standard',
  profile: JSON.parse(localStorage.getItem('profile') || 'null'),
  logs: JSON.parse(localStorage.getItem('logs') || '[]'),
  original: null,
  edited: null,
  analysis: null
};

const $ = (s) => document.querySelector(s);
const tabs = document.querySelectorAll('#tabs button');
for (const t of tabs) t.onclick = () => { tabs.forEach(b=>b.classList.remove('active')); t.classList.add('active'); document.querySelectorAll('.tab').forEach(s=>s.classList.remove('active')); $('#'+t.dataset.tab).classList.add('active'); render(); };

$('#standardMode').onclick = () => setMode('standard');
$('#proMode').onclick = () => setMode('pro');
function setMode(mode){ state.mode = mode; $('#standardMode').classList.toggle('active', mode==='standard'); $('#proMode').classList.toggle('active', mode==='pro'); render(); }

if (!state.profile) $('#onboardingDialog').showModal();
$('#onboardingForm').onsubmit = (e)=>{
  e.preventDefault();
  const f = new FormData(e.target);
  state.profile = Object.fromEntries(f.entries());
  localStorage.setItem('profile', JSON.stringify(state.profile));
  $('#onboardingDialog').close();
  render();
};

function loadImage(input, target){
  const file = input.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ()=> { state[target] = reader.result; $('#'+target+'Preview').src = reader.result; drawHistogram(); };
  reader.readAsDataURL(file);
}
$('#originalInput').onchange = (e)=>loadImage(e.target,'original');
$('#editedInput').onchange = (e)=>loadImage(e.target,'edited');

$('#compareSlider').oninput = (e)=> {
  const v = Number(e.target.value);
  $('#originalPreview').style.opacity = (100-v)/100;
  $('#editedPreview').style.opacity = v/100;
};

function getMetrics(src){
  return new Promise(resolve=>{
    const img = new Image(); img.onload = ()=>{
      const c = document.createElement('canvas'); c.width = 300; c.height = Math.max(1, Math.round(img.height * (300/img.width)));
      const x = c.getContext('2d'); x.drawImage(img,0,0,c.width,c.height); const d = x.getImageData(0,0,c.width,c.height).data;
      let sum=0, whites=0, blacks=0, satSum=0;
      for(let i=0;i<d.length;i+=4){
        const r=d[i], g=d[i+1], b=d[i+2]; const l=0.2126*r+0.7152*g+0.0722*b;
        sum+=l; if(l>250) whites++; if(l<5) blacks++;
        const max=Math.max(r,g,b), min=Math.min(r,g,b); satSum += max===0?0:(max-min)/max;
      }
      const px=d.length/4;
      resolve({brightness: sum/px, whiteClip: whites/px, blackClip: blacks/px, sat: satSum/px});
    }; img.src = src;
  });
}

$('#analyzeBtn').onclick = async ()=>{
  if(!state.original || !state.edited) return alert('2枚アップロードしてください');
  const [o,e] = await Promise.all([getMetrics(state.original), getMetrics(state.edited)]);
  const change = Math.abs(e.brightness-o.brightness)/255 + Math.abs(e.sat-o.sat);
  const penalty = (e.whiteClip+e.blackClip)*80;
  const completion = Math.max(45, Math.min(96, Math.round((70 + change*30 - penalty + (state.mode==='pro'?-6:0)))));
  const direction = e.sat>o.sat ? '透明感・彩度強調型' : 'トーン重視・落ち着き型';
  state.analysis = {completion, direction, o,e, generatedAt:new Date().toISOString()};
  persistLog();
  render();
};

function persistLog(){
  const d = new Date().toISOString().slice(0,10);
  const prev = state.logs[state.logs.length-1];
  const streak = prev && new Date(d)-new Date(prev.date)===86400000 ? prev.streak+1 : 1;
  state.logs.push({date:d, completion:state.analysis.completion, genre:state.profile?.genres||'', camera:state.profile?.camera||'', lens:state.profile?.lens||'', software:state.profile?.software||'', summary:state.analysis.direction, improve:'ハイライトと肌色の安定化', streak});
  localStorage.setItem('logs', JSON.stringify(state.logs));
}

function drawHistogram(){
  const c = $('#histogram'), ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle='#171717'; ctx.fillRect(0,0,c.width,c.height);
  if(!state.original && !state.edited) return;
  const draw = (src,color)=> new Promise(res=>{ const img = new Image(); img.onload=()=>{ const t=document.createElement('canvas'); t.width=256;t.height=128; const x=t.getContext('2d'); x.drawImage(img,0,0,256,128); const d=x.getImageData(0,0,256,128).data; const hist = new Array(256).fill(0); for(let i=0;i<d.length;i+=4){ const l=Math.round(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]); hist[l]++; } const m=Math.max(...hist); ctx.strokeStyle=color; ctx.beginPath(); hist.forEach((v,i)=>{ const y=150-(v/m)*140; if(i===0) ctx.moveTo(i*3.5,y); else ctx.lineTo(i*3.5,y);}); ctx.stroke(); res(); }; img.src=src; });
  Promise.all([state.original?draw(state.original,'#6b8dff'):Promise.resolve(), state.edited?draw(state.edited,'#ffb86b'):Promise.resolve()]);
}

function render(){
  $('#analyze').innerHTML = state.analysis ? `
    <div class="card"><h2>編集完成度</h2><p>${state.analysis.completion}%</p></div>
    <div class="card"><h2>編集方向性</h2><p>${state.analysis.direction}</p></div>
    <div class="grid2"><div class="card"><h3>良い点</h3><ul><li>視線誘導を壊さない明るさ調整</li><li>黒レベルの締まりがあり立体感が出ている</li></ul></div>
    <div class="card"><h3>改善ポイント</h3><ul><li>ハイライトの白飛びをやや抑制</li><li>シャドウノイズ低減を追加</li></ul></div></div>` : '<div class="card">Compareタブで2枚アップロード後、AI解析を押してください。</div>';

  $('#advice').innerHTML = state.analysis ? `
    <div class="card"><h2>Lightroom調整提案 (${state.mode==='pro'?'Pro':'Standard'})</h2>
    <h4>基本補正</h4><ul><li>露光量: +0.20</li><li>コントラスト: -8</li><li>ハイライト: -30</li><li>シャドウ: +18</li></ul>
    <h4>HSL</h4><ul><li>黄色彩度: -6</li><li>青輝度: +10</li></ul>
    <h4>撮影時アドバイス</h4><ul><li>半歩左に寄り背景整理</li><li>逆光ピークの1〜2分前を狙う</li></ul>
    <h4>参考写真</h4><p>PinterestやAdobe Stockで「backlit portrait filmic teal」を検索し、光の縁取りと中間調の扱いを比較する。</p></div>` : '<div class="card">解析結果がありません。</div>';

  const avg = state.logs.length ? Math.round(state.logs.reduce((a,b)=>a+b.completion,0)/state.logs.length) : 0;
  const streak = state.logs[state.logs.length-1]?.streak || 0;
  $('#calendar').innerHTML = `<div class="card"><h2>Calendar / 編集ログ</h2><p>今月編集枚数: ${state.logs.length} / 月平均完成度: ${avg}% / Streak: ${streak}日</p></div>` + state.logs.slice().reverse().map(l=>`<div class="card"><b>${l.date}</b> ${l.completion}% - ${l.summary}<br/>改善: ${l.improve}</div>`).join('');

  $('#profile').innerHTML = `<div class="card"><h2>プロフィール</h2>${state.profile ? `<p>カメラ: ${state.profile.camera}</p><p>レンズ: ${state.profile.lens}</p><p>編集ソフト: ${state.profile.software}</p><p>ジャンル: ${state.profile.genres}</p><p>好み: ${state.profile.style}</p><p>困りごと: ${state.profile.pain}</p>` : '未設定'}</div>`;
}
render();

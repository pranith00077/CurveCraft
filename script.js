/* ============================================================
   MATHVIZ — GRAPH EXPLORER  |  script.js
   Real-time: redraws automatically as you type / change any input
   ============================================================ */

"use strict";

const $ = id => document.getElementById(id);

// Mode switching
const modeTabs     = document.querySelectorAll('.mode-tab');
const panel2d      = $('panel2d');
const panel3d      = $('panel3d');

// 2D
const lib2d        = $('curveLibrary2d');
const eqModeRadios = document.querySelectorAll('input[name="eqMode"]');
const normalBox    = $('normalBox');
const paramBox     = $('parametricBox');
const polarBox     = $('polarBox');
const implicitBox  = $('implicitBox');
const eqInput      = $('equationInput');
const xParam       = $('xParam');
const yParam       = $('yParam');
const polarInput   = $('polarInput');
const implicitIn   = $('implicitInput');
const xMin2d       = $('xMin2d');
const xMax2d       = $('xMax2d');
const yMin2d       = $('yMin2d');
const yMax2d       = $('yMax2d');
const lineColor    = $('lineColor2d');
const lineWidth    = $('lineWidth2d');
const lineWidthV   = $('lineWidthVal');
const addCurveBtn  = $('addCurveBtn');
const extraCurves  = $('extraCurves');
const err2d        = $('err2d');

// 3D
const lib3d        = $('curveLibrary3d');
const surfModes    = document.querySelectorAll('input[name="surfMode"]');
const surfaceBox   = $('surfaceBox');
const param3dBox   = $('param3dBox');
const scatter3dB   = $('scatter3dBox');
const surfRangeB   = $('surfRangeBox');
const zEq          = $('zEquation');
const xP3          = $('xParam3d');
const yP3          = $('yParam3d');
const zP3          = $('zParam3d');
const uMin         = $('uMin');
const uMax         = $('uMax');
const vMin         = $('vMin');
const vMax         = $('vMax');
const xS3          = $('xScatter3d');
const yS3          = $('yScatter3d');
const zS3          = $('zScatter3d');
const tMin3d       = $('tMin3d');
const tMax3d       = $('tMax3d');
const xMin3d       = $('xMin3d');
const xMax3d       = $('xMax3d');
const yMin3d       = $('yMin3d');
const yMax3d       = $('yMax3d');
const colorScale   = $('colorScale3d');
const opacity3d    = $('opacity3d');
const opacityVal   = $('opacityVal');
const wireframe    = $('showWireframe');
const contour      = $('showContour');
const resolution   = $('resolution3d');
const resVal       = $('resVal');
const err3d        = $('err3d');

// Shared
const graphCanvas  = $('graphCanvas');
const placeholder  = $('graphPlaceholder');
const graphTitle   = $('graphTitle');
const downloadBtn  = $('downloadBtn');
const resetBtn     = $('resetBtn');
const fullBtn      = $('fullscreenBtn');

// State
let currentMode   = '2d';
let currentLayout = null;
let currentTraces = null;
let timer2d       = null;
let timer3d       = null;

// ── Debounce helper ───────────────────────────────────────────
// text inputs: 400ms delay  |  sliders/color/select: 120ms
function debounce2d(delay = 400) {
  clearTimeout(timer2d);
  timer2d = setTimeout(draw2D, delay);
}
function debounce3d(delay = 400) {
  clearTimeout(timer3d);
  timer3d = setTimeout(draw3D, delay);
}
function trigger() {
  currentMode === '2d' ? debounce2d() : debounce3d();
}

// ── Math.js compile helper ────────────────────────────────────
function compileFn(expr) {
  const node = math.compile(expr);
  return scope => node.evaluate(scope);
}

// ── Linspace ─────────────────────────────────────────────────
function linspace(a, b, n) {
  const arr = [], step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) arr.push(a + i * step);
  return arr;
}

// ── Mode switching ────────────────────────────────────────────
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    modeTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;
    if (currentMode === '2d') {
      panel2d.classList.add('active-panel');
      panel3d.classList.remove('active-panel');
      debounce2d(0);
    } else {
      panel3d.classList.add('active-panel');
      panel2d.classList.remove('active-panel');
      debounce3d(0);
    }
  });
});

// ── 2D equation mode switching ────────────────────────────────
eqModeRadios.forEach(r => {
  r.addEventListener('change', () => {
    const v = r.value;
    normalBox.classList.toggle('hidden', v !== 'normal');
    paramBox.classList.toggle('hidden', v !== 'parametric');
    polarBox.classList.toggle('hidden', v !== 'polar');
    implicitBox.classList.toggle('hidden', v !== 'implicit');
    debounce2d(0);
  });
});

// ── 3D surface mode switching ─────────────────────────────────
surfModes.forEach(r => {
  r.addEventListener('change', () => {
    const v = r.value;
    surfaceBox.classList.toggle('hidden', v !== 'surface');
    param3dBox.classList.toggle('hidden', v !== 'parametric3d');
    scatter3dB.classList.toggle('hidden', v !== 'scatter3d');
    surfRangeB.classList.toggle('hidden', v === 'scatter3d' || v === 'parametric3d');
    debounce3d(0);
  });
});

// ── Range live feedback + auto-redraw ────────────────────────
lineWidth.addEventListener('input', () => { lineWidthV.textContent = lineWidth.value; debounce2d(120); });
opacity3d.addEventListener('input', () => { opacityVal.textContent = opacity3d.value; debounce3d(120); });
resolution.addEventListener('input', () => { resVal.textContent = resolution.value; debounce3d(300); });

// ── Wire all 2D inputs ────────────────────────────────────────
[eqInput, xParam, yParam, polarInput, implicitIn].forEach(el =>
  el.addEventListener('input', () => debounce2d(400))
);
[xMin2d, xMax2d, yMin2d, yMax2d].forEach(el =>
  el.addEventListener('change', () => debounce2d(200))
);
lineColor.addEventListener('input', () => debounce2d(120));

// ── Wire all 3D inputs ────────────────────────────────────────
[zEq, xP3, yP3, zP3, xS3, yS3, zS3].forEach(el =>
  el.addEventListener('input', () => debounce3d(400))
);
[xMin3d, xMax3d, yMin3d, yMax3d, uMin, uMax, vMin, vMax, tMin3d, tMax3d].forEach(el =>
  el.addEventListener('change', () => debounce3d(200))
);
colorScale.addEventListener('change', () => debounce3d(120));
wireframe.addEventListener('change', () => debounce3d(120));
contour.addEventListener('change', () => debounce3d(120));

// ── Multi-curve add/remove ────────────────────────────────────
addCurveBtn.addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'extra-curve-row';
  row.innerHTML = `
    <input type="text" class="styled-input ec-eq" placeholder="e.g. sin(x)" value="">
    <input type="color" class="color-picker ec-color" value="#f59e0b">
    <button class="btn-remove" title="Remove">×</button>
  `;
  row.querySelector('.btn-remove').addEventListener('click', () => { row.remove(); debounce2d(0); });
  row.querySelector('.ec-eq').addEventListener('input', () => debounce2d(400));
  row.querySelector('.ec-color').addEventListener('input', () => debounce2d(120));
  extraCurves.appendChild(row);
});

// ── 2D Library presets ────────────────────────────────────────
const presets2d = {
  line:            { mode: 'normal', eq: 'x' },
  parabola:        { mode: 'normal', eq: 'x^2' },
  invertedParabola:{ mode: 'normal', eq: '-x^2' },
  cubic:           { mode: 'normal', eq: 'x^3 - 4*x' },
  absolute:        { mode: 'normal', eq: 'abs(x)' },
  squareRoot:      { mode: 'normal', eq: 'sqrt(abs(x))' },
  reciprocal:      { mode: 'normal', eq: '1/x' },
  exponential:     { mode: 'normal', eq: 'exp(x)', xMin: -3, xMax: 3, yMin: -1, yMax: 20 },
  logarithm:       { mode: 'normal', eq: 'log(x)', xMin: 0.01, xMax: 10 },
  log10:           { mode: 'normal', eq: 'log10(x)', xMin: 0.01, xMax: 100 },
  logistic:        { mode: 'normal', eq: '1/(1+exp(-x))' },
  sine:            { mode: 'normal', eq: 'sin(x)' },
  cosine:          { mode: 'normal', eq: 'cos(x)' },
  tangent:         { mode: 'normal', eq: 'tan(x)', yMin: -5, yMax: 5 },
  sineSquared:     { mode: 'normal', eq: 'sin(x)^2' },
  dampedSine:      { mode: 'normal', eq: 'exp(-0.2*x)*sin(x)' },
  circle:          { mode: 'parametric', x: '5*cos(t)', y: '5*sin(t)', tMin: 0, tMax: 6.2832 },
  ellipse:         { mode: 'parametric', x: '6*cos(t)', y: '4*sin(t)', tMin: 0, tMax: 6.2832 },
  hyperbola:       { mode: 'parametric', x: '3/cos(t)', y: '2*tan(t)', tMin: -1.4, tMax: 1.4 },
  parabolaHoriz:   { mode: 'parametric', x: 't^2', y: 't', tMin: -4, tMax: 4 },
  spiral:          { mode: 'polar', r: 'theta', thetaMin: 0, thetaMax: 25 },
  heart:           { mode: 'parametric', x: '16*sin(t)^3', y: '13*cos(t)-5*cos(2*t)-2*cos(3*t)-cos(4*t)', tMin: 0, tMax: 6.2832 },
  rose4:           { mode: 'polar', r: 'cos(4*theta)' },
  rose6:           { mode: 'polar', r: 'cos(6*theta)' },
  lissajous:       { mode: 'parametric', x: 'sin(3*t)', y: 'sin(2*t)', tMin: 0, tMax: 6.2832 },
  astroid:         { mode: 'parametric', x: 'cos(t)^3', y: 'sin(t)^3', tMin: 0, tMax: 6.2832 },
  cycloid:         { mode: 'parametric', x: 't - sin(t)', y: '1 - cos(t)', tMin: 0, tMax: 25 },
  epitrochoid:     { mode: 'parametric', x: '(3+1)*cos(t) - 1*cos((3+1)*t)', y: '(3+1)*sin(t) - 1*sin((3+1)*t)', tMin: 0, tMax: 6.2832 },
  hypotrochoid:    { mode: 'parametric', x: '(3-1)*cos(t) + 2*cos((3-1)*t/1)', y: '(3-1)*sin(t) - 2*sin((3-1)*t/1)', tMin: 0, tMax: 6.2832 },
  butterfly:       { mode: 'polar', r: 'exp(sin(theta)) - 2*cos(4*theta)', thetaMin: 0, thetaMax: 12.57 },
  'limaçon':       { mode: 'polar', r: '1 + 2*cos(theta)' },
  cardioid:        { mode: 'polar', r: '1 - cos(theta)' },
  lemniscate:      { mode: 'parametric', x: 'cos(t)/(1+sin(t)^2)', y: 'sin(t)*cos(t)/(1+sin(t)^2)', tMin: 0, tMax: 6.2832 },
  fourier3:        { mode: 'normal', eq: 'sin(x) + sin(3*x)/3 + sin(5*x)/5 + sin(7*x)/7 + sin(9*x)/9' },
};

lib2d.addEventListener('change', () => {
  const key = lib2d.value;
  if (!key || !presets2d[key]) return;
  const p = presets2d[key];
  const modeMap = { normal: 0, parametric: 1, polar: 2, implicit: 3 };
  const idx = modeMap[p.mode] ?? 0;
  eqModeRadios[idx].checked = true;
  eqModeRadios[idx].dispatchEvent(new Event('change'));
  if (p.mode === 'normal') eqInput.value = p.eq;
  else if (p.mode === 'parametric') { xParam.value = p.x; yParam.value = p.y; lib2d._tMin = p.tMin ?? 0; lib2d._tMax = p.tMax ?? 6.2832; }
  else if (p.mode === 'polar')      { polarInput.value = p.r; lib2d._tMin = p.thetaMin ?? 0; lib2d._tMax = p.thetaMax ?? 6.2832; }
  if (p.xMin !== undefined) xMin2d.value = p.xMin;
  if (p.xMax !== undefined) xMax2d.value = p.xMax;
  if (p.yMin !== undefined) yMin2d.value = p.yMin;
  if (p.yMax !== undefined) yMax2d.value = p.yMax;
  debounce2d(0);
});

// ── 3D Library presets ────────────────────────────────────────
const presets3d = {
  paraboloid:  { mode: 'surface', z: 'x^2+y^2' },
  saddlePoint: { mode: 'surface', z: 'x^2-y^2' },
  plane:       { mode: 'surface', z: '0.5*x + 0.3*y - 1' },
  cone:        { mode: 'surface', z: 'sqrt(x^2+y^2)' },
  sinc2d:      { mode: 'surface', z: 'sin(sqrt(x^2+y^2)+0.001)/(sqrt(x^2+y^2)+0.001)', xr: [-10,10], yr: [-10,10] },
  ripple:      { mode: 'surface', z: 'sin(sqrt(x^2+y^2))' },
  sineProduct: { mode: 'surface', z: 'sin(x)*cos(y)' },
  waveMesh:    { mode: 'surface', z: 'sin(x)+cos(y)' },
  doubleSine:  { mode: 'surface', z: 'sin(2*x)*sin(2*y)' },
  gaussian:    { mode: 'surface', z: 'exp(-(x^2+y^2))' },
  bimodal:     { mode: 'surface', z: 'exp(-((x-2)^2+y^2)) + exp(-((x+2)^2+y^2))' },
  peaks:       { mode: 'surface', z: '3*(1-x)^2*exp(-x^2-(y+1)^2) - 10*(x/5-x^3-y^5)*exp(-x^2-y^2) - exp(-(x+1)^2-y^2)/3' },
  saddle2:     { mode: 'surface', z: 'x^3 - 3*x*y^2' },
  torus:       { mode: 'parametric3d', x: '(2+cos(v))*cos(u)', y: '(2+cos(v))*sin(u)', z: 'sin(v)', uMin: 0, uMax: 6.2832, vMin: 0, vMax: 6.2832 },
  sphere:      { mode: 'parametric3d', x: '3*sin(v)*cos(u)', y: '3*sin(v)*sin(u)', z: '3*cos(v)', uMin: 0, uMax: 6.2832, vMin: 0, vMax: 3.1416 },
  mobius:      { mode: 'parametric3d', x: '(1+v/2*cos(u/2))*cos(u)', y: '(1+v/2*cos(u/2))*sin(u)', z: 'v/2*sin(u/2)', uMin: 0, uMax: 6.2832, vMin: -1, vMax: 1 },
  trefoilKnot: { mode: 'parametric3d', x: 'sin(u) + 2*sin(2*u)', y: 'cos(u) - 2*cos(2*u)', z: '-sin(3*u)', uMin: 0, uMax: 6.2832, vMin: 0, vMax: 0.4, asLine: true },
  kleinBottle: { mode: 'parametric3d', x: '(2+cos(v/2)*sin(u)-sin(v/2)*sin(2*u))*cos(v)', y: '(2+cos(v/2)*sin(u)-sin(v/2)*sin(2*u))*sin(v)', z: 'sin(v/2)*sin(u)+cos(v/2)*sin(2*u)', uMin: 0, uMax: 6.2832, vMin: 0, vMax: 6.2832 },
  seashell:    { mode: 'parametric3d', x: 'exp(u/(6*pi))*cos(u)*(1+cos(v))', y: 'exp(u/(6*pi))*sin(u)*(1+cos(v))', z: 'exp(u/(6*pi))*sin(v) - 1.5*exp(u/(6*pi))', uMin: 0, uMax: 12.57, vMin: 0, vMax: 6.2832 },
};

lib3d.addEventListener('change', () => {
  const key = lib3d.value;
  if (!key || !presets3d[key]) return;
  const p = presets3d[key];
  const modeEl = [...surfModes].find(r => r.value === p.mode);
  if (modeEl) { modeEl.checked = true; modeEl.dispatchEvent(new Event('change')); }
  if (p.mode === 'surface') {
    zEq.value = p.z;
    if (p.xr) { xMin3d.value = p.xr[0]; xMax3d.value = p.xr[1]; }
    if (p.yr) { yMin3d.value = p.yr[0]; yMax3d.value = p.yr[1]; }
  } else if (p.mode === 'parametric3d') {
    xP3.value = p.x; yP3.value = p.y; zP3.value = p.z;
    if (p.uMin !== undefined) uMin.value = p.uMin;
    if (p.uMax !== undefined) uMax.value = p.uMax;
    if (p.vMin !== undefined) vMin.value = p.vMin;
    if (p.vMax !== undefined) vMax.value = p.vMax;
    lib3d._asLine = !!p.asLine;
  }
  debounce3d(0);
});

// ── 2D Quick chips ────────────────────────────────────────────
document.querySelectorAll('.chip:not(.chip-3d)').forEach(chip => {
  chip.addEventListener('click', () => {
    eqModeRadios[0].checked = true;
    eqModeRadios[0].dispatchEvent(new Event('change'));
    eqInput.value = chip.dataset.eq;
    debounce2d(0);
  });
});

document.querySelectorAll('.chip-3d').forEach(chip => {
  chip.addEventListener('click', () => {
    surfModes[0].checked = true;
    surfModes[0].dispatchEvent(new Event('change'));
    zEq.value = chip.dataset.eq;
    debounce3d(0);
  });
});

// ── Plotly layouts ────────────────────────────────────────────
const darkLayout = (title, extra = {}) => ({
  paper_bgcolor: '#1c1f2e',
  plot_bgcolor:  '#1c1f2e',
  font: { color: '#9da2be', family: 'Space Mono, monospace', size: 11 },
  title: { text: title, font: { color: '#00e5c4', size: 14, family: 'Syne, sans-serif', weight: 700 }, x: 0.02, xanchor: 'left' },
  margin: { l: 50, r: 30, t: 50, b: 50 },
  xaxis: { gridcolor: '#2d3148', zerolinecolor: '#4f5478', zerolinewidth: 1.5, linecolor: '#3e4262', tickcolor: '#3e4262', color: '#6b709a', ...extra.xaxis },
  yaxis: { gridcolor: '#2d3148', zerolinecolor: '#4f5478', zerolinewidth: 1.5, linecolor: '#3e4262', tickcolor: '#3e4262', color: '#6b709a', scaleanchor: extra.equalAxes ? 'x' : undefined, scaleratio: extra.equalAxes ? 1 : undefined, ...extra.yaxis },
  showlegend: extra.showlegend ?? false,
  legend: { bgcolor: '#272a3e', bordercolor: '#3e4262', borderwidth: 1 },
  hovermode: 'x unified',
  ...extra,
});

const dark3DLayout = title => ({
  paper_bgcolor: '#1c1f2e',
  font: { color: '#9da2be', family: 'Space Mono, monospace', size: 11 },
  title: { text: title, font: { color: '#ff8080', size: 14, family: 'Syne, sans-serif', weight: 700 }, x: 0.02, xanchor: 'left' },
  margin: { l: 10, r: 10, t: 60, b: 10 },
  scene: {
    bgcolor: '#1c1f2e',
    xaxis: { gridcolor: '#2d3148', zerolinecolor: '#4f5478', showbackground: true, backgroundcolor: '#232638' },
    yaxis: { gridcolor: '#2d3148', zerolinecolor: '#4f5478', showbackground: true, backgroundcolor: '#232638' },
    zaxis: { gridcolor: '#2d3148', zerolinecolor: '#4f5478', showbackground: true, backgroundcolor: '#232638' },
    camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
  },
  showlegend: false,
});

const plotConfig = {
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToRemove: ['sendDataToCloud'],
  displaylogo: false,
  toImageButtonOptions: { format: 'png', filename: 'mathviz_graph', scale: 2 },
};

// ── Clear graph helper ────────────────────────────────────────
function clearGraph() {
  placeholder.classList.remove('hidden');
  Plotly.purge(graphCanvas);
  graphTitle.textContent = '—';
  currentTraces = null;
  currentLayout = null;
}

// ── 2D Draw ───────────────────────────────────────────────────
function draw2D() {
  err2d.textContent = '';
  try {
    const mode  = [...eqModeRadios].find(r => r.checked)?.value ?? 'normal';
    const N     = 800;
    const color = lineColor.value;
    const width = Number(lineWidth.value);
    let traces  = [];
    let title   = '';
    let layoutExtra = {};

    if (mode === 'normal') {
      const expr = eqInput.value.trim();
      if (!expr) { clearGraph(); return; }
      title = `y = ${expr}`;
      const fn = compileFn(expr);
      const xs = linspace(+xMin2d.value, +xMax2d.value, N);
      const ys = xs.map(x => { try { return fn({ x, pi: Math.PI, e: Math.E }); } catch { return NaN; } });
      traces.push({ x: xs, y: ys, type: 'scatter', mode: 'lines', name: `y=${expr}`, line: { color, width } });
      document.querySelectorAll('.ec-eq').forEach(inp => {
        const ex = inp.value.trim();
        if (!ex) return;
        const ec = inp.closest('.extra-curve-row')?.querySelector('.ec-color')?.value ?? '#f59e0b';
        try {
          const fn2 = compileFn(ex);
          const ys2 = xs.map(x => { try { return fn2({ x, pi: Math.PI, e: Math.E }); } catch { return NaN; } });
          traces.push({ x: xs, y: ys2, type: 'scatter', mode: 'lines', name: `y=${ex}`, line: { color: ec, width } });
        } catch(e) {}
      });
      layoutExtra = { showlegend: traces.length > 1 };

    } else if (mode === 'parametric') {
      const xExpr = xParam.value.trim(), yExpr = yParam.value.trim();
      if (!xExpr || !yExpr) { clearGraph(); return; }
      title = `x(t)=${xExpr}, y(t)=${yExpr}`;
      const tMin = lib2d._tMin ?? 0, tMax = lib2d._tMax ?? 6.2832;
      const ts = linspace(tMin, tMax, N);
      const xFn = compileFn(xExpr), yFn = compileFn(yExpr);
      const xs = ts.map(t => { try { return xFn({ t, pi: Math.PI, e: Math.E }); } catch { return NaN; } });
      const ys = ts.map(t => { try { return yFn({ t, pi: Math.PI, e: Math.E }); } catch { return NaN; } });
      traces.push({ x: xs, y: ys, type: 'scatter', mode: 'lines', name: 'Parametric', line: { color, width } });
      layoutExtra = { equalAxes: true };

    } else if (mode === 'polar') {
      const rExpr = polarInput.value.trim();
      if (!rExpr) { clearGraph(); return; }
      title = `r(θ) = ${rExpr}`;
      const tMin = lib2d._tMin ?? 0, tMax = lib2d._tMax ?? 6.2832;
      const ts = linspace(tMin, tMax, N);
      const rFn = compileFn(rExpr);
      const xs = [], ys = [];
      ts.forEach(theta => {
        try { const r = rFn({ theta, t: theta, pi: Math.PI, e: Math.E }); xs.push(r * Math.cos(theta)); ys.push(r * Math.sin(theta)); }
        catch { xs.push(NaN); ys.push(NaN); }
      });
      traces.push({ x: xs, y: ys, type: 'scatter', mode: 'lines', name: `r=${rExpr}`, line: { color, width } });
      layoutExtra = { equalAxes: true };

    } else if (mode === 'implicit') {
      const fExpr = implicitIn.value.trim();
      if (!fExpr) { clearGraph(); return; }
      title = `Implicit: ${fExpr} = 0`;
      traces = drawImplicit(fExpr, +xMin2d.value, +xMax2d.value, +yMin2d.value, +yMax2d.value, color, width);
    }

    const layout = darkLayout(title, {
      xaxis: { range: [+xMin2d.value, +xMax2d.value] },
      yaxis: { range: [+yMin2d.value, +yMax2d.value] },
      ...layoutExtra,
    });

    placeholder.classList.add('hidden');
    Plotly.react(graphCanvas, traces, layout, plotConfig);
    graphTitle.textContent = title;
    currentTraces = traces;
    currentLayout = layout;

  } catch(e) {
    err2d.textContent = '⚠ ' + e.message;
  }
}

// Marching-squares implicit plotter
function drawImplicit(expr, x0, x1, y0, y1, color, lw) {
  const N = 120;
  const fn = compileFn(expr);
  const xs = linspace(x0, x1, N), ys = linspace(y0, y1, N);
  const grid = ys.map(y => xs.map(x => { try { return fn({ x, y, pi: Math.PI, e: Math.E }); } catch { return NaN; } }));
  const segXs = [], segYs = [];
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      const f00=grid[j][i], f10=grid[j][i+1], f01=grid[j+1][i], f11=grid[j+1][i+1];
      if ([f00,f10,f01,f11].some(v => isNaN(v))) continue;
      const pts = [];
      const interp = (fa,fb,a,b) => a+(b-a)*fa/(fa-fb);
      if (f00*f10<0) pts.push([interp(f00,f10,xs[i],xs[i+1]),ys[j]]);
      if (f10*f11<0) pts.push([xs[i+1],interp(f10,f11,ys[j],ys[j+1])]);
      if (f01*f11<0) pts.push([interp(f01,f11,xs[i],xs[i+1]),ys[j+1]]);
      if (f00*f01<0) pts.push([xs[i],interp(f00,f01,ys[j],ys[j+1])]);
      if (pts.length>=2) { segXs.push(pts[0][0],pts[1][0],null); segYs.push(pts[0][1],pts[1][1],null); }
    }
  }
  return [{ x: segXs, y: segYs, type: 'scatter', mode: 'lines', name: expr, line: { color, width: lw }, connectgaps: false }];
}

// ── 3D Draw ───────────────────────────────────────────────────
function draw3D() {
  err3d.textContent = '';
  try {
    const mode  = [...surfModes].find(r => r.checked)?.value ?? 'surface';
    const cs    = colorScale.value;
    const op    = parseFloat(opacity3d.value);
    const steps = parseInt(resolution.value);
    let traces  = [];
    let title   = '';

    if (mode === 'surface') {
      const expr = zEq.value.trim();
      if (!expr) { clearGraph(); return; }
      title = `z = ${expr}`;
      const fn = compileFn(expr);
      const xs = linspace(+xMin3d.value, +xMax3d.value, steps);
      const ys = linspace(+yMin3d.value, +yMax3d.value, steps);
      const zGrid = ys.map(y => xs.map(x => { try { return fn({ x, y, pi: Math.PI, e: Math.E }); } catch { return NaN; } }));
      const surf = {
        type: 'surface', x: xs, y: ys, z: zGrid, colorscale: cs, opacity: op,
        contours: contour.checked ? { z: { show: true, usecolormap: true, highlightcolor: '#00f5d4', project: { z: true } } } : undefined,
        showscale: true,
        colorbar: { tickfont: { color: '#8b90aa', size: 10 }, x: 1.01 },
      };
      traces.push(surf);
      if (wireframe.checked) {
        traces.push({
          type: 'surface', x: xs, y: ys, z: zGrid,
          surfacecolor: zGrid.map(row => row.map(() => 0)),
          colorscale: [[0,'rgba(200,200,200,0.18)'],[1,'rgba(200,200,200,0.18)']],
          opacity: 0.18, showscale: false,
          contours: { x: { show: true, color: '#3a3e58', width: 1, highlight: false }, y: { show: true, color: '#3a3e58', width: 1, highlight: false } },
        });
      }

    } else if (mode === 'parametric3d') {
      const xExpr=xP3.value.trim(), yExpr=yP3.value.trim(), zExpr=zP3.value.trim();
      if (!xExpr||!yExpr||!zExpr) { clearGraph(); return; }
      title = 'Parametric 3D Surface';
      const xFn=compileFn(xExpr), yFn=compileFn(yExpr), zFn=compileFn(zExpr);
      const us=linspace(+uMin.value,+uMax.value,steps), vs=linspace(+vMin.value,+vMax.value,steps);
      const isLine = lib3d._asLine;
      if (isLine) {
        const ts=linspace(+uMin.value,+uMax.value,600);
        const px=[],py=[],pz=[];
        ts.forEach(u => {
          try { px.push(xFn({u,t:u,v:0,pi:Math.PI,e:Math.E})); } catch { px.push(NaN); }
          try { py.push(yFn({u,t:u,v:0,pi:Math.PI,e:Math.E})); } catch { py.push(NaN); }
          try { pz.push(zFn({u,t:u,v:0,pi:Math.PI,e:Math.E})); } catch { pz.push(NaN); }
        });
        traces.push({ type:'scatter3d', mode:'lines', x:px, y:py, z:pz, line:{width:4,colorscale:cs,color:pz,showscale:false} });
      } else {
        const xGrid=vs.map(v=>us.map(u=>{try{return xFn({u,v,pi:Math.PI,e:Math.E});}catch{return NaN;}}));
        const yGrid=vs.map(v=>us.map(u=>{try{return yFn({u,v,pi:Math.PI,e:Math.E});}catch{return NaN;}}));
        const zGrid=vs.map(v=>us.map(u=>{try{return zFn({u,v,pi:Math.PI,e:Math.E});}catch{return NaN;}}));
        traces.push({ type:'surface', x:xGrid, y:yGrid, z:zGrid, colorscale:cs, opacity:op, showscale:false });
      }

    } else if (mode === 'scatter3d') {
      const xExpr=xS3.value.trim(), yExpr=yS3.value.trim(), zExpr=zS3.value.trim();
      if (!xExpr||!yExpr||!zExpr) { clearGraph(); return; }
      title = '3D Curve';
      const ts=linspace(+tMin3d.value,+tMax3d.value,1200);
      const xFn=compileFn(xExpr), yFn=compileFn(yExpr), zFn=compileFn(zExpr);
      const px=[],py=[],pz=[];
      ts.forEach(t=>{
        try{px.push(xFn({t,pi:Math.PI,e:Math.E}));}catch{px.push(NaN);}
        try{py.push(yFn({t,pi:Math.PI,e:Math.E}));}catch{py.push(NaN);}
        try{pz.push(zFn({t,pi:Math.PI,e:Math.E}));}catch{pz.push(NaN);}
      });
      traces.push({ type:'scatter3d', mode:'lines', x:px, y:py, z:pz, line:{width:3,colorscale:cs,color:pz,showscale:false} });
    }

    const layout = dark3DLayout(title);
    placeholder.classList.add('hidden');
    Plotly.react(graphCanvas, traces, layout, { ...plotConfig, scrollZoom: true });
    graphTitle.textContent = title;
    currentTraces = traces;
    currentLayout = layout;
    lib3d._asLine = false;

  } catch(e) {
    err3d.textContent = '⚠ ' + e.message;
  }
}

// ── Toolbar ───────────────────────────────────────────────────
downloadBtn.addEventListener('click', () => {
  Plotly.downloadImage(graphCanvas, { format: 'png', filename: 'mathviz', width: 1600, height: 900, scale: 2 });
});
resetBtn.addEventListener('click', () => {
  clearGraph();
  // also clear all text inputs
  eqInput.value = '';
  xParam.value = ''; yParam.value = '';
  polarInput.value = '';
  implicitIn.value = '';
  zEq.value = '';
  xP3.value = ''; yP3.value = ''; zP3.value = '';
  xS3.value = ''; yS3.value = ''; zS3.value = '';
  document.querySelectorAll('.extra-curve-row').forEach(r => r.remove());
  lib2d.value = '';
  lib3d.value = '';
});
fullBtn.addEventListener('click', () => {
  const el = document.querySelector('.graph-area');
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Resize observer
const ro = new ResizeObserver(() => { if (graphCanvas.data) Plotly.Plots.resize(graphCanvas); });
ro.observe(graphCanvas);

// ── Initial draw on load ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => draw2D());
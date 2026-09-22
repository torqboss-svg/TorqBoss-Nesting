import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as RotateCcw, c as Lock, i as Scan, l as Download, o as Plus, r as Trash2, s as Minus, t as X } from "../_libs/lucide-react.mjs";
import { i as APP_PRODUCT, n as APP_BRAND, r as APP_NAME } from "./router-BWnLv_EI.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-N-WQkRsR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-10 w-full rounded-md bg-raised px-3 font-mono text-sm tabular-nums text-fg", "shadow-[var(--shadow-border)] placeholder:text-faint", "transition-[box-shadow] duration-150 ease-out", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", "disabled:opacity-40", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("block h-4 min-w-0 truncate whitespace-nowrap text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-muted", className),
		...props
	});
}
/** Tolerância linear, mm. */
var EPS = 1e-6;
/** Área mínima aceita para um triângulo não degenerado, mm². */
var MIN_AREA = .01;
function point(x, y) {
	return {
		x,
		y
	};
}
function add(a, b) {
	return {
		x: a.x + b.x,
		y: a.y + b.y
	};
}
function sub(a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y
	};
}
function scale(p, s) {
	return {
		x: p.x * s,
		y: p.y * s
	};
}
function dot(a, b) {
	return a.x * b.x + a.y * b.y;
}
function hypot(p) {
	return Math.hypot(p.x, p.y);
}
function cross(a, b) {
	return a.x * b.y - a.y * b.x;
}
function degToRad(deg) {
	return deg * Math.PI / 180;
}
/** Matriz de rotação 2D anti-horária. */
function rotationMatrix(deg) {
	const r = degToRad(deg);
	return {
		c: Math.cos(r),
		s: Math.sin(r)
	};
}
/** Rotaciona `p` em torno de `pivot` (padrão: origem). */
function rotate(p, deg, pivot = {
	x: 0,
	y: 0
}) {
	const { c, s } = rotationMatrix(deg);
	const q = sub(p, pivot);
	return add({
		x: q.x * c - q.y * s,
		y: q.x * s + q.y * c
	}, pivot);
}
/** p' = R(θ) p + t */
function applyPose(p, pose) {
	return add(rotate(p, pose.rotationDeg), {
		x: pose.x,
		y: pose.y
	});
}
function applyPoseAll(verts, pose) {
	return verts.map((v) => applyPose(v, pose));
}
/**
* Área com sinal (shoelace). Positiva = CCW, negativa = CW.
*/
function signedArea(verts) {
	let a = 0;
	const n = verts.length;
	for (let i = 0; i < n; i++) {
		const p = verts[i];
		const q = verts[(i + 1) % n];
		a += p.x * q.y - q.x * p.y;
	}
	return a / 2;
}
function area(verts) {
	return Math.abs(signedArea(verts));
}
function isDegenerate(verts) {
	return area(verts) < MIN_AREA;
}
/** Número de vértices reflexos (ângulo interno > 180°) em polígono CCW. */
function reflexVertexCount(poly) {
	const n = poly.length;
	if (n < 3) return 0;
	let reflex = 0;
	for (let i = 0; i < n; i++) {
		const a = poly[(i - 1 + n) % n];
		const b = poly[i];
		const c = poly[(i + 1) % n];
		if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) < -1e-6) reflex++;
	}
	return reflex;
}
/** Chevron / seta: um único recorte. Tesela por translação (mesma orientação), não pelo par 180°. */
function isChevronLike(poly) {
	return poly.length >= 5 && poly.length <= 8 && reflexVertexCount(poly) === 1;
}
/**
* Asa-delta / triângulo de lados suaves: convexo, um único ápice, área
* próxima do triângulo dos três extremos. Tesela no par 180° ▽△.
*/
function isDeltaLike(poly) {
	if (poly.length < 5 || poly.length > 16) return false;
	if (reflexVertexCount(poly) !== 0) return false;
	const box = aabbOf(poly);
	const h = box.maxY - box.minY;
	const w = box.maxX - box.minX;
	if (h < 1 || w < 1) return false;
	const band = Math.max(h, 1) * .08;
	let nMax = 0;
	let nMin = 0;
	let apexMax = null;
	let apexMin = null;
	for (const p of poly) {
		if (Math.abs(p.y - box.maxY) <= band) {
			nMax++;
			apexMax = p;
		}
		if (Math.abs(p.y - box.minY) <= band) {
			nMin++;
			apexMin = p;
		}
	}
	const up = nMax === 1 && apexMax;
	if (!!up === !!(nMin === 1 && apexMin)) return false;
	const T = up ? [
		{
			x: box.minX,
			y: box.minY
		},
		{
			x: box.maxX,
			y: box.minY
		},
		{
			x: apexMax.x,
			y: apexMax.y
		}
	] : [
		{
			x: box.minX,
			y: box.maxY
		},
		{
			x: box.maxX,
			y: box.maxY
		},
		{
			x: apexMin.x,
			y: apexMin.y
		}
	];
	const tA = Math.abs(signedArea(T));
	const pA = Math.abs(signedArea(poly));
	if (tA < .01) return false;
	const ratio = pA / tA;
	return ratio >= .92 && ratio <= 1.28;
}
function aabbOf(verts) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const p of verts) {
		if (p.x < minX) minX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.x > maxX) maxX = p.x;
		if (p.y > maxY) maxY = p.y;
	}
	if (!Number.isFinite(minX)) return {
		minX: 0,
		minY: 0,
		maxX: 0,
		maxY: 0
	};
	return {
		minX,
		minY,
		maxX,
		maxY
	};
}
function aabbWidth(b) {
	return b.maxX - b.minX;
}
function aabbHeight(b) {
	return b.maxY - b.minY;
}
/** Distância entre caixas (0 se se tocam ou sobrepõem). Limite inferior da distância dos polígonos. */
function aabbSeparation(a, b) {
	const dx = a.minX > b.maxX ? a.minX - b.maxX : b.minX > a.maxX ? b.minX - a.maxX : 0;
	const dy = a.minY > b.maxY ? a.minY - b.maxY : b.minY > a.maxY ? b.minY - a.maxY : 0;
	if (dx === 0) return dy;
	if (dy === 0) return dx;
	return Math.hypot(dx, dy);
}
/**
* Centróide de um polígono. Para triângulo coincide com a média dos vértices,
* mas usamos a fórmula geral (já precisamos dela no Passo 3).
*/
function centroid(verts) {
	const a = signedArea(verts);
	if (Math.abs(a) < 1e-6) {
		const n = verts.length || 1;
		let x = 0;
		let y = 0;
		for (const p of verts) {
			x += p.x;
			y += p.y;
		}
		return {
			x: x / n,
			y: y / n
		};
	}
	let cx = 0;
	let cy = 0;
	const n = verts.length;
	for (let i = 0; i < n; i++) {
		const p = verts[i];
		const q = verts[(i + 1) % n];
		const cross = p.x * q.y - q.x * p.y;
		cx += (p.x + q.x) * cross;
		cy += (p.y + q.y) * cross;
	}
	return {
		x: cx / (6 * a),
		y: cy / (6 * a)
	};
}
/** Polígono CCW com AABB no canto inferior esquerdo. */
function convexHull(points) {
	const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
	if (pts.length <= 1) return pts.map((p) => ({
		x: p.x,
		y: p.y
	}));
	const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	const lower = [];
	for (const p of pts) {
		while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
		lower.push(p);
	}
	const upper = [];
	for (let i = pts.length - 1; i >= 0; i--) {
		const p = pts[i];
		while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
		upper.push(p);
	}
	lower.pop();
	upper.pop();
	return [...lower, ...upper];
}
/** Polígono CCW com AABB no canto inferior esquerdo. */
function canonicalize(verts) {
	if (verts.length === 0) return [];
	const copy = verts.map((p) => ({
		x: p.x,
		y: p.y
	}));
	if (copy.length >= 3 && signedArea(copy) < 0) copy.reverse();
	const box = aabbOf(copy);
	return copy.map((p) => ({
		x: p.x - box.minX,
		y: p.y - box.minY
	}));
}
/**
* Frame local canônico: CCW e translação para que o canto inferior esquerdo
* da AABB fique em (0, 0). A origem local é esse canto — no Passo 3 o
* Bottom-Left posiciona exatamente essa origem.
*/
function canonicalizeTriangle(tri) {
	const p = canonicalize(tri);
	return [
		p[0] ?? {
			x: 0,
			y: 0
		},
		p[1] ?? {
			x: 0,
			y: 0
		},
		p[2] ?? {
			x: 0,
			y: 0
		}
	];
}
function pointInAabb(p, box, eps = EPS) {
	return p.x >= box.minX - eps && p.x <= box.maxX + eps && p.y >= box.minY - eps && p.y <= box.maxY + eps;
}
function isInsideCircle(verts, cx, cy, r, eps = EPS) {
	const lim = r + eps;
	const lim2 = lim * lim;
	return verts.every((p) => {
		const dx = p.x - cx;
		const dy = p.y - cy;
		return dx * dx + dy * dy <= lim2;
	});
}
/** Recuo interno da chapa. Se o recuo esgota a área, max < min. */
function insetAabb(sheet, inset) {
	const m = Math.max(0, inset);
	return {
		minX: m,
		minY: m,
		maxX: sheet.width - m,
		maxY: sheet.length - m
	};
}
function aabbUsable(box, eps = EPS) {
	return box.maxX - box.minX > eps && box.maxY - box.minY > eps;
}
function isInsideAabb(verts, box, eps = EPS) {
	return verts.every((p) => pointInAabb(p, box, eps));
}
/** Incentro e inraio. r = A / s. */
function incenter(tri) {
	const [A, B, C] = tri;
	const a = hypot(sub(B, C));
	const b = hypot(sub(A, C));
	const c = hypot(sub(A, B));
	const peri = a + b + c;
	if (peri < 1e-6) return {
		center: centroid(tri),
		radius: 0
	};
	return {
		center: {
			x: (a * A.x + b * B.x + c * C.x) / peri,
			y: (a * A.y + b * B.y + c * C.y) / peri
		},
		radius: 2 * area(tri) / peri
	};
}
/**
* Offset paralelo: o triângulo permanece semelhante, centrado no incentro.
* d > 0 expande (slot da folga laser); d < 0 contrai.
*/
function inflateTriangle(tri, distance) {
	if (Math.abs(distance) <= 1e-6) return [
		tri[0],
		tri[1],
		tri[2]
	];
	const { center, radius } = incenter(tri);
	if (radius <= 1e-6) return [
		tri[0],
		tri[1],
		tri[2]
	];
	const nextR = radius + distance;
	if (nextR <= 1e-6) return [
		tri[0],
		tri[1],
		tri[2]
	];
	const s = nextR / radius;
	return tri.map((v) => ({
		x: center.x + s * (v.x - center.x),
		y: center.y + s * (v.y - center.y)
	}));
}
/**
* Offset paralelo de polígono convexo CCW. d > 0 expande, d < 0 contrai.
* Cada aresta corre na normal exterior — a folga laser fica constante.
*/
function offsetConvex(poly, distance) {
	const n = poly.length;
	if (n < 3 || Math.abs(distance) <= 1e-6) return poly.map((p) => ({
		x: p.x,
		y: p.y
	}));
	const normals = [];
	for (let i = 0; i < n; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % n];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len = Math.hypot(dx, dy) || 1;
		normals.push({
			x: dy / len,
			y: -dx / len
		});
	}
	const out = [];
	for (let i = 0; i < n; i++) {
		const n0 = normals[(i - 1 + n) % n];
		const n1 = normals[i];
		const P = poly[i];
		const det = n0.x * n1.y - n0.y * n1.x;
		const r0 = n0.x * P.x + n0.y * P.y + distance;
		const r1 = n1.x * P.x + n1.y * P.y + distance;
		if (Math.abs(det) < 1e-12) out.push({
			x: P.x + n0.x * distance,
			y: P.y + n0.y * distance
		});
		else out.push({
			x: (r0 * n1.y - n0.y * r1) / det,
			y: (n0.x * r1 - r0 * n1.x) / det
		});
	}
	return out;
}
function distPointToSegment(p, a, b) {
	const ab = sub(b, a);
	const len2 = dot(ab, ab);
	if (len2 < 1e-12) return hypot(sub(p, a));
	return hypot(sub(p, add(a, scale(ab, Math.min(1, Math.max(0, dot(sub(p, a), ab) / len2))))));
}
/** Distância mínima entre polígonos (0 se os interiores se sobrepõem). */
function minPolygonDistance(a, b) {
	if (interiorsOverlap(a, b, 1e-7)) return 0;
	let min = Infinity;
	const na = a.length;
	const nb = b.length;
	for (let i = 0; i < na; i++) {
		const p = a[i];
		for (let j = 0; j < nb; j++) min = Math.min(min, distPointToSegment(p, b[j], b[(j + 1) % nb]));
	}
	for (let j = 0; j < nb; j++) {
		const p = b[j];
		for (let i = 0; i < na; i++) min = Math.min(min, distPointToSegment(p, a[i], a[(i + 1) % na]));
	}
	return min;
}
function edgeAxes(verts) {
	const axes = [];
	const n = verts.length;
	for (let i = 0; i < n; i++) {
		const e = sub(verts[(i + 1) % n], verts[i]);
		axes.push({
			x: -e.y,
			y: e.x
		});
	}
	return axes;
}
function projectOn(verts, axis) {
	const len = hypot(axis) || 1;
	const ax = axis.x / len;
	const ay = axis.y / len;
	let min = Infinity;
	let max = -Infinity;
	for (const p of verts) {
		const d = p.x * ax + p.y * ay;
		if (d < min) min = d;
		if (d > max) max = d;
	}
	return {
		min,
		max
	};
}
/**
* Ponto estritamente no interior (não na fronteira).
*/
function pointInPolygonInterior(p, poly, eps = 1e-7) {
	const n = poly.length;
	if (n < 3) return false;
	for (let i = 0; i < n; i++) if (distPointToSegment(p, poly[i], poly[(i + 1) % n]) <= eps) return false;
	let inside = false;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const a = poly[i];
		const b = poly[j];
		const dy = b.y - a.y;
		if (Math.abs(dy) <= eps) continue;
		if (a.y > p.y === b.y > p.y) continue;
		const x = a.x + (b.x - a.x) * (p.y - a.y) / dy;
		if (p.x < x - eps) inside = !inside;
	}
	return inside;
}
function properSegmentIntersect(a, b, c, d, eps = 1e-8) {
	const cr = (o, p, q) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
	const d1 = cr(c, d, a);
	const d2 = cr(c, d, b);
	const d3 = cr(a, b, c);
	const d4 = cr(a, b, d);
	return (d1 > eps && d2 < -eps || d1 < -eps && d2 > eps) && (d3 > eps && d4 < -eps || d3 < -eps && d4 > eps);
}
/**
* Sobreposição de interiores. SAT rejeita rápido (e é exato no convexo);
* polígonos côncavos confirmam com ponto-em-polígono e cruzamento de arestas
* — o SAT sozinho gera falso positivo no chevron e bloqueia o encaixe 180°.
* Arestas compartilhadas não contam.
*/
function interiorsOverlap(a, b, eps = 1e-4) {
	for (const axis of [...edgeAxes(a), ...edgeAxes(b)]) {
		const pa = projectOn(a, axis);
		const pb = projectOn(b, axis);
		if (Math.min(pa.max, pb.max) - Math.max(pa.min, pb.min) <= eps) return false;
	}
	for (const p of a) if (pointInPolygonInterior(p, b, Math.min(eps, 1e-6))) return true;
	for (const p of b) if (pointInPolygonInterior(p, a, Math.min(eps, 1e-6))) return true;
	const na = a.length;
	const nb = b.length;
	for (let i = 0; i < na; i++) {
		const a1 = a[i];
		const a2 = a[(i + 1) % na];
		for (let j = 0; j < nb; j++) if (properSegmentIntersect(a1, a2, b[j], b[(j + 1) % nb])) return true;
	}
	return false;
}
function formatMm(n, digits = 2) {
	if (!Number.isFinite(n)) return "—";
	const v = Number(n.toFixed(digits));
	return Number.isInteger(v) ? String(v) : v.toFixed(digits);
}
function formatArea(mm2) {
	if (!Number.isFinite(mm2)) return "—";
	const fmt = (n, digits) => n.toLocaleString("pt-BR", {
		maximumFractionDigits: digits,
		minimumFractionDigits: 0
	});
	if (mm2 >= 1e6) return `${fmt(mm2 / 1e6, 3)} m²`;
	if (mm2 >= 100) return `${fmt(mm2 / 100, 1)} cm²`;
	return `${fmt(mm2, 2)} mm²`;
}
var SHORT = {
	Largura: "Larg.",
	Comprimento: "Comp.",
	Espessura: "Esp.",
	"Borda da chapa": "Borda",
	"Folga entre peças": "Folga",
	Peso: "Peso",
	"Peças neste lote": "Peças",
	"Cateto A": "Cat. A",
	"Cateto B": "Cat. B",
	Diâmetro: "Ø",
	"Ø externo": "Ø ext.",
	"Ø interno": "Ø int.",
	"Base maior": "Base +",
	"Base menor": "Base −",
	Envergadura: "Enverg.",
	Corda: "Corda",
	Barriga: "Barriga"
};
function CompactLabel({ htmlFor, text }) {
	const [word, axis] = splitAxis(text);
	const short = SHORT[word] ?? word;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
		htmlFor,
		title: text,
		className: "flex h-4 min-w-0 items-center gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0 truncate",
			children: short
		}), axis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 font-mono text-[10px] font-medium normal-case tracking-normal text-faint",
			children: axis
		}) : null]
	});
}
function splitAxis(text) {
	const i = text.indexOf("·");
	if (i < 0) return [text.trim(), null];
	return [text.slice(0, i).trim(), text.slice(i + 1).trim() || null];
}
function MmField({ id, label, value, onChange, min, max, unit = "mm", hint }) {
	const [text, setText] = (0, import_react.useState)(() => formatMm(value));
	(0, import_react.useEffect)(() => {
		setText(formatMm(value));
	}, [value]);
	function commit(raw) {
		const n = Number(String(raw).replace(",", "."));
		if (!Number.isFinite(n)) {
			setText(formatMm(value));
			return;
		}
		let next = n;
		if (min !== void 0) next = Math.max(min, next);
		if (max !== void 0) next = Math.min(max, next);
		onChange(next);
		setText(formatMm(next));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-col gap-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactLabel, {
				htmlFor: id,
				text: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id,
					inputMode: "decimal",
					autoComplete: "off",
					spellCheck: false,
					value: text,
					onChange: (e) => setText(e.target.value),
					onBlur: (e) => commit(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") e.target.blur();
					},
					className: "pr-10"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[11px] text-faint",
					children: unit
				})]
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-faint",
				children: hint
			}) : null
		]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			primary: "bg-primary text-primary-fg hover:opacity-90",
			secondary: "bg-raised text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "text-muted hover:text-fg hover:bg-raised",
			chip: "bg-raised text-muted shadow-[var(--shadow-border)] data-[active=true]:bg-primary data-[active=true]:text-primary-fg data-[active=true]:shadow-none"
		},
		size: {
			sm: "h-8 rounded-sm px-2.5 text-xs",
			md: "h-10 rounded-md px-3.5 text-sm",
			icon: "size-10 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
/** Recuo máximo: metade do menor lado, menos 1 mm. */
function maxSheetMargin(sheet) {
	if (sheet.kind === "disc") return Math.max(0, Math.max(sheet.width, 0) / 2 - 1);
	return Math.max(0, Math.min(sheet.width, sheet.length) / 2 - 1);
}
/** ▽ se dois vértices definem o topo; △ se o ápice é o único ponto alto. */
function pointingOf(world) {
	const ys = world.map((p) => p.y);
	const maxY = Math.max(...ys);
	const minY = Math.min(...ys);
	const span = Math.max(maxY - minY, 1);
	return world.filter((p) => Math.abs(p.y - maxY) <= span * .08).length === 1 ? "up" : "down";
}
function seedPointingDown(poly) {
	if (pointingOf(poly) === "down") return poly;
	return canonicalize(applyPoseAll(poly, {
		x: 0,
		y: 0,
		rotationDeg: 180
	}));
}
function makeLatticeTri(tri, edge) {
	const A = tri[edge];
	const B = tri[(edge + 1) % 3];
	const C = tri[(edge + 2) % 3];
	const C2 = {
		x: A.x + B.x - C.x,
		y: A.y + B.y - C.y
	};
	const box = aabbOf([
		A,
		B,
		C,
		C2
	]);
	return {
		v1: sub(C, A),
		v2: sub(C2, A),
		shift: {
			x: -box.minX,
			y: -box.minY
		},
		mid: {
			x: (A.x + B.x) / 2,
			y: (A.y + B.y) / 2
		},
		pairOffset: {
			x: 0,
			y: 0
		}
	};
}
function aabbLattice(box, mid) {
	const w = box.maxX - box.minX;
	const h = box.maxY - box.minY;
	return {
		v1: {
			x: w,
			y: 0
		},
		v2: {
			x: 0,
			y: h
		},
		shift: {
			x: -box.minX,
			y: -box.minY
		},
		mid,
		pairOffset: {
			x: 0,
			y: 0
		}
	};
}
/**
* Lattice of the 180° pair around an edge. Vectors come from the zonogon
* (parallelogram or hexagon) of the pair — not from the AABB, which left
* unused corridors between trapezoids and irregulars.
*/
function makeLatticeFromPair(poly, edge, gap = 0) {
	const n = poly.length;
	const A = poly[edge];
	const B = poly[(edge + 1) % n];
	const M = {
		x: (A.x + B.x) / 2,
		y: (A.y + B.y) / 2
	};
	const reflected = poly.map((p) => ({
		x: 2 * M.x - p.x,
		y: 2 * M.y - p.y
	}));
	if (interiorsOverlap(poly, reflected)) return null;
	const dx = B.x - A.x;
	const dy = B.y - A.y;
	const len = Math.hypot(dx, dy) || 1;
	const g = Math.max(0, gap);
	const pairOffset = {
		x: dy / len * g,
		y: -dx / len * g
	};
	const spaced = reflected.map((p) => ({
		x: p.x + pairOffset.x,
		y: p.y + pairOffset.y
	}));
	const hull = convexHull([...poly, ...spaced]);
	const box = aabbOf(hull);
	const w = box.maxX - box.minX;
	const h = box.maxY - box.minY;
	if (w < 1 || h < 1) return null;
	if (!(hull.length >= 4 && hull.length % 2 === 0)) {
		const lat = aabbLattice(box, M);
		lat.pairOffset = pairOffset;
		lat.v1 = {
			x: w + g,
			y: 0
		};
		lat.v2 = {
			x: 0,
			y: h + g
		};
		return lat;
	}
	const k = hull.length / 2;
	const e = [];
	for (let i = 0; i < k; i++) e.push(sub(hull[(i + 1) % hull.length], hull[i]));
	let v1;
	let v2;
	if (k === 2) {
		v1 = e[0];
		v2 = e[1];
	} else if (k === 3) {
		v1 = {
			x: e[0].x + e[1].x,
			y: e[0].y + e[1].y
		};
		v2 = {
			x: e[1].x + e[2].x,
			y: e[1].y + e[2].y
		};
	} else {
		const lat = aabbLattice(box, M);
		lat.pairOffset = pairOffset;
		lat.v1 = {
			x: w + g,
			y: 0
		};
		lat.v2 = {
			x: 0,
			y: h + g
		};
		return lat;
	}
	const cr = v1.x * v2.y - v1.y * v2.x;
	if (Math.hypot(v1.x, v1.y) < 1 || Math.hypot(v2.x, v2.y) < 1 || Math.abs(cr) < 1) {
		const lat = aabbLattice(box, M);
		lat.pairOffset = pairOffset;
		lat.v1 = {
			x: w + g,
			y: 0
		};
		lat.v2 = {
			x: 0,
			y: h + g
		};
		return lat;
	}
	if (cr < 0) {
		const tmp = v1;
		v1 = v2;
		v2 = tmp;
	}
	const len1 = Math.hypot(v1.x, v1.y) || 1;
	const len2 = Math.hypot(v2.x, v2.y) || 1;
	return {
		v1: {
			x: v1.x + v1.x / len1 * g,
			y: v1.y + v1.y / len1 * g
		},
		v2: {
			x: v2.x + v2.x / len2 * g,
			y: v2.y + v2.y / len2 * g
		},
		shift: {
			x: -box.minX,
			y: -box.minY
		},
		mid: M,
		pairOffset
	};
}
function cellTranslation(lattice, m, n) {
	return {
		x: lattice.shift.x + m * lattice.v1.x + n * lattice.v2.x,
		y: lattice.shift.y + m * lattice.v1.y + n * lattice.v2.y
	};
}
function posesForCell(lattice, m, n) {
	const t = cellTranslation(lattice, m, n);
	return [{
		x: t.x,
		y: t.y,
		rotationDeg: 0
	}, {
		x: 2 * lattice.mid.x + t.x + lattice.pairOffset.x,
		y: 2 * lattice.mid.y + t.y + lattice.pairOffset.y,
		rotationDeg: 180
	}];
}
function centroidKey(world) {
	const c = centroid(world);
	return `${c.x.toFixed(2)}:${c.y.toFixed(2)}`;
}
var BAND = .75;
function minY(piece) {
	return aabbOf(piece.world).minY;
}
function minX(piece) {
	return aabbOf(piece.world).minX;
}
function rowThreshold(placements) {
	if (placements.length === 0) return BAND;
	let h = 0;
	for (const p of placements) {
		const box = aabbOf(p.world);
		h += box.maxY - box.minY;
	}
	return Math.max(BAND, h / placements.length * .18);
}
function rowBands(placements) {
	if (placements.length === 0) return [];
	const band = rowThreshold(placements);
	const sorted = [...placements].sort((a, b) => {
		const dy = minY(a) - minY(b);
		if (Math.abs(dy) > band) return dy;
		return minX(a) - minX(b);
	});
	const rows = [];
	for (const p of sorted) {
		const y = minY(p);
		const last = rows[rows.length - 1];
		if (last && Math.abs(minY(last[0]) - y) <= band) last.push(p);
		else rows.push([p]);
	}
	for (const row of rows) row.sort((a, b) => minX(a) - minX(b));
	return rows;
}
function glyphFor(p) {
	if (p.pack === "hex") return "●";
	if (p.pack === "grid") return "■";
	return p.pointing === "down" ? "▽" : "△";
}
function rowGlyphs(row) {
	return row.map(glyphFor).join("");
}
function nestAabb(placed) {
	return aabbOf(placed.flatMap((p) => p.world));
}
function densityScore(placed, lattice) {
	const rows = rowBands(placed);
	let alt = 0;
	let neighborSlots = 0;
	for (const row of rows) {
		neighborSlots += Math.max(0, row.length - 1);
		for (let i = 1; i < row.length; i++) if (row[i].pointing !== row[i - 1].pointing) alt += 1;
	}
	const altRatio = neighborSlots > 0 ? alt / neighborSlots : 0;
	const startsOpposite = rows.length >= 2 && rows[0][0].pointing !== rows[1][0].pointing ? 1 : 0;
	const startsDown = rows[0]?.[0]?.pointing === "down" ? 1 : 0;
	const box = placed.length ? nestAabb(placed) : {
		minX: 0,
		minY: 0,
		maxX: 0,
		maxY: 0
	};
	const compact = -(box.maxX + box.maxY);
	let twoD = 0;
	if (lattice) twoD = Math.abs(lattice.v1.x * lattice.v2.y - lattice.v1.y * lattice.v2.x) / (Math.hypot(lattice.v1.x, lattice.v1.y) * Math.hypot(lattice.v2.x, lattice.v2.y) || 1);
	return placed.length * 1e9 + twoD * 1e7 + altRatio * 1e6 + startsOpposite * 1e4 + startsDown * 1e3 + compact;
}
function poseMatching(local, world, rotationDeg) {
	const r0 = rotate(local[0] ?? {
		x: 0,
		y: 0
	}, rotationDeg);
	const w0 = world[0] ?? {
		x: 0,
		y: 0
	};
	return {
		x: w0.x - r0.x,
		y: w0.y - r0.y,
		rotationDeg
	};
}
function mapHoles(holes, pose) {
	return holes.map((h) => applyPoseAll(h, pose));
}
function fillSlots(slot, bounds, lattice, limit) {
	const len1 = Math.hypot(lattice.v1.x, lattice.v1.y) || 1;
	const len2 = Math.hypot(lattice.v2.x, lattice.v2.y) || 1;
	const span = Math.min(48, Math.ceil(Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / Math.min(len1, len2)) + 6);
	const seen = /* @__PURE__ */ new Set();
	const fitted = [];
	for (let n = -span; n <= span; n++) for (let m = -span; m <= span; m++) for (const pose of posesForCell(lattice, m, n)) {
		const world = applyPoseAll(slot, pose);
		if (!isInsideAabb(world, bounds)) continue;
		const key = centroidKey(world);
		if (seen.has(key)) continue;
		seen.add(key);
		fitted.push({
			pose,
			world
		});
	}
	fitted.sort((a, b) => {
		const dy = aabbOf(a.world).minY - aabbOf(b.world).minY;
		if (Math.abs(dy) > BAND) return dy;
		const dx = aabbOf(a.world).minX - aabbOf(b.world).minX;
		if (Math.abs(dx) > BAND) return dx;
		return a.pose.rotationDeg - b.pose.rotationDeg;
	});
	return fitted.slice(0, limit).map((f) => f.pose);
}
function emptyResult(requested, margin, gap) {
	return {
		placements: [],
		requested,
		placed: 0,
		utilization: 0,
		margin,
		gap
	};
}
function translatePlacements(placements, dx, dy) {
	if (dx === 0 && dy === 0) return placements.map((p, index) => ({
		...p,
		index
	}));
	return placements.map((p, index) => ({
		...p,
		index,
		pose: {
			x: p.pose.x + dx,
			y: p.pose.y + dy,
			rotationDeg: p.pose.rotationDeg
		},
		world: p.world.map((v) => ({
			x: v.x + dx,
			y: v.y + dy
		})),
		holes: p.holes.map((h) => h.map((v) => ({
			x: v.x + dx,
			y: v.y + dy
		})))
	}));
}
function packLatticeTri(tri, sheet, requested, gap, alreadySeeded = false) {
	const half = Math.max(0, gap) / 2;
	const seed = alreadySeeded ? canonicalizeTriangle(tri) : seedPointingDown(tri);
	const slot = canonicalizeTriangle(inflateTriangle(seed, half));
	const bounds = insetAabb(sheet, 0);
	if (!aabbUsable(bounds)) return [];
	let best = [];
	let bestScore = -Infinity;
	for (let edge = 0; edge < 3; edge++) {
		const lattice = makeLatticeTri(slot, edge);
		const poses = fillSlots(slot, bounds, lattice, requested);
		const placed = [];
		for (const slotPose of poses) {
			const world = inflateTriangle(applyPoseAll(slot, slotPose), -half);
			if (!isInsideAabb(world, bounds)) continue;
			placed.push({
				index: 0,
				pose: poseMatching(seed, world, slotPose.rotationDeg),
				world,
				holes: [],
				pointing: pointingOf(world),
				pack: "pair"
			});
		}
		const score = densityScore(placed, lattice);
		if (score > bestScore) {
			bestScore = score;
			best = placed;
		}
	}
	return best;
}
function keepClear(placed, gap) {
	const need = Math.max(0, gap) - .05;
	const out = [];
	for (const p of placed) {
		let ok = true;
		for (const q of out) if (need <= 0) {
			if (interiorsOverlap(p.world, q.world)) {
				ok = false;
				break;
			}
		} else if (minPolygonDistance(p.world, q.world) < need) {
			ok = false;
			break;
		}
		if (ok) out.push(p);
	}
	return out;
}
function nestAreaOf(placed) {
	if (placed.length === 0) return Infinity;
	const box = nestAabb(placed);
	return Math.max(1, (box.maxX - box.minX) * (box.maxY - box.minY));
}
function contactCount(placed, gap) {
	const lim = Math.max(0, gap) + .6;
	let n = 0;
	for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) if (minPolygonDistance(placed[i].world, placed[j].world) <= lim) n += 1;
	return n;
}
function pickTight(candidates, gap) {
	let best = [];
	let bestKey = [
		-1,
		-1,
		Infinity
	];
	for (const c of candidates) {
		const key = [
			c.length,
			contactCount(c, gap),
			nestAreaOf(c)
		];
		if (key[0] > bestKey[0] || key[0] === bestKey[0] && key[1] > bestKey[1] || key[0] === bestKey[0] && key[1] === bestKey[1] && key[2] < bestKey[2]) {
			best = c;
			bestKey = key;
		}
	}
	return best;
}
function pickDense(candidates, gap) {
	let best = [];
	let bestKey = [
		-1,
		Infinity,
		-1
	];
	for (const c of candidates) {
		const key = [
			c.length,
			nestAreaOf(c),
			-contactCount(c, gap)
		];
		if (key[0] > bestKey[0] || key[0] === bestKey[0] && key[1] < bestKey[1] - 1 || key[0] === bestKey[0] && Math.abs(key[1] - bestKey[1]) <= 1 && key[2] < bestKey[2]) {
			best = c;
			bestKey = key;
		}
	}
	return best;
}
function minkowskiVertices(a, b) {
	const pts = [];
	for (const p of a) for (const q of b) pts.push({
		x: p.x + q.x,
		y: p.y + q.y
	});
	return convexHull(pts);
}
function segIntersect(a, b, c, d) {
	const r = sub(b, a);
	const s = sub(d, c);
	const den = cross(r, s);
	if (Math.abs(den) < 1e-9) return null;
	const qp = sub(c, a);
	const t = cross(qp, s) / den;
	const u = cross(qp, r) / den;
	if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
	return {
		x: a.x + t * r.x,
		y: a.y + t * r.y
	};
}
function nfpBoundary(stationary, moving, gap) {
	return minkowskiVertices(offsetConvex(stationary, Math.max(0, gap)), moving.map((p) => ({
		x: -p.x,
		y: -p.y
	})));
}
function wallHits(nfp, axis, value) {
	const hits = [];
	const n = nfp.length;
	for (let i = 0; i < n; i++) {
		const a = nfp[i];
		const b = nfp[(i + 1) % n];
		const av = axis === "x" ? a.x : a.y;
		const bv = axis === "x" ? b.x : b.y;
		if ((av - value) * (bv - value) > 0) continue;
		const span = bv - av;
		if (Math.abs(span) < 1e-12) {
			hits.push({
				x: a.x,
				y: a.y
			});
			continue;
		}
		const t = (value - av) / span;
		hits.push({
			x: a.x + t * (b.x - a.x),
			y: a.y + t * (b.y - a.y)
		});
	}
	return hits;
}
function nfpIntersections(a, b) {
	const hits = [];
	const na = a.length;
	const nb = b.length;
	for (let i = 0; i < na; i++) {
		const a1 = a[i];
		const a2 = a[(i + 1) % na];
		for (let j = 0; j < nb; j++) {
			const p = segIntersect(a1, a2, b[j], b[(j + 1) % nb]);
			if (p) hits.push(p);
		}
	}
	return hits;
}
/**
* Bottom-left fill via NFP of convex pieces. Positions sit on contact
* (distance = gap) instead of on a padded AABB, so irregulars close up.
*/
function packConvexNfp(poly, sheet, requested, gap, rotations, obstacles = []) {
	const bounds = insetAabb(sheet, 0);
	if (!aabbUsable(bounds) || poly.length < 3) return [];
	const locals = rotations.map((rot) => canonicalize(applyPoseAll(poly, {
		x: 0,
		y: 0,
		rotationDeg: rot
	})));
	const placed = obstacles.map((world) => ({
		index: -1,
		pose: {
			x: 0,
			y: 0,
			rotationDeg: 0
		},
		world,
		holes: [],
		pointing: pointingOf(world),
		pack: "grid"
	}));
	const frozen = placed.length;
	const need = Math.max(0, gap) - .05;
	for (let n = 0; n < requested; n++) {
		let bestWorld = null;
		let bestPose = null;
		let bestScore = Infinity;
		for (let ri = 0; ri < locals.length; ri++) {
			const local = locals[ri];
			const rot = rotations[ri];
			const candidates = [{
				x: 0,
				y: 0
			}];
			const nfps = [];
			for (const p of placed) {
				const nfp = nfpBoundary(p.world, local, gap);
				if (nfp.length < 3) continue;
				nfps.push(nfp);
				candidates.push(...nfp);
				candidates.push(...wallHits(nfp, "y", 0));
				candidates.push(...wallHits(nfp, "x", 0));
			}
			if (placed.length < 8 && local.length <= 12) for (let i = 0; i < nfps.length; i++) for (let j = i + 1; j < nfps.length; j++) candidates.push(...nfpIntersections(nfps[i], nfps[j]));
			for (const t of candidates) {
				if (t.x < -.05 || t.y < -.05) continue;
				const world = local.map((p) => ({
					x: p.x + t.x,
					y: p.y + t.y
				}));
				if (!isInsideAabb(world, bounds)) continue;
				let ok = true;
				const wb = aabbOf(world);
				for (const q of placed) {
					if (aabbSeparation(wb, aabbOf(q.world)) >= need) continue;
					if (need <= 0) {
						if (interiorsOverlap(world, q.world)) {
							ok = false;
							break;
						}
					} else if (minPolygonDistance(world, q.world) < need) {
						ok = false;
						break;
					}
				}
				if (!ok) continue;
				const box = aabbOf(world);
				const score = box.minY * 1e6 + box.minX + box.maxY * .01;
				if (score < bestScore) {
					bestScore = score;
					bestWorld = world;
					bestPose = poseMatching(poly, world, rot);
				}
			}
		}
		if (!bestWorld || !bestPose) break;
		placed.push({
			index: 0,
			pose: bestPose,
			world: bestWorld,
			holes: [],
			pointing: pointingOf(bestWorld),
			pack: "pair"
		});
	}
	return placed.slice(frozen);
}
function longestEdgeIndices(poly, cap) {
	const n = poly.length;
	const scored = [];
	for (let i = 0; i < n; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % n];
		scored.push({
			i,
			len: Math.hypot(b.x - a.x, b.y - a.y)
		});
	}
	scored.sort((a, b) => b.len - a.len);
	const maxLen = scored[0]?.len ?? 0;
	const floor = Math.max(8, maxLen * .35);
	const kept = scored.filter((s) => s.len >= floor).slice(0, cap);
	return (kept.length > 0 ? kept : scored.slice(0, 1)).map((s) => s.i);
}
function uniqueVec(t, list, eps = .75) {
	return !list.some((u) => Math.hypot(u.x - t.x, u.y - t.y) < eps);
}
function hemisphere(t) {
	if (t.y < -1e-9 || Math.abs(t.y) <= 1e-9 && t.x < 0) return {
		x: -t.x,
		y: -t.y
	};
	return t;
}
/**
* Translations where a copy of `poly` kisses without overlapping.
* Opposite-parallel edges (the chevron slide) plus vertex-vertex.
*/
function contactTranslations(poly) {
	const ts = [];
	const n = poly.length;
	const consider = (raw) => {
		const t = hemisphere(raw);
		if (Math.hypot(t.x, t.y) < 1) return;
		if (!uniqueVec(t, ts)) return;
		const b = poly.map((p) => ({
			x: p.x + t.x,
			y: p.y + t.y
		}));
		if (interiorsOverlap(poly, b)) return;
		if (minPolygonDistance(poly, b) > .6) return;
		ts.push(t);
	};
	for (let i = 0; i < n; i++) {
		const A1 = poly[i];
		const A2 = poly[(i + 1) % n];
		const eA = {
			x: A2.x - A1.x,
			y: A2.y - A1.y
		};
		const lenA = Math.hypot(eA.x, eA.y) || 1;
		for (let j = 0; j < n; j++) {
			const B1 = poly[j];
			const B2 = poly[(j + 1) % n];
			const eB = {
				x: B2.x - B1.x,
				y: B2.y - B1.y
			};
			const lenB = Math.hypot(eB.x, eB.y) || 1;
			if ((eA.x * eB.x + eA.y * eB.y) / (lenA * lenB) > -.999) continue;
			if (Math.abs(lenA - lenB) > 1) continue;
			consider({
				x: A1.x - B2.x,
				y: A1.y - B2.y
			});
		}
	}
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
		if (i === j) continue;
		consider({
			x: poly[i].x - poly[j].x,
			y: poly[i].y - poly[j].y
		});
	}
	return ts;
}
function pickLatticeVectors(vectors, cellMin) {
	const sorted = [...vectors].sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
	let best = null;
	let bestArea = Infinity;
	let bestRect = -1;
	for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) {
		const a = sorted[i];
		const b = sorted[j];
		const cr = a.x * b.y - a.y * b.x;
		const cell = Math.abs(cr);
		if (cell < cellMin * .85 || cell > cellMin * 2.5) continue;
		const rect = cell / ((Math.hypot(a.x, a.y) || 1) * (Math.hypot(b.x, b.y) || 1));
		if (cell < bestArea * .98 || cell <= bestArea * 1.02 && rect > bestRect) {
			bestArea = cell;
			bestRect = rect;
			best = cr < 0 ? {
				v1: b,
				v2: a
			} : {
				v1: a,
				v2: b
			};
		}
	}
	return best;
}
function lattice2x2Clear(poly, v1, v2) {
	const pieces = [
		{
			x: 0,
			y: 0
		},
		v1,
		v2,
		{
			x: v1.x + v2.x,
			y: v1.y + v2.y
		}
	].map((t) => poly.map((p) => ({
		x: p.x + t.x,
		y: p.y + t.y
	})));
	for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) if (interiorsOverlap(pieces[i], pieces[j])) return false;
	return true;
}
/**
* Translation tessellation for chevron-like concave pieces. Two copies of
* the same orientation tile by sliding the notch onto the tip (pitch = half
* AABB); inflating by gap/2 first makes that pitch hug the laser gap.
* 180° pairing of the convex hull left a 280 mm cell and a huge empty
* corridor — this lattice closes it.
*/
function packTranslationLattice(poly, sheet, requested, gap) {
	const bounds = insetAabb(sheet, 0);
	if (!aabbUsable(bounds) || poly.length < 3) return [];
	let best = [];
	for (const rot of [
		0,
		90,
		180,
		270
	]) {
		const local = canonicalize(applyPoseAll(poly, {
			x: 0,
			y: 0,
			rotationDeg: rot
		}));
		const half = Math.max(0, gap) / 2;
		const inflated = half > 1e-9 ? offsetConvex(local, half) : local;
		if (inflated.length < 3 || signedArea(inflated) < signedArea(local) * .5) continue;
		const slot = canonicalize(inflated);
		const lat = pickLatticeVectors(contactTranslations(slot), area(slot));
		if (!lat || !lattice2x2Clear(slot, lat.v1, lat.v2)) continue;
		const len1 = Math.hypot(lat.v1.x, lat.v1.y) || 1;
		const len2 = Math.hypot(lat.v2.x, lat.v2.y) || 1;
		const span = Math.min(48, Math.ceil(Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / Math.min(len1, len2)) + 6);
		const seen = /* @__PURE__ */ new Set();
		const fitted = [];
		for (let n = -span; n <= span; n++) for (let m = -span; m <= span; m++) {
			const t = {
				x: m * lat.v1.x + n * lat.v2.x,
				y: m * lat.v1.y + n * lat.v2.y
			};
			const world = local.map((p) => ({
				x: p.x + t.x,
				y: p.y + t.y
			}));
			if (!isInsideAabb(world, bounds)) continue;
			const key = centroidKey(world);
			if (seen.has(key)) continue;
			seen.add(key);
			fitted.push({ world });
		}
		fitted.sort((a, b) => {
			const dy = aabbOf(a.world).minY - aabbOf(b.world).minY;
			if (Math.abs(dy) > BAND) return dy;
			const dx = aabbOf(a.world).minX - aabbOf(b.world).minX;
			if (Math.abs(dx) > BAND) return dx;
			return 0;
		});
		const placed = [];
		for (const f of fitted) {
			if (placed.length >= requested) break;
			placed.push({
				index: 0,
				pose: poseMatching(poly, f.world, rot),
				world: f.world,
				holes: [],
				pointing: pointingOf(f.world),
				pack: "pair"
			});
		}
		const clear = keepClear(placed, gap);
		if (clear.length > best.length || clear.length === best.length && nestAreaOf(clear) < nestAreaOf(best)) best = clear;
	}
	return best;
}
/**
* Three extrema of a delta-like outline: base corners of the AABB plus the
* unique apex. The curved sides sit slightly outside this triangle.
*/
function apexTriangle(poly) {
	const box = aabbOf(poly);
	const band = Math.max(box.maxY - box.minY, 1) * .08;
	const atMax = [];
	const atMin = [];
	for (const p of poly) {
		if (Math.abs(p.y - box.maxY) <= band) atMax.push(p);
		if (Math.abs(p.y - box.minY) <= band) atMin.push(p);
	}
	if (atMax.length === 1) return [
		{
			x: box.minX,
			y: box.minY
		},
		{
			x: box.maxX,
			y: box.minY
		},
		{
			x: atMax[0].x,
			y: atMax[0].y
		}
	];
	if (atMin.length === 1) return [
		{
			x: box.minX,
			y: box.maxY
		},
		{
			x: box.maxX,
			y: box.maxY
		},
		{
			x: atMin[0].x,
			y: atMin[0].y
		}
	];
	return null;
}
function distOutsideTriangle(p, tri) {
	const [A, B, C] = tri;
	const side = (a, b, q) => (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
	const sAB = side(A, B, C);
	const dAB = side(A, B, p);
	const dBC = side(B, C, p);
	const dCA = side(C, A, p);
	if (sAB >= 0 ? dAB >= -1e-6 && dBC >= -1e-6 && dCA >= -1e-6 : dAB <= 1e-6 && dBC <= 1e-6 && dCA <= 1e-6) return 0;
	const distEdge = (a, b, q) => {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const L = Math.hypot(dx, dy) || 1;
		const t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / (L * L)));
		return Math.hypot(q.x - (a.x + t * dx), q.y - (a.y + t * dy));
	};
	return Math.min(distEdge(A, B, p), distEdge(B, C, p), distEdge(C, A, p));
}
function mapSeedOntoTriangle(seed, worldT, rotationDeg) {
	const rotated = applyPoseAll(seed, {
		x: 0,
		y: 0,
		rotationDeg
	});
	const lb = aabbOf(rotated);
	const wb = aabbOf(worldT);
	const dx = wb.minX - lb.minX;
	const dy = wb.minY - lb.minY;
	return rotated.map((q) => ({
		x: q.x + dx,
		y: q.y + dy
	}));
}
/**
* Delta wing: ride the triangle checkerboard (▽△ at 180°) and push the
* lattice by the curve's outward bulge so the smooth sides kiss at `gap`
* instead of overlapping.
*/
function packDeltaPair(poly, sheet, requested, gap) {
	const seed = seedPointingDown(poly);
	const T = apexTriangle(seed);
	if (!T) return [];
	let excess = 0;
	for (const p of seed) excess = Math.max(excess, distOutsideTriangle(p, T));
	const bounds = insetAabb(sheet, 0);
	const attempt = (extra) => {
		const packed = packLatticeTri(T, sheet, requested, gap + extra, true);
		const placed = [];
		for (const p of packed) {
			const world = mapSeedOntoTriangle(seed, p.world, p.pose.rotationDeg);
			if (!isInsideAabb(world, bounds)) continue;
			placed.push({
				index: 0,
				pose: poseMatching(seed, world, p.pose.rotationDeg),
				world,
				holes: [],
				pointing: pointingOf(world),
				pack: "pair"
			});
		}
		return placed;
	};
	const hi0 = Math.max(2 * excess, 0);
	let lo = 0;
	let hi = hi0;
	let best = keepClear(attempt(hi0), gap);
	for (let i = 0; i < 8; i++) {
		const mid = (lo + hi) / 2;
		const cand = attempt(mid);
		let ov = false;
		let minD = Infinity;
		for (let a = 0; a < cand.length; a++) for (let b = a + 1; b < cand.length; b++) {
			if (interiorsOverlap(cand[a].world, cand[b].world)) ov = true;
			const d = minPolygonDistance(cand[a].world, cand[b].world);
			if (d < minD) minD = d;
		}
		if (!ov && cand.length > 0 && (cand.length < 2 || minD >= gap - .05)) {
			if (cand.length > best.length || cand.length === best.length && nestAreaOf(cand) < nestAreaOf(best) - 1) best = cand;
			hi = mid;
		} else lo = mid;
	}
	return keepClear(best, gap);
}
function packLatticeN(poly, sheet, requested, gap) {
	const seed = seedPointingDown(poly);
	const hull = convexHull(seed);
	if (hull.length === 3) return keepClear(packLatticeTri(hull, sheet, requested, gap, true).map((p) => {
		const world = applyPoseAll(seed, p.pose);
		return {
			...p,
			world,
			pointing: pointingOf(world)
		};
	}), gap);
	const concave = hull.length !== seed.length;
	if (concave && !isChevronLike(seed)) return packGrid(seed, sheet, requested, gap, [
		0,
		90,
		180,
		270
	]);
	const bounds = insetAabb(sheet, 0);
	if (!aabbUsable(bounds) || seed.length < 3) return [];
	let pair = [];
	if (concave) {
		let best = [];
		let bestScore = -Infinity;
		for (let edge = 0; edge < seed.length; edge++) {
			const lattice = makeLatticeFromPair(seed, edge, gap);
			if (!lattice) continue;
			const poses = fillSlots(seed, bounds, lattice, requested);
			const placed = [];
			for (const pose of poses) {
				const world = applyPoseAll(seed, pose);
				if (!isInsideAabb(world, bounds)) continue;
				placed.push({
					index: 0,
					pose: poseMatching(seed, world, pose.rotationDeg),
					world,
					holes: [],
					pointing: pointingOf(world),
					pack: "pair"
				});
			}
			const clear = keepClear(placed, gap);
			const score = clear.length * 1e9 - nestAreaOf(clear);
			if (score > bestScore) {
				bestScore = score;
				best = clear;
			}
		}
		pair = best;
	} else {
		const half = Math.max(0, gap) / 2;
		const inflated = offsetConvex(seed, half);
		if (signedArea(inflated) >= signedArea(seed) * .35) {
			const slot = canonicalize(inflated);
			let best = [];
			let bestScore = -Infinity;
			for (const edge of longestEdgeIndices(slot, 6)) {
				const lattice = makeLatticeFromPair(slot, edge);
				if (!lattice) continue;
				const poses = fillSlots(slot, bounds, lattice, requested);
				const placed = [];
				for (const pose of poses) {
					const world = offsetConvex(applyPoseAll(slot, pose), -half);
					if (world.length < 3 || !isInsideAabb(world, bounds)) continue;
					placed.push({
						index: 0,
						pose: poseMatching(seed, world, pose.rotationDeg),
						world,
						holes: [],
						pointing: pointingOf(world),
						pack: "pair"
					});
				}
				const clear = keepClear(placed, gap);
				const score = clear.length * 1e9 - nestAreaOf(clear);
				if (score > bestScore) {
					bestScore = score;
					best = clear;
				}
			}
			pair = best;
		}
	}
	if (isDeltaLike(seed)) {
		const delta = packDeltaPair(seed, sheet, requested, gap);
		const grid = packGrid(seed, sheet, requested, gap, [
			0,
			90,
			180,
			270
		]);
		return pickDense([
			delta,
			pair,
			grid
		], gap);
	}
	if (pair.length >= requested && !concave) return pair;
	const grid = packGrid(seed, sheet, requested, gap, [
		0,
		90,
		180,
		270
	]);
	if (seed.length > 20) return pickTight([pair, grid], gap);
	const nfp = packConvexNfp(seed, sheet, requested, gap, [0, 180]);
	if (concave && isChevronLike(seed)) return pickDense([
		packTranslationLattice(seed, sheet, requested, gap),
		pair,
		grid
	], gap);
	return pickTight([
		pair,
		nfp,
		grid
	], gap);
}
function packGrid(poly, sheet, requested, gap, rotations, holes = [], obstacles = []) {
	const bounds = insetAabb(sheet, 0);
	if (!aabbUsable(bounds)) return [];
	let best = [];
	let bestScore = -Infinity;
	for (const rot of rotations) {
		const rotated = canonicalize(applyPoseAll(poly, {
			x: 0,
			y: 0,
			rotationDeg: rot
		}));
		const box = aabbOf(rotated);
		const pw = aabbWidth(box);
		const ph = aabbHeight(box);
		if (pw < .5 || ph < .5) continue;
		const pitchX = pw + gap;
		const pitchY = ph + gap;
		const placed = [];
		const cols = Math.ceil((bounds.maxX - bounds.minX) / pitchX) + 1;
		const rows = Math.ceil((bounds.maxY - bounds.minY) / pitchY) + 1;
		for (let j = 0; j < rows && placed.length < requested; j++) for (let i = 0; i < cols && placed.length < requested; i++) {
			const x = i * pitchX;
			const y = j * pitchY;
			const world = rotated.map((p) => ({
				x: p.x + x,
				y: p.y + y
			}));
			if (!isInsideAabb(world, bounds)) continue;
			if (!respectsGap(world, obstacles, gap)) continue;
			const pose = poseMatching(poly, world, rot);
			placed.push({
				index: 0,
				pose,
				world,
				holes: mapHoles(holes, pose),
				pointing: pointingOf(world),
				pack: "grid"
			});
		}
		const score = densityScore(placed);
		if (score > bestScore) {
			bestScore = score;
			best = placed;
		}
	}
	return best;
}
function packHex(poly, sheet, requested, gap, holes = [], obstacles = []) {
	const bounds = insetAabb(sheet, 0);
	if (!aabbUsable(bounds)) return [];
	const box = aabbOf(poly);
	const pitch = Math.min(aabbWidth(box), aabbHeight(box)) + gap;
	if (pitch < .5) return [];
	const pitchY = pitch * (Math.sqrt(3) / 2);
	const placed = [];
	const rows = Math.ceil((bounds.maxY - bounds.minY) / pitchY) + 2;
	const cols = Math.ceil((bounds.maxX - bounds.minX) / pitch) + 2;
	for (let j = 0; j < rows && placed.length < requested; j++) {
		const offset = j % 2 === 1 ? pitch / 2 : 0;
		for (let i = 0; i < cols && placed.length < requested; i++) {
			const x = i * pitch + offset;
			const y = j * pitchY;
			const world = poly.map((p) => ({
				x: p.x + x,
				y: p.y + y
			}));
			if (!isInsideAabb(world, bounds)) continue;
			if (!respectsGap(world, obstacles, gap)) continue;
			const pose = {
				x,
				y,
				rotationDeg: 0
			};
			placed.push({
				index: 0,
				pose,
				world,
				holes: mapHoles(holes, pose),
				pointing: pointingOf(world),
				pack: "hex"
			});
		}
	}
	return placed;
}
function pickBest(candidates) {
	let best = [];
	let bestScore = -Infinity;
	for (const c of candidates) {
		const score = densityScore(c);
		if (score > bestScore) {
			bestScore = score;
			best = c;
		}
	}
	return best;
}
function packFamily(poly, sheet, requested, gap, family, holes, obstacles = []) {
	if (family === "hex") return packHex(poly, sheet, requested, gap, holes, obstacles);
	if (family === "grid") return packGrid(poly, sheet, requested, gap, [0, 90], holes, obstacles);
	if (family === "pair180") return poly.length === 3 ? packLatticeTri(poly, sheet, requested, gap) : packLatticeN(poly, sheet, requested, gap);
	return pickBest([poly.length === 3 ? packLatticeTri(poly, sheet, requested, gap) : packLatticeN(poly, sheet, requested, gap), packGrid(poly, sheet, requested, gap, [
		0,
		90,
		180,
		270
	], holes, obstacles)]);
}
function respectsGap(world, obstacles, gap) {
	if (obstacles.length === 0) return true;
	const need = Math.max(0, gap) - .05;
	const wb = aabbOf(world);
	for (const o of obstacles) {
		if (aabbSeparation(wb, aabbOf(o)) >= need) continue;
		if (need <= 0) {
			if (interiorsOverlap(world, o)) return false;
		} else if (minPolygonDistance(world, o) < need) return false;
	}
	return true;
}
function shiftCluster(placed, dx, dy) {
	if (dx === 0 && dy === 0) return placed.map((p) => ({ ...p }));
	return placed.map((p) => ({
		...p,
		pose: {
			x: p.pose.x + dx,
			y: p.pose.y + dy,
			rotationDeg: p.pose.rotationDeg
		},
		world: p.world.map((v) => ({
			x: v.x + dx,
			y: v.y + dy
		})),
		holes: p.holes.map((h) => h.map((v) => ({
			x: v.x + dx,
			y: v.y + dy
		})))
	}));
}
function clusterFits(cluster, obstacles, bounds, gap) {
	for (const p of cluster) {
		if (!isInsideAabb(p.world, bounds)) return false;
		if (!respectsGap(p.world, obstacles, gap)) return false;
	}
	return true;
}
function rotationsFor(family, n) {
	if (family === "hex") return [
		0,
		30,
		60
	];
	if (family === "grid") return [0, 90];
	if (family === "pair180" || n === 3) return [0, 180];
	return [
		0,
		90,
		180,
		270
	];
}
/**
* Keep the empty-sheet tessellation as a rigid cluster and slide it into
* free space until it kisses the locked pieces (distance = gap). Leftovers
* fill the remaining pockets on the same lattice, skipping occupied cells.
*/
function trySlideCluster(packed, obstacles, bounds, gap) {
	if (packed.length === 0) return null;
	const box = aabbOf(packed.flatMap((p) => p.world));
	const origin = shiftCluster(packed, -box.minX, -box.minY);
	const probe = origin[0].world;
	const blob = aabbOf(obstacles.flatMap((o) => o));
	const pockets = [
		{
			x: 0,
			y: 0
		},
		{
			x: 0,
			y: blob.maxY + gap
		},
		{
			x: blob.minX,
			y: blob.maxY + gap
		},
		{
			x: blob.maxX + gap,
			y: 0
		},
		{
			x: blob.maxX + gap,
			y: blob.minY
		},
		{
			x: blob.maxX + gap,
			y: blob.maxY + gap
		}
	];
	const topSpan = Math.max(0, blob.maxX - blob.minX);
	const step = Math.max(60, topSpan / 10);
	for (let x = Math.max(0, blob.minX); x <= blob.maxX + 1; x += step) pockets.push({
		x,
		y: blob.maxY + gap
	});
	for (let y = Math.max(0, blob.minY); y <= blob.maxY + 1; y += step) pockets.push({
		x: blob.maxX + gap,
		y
	});
	const rest = [];
	for (const o of obstacles) {
		const nfp = nfpBoundary(o, probe, gap);
		if (nfp.length >= 3) {
			rest.push(...nfp);
			rest.push(...wallHits(nfp, "y", 0));
			rest.push(...wallHits(nfp, "x", 0));
		}
	}
	rest.sort((a, b) => a.y - b.y || a.x - b.x);
	const cands = [...pockets, ...rest.slice(0, 160)];
	let best = null;
	let bestScore = Infinity;
	for (const t of cands) {
		if (t.x < -.05 || t.y < -.05) continue;
		const moved = shiftCluster(origin, t.x, t.y);
		if (!clusterFits(moved, obstacles, bounds, gap)) continue;
		const nb = aabbOf(moved.flatMap((p) => p.world));
		const score = nb.minY * 1e6 + nb.minX;
		if (score < bestScore) {
			best = moved;
			bestScore = score;
		}
	}
	return best;
}
function placeAroundObstacles(packed, obstacles, sheet, gap, poly, requested, family, holes = []) {
	if (obstacles.length === 0) return packed;
	const bounds = insetAabb(sheet, 0);
	const empty = packed.slice(0, requested);
	const out = [];
	let remaining = empty;
	let occupied = [...obstacles];
	while (remaining.length > 0 && out.length < requested) {
		let moved = null;
		for (let n = remaining.length; n >= 1; n--) {
			moved = trySlideCluster(remaining.slice(0, n), occupied, bounds, gap);
			if (moved) {
				remaining = remaining.slice(n);
				break;
			}
		}
		if (!moved) break;
		out.push(...moved);
		occupied = [...occupied, ...moved.map((p) => p.world)];
	}
	if (out.length >= requested) return out.slice(0, requested);
	const rest = requested - out.length;
	if (rest <= 0) return out;
	const extra = family === "hex" ? packHex(poly, sheet, rest, gap, holes, occupied) : family === "grid" || poly.length > 20 ? packGrid(poly, sheet, rest, gap, family === "grid" ? [0, 90] : [
		0,
		90,
		180,
		270
	], holes, occupied) : packConvexNfp(poly, sheet, rest, gap, rotationsFor(family, poly.length), occupied);
	return [...out, ...extra].slice(0, requested);
}
function clipDisc(placed, D, margin) {
	const c = D / 2;
	const r = c - Math.max(0, margin);
	if (r <= 0) return [];
	return placed.filter((p) => isInsideCircle(p.world, c, c, r));
}
/** Hexágono no retalho circular: malha deslocada para ocupar a faixa da borda. */
function packHexRings(poly, D, requested, gap, holes, margin, obstacles) {
	const box = aabbOf(poly);
	const pw = aabbWidth(box);
	const ph = aabbHeight(box);
	const pitch = Math.min(pw, ph) + gap;
	if (pitch < .5 || requested <= 0) return [];
	const pitchY = pitch * (Math.sqrt(3) / 2);
	const c = D / 2;
	const rIn = c - Math.max(0, margin);
	if (rIn <= 0) return [];
	const radMax = Math.hypot(pw, ph) / 2;
	const span = Math.ceil(2 * rIn / Math.min(pitch, pitchY)) + 3;
	const toPieces = (hits) => {
		hits.sort((a, b) => a.dist - b.dist || a.y - b.y || a.x - b.x);
		return hits.slice(0, requested).map((h) => {
			const pose = {
				x: h.x,
				y: h.y,
				rotationDeg: 0
			};
			return {
				index: 0,
				pose,
				world: h.world,
				holes: mapHoles(holes, pose),
				pointing: pointingOf(h.world),
				pack: "hex"
			};
		});
	};
	const fill = (ox, oy, ang) => {
		const rad = ang * Math.PI / 180;
		const ca = Math.cos(rad);
		const sa = Math.sin(rad);
		const v1x = pitch * ca;
		const v1y = pitch * sa;
		const v2x = pitch / 2 * ca - pitchY * sa;
		const v2y = pitch / 2 * sa + pitchY * ca;
		const hits = [];
		for (let j = -span; j <= span; j++) for (let i = -span; i <= span; i++) {
			const x = ox + i * v1x + j * v2x;
			const y = oy + i * v1y + j * v2y;
			const d = Math.hypot(x + pw / 2 - c, y + ph / 2 - c);
			if (d - radMax > rIn) continue;
			let world;
			if (d + radMax <= rIn) world = poly.map((p) => ({
				x: p.x + x,
				y: p.y + y
			}));
			else {
				world = poly.map((p) => ({
					x: p.x + x,
					y: p.y + y
				}));
				if (!isInsideCircle(world, c, c, rIn)) continue;
			}
			if (!respectsGap(world, obstacles, gap)) continue;
			hits.push({
				x,
				y,
				world,
				dist: d
			});
		}
		hits.sort((a, b) => a.dist - b.dist || a.y - b.y || a.x - b.x);
		return hits;
	};
	const scoreOf = (hits) => {
		const take = hits.slice(0, requested);
		let sum = 0;
		let maxd = 0;
		for (const h of take) {
			sum += h.dist;
			if (h.dist > maxd) maxd = h.dist;
		}
		return take.length * 0xe8d4a51000 - maxd * 1e6 - sum;
	};
	let bestHits = [];
	let bestScore = -Infinity;
	const consider = (hits) => {
		const s = scoreOf(hits);
		if (s > bestScore) {
			bestScore = s;
			bestHits = hits;
		}
	};
	const baseX = c - pw / 2;
	const baseY = c - ph / 2;
	const steps = 10;
	for (const ang of [
		0,
		15,
		30
	]) {
		const rad = ang * Math.PI / 180;
		const ca = Math.cos(rad);
		const sa = Math.sin(rad);
		const v1x = pitch * ca;
		const v1y = pitch * sa;
		const v2x = pitch / 2 * ca - pitchY * sa;
		const v2y = pitch / 2 * sa + pitchY * ca;
		for (let a = 0; a < steps; a++) {
			const ua = a / steps;
			for (let b = 0; b < steps; b++) {
				const ub = b / steps;
				consider(fill(baseX + ua * v1x + ub * v2x, baseY + ua * v1y + ub * v2y, ang));
			}
		}
	}
	return toPieces(bestHits);
}
/**
* Malha ▽△ / grade no retalho circular: cada célula é testada contra o
* círculo (não contra o quadrado circunscrito). A origem da malha percorre
* a célula unitária para caber o máximo na faixa da borda — o recorte do
* cluster centrado deixava 4 triângulos 500 mm virarem 2 num Ø 1250.
*/
function packLatticeRings(poly, D, requested, gap, family, holes, margin, obstacles) {
	const c = D / 2;
	const rIn = c - Math.max(0, margin);
	if (rIn <= 0 || requested <= 0) return [];
	const specs = [];
	const wantPair = family === "pair180" || family === "auto" || family !== "grid" && family !== "hex" && poly.length === 3;
	const wantGrid = family === "grid" || family === "auto";
	if (wantPair) {
		if (poly.length === 3) {
			const half = Math.max(0, gap) / 2;
			const seed = seedPointingDown(poly);
			const slot = canonicalizeTriangle(inflateTriangle(seed, half));
			for (let edge = 0; edge < 3; edge++) specs.push({
				type: "tri",
				seed,
				slot,
				half,
				lattice: makeLatticeTri(slot, edge),
				pack: "pair"
			});
		} else if (poly.length <= 20) {
			const seed = seedPointingDown(canonicalize(poly));
			const limit = Math.min(seed.length, 6);
			for (let edge = 0; edge < limit; edge++) {
				const lattice = makeLatticeFromPair(seed, edge, gap);
				if (!lattice) continue;
				specs.push({
					type: "pair",
					seed,
					slot: seed,
					half: 0,
					lattice,
					pack: "pair"
				});
			}
		}
	}
	if (wantGrid) {
		const rots = family === "grid" ? [0, 90] : [
			0,
			90,
			180,
			270
		];
		for (const rot of rots) {
			const local = canonicalize(applyPoseAll(poly, {
				x: 0,
				y: 0,
				rotationDeg: rot
			}));
			const box = aabbOf(local);
			const pw = aabbWidth(box);
			const ph = aabbHeight(box);
			if (pw < .5 || ph < .5) continue;
			specs.push({
				type: "grid",
				seed: poly,
				local,
				rot,
				v1: {
					x: pw + gap,
					y: 0
				},
				v2: {
					x: 0,
					y: ph + gap
				},
				pack: "grid"
			});
		}
	}
	if (specs.length === 0) return [];
	const scoreOf = (hits) => {
		const take = hits.slice(0, requested);
		let sum = 0;
		let maxd = 0;
		for (const h of take) {
			sum += h.dist;
			if (h.dist > maxd) maxd = h.dist;
		}
		return take.length * 0xe8d4a51000 - maxd * 1e6 - sum;
	};
	let bestHits = [];
	let bestSpec = specs[0];
	let bestScore = -Infinity;
	for (const spec of specs) {
		const v1 = spec.type === "grid" ? spec.v1 : spec.lattice.v1;
		const v2 = spec.type === "grid" ? spec.v2 : spec.lattice.v2;
		const len1 = Math.hypot(v1.x, v1.y) || 1;
		const len2 = Math.hypot(v2.x, v2.y) || 1;
		const span = Math.min(48, Math.ceil(2 * rIn / Math.min(len1, len2)) + 4);
		const steps = span >= 24 ? 4 : span >= 12 ? 6 : 8;
		const box = aabbOf(spec.type === "grid" ? spec.local : spec.slot);
		const pw = aabbWidth(box);
		const ph = aabbHeight(box);
		const radMax = Math.hypot(pw, ph) / 2;
		const fill = (ox, oy) => {
			const hits = [];
			const seen = /* @__PURE__ */ new Set();
			const accept = (world, dist, extra) => {
				if (world.length < 3) return;
				if (dist - radMax > rIn) return;
				if (dist + radMax > rIn && !isInsideCircle(world, c, c, rIn)) return;
				if (!respectsGap(world, obstacles, gap)) return;
				const key = centroidKey(world);
				if (seen.has(key)) return;
				seen.add(key);
				hits.push({
					world,
					dist,
					...extra
				});
			};
			if (spec.type === "grid") for (let n = -span; n <= span; n++) for (let m = -span; m <= span; m++) {
				const x = ox + m * v1.x + n * v2.x;
				const y = oy + m * v1.y + n * v2.y;
				accept(spec.local.map((p) => ({
					x: p.x + x,
					y: p.y + y
				})), Math.hypot(x + pw / 2 - c, y + ph / 2 - c), {
					x,
					y,
					rot: spec.rot
				});
			}
			else for (let n = -span; n <= span; n++) for (let m = -span; m <= span; m++) for (const pose0 of posesForCell(spec.lattice, m, n)) {
				const pose = {
					x: pose0.x + ox,
					y: pose0.y + oy,
					rotationDeg: pose0.rotationDeg
				};
				const worldSlot = applyPoseAll(spec.slot, pose);
				const wb = aabbOf(worldSlot);
				const d = Math.hypot((wb.minX + wb.maxX) / 2 - c, (wb.minY + wb.maxY) / 2 - c);
				accept(spec.half > 1e-9 && spec.slot.length === 3 ? inflateTriangle(worldSlot, -spec.half) : applyPoseAll(spec.seed, pose), d, {
					pose,
					rot: pose.rotationDeg
				});
			}
			hits.sort((a, b) => a.dist - b.dist || (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));
			return hits;
		};
		for (let a = 0; a < steps; a++) {
			const ua = a / steps;
			for (let b = 0; b < steps; b++) {
				const ub = b / steps;
				const hits = fill(ua * v1.x + ub * v2.x, ua * v1.y + ub * v2.y);
				const s = scoreOf(hits);
				if (s > bestScore) {
					bestScore = s;
					bestHits = hits;
					bestSpec = spec;
				}
			}
		}
	}
	return bestHits.slice(0, requested).map((h) => {
		const pose = h.pose ?? poseMatching(bestSpec.seed ?? poly, h.world, h.rot ?? 0);
		return {
			index: 0,
			pose,
			world: h.world,
			holes: mapHoles(holes, pose),
			pointing: pointingOf(h.world),
			pack: bestSpec.pack
		};
	});
}
function interiorAngleDeg(poly, i) {
	const n = poly.length;
	const curr = poly[i];
	const prev = poly[(i - 1 + n) % n];
	const next = poly[(i + 1) % n];
	const v1 = sub(prev, curr);
	const v2 = sub(next, curr);
	let a = Math.atan2(v1.y, v1.x) - Math.atan2(v2.y, v2.x);
	if (a < 0) a += 2 * Math.PI;
	if (a >= 2 * Math.PI - 1e-12) a = 0;
	return a * 180 / Math.PI;
}
function poseHubOutward(poly, hub, cx, cy, d, phiDeg) {
	const n = poly.length;
	const V = poly[hub];
	const prev = poly[(hub - 1 + n) % n];
	const next = poly[(hub + 1) % n];
	const a = sub(prev, V);
	const b = sub(next, V);
	const na = Math.hypot(a.x, a.y) || 1;
	const nb = Math.hypot(b.x, b.y) || 1;
	const bx = a.x / na + b.x / nb;
	const by = a.y / na + b.y / nb;
	if (bx * bx + by * by < 1e-12) return null;
	const phi = phiDeg * Math.PI / 180;
	const rot = (phi - Math.atan2(by, bx)) * 180 / Math.PI;
	const target = {
		x: cx + d * Math.cos(phi),
		y: cy + d * Math.sin(phi)
	};
	const Vr = rotate(V, rot);
	return {
		x: target.x - Vr.x,
		y: target.y - Vr.y,
		rotationDeg: rot
	};
}
function discPackScore(placed, c) {
	if (!placed.length) return -Infinity;
	let sum = 0;
	let maxd = 0;
	for (const p of placed) for (const v of p.world) {
		const d = Math.hypot(v.x - c, v.y - c);
		if (d > maxd) maxd = d;
		sum += d;
	}
	return placed.length * 0xe8d4a51000 - maxd * 1e6 - sum;
}
/**
* No disco, um vértice que divide 360° (90° → 4, 60° → 6) aponta para o
* centro. Quatro catetos 500 mm encontram os retos no miolo e o circunraio
* cai de ~600 mm (dois pares no diâmetro) para ~500 mm — o Ø mínimo desce.
*/
function packPinwheelOnDisc(poly, D, requested, gap, family, holes, margin, obstacles) {
	if (poly.length < 3 || poly.length > 8 || requested <= 0) return [];
	const c = D / 2;
	const rIn = c - Math.max(0, margin);
	if (rIn <= 0) return [];
	const g = Math.max(0, gap);
	const hubs = [];
	for (let i = 0; i < poly.length; i++) {
		const deg = interiorAngleDeg(poly, i);
		if (deg < 28 || deg > 135) continue;
		const fold = Math.round(360 / deg);
		if (fold < 3 || fold > 8) continue;
		if (Math.abs(360 / fold - deg) > 20) continue;
		hubs.push({
			index: i,
			deg,
			fold
		});
	}
	if (hubs.length === 0) return [];
	let best = [];
	let bestScore = -Infinity;
	for (const hub of hubs) {
		const theta = hub.deg * Math.PI / 180;
		const sinHalf = Math.sin(theta / 2);
		const d = sinHalf > 1e-6 ? g / 2 / sinHalf : g / 2;
		const step = 360 / hub.fold;
		const starts = hub.fold === 4 ? [
			45,
			0,
			22.5
		] : [
			0,
			step / 4,
			step / 2
		];
		const nPlace = Math.min(requested, hub.fold);
		for (const phi0 of starts) {
			const placed = [];
			const occupied = obstacles.slice();
			for (let i = 0; i < hub.fold && placed.length < nPlace; i++) {
				const pose = poseHubOutward(poly, hub.index, c, c, d, phi0 + i * step);
				if (!pose) continue;
				const world = applyPoseAll(poly, pose);
				if (!isInsideCircle(world, c, c, rIn)) continue;
				if (!respectsGap(world, occupied, g)) continue;
				placed.push({
					index: 0,
					pose: poseMatching(poly, world, pose.rotationDeg),
					world,
					holes: mapHoles(holes, pose),
					pointing: pointingOf(world),
					pack: "pair"
				});
				occupied.push(world);
			}
			const s = discPackScore(placed, c);
			if (s > bestScore) {
				bestScore = s;
				best = placed;
			}
		}
	}
	if (best.length >= requested || best.length === 0) return best.slice(0, requested);
	const rest = packLatticeRings(poly, D, requested - best.length, gap, family, holes, margin, [...obstacles, ...best.map((p) => p.world)]);
	return [...best, ...rest].slice(0, requested);
}
function tessellate(poly, sheet, count, clearance = {}) {
	const requested = Math.max(0, Math.min(200, Math.floor(count)));
	const margin = Math.max(0, clearance.margin ?? 0);
	const gap = Math.max(0, clearance.gap ?? 0);
	const verts = poly.length === 3 ? poly : canonicalize(poly);
	if (requested === 0 || isDegenerate(verts)) return emptyResult(requested, margin, gap);
	const family = clearance.family ?? (verts.length === 3 ? "pair180" : "auto");
	const holes = clearance.holes ?? [];
	const rawObstacles = clearance.obstacles ?? [];
	if (sheet.kind === "disc") {
		const D = Math.max(1, sheet.width);
		if (D / 2 - margin <= .5) return emptyResult(requested, margin, gap);
		let fitted;
		if (family === "hex") fitted = packHexRings(verts, D, requested, gap, holes, margin, rawObstacles);
		else {
			const lattice = clipDisc(packLatticeRings(verts, D, requested, gap, family, holes, margin, rawObstacles), D, margin).slice(0, requested);
			if (family === "grid") fitted = lattice;
			else {
				const wheel = clipDisc(packPinwheelOnDisc(verts, D, requested, gap, family, holes, margin, rawObstacles), D, margin).slice(0, requested);
				const c = D / 2;
				fitted = discPackScore(wheel, c) > discPackScore(lattice, c) ? wheel : lattice;
			}
		}
		const sheetArea = Math.PI * (D / 2) * (D / 2);
		const holeArea = holes.reduce((s, h) => s + area(h), 0);
		const used = fitted.length * Math.max(0, area(verts) - holeArea);
		return {
			placements: translatePlacements(fitted, 0, 0),
			requested,
			placed: fitted.length,
			utilization: sheetArea > 0 ? used / sheetArea : 0,
			margin,
			gap
		};
	}
	const inner = {
		width: sheet.width - 2 * margin,
		length: sheet.length - 2 * margin,
		thickness: sheet.thickness
	};
	if (!aabbUsable({
		minX: 0,
		minY: 0,
		maxX: inner.width,
		maxY: inner.length
	})) return emptyResult(requested, margin, gap);
	const innerObstacles = margin === 0 ? rawObstacles : rawObstacles.map((o) => o.map((p) => ({
		x: p.x - margin,
		y: p.y - margin
	})));
	const packed = packFamily(verts, inner, requested, gap, family, clearance.holes ?? []);
	const placements = translatePlacements(innerObstacles.length === 0 ? packed : placeAroundObstacles(packed, innerObstacles, inner, gap, verts, requested, family, clearance.holes ?? []), margin, margin);
	const sheetArea = sheet.width * sheet.length;
	const holeArea = (clearance.holes ?? []).reduce((s, h) => s + area(h), 0);
	const used = placements.length * Math.max(0, area(verts) - holeArea);
	return {
		placements,
		requested,
		placed: placements.length,
		utilization: sheetArea > 0 ? used / sheetArea : 0,
		margin,
		gap
	};
}
function patternPreview(placements, rows = 2) {
	return rowBands(placements).slice(0, rows).map(rowGlyphs).join(" ");
}
function QtyField({ id, label, value, onChange, min = 1, max = 200 }) {
	const [text, setText] = (0, import_react.useState)(() => String(value));
	(0, import_react.useEffect)(() => {
		setText(String(value));
	}, [value]);
	function commit(raw) {
		const n = Number.parseInt(String(raw).replace(",", "."), 10);
		if (!Number.isFinite(n)) {
			setText(String(value));
			return;
		}
		const next = Math.min(max, Math.max(min, n));
		onChange(next);
		setText(String(next));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactLabel, {
			htmlFor: id,
			text: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					size: "icon",
					"aria-label": "Diminuir quantidade",
					disabled: value <= min,
					onClick: () => onChange(Math.max(min, value - 1)),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id,
					inputMode: "numeric",
					autoComplete: "off",
					spellCheck: false,
					value: text,
					onChange: (e) => setText(e.target.value),
					onBlur: (e) => commit(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") e.target.blur();
					},
					className: "text-center"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					size: "icon",
					"aria-label": "Aumentar quantidade",
					disabled: value >= max,
					onClick: () => onChange(Math.min(max, value + 1)),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
				})
			]
		})]
	});
}
var tones = {
	neutral: "text-muted bg-raised",
	ok: "text-ok bg-ok/10",
	warn: "text-warn bg-warn/10",
	danger: "text-danger bg-danger/10"
};
function Badge({ tone = "neutral", className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em]", tones[tone], className),
		...props
	});
}
function Slider({ value, min = 0, max = 100, step = 1, onValueChange, className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		value: [value],
		min,
		max,
		step,
		onValueChange: (v) => onValueChange(v[0] ?? 0),
		className: cn("relative flex h-10 w-full touch-none items-center", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-1 w-full grow rounded-full bg-raised",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full rounded-full bg-primary/70" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-primary shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" })]
	});
}
/** Densidade comercial do aço inox: 8 g/cm³ (8000 kg/m³). AISI 304 de laboratório é ~7,93. */
var STAINLESS_DENSITY = 8e3;
var STAINLESS_LABEL = "Aço inox";
var MM3_TO_M3 = 1e9;
/** Área da face da chapa, mm². Disco usa π r². */
function sheetFaceAreaMm2(sheet) {
	if (sheet.kind === "disc") {
		const r = Math.max(0, sheet.width) / 2;
		return Math.PI * r * r;
	}
	return Math.max(0, sheet.width) * Math.max(0, sheet.length);
}
/** Massa da chapa inteira, kg. */
function sheetMassKg(sheet, density = STAINLESS_DENSITY) {
	const area = sheetFaceAreaMm2(sheet);
	const t = Math.max(0, sheet.thickness);
	if (!Number.isFinite(area * t * density)) return 0;
	return area * t * density / MM3_TO_M3;
}
/** Massa a partir da área da face, kg. Mesma densidade comercial da chapa. */
function massFromAreaKg(areaMm2, thicknessMm, density = STAINLESS_DENSITY) {
	const a = Math.max(0, areaMm2);
	const t = Math.max(0, thicknessMm);
	if (!Number.isFinite(a * t * density)) return 0;
	return a * t * density / MM3_TO_M3;
}
/** Peso para leitura de chão de fábrica: g abaixo de 1 kg. */
function formatKg(kg) {
	if (!Number.isFinite(kg) || kg <= 0) return "—";
	if (kg < 1) {
		const g = kg * 1e3;
		const digits = g < 10 ? 1 : 0;
		return `${g.toLocaleString("pt-BR", {
			maximumFractionDigits: digits,
			minimumFractionDigits: 0
		})} g`;
	}
	const digits = kg >= 100 ? 1 : 2;
	return `${kg.toLocaleString("pt-BR", {
		maximumFractionDigits: digits,
		minimumFractionDigits: 0
	})} kg`;
}
function thicknessFromMassKg(width, length, massKg, density = STAINLESS_DENSITY, kind = "rect") {
	const denom = (kind === "disc" ? Math.PI * (Math.max(0, width) / 2) ** 2 : Math.max(0, width) * Math.max(0, length)) * density;
	if (denom <= 0 || !Number.isFinite(massKg) || massKg <= 0) return 0;
	const t = massKg * MM3_TO_M3 / denom;
	if (!Number.isFinite(t) || t < 0) return 0;
	return Math.round(t * 100) / 100;
}
var ELLIPSE_K = .5522847498307936;
var WING_PRESETS = [
	{
		id: "delta",
		label: "Delta",
		mark: "⋀",
		hint: "Asa-delta — o modelo principal. Borda de ataque em Bézier, bordo de fuga quase reto."
	},
	{
		id: "rogallo",
		label: "Rogallo",
		mark: "⋏",
		hint: "Dois lóbulos e quilha — a asa clássica de asa-delta."
	},
	{
		id: "petala",
		label: "Pétala",
		mark: "✿",
		hint: "Pétala: ponta fina, base arredondada."
	},
	{
		id: "lagrima",
		label: "Lágrima",
		mark: "◠",
		hint: "Gota Bézier — bulbosa embaixo, afilada no nariz."
	},
	{
		id: "folha",
		label: "Folha",
		mark: "❦",
		hint: "Folha assimétrica, uma margem mais curva."
	},
	{
		id: "foice",
		label: "Foice",
		mark: ")",
		hint: "Crescente / foice — arco externo e interno em Bézier."
	},
	{
		id: "amendoa",
		label: "Amêndoa",
		mark: "⬦",
		hint: "Amêndoa: dois ápices, flancos convexos."
	},
	{
		id: "oval",
		label: "Oval",
		mark: "⬭",
		hint: "Elipse em quatro cúbicas (κ ≈ 0,552). Barriga altera o arredondamento."
	},
	{
		id: "gaivota",
		label: "Gaivota",
		mark: "⁀",
		hint: "Planta de gaivota — ombros altos, bordo de fuga em W raso."
	},
	{
		id: "bumerangue",
		label: "Bumerangue",
		mark: "⊂",
		hint: "Dois braços, copa convexa e virilha côncava."
	}
];
function wingPresetMeta(id) {
	return WING_PRESETS.find((p) => p.id === id) ?? WING_PRESETS[0];
}
function isWingPreset(id) {
	return typeof id === "string" && WING_PRESETS.some((p) => p.id === id);
}
function P(x, y) {
	return point(x, y);
}
function cubicPoint(p0, p1, p2, p3, t) {
	const u = 1 - t;
	const uu = u * u;
	const tt = t * t;
	return {
		x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
		y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
	};
}
function hypot2(a, b) {
	return Math.hypot(b.x - a.x, b.y - a.y);
}
function sampleCubic(c, n) {
	const out = [];
	const segs = Math.max(2, Math.round(n));
	for (let i = 0; i <= segs; i++) out.push(cubicPoint(c[0], c[1], c[2], c[3], i / segs));
	return out;
}
/** Mais pontos onde a cúbica foge da corda; reta quase não gasta vértice. */
function segsForCubic(c) {
	const chord = hypot2(c[0], c[3]);
	const mid = cubicPoint(c[0], c[1], c[2], c[3], .5);
	const bow = Math.hypot(mid.x - (c[0].x + c[3].x) / 2, mid.y - (c[0].y + c[3].y) / 2);
	const q = chord < 1e-6 ? 1 : bow / chord;
	return Math.max(3, Math.min(8, Math.round(3 + q * 12)));
}
function sampleLoop(curves) {
	const pts = [];
	for (const c of curves) {
		const s = sampleCubic(c, segsForCubic(c));
		pts.push(...s.slice(0, -1));
	}
	return dropColinear(canonicalize(pts));
}
function dropColinear(pts) {
	const n = pts.length;
	if (n < 5) return pts;
	const box = {
		minX: Infinity,
		minY: Infinity,
		maxX: -Infinity,
		maxY: -Infinity
	};
	for (const p of pts) {
		if (p.x < box.minX) box.minX = p.x;
		if (p.y < box.minY) box.minY = p.y;
		if (p.x > box.maxX) box.maxX = p.x;
		if (p.y > box.maxY) box.maxY = p.y;
	}
	const span = Math.hypot(box.maxX - box.minX, box.maxY - box.minY) || 1;
	const eps = Math.max(.35, span * .0018);
	const out = [];
	for (let i = 0; i < n; i++) {
		const a = pts[(i - 1 + n) % n];
		const b = pts[i];
		const c = pts[(i + 1) % n];
		const cr = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
		const base = hypot2(a, c) || 1;
		if (Math.abs(cr) / base > eps) out.push(b);
	}
	return out.length >= 4 ? out : pts;
}
function scaleCubics(curves, w, h) {
	const sx = Math.max(w, 1);
	const sy = Math.max(h, 1);
	return curves.map((c) => [
		P(c[0].x * sx, c[0].y * sy),
		P(c[1].x * sx, c[1].y * sy),
		P(c[2].x * sx, c[2].y * sy),
		P(c[3].x * sx, c[3].y * sy)
	]);
}
function clamp01(n) {
	if (!Number.isFinite(n)) return 0;
	return Math.min(.85, Math.max(0, n));
}
function unitCurves(id, k) {
	switch (id) {
		case "delta": {
			const out = k * .18;
			return [
				[
					P(0, 0),
					P(.16 - out, .34),
					P(.34 - out, .74),
					P(.5, 1)
				],
				[
					P(.5, 1),
					P(.66 + out, .74),
					P(.84 + out, .34),
					P(1, 0)
				],
				[
					P(1, 0),
					P(.66, -k * .12),
					P(.34, -k * .12),
					P(0, 0)
				]
			];
		}
		case "rogallo": return [
			[
				P(0, .1),
				P(0, .52 + k * .18),
				P(.28, .96),
				P(.5, 1)
			],
			[
				P(.5, 1),
				P(.72, .96),
				P(1, .52 + k * .18),
				P(1, .1)
			],
			[
				P(1, .1),
				P(.84, .02 + k * .06),
				P(.64, .08 + k * .42),
				P(.5, 0)
			],
			[
				P(.5, 0),
				P(.36, .08 + k * .42),
				P(.16, .02 + k * .06),
				P(0, .1)
			]
		];
		case "petala": return [
			[
				P(.5, 1),
				P(.22, .82),
				P(.02, .58),
				P(.04, .28)
			],
			[
				P(.04, .28),
				P(.06, .08),
				P(.28, 0),
				P(.5, 0)
			],
			[
				P(.5, 0),
				P(.72, 0),
				P(.94, .08),
				P(.96, .28)
			],
			[
				P(.96, .28),
				P(.98, .58),
				P(.78, .82),
				P(.5, 1)
			]
		];
		case "lagrima": return [
			[
				P(.5, 1),
				P(.4, .72),
				P(.02, .62),
				P(0, .38)
			],
			[
				P(0, .38),
				P(0, .12 + k * .04),
				P(.2, 0),
				P(.5, 0)
			],
			[
				P(.5, 0),
				P(.8, 0),
				P(1, .12 + k * .04),
				P(1, .38)
			],
			[
				P(1, .38),
				P(.98, .62),
				P(.6, .72),
				P(.5, 1)
			]
		];
		case "folha": return [
			[
				P(.5, 1),
				P(.12, .86),
				P(0, .58),
				P(.06, .3)
			],
			[
				P(.06, .3),
				P(.1, .08),
				P(.34, 0),
				P(.48, 0)
			],
			[
				P(.48, 0),
				P(.62, .02),
				P(.92, .16 + k * .1),
				P(.94, .42)
			],
			[
				P(.94, .42),
				P(.96, .68),
				P(.78, .9),
				P(.5, 1)
			]
		];
		case "foice": {
			const inner = .22 + k * .38;
			return [
				[
					P(0, .18),
					P(.06, .68),
					P(.28, 1),
					P(.5, 1)
				],
				[
					P(.5, 1),
					P(.72, 1),
					P(.94, .68),
					P(1, .18)
				],
				[
					P(1, .18),
					P(.72, inner),
					P(.58, inner * .72),
					P(.5, inner * .58)
				],
				[
					P(.5, inner * .58),
					P(.42, inner * .72),
					P(.28, inner),
					P(0, .18)
				]
			];
		}
		case "amendoa": return [
			[
				P(.5, 1),
				P(.18, 1 - k * .08),
				P(0, .72),
				P(0, .5)
			],
			[
				P(0, .5),
				P(0, .28),
				P(.18, k * .08),
				P(.5, 0)
			],
			[
				P(.5, 0),
				P(.82, k * .08),
				P(1, .28),
				P(1, .5)
			],
			[
				P(1, .5),
				P(1, .72),
				P(.82, 1 - k * .08),
				P(.5, 1)
			]
		];
		case "oval": {
			const kappa = Math.min(.78, Math.max(.32, ELLIPSE_K + (k - .3) * .35));
			const ox = kappa;
			const oy = kappa;
			return [
				[
					P(1, .5),
					P(1, .5 + oy * .5),
					P(.5 + ox * .5, 1),
					P(.5, 1)
				],
				[
					P(.5, 1),
					P(.5 - ox * .5, 1),
					P(0, .5 + oy * .5),
					P(0, .5)
				],
				[
					P(0, .5),
					P(0, .5 - oy * .5),
					P(.5 - ox * .5, 0),
					P(.5, 0)
				],
				[
					P(.5, 0),
					P(.5 + ox * .5, 0),
					P(1, .5 - oy * .5),
					P(1, .5)
				]
			];
		}
		case "gaivota": return [
			[
				P(0, .32),
				P(.04, .72),
				P(.2, .96),
				P(.5, 1)
			],
			[
				P(.5, 1),
				P(.8, .96),
				P(.96, .72),
				P(1, .32)
			],
			[
				P(1, .32),
				P(.78, .04 + k * .06),
				P(.62, .14),
				P(.5, 0)
			],
			[
				P(.5, 0),
				P(.38, .14),
				P(.22, .04 + k * .06),
				P(0, .32)
			]
		];
		case "bumerangue": {
			const crotch = .42 + k * .1;
			return [
				[
					P(0, .08),
					P(.06, .52),
					P(.24, 1),
					P(.5, 1)
				],
				[
					P(.5, 1),
					P(.76, 1),
					P(.94, .52),
					P(1, .08)
				],
				[
					P(1, .08),
					P(.78, .18),
					P(.64, crotch),
					P(.5, crotch)
				],
				[
					P(.5, crotch),
					P(.36, crotch),
					P(.22, .18),
					P(0, .08)
				]
			];
		}
	}
}
function wingFromSpec(preset, width, height, camber) {
	const w = Math.max(1, width);
	const h = Math.max(1, height);
	return sampleLoop(scaleCubics(unitCurves(preset, clamp01(camber / h)), w, h));
}
var SHAPE_META = [
	{
		id: "triangle",
		label: "Triângulo",
		mark: "△",
		family: "pair180"
	},
	{
		id: "square",
		label: "Quadrado",
		mark: "□",
		family: "grid"
	},
	{
		id: "rect",
		label: "Retângulo",
		mark: "▭",
		family: "grid"
	},
	{
		id: "disc",
		label: "Disco",
		mark: "○",
		family: "hex"
	},
	{
		id: "flange",
		label: "Flange",
		mark: "◎",
		family: "hex"
	},
	{
		id: "wing",
		label: "Asa",
		mark: "⋀",
		family: "auto"
	},
	{
		id: "l",
		label: "L",
		mark: "└",
		family: "grid"
	},
	{
		id: "u",
		label: "U",
		mark: "∪",
		family: "grid"
	},
	{
		id: "v",
		label: "V",
		mark: "∨",
		family: "pair180"
	},
	{
		id: "hex",
		label: "Hexágono",
		mark: "⬡",
		family: "hex"
	},
	{
		id: "trap",
		label: "Trapézio",
		mark: "⏢",
		family: "pair180"
	},
	{
		id: "poly",
		label: "Irregular",
		mark: "⬠",
		family: "auto"
	}
];
function shapeMeta(id) {
	return SHAPE_META.find((s) => s.id === id) ?? SHAPE_META[0];
}
function dimJoin(...parts) {
	return parts.map((n) => formatMm(n)).join(" × ");
}
/** Cota de fabricação do lote — compacta, para a lista consolidada. */
function pieceDimLabel(input) {
	switch (input.shape) {
		case "triangle":
			if (input.triangleMode === "right") return dimJoin(input.legA, input.legB);
			if (input.triangleMode === "vertices") {
				const box = aabbOf((input.vertices ?? []).slice(0, 3));
				return dimJoin(box.maxX - box.minX, box.maxY - box.minY);
			}
			return dimJoin(input.base, input.height);
		case "square": return dimJoin(input.side);
		case "rect": return dimJoin(input.width, input.height);
		case "disc": return `⌀${formatMm(input.outerDia)}`;
		case "flange": {
			const sweep = input.sweepDeg ?? 360;
			const hole = input.innerDia > .5 ? ` / ⌀${formatMm(input.innerDia)}` : "";
			const arc = sweep < 359 ? ` · ${formatMm(sweep)}°` : "";
			return `⌀${formatMm(input.outerDia)}${hole}${arc}`;
		}
		case "wing": return dimJoin(input.width, input.height);
		case "l":
		case "u":
		case "v": return dimJoin(input.width, input.height, input.thick);
		case "hex": return dimJoin(input.hexSide);
		case "trap": return dimJoin(input.baseBot, input.baseTop, input.height);
		case "poly": {
			const box = aabbOf(input.vertices ?? []);
			return dimJoin(box.maxX - box.minX, box.maxY - box.minY);
		}
	}
}
/** Dez modelos de partida para Irregular — o usuário ainda edita os vértices. */
var POLY_PRESETS = [
	{
		id: "livre",
		label: "Livre",
		mark: "⬠",
		hint: "Pentágono assimétrico — o modelo principal.",
		vertices: [
			{
				x: 0,
				y: 0
			},
			{
				x: 320,
				y: 0
			},
			{
				x: 380,
				y: 140
			},
			{
				x: 200,
				y: 280
			},
			{
				x: 20,
				y: 160
			}
		]
	},
	{
		id: "casa",
		label: "Casa",
		mark: "⌂",
		hint: "Retângulo com frontão.",
		vertices: [
			{
				x: 0,
				y: 0
			},
			{
				x: 360,
				y: 0
			},
			{
				x: 360,
				y: 180
			},
			{
				x: 180,
				y: 300
			},
			{
				x: 0,
				y: 180
			}
		]
	},
	{
		id: "seta",
		label: "Seta",
		mark: "➤",
		hint: "Seta com haste — encaixa em grade.",
		vertices: [
			{
				x: 0,
				y: 70
			},
			{
				x: 200,
				y: 70
			},
			{
				x: 200,
				y: 0
			},
			{
				x: 380,
				y: 140
			},
			{
				x: 200,
				y: 280
			},
			{
				x: 200,
				y: 210
			},
			{
				x: 0,
				y: 210
			}
		]
	},
	{
		id: "paralelogramo",
		label: "Paralelo",
		mark: "▱",
		hint: "Paralelogramo — tesela no par 180°.",
		vertices: [
			{
				x: 0,
				y: 0
			},
			{
				x: 320,
				y: 0
			},
			{
				x: 400,
				y: 240
			},
			{
				x: 80,
				y: 240
			}
		]
	},
	{
		id: "losango",
		label: "Losango",
		mark: "◇",
		hint: "Losango / pipa.",
		vertices: [
			{
				x: 180,
				y: 0
			},
			{
				x: 360,
				y: 160
			},
			{
				x: 180,
				y: 320
			},
			{
				x: 0,
				y: 160
			}
		]
	},
	{
		id: "te",
		label: "Tê",
		mark: "⊤",
		hint: "Perfil em T.",
		vertices: [
			{
				x: 130,
				y: 0
			},
			{
				x: 230,
				y: 0
			},
			{
				x: 230,
				y: 180
			},
			{
				x: 360,
				y: 180
			},
			{
				x: 360,
				y: 280
			},
			{
				x: 0,
				y: 280
			},
			{
				x: 0,
				y: 180
			},
			{
				x: 130,
				y: 180
			}
		]
	},
	{
		id: "cruz",
		label: "Cruz",
		mark: "✚",
		hint: "Cruz de braços iguais.",
		vertices: [
			{
				x: 130,
				y: 0
			},
			{
				x: 230,
				y: 0
			},
			{
				x: 230,
				y: 110
			},
			{
				x: 360,
				y: 110
			},
			{
				x: 360,
				y: 210
			},
			{
				x: 230,
				y: 210
			},
			{
				x: 230,
				y: 320
			},
			{
				x: 130,
				y: 320
			},
			{
				x: 130,
				y: 210
			},
			{
				x: 0,
				y: 210
			},
			{
				x: 0,
				y: 110
			},
			{
				x: 130,
				y: 110
			}
		]
	},
	{
		id: "chevron",
		label: "Chevron",
		mark: "⟨",
		hint: "V grosso / seta recortada.",
		vertices: [
			{
				x: 0,
				y: 0
			},
			{
				x: 140,
				y: 0
			},
			{
				x: 280,
				y: 140
			},
			{
				x: 140,
				y: 280
			},
			{
				x: 0,
				y: 280
			},
			{
				x: 140,
				y: 140
			}
		]
	},
	{
		id: "aba",
		label: "Aba",
		mark: "⊓",
		hint: "Retângulo com aba trapezoidal.",
		vertices: [
			{
				x: 0,
				y: 0
			},
			{
				x: 360,
				y: 0
			},
			{
				x: 360,
				y: 200
			},
			{
				x: 260,
				y: 200
			},
			{
				x: 220,
				y: 280
			},
			{
				x: 140,
				y: 280
			},
			{
				x: 100,
				y: 200
			},
			{
				x: 0,
				y: 200
			}
		]
	},
	{
		id: "gota",
		label: "Gota",
		mark: "◉",
		hint: "Gota poligonal.",
		vertices: [
			{
				x: 160,
				y: 0
			},
			{
				x: 280,
				y: 60
			},
			{
				x: 320,
				y: 180
			},
			{
				x: 240,
				y: 300
			},
			{
				x: 80,
				y: 300
			},
			{
				x: 0,
				y: 180
			},
			{
				x: 40,
				y: 60
			}
		]
	}
];
function polyPresetMeta(id) {
	return POLY_PRESETS.find((p) => p.id === id) ?? POLY_PRESETS[0];
}
function verticesOfPreset(id) {
	return polyPresetMeta(id).vertices.map((p) => ({
		x: p.x,
		y: p.y
	}));
}
var FLANGE_PRESETS = [
	{
		id: "anel",
		label: "Anel",
		mark: "◎",
		hint: "Flange completa — furo concêntrico.",
		sweepDeg: 360,
		innerRatio: .57,
		kind: "ring"
	},
	{
		id: "meia",
		label: "Meia",
		mark: "◐",
		hint: "Meia flange (180°) com furo.",
		sweepDeg: 180,
		innerRatio: .57,
		kind: "ring"
	},
	{
		id: "quarto",
		label: "Quarto",
		mark: "◔",
		hint: "1/4 da flange (90°).",
		sweepDeg: 90,
		innerRatio: .57,
		kind: "ring"
	},
	{
		id: "terco",
		label: "Terço",
		mark: "◕",
		hint: "1/3 da flange (120°).",
		sweepDeg: 120,
		innerRatio: .57,
		kind: "ring"
	},
	{
		id: "sexto",
		label: "Sexto",
		mark: "◗",
		hint: "1/6 da flange (60°).",
		sweepDeg: 60,
		innerRatio: .57,
		kind: "ring"
	},
	{
		id: "c",
		label: "Aberto",
		mark: "⊃",
		hint: "Anel em C — fresta no arco.",
		sweepDeg: 300,
		innerRatio: .57,
		kind: "ring"
	},
	{
		id: "fatia",
		label: "Fatia",
		mark: "◓",
		hint: "Setor até o centro — raios juntos num ponto.",
		sweepDeg: 90,
		innerRatio: 0,
		kind: "ring"
	},
	{
		id: "meialua",
		label: "Meia-lua",
		mark: "◑",
		hint: "Semicírculo sólido. Ø interno 0 = pontas juntas.",
		sweepDeg: 180,
		innerRatio: 0,
		kind: "ring"
	},
	{
		id: "gomo",
		label: "Gomo",
		mark: "◝",
		hint: "Gomo 60° até o centro.",
		sweepDeg: 60,
		innerRatio: 0,
		kind: "ring"
	},
	{
		id: "crescente",
		label: "Lua",
		mark: "☾",
		hint: "Crescente: arco interno deslocado do externo.",
		sweepDeg: 180,
		innerRatio: .62,
		kind: "crescent"
	}
];
function flangePresetMeta(id) {
	return FLANGE_PRESETS.find((p) => p.id === id) ?? FLANGE_PRESETS[0];
}
function flangePresetPatch(id, outerDia) {
	const meta = flangePresetMeta(id);
	const od = Math.max(1, outerDia);
	return {
		flangePreset: id,
		sweepDeg: meta.sweepDeg,
		innerDia: Math.round(od * meta.innerRatio)
	};
}
function circlePoints(cx, cy, radius, n, startDeg = 0) {
	const out = [];
	const step = 360 / n;
	for (let i = 0; i < n; i++) {
		const a = (startDeg + i * step) * Math.PI / 180;
		out.push(point(cx + radius * Math.cos(a), cy + radius * Math.sin(a)));
	}
	return out;
}
function regularPolygon(cx, cy, radius, n, startDeg = 0) {
	return canonicalize(circlePoints(cx, cy, radius, n, startDeg));
}
function triangleFromBaseHeight(base, height) {
	return canonicalizeTriangle([
		point(0, 0),
		point(base, 0),
		point(base / 2, height)
	]);
}
function triangleFromLegs(legA, legB) {
	return canonicalizeTriangle([
		point(0, 0),
		point(legA, 0),
		point(0, legB)
	]);
}
function triangleFromVertices(a, b, c) {
	return canonicalizeTriangle([
		a,
		b,
		c
	]);
}
function squareFromSide(side) {
	return canonicalize([
		point(0, 0),
		point(side, 0),
		point(side, side),
		point(0, side)
	]);
}
function rectFromSize(width, height) {
	return canonicalize([
		point(0, 0),
		point(width, 0),
		point(width, height),
		point(0, height)
	]);
}
function discFromDiameter(diameter) {
	return regularPolygon(0, 0, Math.max(0, diameter) / 2, 48, 0);
}
function arcPoints(cx, cy, r, deg0, deg1, n) {
	const segs = Math.max(4, Math.round(n));
	const out = [];
	for (let i = 0; i <= segs; i++) {
		const a = (deg0 + (deg1 - deg0) * i / segs) * Math.PI / 180;
		out.push(point(cx + r * Math.cos(a), cy + r * Math.sin(a)));
	}
	return out;
}
function annularSector(rOut, rIn, sweepDeg) {
	const sweep = Math.min(359.5, Math.max(8, sweepDeg));
	const segs = Math.max(8, Math.round(48 * sweep / 360));
	const a0 = -sweep / 2;
	const a1 = sweep / 2;
	if (rIn < .5) return canonicalize([...arcPoints(0, 0, rOut, a0, a1, segs), point(0, 0)]);
	const outer = arcPoints(0, 0, rOut, a0, a1, segs);
	const inner = arcPoints(0, 0, rIn, a1, a0, segs);
	return canonicalize([...outer, ...inner]);
}
function crescentFromRadii(rOut, rIn) {
	const R = Math.max(rOut, 2);
	const r = Math.min(Math.max(rIn, R * .2), R * .92);
	const d = Math.max(.8, R - r * .55);
	const x = (d * d + R * R - r * r) / (2 * d);
	const y2 = R * R - x * x;
	if (y2 <= 1e-4) return annularSector(R, r, 180);
	const y = Math.sqrt(y2);
	const aA1 = Math.atan2(y, x) * 180 / Math.PI;
	const aA2 = Math.atan2(-y, x) * 180 / Math.PI;
	const aB1 = Math.atan2(y, x - d) * 180 / Math.PI;
	const aB2 = Math.atan2(-y, x - d) * 180 / Math.PI;
	const outer = arcPoints(0, 0, R, aA1, aA2 + 360, 28);
	const inner = arcPoints(d, 0, r, aB2, aB1, 20);
	return canonicalize([...outer, ...inner]);
}
function flangeFromSpec(outer, inner, sweepDeg, preset = "anel") {
	const rOut = Math.max(0, outer) / 2;
	const rIn = Math.max(0, inner) / 2;
	if (flangePresetMeta(preset).kind === "crescent") return {
		vertices: crescentFromRadii(rOut, rIn < .5 ? rOut * .62 : rIn),
		holes: []
	};
	const sweep = Math.min(360, Math.max(8, sweepDeg));
	if (sweep >= 359.2) {
		const raw = circlePoints(0, 0, rOut, 48, 0);
		const vertices = canonicalize(raw);
		if (rIn < .5 || rIn >= rOut - .5) return {
			vertices,
			holes: []
		};
		const box = aabbOf(raw);
		return {
			vertices,
			holes: [circlePoints(0, 0, rIn, 48, 0).map((p) => ({
				x: p.x - box.minX,
				y: p.y - box.minY
			}))]
		};
	}
	return {
		vertices: annularSector(rOut, Math.min(rIn, rOut - .5), sweep),
		holes: []
	};
}
function lFromSize(width, height, thick) {
	const t = Math.min(thick, width - .5, height - .5);
	if (t <= 0) return squareFromSide(Math.max(width, height, 1));
	return canonicalize([
		point(0, 0),
		point(width, 0),
		point(width, t),
		point(t, t),
		point(t, height),
		point(0, height)
	]);
}
function uFromSize(width, height, thick) {
	const t = Math.min(thick, width / 2 - .5, height - .5);
	if (t <= 0) return rectFromSize(width, height);
	return canonicalize([
		point(0, 0),
		point(width, 0),
		point(width, height),
		point(width - t, height),
		point(width - t, t),
		point(t, t),
		point(t, height),
		point(0, height)
	]);
}
function vFromSize(width, height, thick) {
	const W = Math.max(width, 1);
	const H = Math.max(height, 1);
	const L = Math.hypot(W / 2, H);
	const sinA = W / 2 / L;
	if (sinA < 1e-6) return triangleFromBaseHeight(W, H);
	const inset = thick / sinA;
	if (inset >= H - .5 || thick >= W / 2 - .5) return triangleFromBaseHeight(W, H);
	const innerApexY = inset;
	const scale = (H - innerApexY) / H;
	const innerHalf = W / 2 * scale;
	return canonicalize([
		point(0, H),
		point(W / 2 - innerHalf, H),
		point(W / 2, innerApexY),
		point(W / 2 + innerHalf, H),
		point(W, H),
		point(W / 2, 0)
	]);
}
function hexFromSide(side) {
	return regularPolygon(0, 0, Math.max(side, 0), 6, 30);
}
function trapFromBases(baseBot, baseTop, height) {
	const bot = Math.max(baseBot, .5);
	const top = Math.max(baseTop, .5);
	const h = Math.max(height, .5);
	const left = (bot - top) / 2;
	return canonicalize([
		point(0, 0),
		point(bot, 0),
		point(left + top, h),
		point(left, h)
	]);
}
function polyFromVertices(verts) {
	const cleaned = verts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
	if (cleaned.length < 3) return triangleFromBaseHeight(10, 8);
	return canonicalize(cleaned.slice(0, 16));
}
function netArea(vertices, holes) {
	return Math.max(0, area(vertices) - holes.reduce((s, h) => s + area(h), 0));
}
function buildPiece(input) {
	const meta = shapeMeta(input.shape);
	let vertices = [];
	let holes = [];
	switch (input.shape) {
		case "triangle":
			if (input.triangleMode === "right") vertices = triangleFromLegs(input.legA, input.legB);
			else if (input.triangleMode === "vertices") {
				const v = input.vertices;
				vertices = triangleFromVertices(v[0] ?? point(0, 0), v[1] ?? point(1, 0), v[2] ?? point(0, 1));
			} else vertices = triangleFromBaseHeight(input.base, input.height);
			break;
		case "square":
			vertices = squareFromSide(input.side);
			break;
		case "rect":
			vertices = rectFromSize(input.width, input.height);
			break;
		case "disc":
			vertices = discFromDiameter(input.outerDia);
			break;
		case "flange": {
			const f = flangeFromSpec(input.outerDia, input.innerDia, input.sweepDeg ?? 360, input.flangePreset ?? "anel");
			vertices = f.vertices;
			holes = f.holes;
			break;
		}
		case "wing":
			vertices = wingFromSpec(input.wingPreset ?? "delta", input.width, input.height, input.thick);
			break;
		case "l":
			vertices = lFromSize(input.width, input.height, input.thick);
			break;
		case "u":
			vertices = uFromSize(input.width, input.height, input.thick);
			break;
		case "v":
			vertices = vFromSize(input.width, input.height, input.thick);
			break;
		case "hex":
			vertices = hexFromSide(input.hexSide);
			break;
		case "trap":
			vertices = trapFromBases(input.baseBot, input.baseTop, input.height);
			break;
		case "poly": vertices = polyFromVertices(input.vertices);
	}
	const pieceArea = netArea(vertices, holes);
	let family = meta.family;
	if (input.shape === "poly") {
		const hull = convexHull(vertices);
		family = hull.length === 3 ? "pair180" : hull.length === vertices.length ? "pair180" : isChevronLike(vertices) ? "pair180" : "grid";
	} else if (input.shape === "flange") {
		const sweep = input.sweepDeg ?? 360;
		if ((input.flangePreset ?? "anel") === "anel" && sweep >= 359) family = "hex";
		else family = convexHull(vertices).length === vertices.length ? "pair180" : "grid";
	} else if (input.shape === "wing") family = convexHull(vertices).length >= vertices.length - 4 ? "pair180" : "grid";
	const isFullFlange = input.shape === "flange" && (input.flangePreset ?? "anel") === "anel" && (input.sweepDeg ?? 360) >= 359;
	return {
		valid: !isDegenerate(vertices) && pieceArea >= .01 && (!isFullFlange || holes.length > 0),
		piece: {
			id: "piece-a",
			name: input.shape === "poly" ? `Irregular · ${polyPresetMeta(input.polyPreset ?? "livre").label}` : input.shape === "flange" ? `Flange · ${flangePresetMeta(input.flangePreset ?? "anel").label}` : input.shape === "wing" ? `Asa · ${wingPresetMeta(input.wingPreset ?? "delta").label}` : meta.label,
			shape: input.shape,
			family,
			vertices,
			holes,
			area: pieceArea
		}
	};
}
function vertexLabel(i) {
	if (i < 26) return String.fromCharCode(65 + i);
	return `P${i + 1}`;
}
function plateId() {
	return `chapa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
function makePlate(sheet, jobs = []) {
	return {
		id: plateId(),
		sheet: {
			kind: sheet.kind ?? "rect",
			width: sheet.width,
			length: sheet.length,
			thickness: sheet.thickness
		},
		jobs: [...jobs]
	};
}
function cloneSheet(sheet) {
	return {
		kind: sheet.kind ?? "rect",
		width: sheet.width,
		length: sheet.length,
		thickness: sheet.thickness
	};
}
function obstaclesOf(jobs) {
	return jobs.flatMap((j) => j.placements.map((p) => p.world));
}
function plateGap(gap, sheet) {
	return Math.max(Math.max(0, gap), Math.max(0, sheet.thickness));
}
/** Preenche as chapas em ordem. O que não cabe na atual vai para a próxima. */
function planPlates(piece, quantity, margin, gap, stored) {
	const requested = Math.max(0, Math.floor(quantity));
	const base = stored.length > 0 ? stored : [makePlate({
		width: 1,
		length: 1,
		thickness: 0
	})];
	const out = [];
	let remaining = requested;
	const fillOne = (plate, virtual) => {
		const nest = remaining > 0 ? tessellate(piece.vertices, plate.sheet, remaining, {
			margin,
			gap: plateGap(gap, plate.sheet),
			family: piece.family,
			holes: piece.holes,
			obstacles: obstaclesOf(plate.jobs)
		}) : {
			placements: [],
			placed: 0
		};
		remaining = Math.max(0, remaining - nest.placed);
		return {
			id: plate.id,
			sheet: plate.sheet,
			jobs: plate.jobs,
			live: nest.placements,
			placed: nest.placed,
			locked: plate.jobs.reduce((n, j) => n + j.placements.length, 0),
			virtual
		};
	};
	for (const plate of base) out.push(fillOne(plate, false));
	while (remaining > 0 && out.length < 8) {
		const last = out[out.length - 1];
		if (last.placed === 0 && last.jobs.length === 0) break;
		const next = fillOne({
			id: `virtual-${out.length}`,
			sheet: cloneSheet(last.sheet),
			jobs: []
		}, true);
		if (next.placed === 0) break;
		out.push(next);
	}
	return {
		plates: out,
		remainder: remaining,
		livePlaced: requested - remaining,
		requested
	};
}
function planFromInput(input, quantity, margin, gap, stored) {
	const { piece, valid } = buildPiece(input);
	if (!valid) return {
		plates: (stored.length ? stored : [makePlate({
			width: 1,
			length: 1,
			thickness: 0
		})]).map((p) => ({
			id: p.id,
			sheet: p.sheet,
			jobs: p.jobs,
			live: [],
			placed: 0,
			locked: p.jobs.reduce((n, j) => n + j.placements.length, 0),
			virtual: false
		})),
		remainder: quantity,
		livePlaced: 0,
		requested: quantity,
		piece,
		valid
	};
	return {
		...planPlates(piece, quantity, margin, gap, stored),
		piece,
		valid
	};
}
function materializePlan(stored, plan, upToIndex) {
	const plates = stored.map((p) => ({
		id: p.id,
		sheet: cloneSheet(p.sheet),
		jobs: [...p.jobs]
	}));
	const cap = Math.min(upToIndex, plan.plates.length - 1);
	for (let i = plates.length; i <= cap; i++) {
		const src = plan.plates[i];
		plates.push(makePlate(src.sheet));
	}
	return plates;
}
var STORAGE_KEY = "ninho-nest-v7";
var DEFAULT_SHEET = {
	kind: "rect",
	width: 2e3,
	length: 1250,
	thickness: 10
};
var DEFAULT_INPUT = {
	shape: "triangle",
	triangleMode: "base-height",
	polyPreset: "livre",
	flangePreset: "anel",
	wingPreset: "delta",
	base: 400,
	height: 300,
	legA: 300,
	legB: 400,
	vertices: [
		{
			x: 0,
			y: 0
		},
		{
			x: 320,
			y: 0
		},
		{
			x: 380,
			y: 140
		},
		{
			x: 200,
			y: 280
		},
		{
			x: 20,
			y: 160
		}
	],
	side: 300,
	width: 420,
	outerDia: 280,
	innerDia: 160,
	sweepDeg: 360,
	thick: 80,
	hexSide: 140,
	baseTop: 240,
	baseBot: 400
};
var DEFAULT_GAP = DEFAULT_SHEET.thickness;
function firstPlate() {
	return makePlate(DEFAULT_SHEET);
}
function mirrors(plates, activePlateId) {
	const list = plates.length > 0 ? plates : [firstPlate()];
	const p = list.find((x) => x.id === activePlateId) ?? list[0];
	return {
		plates: list,
		activePlateId: p.id,
		sheet: p.sheet,
		jobs: p.jobs
	};
}
function floorGap(gap, thickness) {
	return Math.max(Math.max(0, thickness), Math.max(0, gap));
}
function clampMargin(margin, sheet) {
	const cap = maxSheetMargin(sheet);
	if (!Number.isFinite(margin)) return 0;
	return Math.min(Math.max(0, margin), cap);
}
function migrateInput(raw) {
	const parsed = raw ?? {};
	const shape = parsed.shape ?? (parsed.kind === "base-height" || parsed.kind === "right" || parsed.kind === "vertices" ? "triangle" : "triangle");
	const triangleMode = parsed.triangleMode ?? (parsed.kind === "right" || parsed.kind === "vertices" || parsed.kind === "base-height" ? parsed.kind : "base-height");
	const preset = parsed.polyPreset;
	const polyPreset = preset === "casa" || preset === "seta" || preset === "paralelogramo" || preset === "losango" || preset === "te" || preset === "cruz" || preset === "chevron" || preset === "aba" || preset === "gota" || preset === "livre" ? preset : "livre";
	const fp = parsed.flangePreset;
	const flangePreset = fp === "meia" || fp === "quarto" || fp === "terco" || fp === "sexto" || fp === "c" || fp === "fatia" || fp === "meialua" || fp === "gomo" || fp === "crescente" || fp === "anel" ? fp : "anel";
	const wingPreset = isWingPreset(parsed.wingPreset) ? parsed.wingPreset : "delta";
	const sweepRaw = parsed.sweepDeg;
	const sweepDeg = typeof sweepRaw === "number" && Number.isFinite(sweepRaw) ? Math.min(360, Math.max(8, sweepRaw)) : 360;
	return {
		...DEFAULT_INPUT,
		...parsed,
		shape,
		triangleMode,
		polyPreset,
		flangePreset,
		wingPreset,
		sweepDeg,
		vertices: Array.isArray(parsed.vertices) && parsed.vertices.length >= 3 ? parsed.vertices : DEFAULT_INPUT.vertices
	};
}
function jobId() {
	return `lote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
var useNestStore = create((set) => {
	const origin = firstPlate();
	return {
		...mirrors([origin], origin.id),
		input: DEFAULT_INPUT,
		quantity: 12,
		margin: 15,
		gap: DEFAULT_GAP,
		setSheet: (patch) => set((s) => {
			let sheet = {
				...s.sheet,
				...patch
			};
			if ((sheet.kind ?? "rect") === "disc") {
				const d = patch.width !== void 0 ? patch.width : patch.length !== void 0 ? patch.length : sheet.width;
				sheet = {
					...sheet,
					kind: "disc",
					width: d,
					length: d
				};
			} else sheet = {
				...sheet,
				kind: "rect"
			};
			return {
				...mirrors(s.plates.map((p) => p.id === s.activePlateId ? {
					...p,
					sheet
				} : p), s.activePlateId),
				gap: floorGap(s.gap, sheet.thickness),
				margin: clampMargin(s.margin, sheet)
			};
		}),
		setInput: (patch) => set((s) => ({ input: {
			...s.input,
			...patch
		} })),
		setShape: (shape) => set((s) => ({ input: {
			...s.input,
			shape
		} })),
		setKind: (kind) => set((s) => ({ input: {
			...s.input,
			triangleMode: kind
		} })),
		setPolyPreset: (polyPreset) => set((s) => ({ input: {
			...s.input,
			polyPreset,
			vertices: verticesOfPreset(polyPreset)
		} })),
		setFlangePreset: (flangePreset) => set((s) => ({ input: {
			...s.input,
			...flangePresetPatch(flangePreset, s.input.outerDia)
		} })),
		setWingPreset: (wingPreset) => set((s) => ({ input: {
			...s.input,
			wingPreset
		} })),
		setQuantity: (quantity) => set({ quantity }),
		setMargin: (margin) => set((s) => ({ margin: clampMargin(margin, s.sheet) })),
		setGap: (gap) => set((s) => ({ gap: floorGap(gap, s.sheet.thickness) })),
		selectPlateAt: (index) => set((s) => {
			const plan = planFromInput(s.input, s.quantity, s.margin, s.gap, s.plates);
			const plates = materializePlan(s.plates, plan, index);
			return mirrors(plates, plates[Math.max(0, Math.min(index, plates.length - 1))].id);
		}),
		addPlate: () => set((s) => {
			if (s.plates.length >= 8) return s;
			const extra = makePlate(s.sheet);
			return mirrors([...s.plates, extra], extra.id);
		}),
		removeActivePlate: () => set((s) => {
			if (s.plates.length <= 1) return s;
			const current = s.plates.find((p) => p.id === s.activePlateId);
			if (current && current.jobs.length > 0) return s;
			const plates = s.plates.filter((p) => p.id !== s.activePlateId);
			return mirrors(plates, plates[0].id);
		}),
		lockCurrent: () => set((s) => {
			const plan = planFromInput(s.input, s.quantity, s.margin, s.gap, s.plates);
			if (!plan.valid) return s;
			const idx = Math.max(0, plan.plates.findIndex((p) => p.id === s.activePlateId));
			const fill = plan.plates[idx];
			if (!fill || fill.placed === 0) return s;
			const plates = fill.virtual ? materializePlan(s.plates, plan, idx) : s.plates.map((p) => ({
				...p,
				jobs: [...p.jobs]
			}));
			const activeId = plates[Math.min(idx, plates.length - 1)].id;
			const plate = plates.find((p) => p.id === activeId);
			if (!plate || plate.jobs.length >= 8) return s;
			const id = jobId();
			const job = {
				id,
				name: plan.piece.name,
				shape: plan.piece.shape,
				input: {
					...s.input,
					vertices: s.input.vertices.map((v) => ({
						x: v.x,
						y: v.y
					}))
				},
				quantity: fill.placed,
				placements: fill.live.map((p, index) => ({
					...p,
					index,
					jobId: id
				}))
			};
			return {
				...mirrors(plates.map((p) => p.id === activeId ? {
					...p,
					jobs: [...p.jobs, job]
				} : p), activeId),
				quantity: Math.max(1, s.quantity - fill.placed)
			};
		}),
		removeJob: (id) => set((s) => {
			return mirrors(s.plates.map((p) => p.id === s.activePlateId ? {
				...p,
				jobs: p.jobs.filter((j) => j.id !== id)
			} : p), s.activePlateId);
		}),
		reset: () => set(() => {
			const origin = firstPlate();
			return {
				...mirrors([origin], origin.id),
				input: DEFAULT_INPUT,
				quantity: 12,
				margin: 15,
				gap: DEFAULT_GAP
			};
		})
	};
});
function useDerivedPiece() {
	const input = useNestStore((s) => s.input);
	return (0, import_react.useMemo)(() => buildPiece(input), [input]);
}
function useNestResult() {
	const plates = useNestStore((s) => s.plates);
	const activePlateId = useNestStore((s) => s.activePlateId);
	const quantity = useNestStore((s) => s.quantity);
	const margin = useNestStore((s) => s.margin);
	const gap = useNestStore((s) => s.gap);
	const input = useNestStore((s) => s.input);
	const plan = (0, import_react.useMemo)(() => planFromInput(input, quantity, margin, gap, plates), [
		input,
		quantity,
		margin,
		gap,
		plates
	]);
	const plateIndex = Math.max(0, plan.plates.findIndex((p) => p.id === activePlateId));
	const active = plan.plates[plateIndex] ?? plan.plates[0];
	const sheet = active.sheet;
	const jobs = active.jobs;
	const nest = {
		placements: active.live,
		requested: quantity,
		placed: active.placed,
		utilization: 0,
		margin,
		gap
	};
	const lockedPlacements = jobs.flatMap((j) => j.placements);
	const lockedArea = jobs.reduce((s, j) => s + (j.placements[0] ? areaOfJob(j) : 0), 0);
	const liveArea = nest.placed * plan.piece.area;
	const sheetArea = sheetFaceAreaMm2(sheet);
	const totalPlaced = lockedPlacements.length + nest.placed;
	const totalUtilization = sheetArea > 0 ? (lockedArea + liveArea) / sheetArea : 0;
	nest.utilization = totalUtilization;
	return {
		...nest,
		piece: plan.piece,
		valid: plan.valid,
		lockedPlacements,
		lockedCount: lockedPlacements.length,
		totalPlaced,
		totalUtilization,
		plateCount: plan.plates.length,
		plateIndex,
		livePlaced: plan.livePlaced,
		remainder: plan.remainder,
		virtual: active.virtual,
		folios: plan.plates.map((p, index) => ({
			id: p.id,
			index,
			placed: p.placed,
			locked: p.locked,
			virtual: p.virtual,
			total: p.placed + p.locked
		}))
	};
}
function areaOfJob(job) {
	const built = buildPiece(job.input);
	return built.valid ? built.piece.area * job.placements.length : 0;
}
function persistNestState() {
	if (typeof window === "undefined") return () => {};
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("ninho-nest-v6") ?? window.localStorage.getItem("ninho-nest-v5");
		if (raw) {
			const parsed = JSON.parse(raw);
			const migrated = migratePlates(parsed);
			const sheet = migrated.sheet;
			const gapRaw = typeof parsed.gap === "number" && Number.isFinite(parsed.gap) ? parsed.gap : sheet.thickness;
			useNestStore.setState({
				...mirrors(migrated.plates, migrated.activePlateId),
				input: migrateInput(parsed.input),
				quantity: typeof parsed.quantity === "number" && Number.isFinite(parsed.quantity) ? parsed.quantity : 12,
				margin: clampMargin(typeof parsed.margin === "number" && Number.isFinite(parsed.margin) ? parsed.margin : 15, sheet),
				gap: floorGap(gapRaw, sheet.thickness)
			});
		}
	} catch {}
	return useNestStore.subscribe((s) => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
				sheet: s.sheet,
				plates: s.plates,
				activePlateId: s.activePlateId,
				input: s.input,
				quantity: s.quantity,
				margin: s.margin,
				gap: s.gap,
				jobs: s.jobs
			}));
		} catch {}
	});
}
function migratePlates(parsed) {
	if (Array.isArray(parsed.plates) && parsed.plates.length > 0) {
		const plates = parsed.plates.map((p) => ({
			id: typeof p.id === "string" ? p.id : plateFallbackId(),
			sheet: {
				...DEFAULT_SHEET,
				...p.sheet
			},
			jobs: Array.isArray(p.jobs) ? p.jobs.filter(isJob) : []
		}));
		const m = mirrors(plates, parsed.activePlateId ?? plates[0].id);
		return {
			plates: m.plates,
			activePlateId: m.activePlateId,
			sheet: m.sheet
		};
	}
	const sheet = {
		...DEFAULT_SHEET,
		...parsed.sheet
	};
	const plate = makePlate(sheet, Array.isArray(parsed.jobs) ? parsed.jobs.filter(isJob) : []);
	return {
		plates: [plate],
		activePlateId: plate.id,
		sheet
	};
}
function plateFallbackId() {
	return `chapa-${Math.random().toString(36).slice(2, 8)}`;
}
function isJob(raw) {
	if (!raw || typeof raw !== "object") return false;
	const j = raw;
	return typeof j.id === "string" && Array.isArray(j.placements) && j.placements.length > 0;
}
function cutRowsFrom(placements, lote) {
	return placements.map((p, i) => ({
		lote,
		index: p.index + 1 || i + 1,
		x: round3(p.pose.x),
		y: round3(p.pose.y),
		rotationDeg: round3(p.pose.rotationDeg),
		pointing: p.pointing
	}));
}
function buildNestExport(args) {
	const pieces = [];
	for (const job of args.jobs) pieces.push(...cutRowsFrom(job.placements, job.name));
	pieces.push(...cutRowsFrom(args.live, "ao vivo"));
	return {
		app: APP_NAME,
		unit: "mm",
		sheet: { ...args.sheet },
		margin: args.margin,
		gap: args.gap,
		pieces
	};
}
function nestExportToCsv(doc) {
	return ["lote,index,x_mm,y_mm,rotacao_deg,apontamento", ...doc.pieces.map((r) => `${csvCell(r.lote)},${r.index},${r.x},${r.y},${r.rotationDeg},${r.pointing}`)].join("\n");
}
function nestExportFilename(ext) {
	return `torqboss-nesting-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.${ext}`;
}
function round3(n) {
	return Math.round(n * 1e3) / 1e3;
}
function csvCell(s) {
	if (/[",\n]/.test(s)) return `"${s.replaceAll("\"", "\"\"")}"`;
	return s;
}
var TRI_MODES = [
	{
		id: "base-height",
		label: "Base×alt.",
		title: "Base × altura"
	},
	{
		id: "right",
		label: "Catetos",
		title: "Catetos"
	},
	{
		id: "vertices",
		label: "Vértices",
		title: "Vértices"
	}
];
function jobLotKg(job, thickness) {
	const built = buildPiece(job.input);
	if (!built.valid) return 0;
	return massFromAreaKg(built.piece.area * job.placements.length, thickness);
}
function ControlPanel() {
	const sheet = useNestStore((s) => s.sheet);
	const input = useNestStore((s) => s.input);
	const quantity = useNestStore((s) => s.quantity);
	const margin = useNestStore((s) => s.margin);
	const gap = useNestStore((s) => s.gap);
	const setSheet = useNestStore((s) => s.setSheet);
	const setInput = useNestStore((s) => s.setInput);
	const setShape = useNestStore((s) => s.setShape);
	const setKind = useNestStore((s) => s.setKind);
	const setPolyPreset = useNestStore((s) => s.setPolyPreset);
	const setFlangePreset = useNestStore((s) => s.setFlangePreset);
	const setWingPreset = useNestStore((s) => s.setWingPreset);
	const setQuantity = useNestStore((s) => s.setQuantity);
	const setMargin = useNestStore((s) => s.setMargin);
	const setGap = useNestStore((s) => s.setGap);
	const reset = useNestStore((s) => s.reset);
	const jobs = useNestStore((s) => s.jobs);
	const lockCurrent = useNestStore((s) => s.lockCurrent);
	const removeJob = useNestStore((s) => s.removeJob);
	const selectPlateAt = useNestStore((s) => s.selectPlateAt);
	const addPlate = useNestStore((s) => s.addPlate);
	const removeActivePlate = useNestStore((s) => s.removeActivePlate);
	const { piece, valid } = useDerivedPiece();
	const nest = useNestResult();
	const localBox = aabbOf(piece.vertices);
	const pieceArea = piece.area;
	const sheetArea = sheetFaceAreaMm2(sheet);
	const used = nest.totalUtilization * sheetArea;
	const waste = Math.max(0, sheetArea - used);
	const unitKg = valid ? massFromAreaKg(pieceArea, sheet.thickness) : 0;
	const liveKg = massFromAreaKg(pieceArea * nest.placed, sheet.thickness);
	const plateKg = massFromAreaKg(used, sheet.thickness);
	const up = nest.placements.filter((p) => p.pointing === "up").length;
	const down = nest.placements.filter((p) => p.pointing === "down").length;
	const short = nest.remainder > 0;
	const marginCap = maxSheetMargin(sheet);
	const pack = nest.placements[0]?.pack ?? (piece.family === "hex" ? "hex" : piece.family === "grid" ? "grid" : "pair");
	const canLock = valid && nest.placed > 0 && jobs.length < 8;
	const canRemovePlate = nest.plateCount > 1 && jobs.length === 0 && !nest.virtual;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 p-4 lg:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						n: "01",
						title: "Chapa",
						extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-faint",
							children: STAINLESS_LABEL
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-1",
						children: [
							nest.folios.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "chip",
								size: "sm",
								"data-active": f.index === nest.plateIndex,
								onClick: () => selectPlateAt(f.index),
								className: "h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap",
								title: f.virtual ? `Chapa ${f.index + 1} (remanescente)` : `Chapa ${f.index + 1}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono",
									children: f.index + 1
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-faint",
									children: [f.total, " pç"]
								})]
							}, f.id)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								size: "icon",
								className: "size-8",
								"aria-label": "Nova chapa",
								disabled: nest.folios.length >= 8,
								onClick: addPlate,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
							}),
							canRemovePlate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								size: "icon",
								className: "size-8",
								"aria-label": "Remover chapa",
								onClick: removeActivePlate,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-faint",
						children: [
							"Folha ",
							nest.plateIndex + 1,
							" de ",
							nest.plateCount,
							nest.virtual ? " · remanescente — as medidas desta chapa são independentes." : ".",
							" O que não cabe segue na próxima."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "chip",
							size: "sm",
							"data-active": (sheet.kind ?? "rect") === "rect",
							onClick: () => setSheet({ kind: "rect" }),
							className: "h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap",
							children: "Retângulo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "chip",
							size: "sm",
							"data-active": sheet.kind === "disc",
							onClick: () => setSheet({
								kind: "disc",
								width: Math.min(sheet.width, sheet.length)
							}),
							className: "h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap",
							children: "Disco"
						})]
					}),
					(sheet.kind ?? "rect") === "disc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
							id: "sheet-d",
							label: "Diâmetro",
							value: sheet.width,
							min: 1,
							onChange: (width) => setSheet({
								kind: "disc",
								width
							}),
							hint: "Retalho circular."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
							id: "sheet-t",
							label: "Espessura · Z",
							value: sheet.thickness,
							min: 0,
							onChange: (thickness) => setSheet({ thickness }),
							hint: "Piso da folga entre peças."
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
								id: "sheet-w",
								label: "Largura · X",
								value: sheet.width,
								min: 1,
								onChange: (width) => setSheet({ width })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
								id: "sheet-l",
								label: "Comprimento · Y",
								value: sheet.length,
								min: 1,
								onChange: (length) => setSheet({ length })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
								id: "sheet-t",
								label: "Espessura · Z",
								value: sheet.thickness,
								min: 0,
								onChange: (thickness) => setSheet({ thickness }),
								hint: "Piso da folga entre peças."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
									id: "margin",
									label: "Borda da chapa",
									value: margin,
									min: 0,
									max: marginCap,
									onChange: setMargin
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
									value: margin,
									min: 0,
									max: Math.max(1, marginCap),
									step: 1,
									onValueChange: setMargin,
									"aria-label": "Borda da chapa"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
								id: "gap",
								label: "Folga entre peças",
								value: gap,
								min: sheet.thickness,
								onChange: setGap,
								hint: "Mínimo = espessura (laser)."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
								id: "sheet-mass",
								label: "Peso",
								value: sheetMassKg(sheet),
								min: 0,
								unit: "kg",
								onChange: (kg) => setSheet({ thickness: thicknessFromMassKg(sheet.width, sheet.length, kg, void 0, sheet.kind ?? "rect") }),
								hint: "Chapa inteira."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-faint",
						children: (sheet.kind ?? "rect") === "disc" ? `Recuo radial 1:1 em mm. Máx. ${formatMm(marginCap)} mm.` : `Recuo 1:1 em mm nos quatro lados. Máx. ${formatMm(marginCap)} mm.`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						n: "02",
						title: "Peça"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: SHAPE_META.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "chip",
							size: "sm",
							"data-active": input.shape === k.id,
							onClick: () => setShape(k.id),
							className: "h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap",
							title: k.label,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: k.mark
							}), k.label]
						}, k.id))
					}),
					input.shape === "triangle" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-1 rounded-lg bg-raised p-1",
						children: TRI_MODES.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "chip",
							size: "sm",
							"data-active": input.triangleMode === k.id,
							onClick: () => setKind(k.id),
							className: "h-9 min-w-0 px-1 text-[11px] tracking-normal whitespace-nowrap",
							title: k.title,
							children: k.label
						}, k.id))
					}) : null,
					input.shape === "poly" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1 rounded-lg bg-raised p-1",
							children: POLY_PRESETS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "chip",
								size: "sm",
								"data-active": (input.polyPreset ?? "livre") === k.id,
								onClick: () => setPolyPreset(k.id),
								className: "h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap",
								title: k.hint,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs",
									children: k.mark
								}), k.label]
							}, k.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-faint",
							children: [POLY_PRESETS.find((p) => p.id === (input.polyPreset ?? "livre"))?.hint, " Vértices continuam editáveis."]
						})]
					}) : null,
					input.shape === "flange" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1 rounded-lg bg-raised p-1",
							children: FLANGE_PRESETS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "chip",
								size: "sm",
								"data-active": (input.flangePreset ?? "anel") === k.id,
								onClick: () => setFlangePreset(k.id),
								className: "h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap",
								title: k.hint,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs",
									children: k.mark
								}), k.label]
							}, k.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-faint",
							children: [FLANGE_PRESETS.find((p) => p.id === (input.flangePreset ?? "anel"))?.hint, " Ø interno 0 junta os raios num ponto; maior que 0 abre distanciamento."]
						})]
					}) : null,
					input.shape === "wing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1 rounded-lg bg-raised p-1",
							children: WING_PRESETS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "chip",
								size: "sm",
								"data-active": (input.wingPreset ?? "delta") === k.id,
								onClick: () => setWingPreset(k.id),
								className: "h-8 min-w-0 px-2 text-[11px] tracking-normal whitespace-nowrap",
								title: k.hint,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs",
									children: k.mark
								}), k.label]
							}, k.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-faint",
							children: [WING_PRESETS.find((p) => p.id === (input.wingPreset ?? "delta"))?.hint, " Envergadura, corda e barriga continuam editáveis."]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShapeFields, {
						input,
						setInput
					}),
					!valid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-danger/10 px-3 py-2 text-xs text-danger",
						children: "Peça degenerada — área nula ou furo inválido. Ajuste as dimensões."
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						n: "03",
						title: "Quantidade"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-faint",
						children: "Este lote preenche a chapa 1. O que não cabe abre a próxima folha, com tamanho próprio."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QtyField, {
						id: "qty",
						label: "Peças neste lote",
						value: quantity,
						onChange: setQuantity
					}),
					valid && unitKg > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-[11px] tabular-nums text-faint",
						children: [
							formatKg(unitKg),
							" un.",
							nest.placed > 0 ? ` · ${formatKg(liveKg)} neste lote` : "",
							nest.lockedCount > 0 ? ` · ${formatKg(plateKg)} na chapa` : ""
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-widest text-fg",
						children: patternPreview(nest.placements, 2) || "—"
					}),
					short ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn/10 px-3 py-2 text-xs text-warn",
						children: nest.livePlaced === 0 ? jobs.length ? "Esta chapa está cheia de lotes travados — o restante foi para a próxima." : "A borda comeu a área útil — a peça não cabe no retângulo interno." : `Coube ${nest.livePlaced} de ${nest.requested} nas ${nest.plateCount} chapa${nest.plateCount > 1 ? "s" : ""}. Faltam ${nest.remainder}.`
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						n: "04",
						title: "Lotes nesta chapa"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						disabled: !canLock,
						onClick: lockCurrent,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {}), "Consolidar chapa"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-faint",
						children: "Trava as peças desta folha. O remanescente segue nas próximas; o formato da chapa consolidada deixa de se rearranjar."
					}),
					jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-raised px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)]",
						children: "Nenhum lote travado. Encaixe, depois trave."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-1.5",
						children: jobs.map((job, i) => {
							const meta = shapeMeta(job.shape);
							const dim = pieceDimLabel(job.input);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-2 rounded-md bg-raised px-2 py-1.5 shadow-[var(--shadow-border)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-4 shrink-0 font-mono text-[11px] text-faint",
										children: i + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs text-muted",
										children: meta.mark
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-xs text-fg",
											children: job.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block truncate font-mono text-[10px] tabular-nums text-faint",
											children: [
												dim,
												" · ",
												job.placements.length,
												" pç",
												jobLotKg(job, sheet.thickness) > 0 ? ` · ${formatKg(jobLotKg(job, sheet.thickness))}` : ""
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										size: "icon",
										className: "size-8",
										"aria-label": `Remover lote ${job.name}`,
										onClick: () => removeJob(job.id),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
									})
								]
							}, job.id);
						})
					}),
					jobs.length >= 8 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-warn",
						children: [
							"Limite de ",
							8,
							" lotes nesta chapa."
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						n: "05",
						title: "Encaixe"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: valid ? "ok" : "danger",
								children: valid ? "Válido" : "Degenerado"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								tone: short ? "warn" : "ok",
								children: [
									"ordem ",
									nest.livePlaced,
									" / ",
									nest.requested
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: [
								"chapa ",
								nest.plateIndex + 1,
								"/",
								nest.plateCount
							] }),
							nest.lockedCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: [
								"travadas ",
								nest.lockedCount,
								" · total ",
								nest.totalPlaced
							] }) : null,
							pack === "pair" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: [
								"△ ",
								up,
								" · ▽ ",
								down
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: pack === "hex" ? "Hexagonal" : "Grade" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Área da peça",
								v: formatArea(pieceArea)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Peso un.",
								v: formatKg(unitKg)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "AABB local",
								v: `${formatMm(aabbWidth(localBox))} × ${formatMm(aabbHeight(localBox))}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Borda",
								v: `${formatMm(margin)} mm`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Folga laser",
								v: `${formatMm(gap)} mm`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Aproveitamento",
								v: `${formatMm(nest.totalUtilization * 100, 1)} %`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Área usada",
								v: formatArea(used)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Peso na chapa",
								v: formatKg(plateKg)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "Sobra da chapa",
								v: formatArea(waste)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-lg bg-raised p-3 font-mono text-[11px] leading-relaxed text-muted shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackHint, { pack })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "secondary",
							disabled: nest.livePlaced + nest.lockedCount === 0,
							onClick: () => downloadCutList("json", {
								sheet,
								margin,
								gap,
								live: nest.placements,
								jobs
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "JSON"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "secondary",
							disabled: nest.livePlaced + nest.lockedCount === 0,
							onClick: () => downloadCutList("csv", {
								sheet,
								margin,
								gap,
								live: nest.placements,
								jobs
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "CSV"]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "secondary",
				onClick: reset,
				className: "self-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), "Restaurar padrão"]
			})
		]
	});
}
function ShapeFields({ input, setInput }) {
	switch (input.shape) {
		case "triangle":
			if (input.triangleMode === "base-height") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "base",
					label: "Base",
					value: input.base,
					min: 1,
					onChange: (base) => setInput({ base })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "height",
					label: "Altura",
					value: input.height,
					min: 1,
					onChange: (height) => setInput({ height })
				})]
			});
			if (input.triangleMode === "right") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "lega",
					label: "Cateto A · X",
					value: input.legA,
					min: 1,
					onChange: (legA) => setInput({ legA })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "legb",
					label: "Cateto B · Y",
					value: input.legB,
					min: 1,
					onChange: (legB) => setInput({ legB })
				})]
			});
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VertexEditor, {
				vertices: input.vertices.slice(0, 3),
				minCount: 3,
				maxCount: 3,
				onChange: (vertices) => {
					const next = [...input.vertices];
					next[0] = vertices[0];
					next[1] = vertices[1];
					next[2] = vertices[2];
					setInput({ vertices: next });
				}
			});
		case "square": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
			id: "side",
			label: "Lado",
			value: input.side,
			min: 1,
			onChange: (side) => setInput({ side })
		});
		case "rect": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
				id: "rw",
				label: "Largura",
				value: input.width,
				min: 1,
				onChange: (width) => setInput({ width })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
				id: "rh",
				label: "Altura",
				value: input.height,
				min: 1,
				onChange: (height) => setInput({ height })
			})]
		});
		case "disc": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
			id: "dia",
			label: "Diâmetro",
			value: input.outerDia,
			min: 1,
			onChange: (outerDia) => setInput({ outerDia })
		});
		case "wing": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "wing-w",
					label: "Envergadura · X",
					value: input.width,
					min: 1,
					onChange: (width) => setInput({ width })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "wing-h",
					label: "Corda · Y",
					value: input.height,
					min: 1,
					onChange: (height) => setInput({ height })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "wing-c",
					label: "Barriga",
					value: input.thick,
					min: 0,
					onChange: (thick) => setInput({ thick }),
					hint: "Curvatura dos Bézier."
				})
			]
		});
		case "flange": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "od",
					label: "Ø externo",
					value: input.outerDia,
					min: 1,
					onChange: (outerDia) => setInput({ outerDia })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "id",
					label: "Ø interno",
					value: input.innerDia,
					min: 0,
					max: Math.max(0, input.outerDia - 1),
					onChange: (innerDia) => setInput({ innerDia }),
					hint: "0 = raios juntos no centro."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "sweep",
					label: "Arco",
					value: input.sweepDeg ?? 360,
					min: 8,
					max: 360,
					unit: "°",
					onChange: (sweepDeg) => setInput({ sweepDeg }),
					hint: "360° = anel. 180° = meia. 90° = quarto."
				})
			]
		});
		case "l":
		case "u":
		case "v": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "pw",
					label: "Largura",
					value: input.width,
					min: 1,
					onChange: (width) => setInput({ width })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "ph",
					label: "Altura",
					value: input.height,
					min: 1,
					onChange: (height) => setInput({ height })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "pt",
					label: "Espessura",
					value: input.thick,
					min: 1,
					onChange: (thick) => setInput({ thick }),
					hint: "Parede do perfil."
				})
			]
		});
		case "hex": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
			id: "hex",
			label: "Lado",
			value: input.hexSide,
			min: 1,
			onChange: (hexSide) => setInput({ hexSide })
		});
		case "trap": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "bbot",
					label: "Base maior",
					value: input.baseBot,
					min: 1,
					onChange: (baseBot) => setInput({ baseBot })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "btop",
					label: "Base menor",
					value: input.baseTop,
					min: 1,
					onChange: (baseTop) => setInput({ baseTop })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
					id: "th",
					label: "Altura",
					value: input.height,
					min: 1,
					onChange: (height) => setInput({ height })
				})
			]
		});
		case "poly": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VertexEditor, {
			vertices: input.vertices,
			minCount: 3,
			maxCount: 16,
			onChange: (vertices) => setInput({ vertices })
		});
	}
}
function VertexEditor({ vertices, minCount, maxCount, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [
			vertices.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[1.5rem_1fr_1fr_auto] items-end gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pb-2 font-mono text-sm text-muted",
						children: vertexLabel(i)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
						id: `vx-${i}`,
						label: "x",
						value: v.x,
						onChange: (x) => {
							onChange(vertices.map((p, k) => k === i ? {
								...p,
								x
							} : p));
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MmField, {
						id: `vy-${i}`,
						label: "y",
						value: v.y,
						onChange: (y) => {
							onChange(vertices.map((p, k) => k === i ? {
								...p,
								y
							} : p));
						}
					}),
					maxCount > minCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "icon",
						className: "mb-0.5 size-10",
						disabled: vertices.length <= minCount,
						"aria-label": `Remover ${vertexLabel(i)}`,
						onClick: () => onChange(vertices.filter((_, k) => k !== i)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
				]
			}, i)),
			maxCount > minCount && vertices.length < maxCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				className: "self-start",
				onClick: () => {
					const last = vertices[vertices.length - 1] ?? {
						x: 0,
						y: 0
					};
					onChange([...vertices, {
						x: last.x + 40,
						y: last.y + 30
					}]);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "Vértice"]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [
					"Coordenadas locais, mm. Mínimo ",
					minCount,
					" pontos."
				]
			})
		]
	});
}
function PackHint({ pack }) {
	if (pack === "hex") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-fg",
			children: "Lattice hexagonal — centros a 60°"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1",
			children: "Disco e hexágono encostam pela folga laser"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Flange usa o Ø externo; o furo é só corte" })
	] });
	if (pack === "grid") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-fg",
			children: "Grade eixo-alinhada · 0° / 90°"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1",
			children: "Quadrado, retângulo e perfis em AABB + folga"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "O retângulo escolhe a rotação que mais cabe" })
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-fg",
			children: "Fileira par ▽△▽△ · ímpar △▽△▽"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1",
			children: "Par = peça + 180° no ponto médio da aresta"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Folga = offset no lattice; o padrão não muda" })
	] });
}
function SectionTitle({ n, title, extra }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
		className: "flex items-baseline gap-2 text-sm font-medium text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] text-faint",
				children: n
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 truncate",
				children: title
			}),
			extra ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-auto shrink-0",
				children: extra
			}) : null
		]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-faint",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "text-fg",
		children: v
	})] });
}
function downloadCutList(kind, args) {
	const doc = buildNestExport(args);
	const body = kind === "json" ? JSON.stringify(doc, null, 2) : nestExportToCsv(doc);
	const blob = new Blob([body], { type: kind === "json" ? "application/json" : "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = nestExportFilename(kind);
	a.click();
	URL.revokeObjectURL(url);
}
var MIN_ZOOM = .2;
function fitCamera(w, h, sheet, pad = 56) {
	const availW = Math.max(1, w - pad * 2);
	const availH = Math.max(1, h - pad * 2);
	const scale = Math.min(availW / Math.max(sheet.width, 1), availH / Math.max(sheet.length, 1));
	const sw = sheet.width * scale;
	const sh = sheet.length * scale;
	const left = (w - sw) / 2;
	const top = (h - sh) / 2;
	return {
		scale: Math.max(scale, 1e-6),
		ox: left,
		oy: top + sh
	};
}
function toScreen(cam, x, y) {
	return {
		x: cam.ox + x * cam.scale,
		y: cam.oy - y * cam.scale
	};
}
function toWorld(cam, sx, sy) {
	return {
		x: (sx - cam.ox) / cam.scale,
		y: (cam.oy - sy) / cam.scale
	};
}
function panCamera(cam, dx, dy) {
	return {
		scale: cam.scale,
		ox: cam.ox + dx,
		oy: cam.oy + dy
	};
}
function zoomAt(cam, sx, sy, factor, minScale, maxScale) {
	const world = toWorld(cam, sx, sy);
	const scale = Math.min(maxScale, Math.max(minScale, cam.scale * factor));
	return {
		scale,
		ox: sx - world.x * scale,
		oy: sy + world.y * scale
	};
}
function zoomLimits(fitted) {
	return {
		min: fitted.scale * MIN_ZOOM,
		max: fitted.scale * 48
	};
}
function zoomPercent(cam, fitted) {
	if (fitted.scale <= 0) return 100;
	return Math.round(cam.scale / fitted.scale * 100);
}
function keepWorldCenter(cam, fromW, fromH, toW, toH) {
	const world = toWorld(cam, fromW / 2, fromH / 2);
	return {
		scale: cam.scale,
		ox: toW / 2 - world.x * cam.scale,
		oy: toH / 2 + world.y * cam.scale
	};
}
function dist(a, b) {
	return Math.hypot(a.x - b.x, a.y - b.y);
}
function midpoint(a, b) {
	return {
		x: (a.x + b.x) / 2,
		y: (a.y + b.y) / 2
	};
}
/**
* Pinça: zoom em torno do ponto médio inicial e pan conforme os dedos
* deslizam. `start` é a câmera no instante em que o segundo dedo desceu.
*/
function pinchCamera(start, startA, startB, nowA, nowB, minScale, maxScale) {
	const startDist = dist(startA, startB);
	const nowDist = dist(nowA, nowB);
	const startMid = midpoint(startA, startB);
	const nowMid = midpoint(nowA, nowB);
	const factor = startDist < 1e-6 ? 1 : nowDist / startDist;
	return panCamera(zoomAt(start, startMid.x, startMid.y, factor, minScale, maxScale), nowMid.x - startMid.x, nowMid.y - startMid.y);
}
var C = {
	well: "#0c0d0e",
	sheet: "#1e2124",
	sheetLip: "#262a2e",
	gridMinor: "rgba(236, 234, 228, 0.04)",
	gridMajor: "rgba(236, 234, 228, 0.09)",
	axisX: "#8a5a50",
	axisY: "#4f6d58",
	up: "rgba(132, 142, 138, 0.92)",
	down: "rgba(58, 66, 64, 0.96)",
	stroke: "#101214",
	ink: "#c8ccd0",
	dim: "#6a7078",
	label: "#eceae4",
	chevron: "rgba(236, 234, 228, 0.42)",
	keepout: "rgba(0, 0, 0, 0.28)",
	keepoutLine: "rgba(236, 234, 228, 0.22)",
	dimLine: "rgba(236, 234, 228, 0.40)",
	liveStroke: "#d4cfc4"
};
var JOB_FILL = [
	{
		up: "rgba(108, 118, 124, 0.88)",
		down: "rgba(46, 52, 56, 0.94)"
	},
	{
		up: "rgba(124, 114, 104, 0.88)",
		down: "rgba(54, 48, 44, 0.94)"
	},
	{
		up: "rgba(104, 120, 112, 0.88)",
		down: "rgba(44, 54, 50, 0.94)"
	},
	{
		up: "rgba(118, 110, 122, 0.88)",
		down: "rgba(50, 46, 56, 0.94)"
	}
];
function pathPoly(ctx, cam, verts) {
	const s0 = toScreen(cam, verts[0].x, verts[0].y);
	ctx.beginPath();
	ctx.moveTo(s0.x, s0.y);
	for (let i = 1; i < verts.length; i++) {
		const s = toScreen(cam, verts[i].x, verts[i].y);
		ctx.lineTo(s.x, s.y);
	}
	ctx.closePath();
}
function pathDisc(ctx, cam, cx, cy, r) {
	const c = toScreen(cam, cx, cy);
	ctx.beginPath();
	ctx.arc(c.x, c.y, Math.max(.5, Math.abs(r) * cam.scale), 0, Math.PI * 2);
}
function drawGrid(ctx, cam, sheet) {
	const minor = cam.scale * 50 >= 10 ? 50 : 0;
	const major = cam.scale * 100 >= 12 ? 100 : cam.scale * 200 >= 12 ? 200 : 500;
	const W = sheet.kind === "disc" ? sheet.width : sheet.width;
	const H = sheet.kind === "disc" ? sheet.width : sheet.length;
	const tl = toScreen(cam, 0, H);
	const br = toScreen(cam, W, 0);
	ctx.save();
	ctx.beginPath();
	if (sheet.kind === "disc") pathDisc(ctx, cam, W / 2, W / 2, W / 2);
	else ctx.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
	ctx.clip();
	if (minor) {
		ctx.strokeStyle = C.gridMinor;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let x = 0; x <= W + .01; x += minor) {
			const a = toScreen(cam, x, 0);
			const b = toScreen(cam, x, H);
			ctx.moveTo(a.x + .5, a.y);
			ctx.lineTo(b.x + .5, b.y);
		}
		for (let y = 0; y <= H + .01; y += minor) {
			const a = toScreen(cam, 0, y);
			const b = toScreen(cam, W, y);
			ctx.moveTo(a.x, a.y + .5);
			ctx.lineTo(b.x, b.y + .5);
		}
		ctx.stroke();
	}
	ctx.strokeStyle = C.gridMajor;
	ctx.lineWidth = 1;
	ctx.beginPath();
	for (let x = 0; x <= W + .01; x += major) {
		const a = toScreen(cam, x, 0);
		const b = toScreen(cam, x, H);
		ctx.moveTo(a.x + .5, a.y);
		ctx.lineTo(b.x + .5, b.y);
	}
	for (let y = 0; y <= H + .01; y += major) {
		const a = toScreen(cam, 0, y);
		const b = toScreen(cam, W, y);
		ctx.moveTo(a.x, a.y + .5);
		ctx.lineTo(b.x, b.y + .5);
	}
	ctx.stroke();
	ctx.restore();
}
function drawSheet(ctx, cam, sheet) {
	if (sheet.kind === "disc") {
		const D = sheet.width;
		const c = toScreen(cam, D / 2, D / 2);
		const r = D / 2 * cam.scale;
		const lip = 5;
		ctx.fillStyle = C.sheetLip;
		ctx.beginPath();
		ctx.arc(c.x + lip, c.y + lip, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = C.sheet;
		ctx.beginPath();
		ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = "rgba(236,234,228,0.10)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(c.x, c.y, Math.max(.5, r - .5), 0, Math.PI * 2);
		ctx.stroke();
		return;
	}
	const origin = toScreen(cam, 0, 0);
	const topRight = toScreen(cam, sheet.width, sheet.length);
	const w = topRight.x - origin.x;
	const h = origin.y - topRight.y;
	const lip = 5;
	ctx.fillStyle = C.sheetLip;
	ctx.beginPath();
	ctx.moveTo(origin.x, origin.y);
	ctx.lineTo(origin.x + lip, origin.y + lip);
	ctx.lineTo(origin.x + w + lip, origin.y + lip);
	ctx.lineTo(origin.x + w + lip, origin.y - h + lip);
	ctx.lineTo(origin.x + w, origin.y - h);
	ctx.lineTo(origin.x + w, origin.y);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = C.sheet;
	ctx.fillRect(origin.x, origin.y - h, w, h);
	ctx.strokeStyle = "rgba(236,234,228,0.10)";
	ctx.lineWidth = 1;
	ctx.strokeRect(origin.x + .5, origin.y - h + .5, w - 1, h - 1);
}
function drawKeepout(ctx, cam, sheet, margin) {
	if (margin <= 0) return;
	if (sheet.kind === "disc") {
		const D = sheet.width;
		const c = toScreen(cam, D / 2, D / 2);
		const rOut = D / 2 * cam.scale;
		const rIn = Math.max(0, D / 2 - margin) * cam.scale;
		ctx.save();
		ctx.beginPath();
		ctx.arc(c.x, c.y, rOut, 0, Math.PI * 2);
		if (rIn > .5) ctx.arc(c.x, c.y, rIn, 0, Math.PI * 2, true);
		ctx.clip();
		ctx.fillStyle = C.keepout;
		ctx.fill();
		ctx.restore();
		if (rIn > .5) {
			ctx.strokeStyle = C.keepoutLine;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(c.x, c.y, rIn, 0, Math.PI * 2);
			ctx.stroke();
		}
		if (margin * cam.scale >= 12) {
			ctx.fillStyle = C.ink;
			ctx.strokeStyle = C.dimLine;
			ctx.lineWidth = 1;
			ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			const outer = toScreen(cam, D / 2, 0);
			const inner = toScreen(cam, D / 2, margin);
			ctx.beginPath();
			ctx.moveTo(outer.x, outer.y);
			ctx.lineTo(inner.x, inner.y);
			ctx.stroke();
			ctx.fillText(formatMm(margin), (outer.x + inner.x) / 2 + 14, (outer.y + inner.y) / 2);
			ctx.textAlign = "left";
			ctx.textBaseline = "alphabetic";
		}
		return;
	}
	const origin = toScreen(cam, 0, 0);
	const topRight = toScreen(cam, sheet.width, sheet.length);
	const w = topRight.x - origin.x;
	const h = origin.y - topRight.y;
	const innerW = Math.max(0, sheet.width - 2 * margin);
	const innerH = Math.max(0, sheet.length - 2 * margin);
	const usable = innerW > 0 && innerH > 0;
	const innerBl = toScreen(cam, margin, margin);
	const innerTr = toScreen(cam, margin + innerW, margin + innerH);
	const iw = innerTr.x - innerBl.x;
	const ih = innerBl.y - innerTr.y;
	const px = margin * cam.scale;
	ctx.save();
	ctx.beginPath();
	ctx.rect(origin.x, origin.y - h, w, h);
	if (usable && iw > .5 && ih > .5) ctx.rect(innerBl.x, innerTr.y, iw, ih);
	ctx.clip("evenodd");
	ctx.fillStyle = C.keepout;
	ctx.fillRect(origin.x, origin.y - h, w, h);
	ctx.restore();
	if (usable && iw > .5 && ih > .5) {
		ctx.strokeStyle = C.keepoutLine;
		ctx.lineWidth = 1;
		ctx.strokeRect(innerBl.x + .5, innerTr.y + .5, Math.max(0, iw - 1), Math.max(0, ih - 1));
	}
	if (px < 12) return;
	const label = formatMm(margin);
	ctx.fillStyle = C.ink;
	ctx.strokeStyle = C.dimLine;
	ctx.lineWidth = 1;
	ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	const bx = sheet.width * .55;
	const bottomOuter = toScreen(cam, bx, 0);
	const bottomInner = toScreen(cam, bx, margin);
	ctx.beginPath();
	ctx.moveTo(bottomOuter.x, bottomOuter.y);
	ctx.lineTo(bottomInner.x, bottomInner.y);
	ctx.stroke();
	ctx.fillText(label, (bottomOuter.x + bottomInner.x) / 2 + 14, (bottomOuter.y + bottomInner.y) / 2);
	const ly = sheet.length * .55;
	const leftOuter = toScreen(cam, 0, ly);
	const leftInner = toScreen(cam, margin, ly);
	ctx.beginPath();
	ctx.moveTo(leftOuter.x, leftOuter.y);
	ctx.lineTo(leftInner.x, leftInner.y);
	ctx.stroke();
	ctx.save();
	ctx.translate((leftOuter.x + leftInner.x) / 2, (leftOuter.y + leftInner.y) / 2);
	ctx.rotate(-Math.PI / 2);
	ctx.fillText(label, 0, -10);
	ctx.restore();
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
}
function drawAxes(ctx, cam, sheet) {
	const len = (sheet.kind === "disc" ? sheet.width : Math.min(sheet.width, sheet.length)) * .1;
	const o = toScreen(cam, 0, 0);
	const x = toScreen(cam, len, 0);
	const y = toScreen(cam, 0, len);
	ctx.lineWidth = 1.5;
	ctx.lineCap = "round";
	ctx.strokeStyle = C.axisX;
	ctx.beginPath();
	ctx.moveTo(o.x, o.y);
	ctx.lineTo(x.x, x.y);
	ctx.stroke();
	ctx.strokeStyle = C.axisY;
	ctx.beginPath();
	ctx.moveTo(o.x, o.y);
	ctx.lineTo(y.x, y.y);
	ctx.stroke();
	ctx.font = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
	ctx.fillStyle = C.axisX;
	ctx.fillText("X", x.x + 6, x.y + 4);
	ctx.fillStyle = C.axisY;
	ctx.fillText("Y", y.x - 4, y.y - 8);
	ctx.fillStyle = C.dim;
	ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
	ctx.textAlign = "center";
	if (sheet.kind === "disc") {
		const mid = toScreen(cam, sheet.width / 2, 0);
		const o2 = toScreen(cam, 0, 0);
		ctx.fillText(`Ø ${sheet.width} mm`, mid.x, o2.y + 22);
	} else {
		const midX = toScreen(cam, sheet.width / 2, 0);
		const midY = toScreen(cam, 0, sheet.length / 2);
		ctx.fillText(`${sheet.width} mm`, midX.x, o.y + 22);
		ctx.save();
		ctx.translate(midY.x - 22, midY.y);
		ctx.rotate(-Math.PI / 2);
		ctx.fillText(`${sheet.length} mm`, 0, 0);
		ctx.restore();
	}
	ctx.textAlign = "left";
}
function drawNested(ctx, cam, piece, showIndex, role, jobIndex = 0) {
	pathPoly(ctx, cam, piece.world);
	for (const hole of piece.holes) {
		if (hole.length < 3) continue;
		const s0 = toScreen(cam, hole[0].x, hole[0].y);
		ctx.moveTo(s0.x, s0.y);
		for (let i = 1; i < hole.length; i++) {
			const s = toScreen(cam, hole[i].x, hole[i].y);
			ctx.lineTo(s.x, s.y);
		}
		ctx.closePath();
	}
	if (role === "locked") {
		const tone = JOB_FILL[jobIndex % JOB_FILL.length];
		ctx.fillStyle = piece.pointing === "up" ? tone.up : tone.down;
	} else ctx.fillStyle = piece.pointing === "up" ? C.up : C.down;
	ctx.fill("evenodd");
	ctx.strokeStyle = role === "live" ? C.liveStroke : C.stroke;
	ctx.lineWidth = Math.max(.75, Math.min(role === "live" ? 1.7 : 1.3, cam.scale * .8));
	pathPoly(ctx, cam, piece.world);
	ctx.stroke();
	for (const hole of piece.holes) {
		if (hole.length < 3) continue;
		pathPoly(ctx, cam, hole);
		ctx.stroke();
	}
	const c = centroid(piece.world);
	const cs = toScreen(cam, c.x, c.y);
	if (piece.world.length === 3 && role === "live") {
		const apex = piece.pointing === "up" ? piece.world.reduce((a, p) => p.y > a.y ? p : a) : piece.world.reduce((a, p) => p.y < a.y ? p : a);
		const as = toScreen(cam, apex.x, apex.y);
		ctx.strokeStyle = C.chevron;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(cs.x, cs.y);
		ctx.lineTo(as.x, as.y);
		ctx.stroke();
	}
	if (!showIndex) return;
	ctx.fillStyle = C.label;
	ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(String(piece.index + 1), cs.x, cs.y);
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
}
function NestCanvas() {
	const hostRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const camRef = (0, import_react.useRef)(null);
	const fittedRef = (0, import_react.useRef)(null);
	const sizeRef = (0, import_react.useRef)({
		w: 0,
		h: 0,
		sw: 0,
		sl: 0,
		kind: "rect"
	});
	const pointersRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const panRef = (0, import_react.useRef)(null);
	const pinchRef = (0, import_react.useRef)(null);
	const sheet = useNestStore((s) => s.sheet);
	const margin = useNestStore((s) => s.margin);
	const jobs = useNestStore((s) => s.jobs);
	const { placements, lockedPlacements, valid } = useNestResult();
	const [pct, setPct] = (0, import_react.useState)(100);
	const [grabbing, setGrabbing] = (0, import_react.useState)(false);
	const syncPct = (0, import_react.useCallback)(() => {
		const cam = camRef.current;
		const fitted = fittedRef.current;
		if (!cam || !fitted) return;
		setPct(zoomPercent(cam, fitted));
	}, []);
	const paint = (0, import_react.useCallback)(() => {
		const canvas = canvasRef.current;
		const host = hostRef.current;
		if (!canvas || !host) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = host.clientWidth;
		const h = host.clientHeight;
		canvas.width = Math.max(1, Math.floor(w * dpr));
		canvas.height = Math.max(1, Math.floor(h * dpr));
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const prev = sizeRef.current;
		const sheetChanged = prev.sw !== sheet.width || prev.sl !== sheet.length || prev.kind !== (sheet.kind ?? "rect");
		const sizeChanged = prev.w !== w || prev.h !== h;
		const fitted = fitCamera(w, h, sheet);
		fittedRef.current = fitted;
		if (!camRef.current || sheetChanged || prev.w === 0) camRef.current = fitted;
		else if (sizeChanged) camRef.current = keepWorldCenter(camRef.current, prev.w, prev.h, w, h);
		sizeRef.current = {
			w,
			h,
			sw: sheet.width,
			sl: sheet.length,
			kind: sheet.kind ?? "rect"
		};
		const cam = camRef.current;
		ctx.fillStyle = C.well;
		ctx.fillRect(0, 0, w, h);
		drawSheet(ctx, cam, sheet);
		drawGrid(ctx, cam, sheet);
		drawKeepout(ctx, cam, sheet, margin);
		const showIndex = lockedPlacements.length + placements.length <= 36 && cam.scale * 80 > 14;
		const jobIndexById = new Map(jobs.map((j, i) => [j.id, i]));
		for (const piece of lockedPlacements) drawNested(ctx, cam, piece, false, "locked", jobIndexById.get(piece.jobId ?? "") ?? 0);
		if (valid) for (const piece of placements) drawNested(ctx, cam, piece, showIndex, "live");
		drawAxes(ctx, cam, sheet);
	}, [
		sheet,
		margin,
		placements,
		lockedPlacements,
		valid,
		jobs
	]);
	const applyCam = (0, import_react.useCallback)((next) => {
		camRef.current = next;
		paint();
		syncPct();
	}, [paint, syncPct]);
	(0, import_react.useLayoutEffect)(() => {
		paint();
		syncPct();
		const host = hostRef.current;
		const canvas = canvasRef.current;
		if (!host) return;
		const ro = new ResizeObserver(() => {
			paint();
			syncPct();
		});
		ro.observe(host);
		const onWheelNative = (e) => {
			e.preventDefault();
			const cam = camRef.current;
			const fitted = fittedRef.current;
			if (!cam || !fitted) return;
			const rect = host.getBoundingClientRect();
			const factor = Math.exp(-e.deltaY * .0018);
			const lim = zoomLimits(fitted);
			applyCam(zoomAt(cam, e.clientX - rect.left, e.clientY - rect.top, factor, lim.min, lim.max));
		};
		canvas?.addEventListener("wheel", onWheelNative, { passive: false });
		const blockPageGesture = (ev) => ev.preventDefault();
		canvas?.addEventListener("touchstart", blockPageGesture, { passive: false });
		canvas?.addEventListener("touchmove", blockPageGesture, { passive: false });
		return () => {
			ro.disconnect();
			canvas?.removeEventListener("wheel", onWheelNative);
			canvas?.removeEventListener("touchstart", blockPageGesture);
			canvas?.removeEventListener("touchmove", blockPageGesture);
		};
	}, [
		paint,
		syncPct,
		applyCam
	]);
	const fitView = (0, import_react.useCallback)(() => {
		const host = hostRef.current;
		if (!host) return;
		applyCam(fitCamera(host.clientWidth, host.clientHeight, sheet));
	}, [applyCam, sheet]);
	const nudgeZoom = (0, import_react.useCallback)((factor) => {
		const host = hostRef.current;
		const cam = camRef.current;
		const fitted = fittedRef.current;
		if (!host || !cam || !fitted) return;
		const lim = zoomLimits(fitted);
		applyCam(zoomAt(cam, host.clientWidth / 2, host.clientHeight / 2, factor, lim.min, lim.max));
	}, [applyCam]);
	const onPointerDown = (0, import_react.useCallback)((e) => {
		const canvas = canvasRef.current;
		const host = hostRef.current;
		if (!canvas || !host) return;
		if (e.pointerType !== "touch") canvas.setPointerCapture(e.pointerId);
		e.preventDefault();
		canvas.focus();
		pointersRef.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		if (pointersRef.current.size === 1 && e.button <= 1) {
			panRef.current = {
				id: e.pointerId,
				x: e.clientX,
				y: e.clientY
			};
			setGrabbing(true);
		} else if (pointersRef.current.size >= 2) {
			panRef.current = null;
			const pts = [...pointersRef.current.values()];
			const rect = host.getBoundingClientRect();
			const toHost = (p) => ({
				x: p.x - rect.left,
				y: p.y - rect.top
			});
			pinchRef.current = {
				cam: { ...camRef.current },
				a: toHost(pts[0]),
				b: toHost(pts[1])
			};
		}
	}, []);
	const onPointerMove = (0, import_react.useCallback)((e) => {
		if (!pointersRef.current.has(e.pointerId)) return;
		pointersRef.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		const cam = camRef.current;
		const fitted = fittedRef.current;
		const host = hostRef.current;
		if (!cam || !fitted || !host) return;
		if (pointersRef.current.size >= 2 && pinchRef.current) {
			const pts = [...pointersRef.current.values()];
			const rect = host.getBoundingClientRect();
			const toHost = (p) => ({
				x: p.x - rect.left,
				y: p.y - rect.top
			});
			const lim = zoomLimits(fitted);
			const next = pinchCamera(pinchRef.current.cam, pinchRef.current.a, pinchRef.current.b, toHost(pts[0]), toHost(pts[1]), lim.min, lim.max);
			camRef.current = next;
			paint();
			syncPct();
			return;
		}
		const pan = panRef.current;
		if (pan && pan.id === e.pointerId) {
			applyCam(panCamera(cam, e.clientX - pan.x, e.clientY - pan.y));
			panRef.current = {
				id: pan.id,
				x: e.clientX,
				y: e.clientY
			};
		}
	}, [
		applyCam,
		paint,
		syncPct
	]);
	const endPointer = (0, import_react.useCallback)((e) => {
		pointersRef.current.delete(e.pointerId);
		if (panRef.current?.id === e.pointerId) panRef.current = null;
		if (pointersRef.current.size < 2) pinchRef.current = null;
		if (pointersRef.current.size === 0) setGrabbing(false);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: hostRef,
		className: "relative h-full min-h-0 w-full overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: `block h-full w-full touch-none select-none focus-visible:outline-none ${grabbing ? "cursor-grabbing" : "cursor-grab"}`,
			"aria-label": "Vista da chapa de corte. Pinça: zoom. Arraste: pan. Duplo toque: enquadrar.",
			tabIndex: 0,
			onPointerDown,
			onPointerMove,
			onPointerUp: endPointer,
			onPointerCancel: endPointer,
			onDoubleClick: fitView,
			onKeyDown: (e) => {
				if (e.key === "+" || e.key === "=") {
					e.preventDefault();
					nudgeZoom(1.2);
				} else if (e.key === "-" || e.key === "_") {
					e.preventDefault();
					nudgeZoom(1 / 1.2);
				} else if (e.key === "0" || e.key === "f" || e.key === "F") {
					e.preventDefault();
					fitView();
				}
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 lg:p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto flex items-center gap-0.5 rounded-md bg-bg/90 p-1 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "icon",
						className: "size-10",
						"aria-label": "Reduzir zoom",
						onClick: () => nudgeZoom(1 / 1.25),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "min-w-14 px-1 text-center font-mono text-xs tabular-nums text-fg",
						"aria-label": "Enquadrar a chapa",
						onClick: fitView,
						children: [pct, "%"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "icon",
						className: "size-10",
						"aria-label": "Aumentar zoom",
						onClick: () => nudgeZoom(1.25),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "icon",
						className: "size-10",
						"aria-label": "Enquadrar a chapa",
						onClick: fitView,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scan, {})
					})
				]
			})
		})]
	});
}
function Workbench() {
	(0, import_react.useEffect)(() => persistNestState(), []);
	const sheet = useNestStore((s) => s.sheet);
	const quantity = useNestStore((s) => s.quantity);
	const margin = useNestStore((s) => s.margin);
	const gap = useNestStore((s) => s.gap);
	const setQuantity = useNestStore((s) => s.setQuantity);
	const nest = useNestResult();
	const headerLabel = nest.remainder > 0 ? `${nest.livePlaced}/${nest.requested} pç · ${nest.plateCount} chapa${nest.plateCount > 1 ? "s" : ""}` : `${nest.livePlaced} pç · ${nest.plateCount} chapa${nest.plateCount > 1 ? "s" : ""}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex shrink-0 items-center justify-between gap-3 border-b border-border px-[max(1rem,env(safe-area-inset-left))] py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.625rem,env(safe-area-inset-top))] lg:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-medium uppercase tracking-[0.22em] text-faint",
						children: APP_BRAND
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "truncate text-base font-medium tracking-tight lg:text-lg",
						children: APP_PRODUCT
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: nest.remainder > 0 ? "warn" : "neutral",
				children: headerLabel
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(12rem,40%)] lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_26rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative min-h-0 min-w-0 overflow-hidden touch-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NestCanvas, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 lg:p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md bg-bg/80 px-2.5 py-1.5 font-mono text-xs tabular-nums text-muted shadow-[var(--shadow-border)]",
						children: [
							sheet.kind === "disc" ? `Ø ${formatMm(sheet.width)} × ${formatMm(sheet.thickness)} mm` : `${formatMm(sheet.width)} × ${formatMm(sheet.length)} × ${formatMm(sheet.thickness)} mm`,
							nest.plateCount > 1 ? ` · chapa ${nest.plateIndex + 1}/${nest.plateCount}` : "",
							margin > 0 ? ` · borda ${formatMm(margin)}` : "",
							gap > 0 ? ` · folga ${formatMm(gap)}` : ""
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex items-center gap-1 rounded-md bg-bg/90 p-1 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								size: "icon",
								className: "size-10",
								"aria-label": "Diminuir quantidade",
								disabled: quantity <= 1,
								onClick: () => setQuantity(Math.max(1, quantity - 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-10 text-center font-mono text-xs tabular-nums text-fg",
								children: [
									nest.livePlaced,
									"/",
									quantity
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								size: "icon",
								className: "size-10",
								"aria-label": "Aumentar quantidade",
								disabled: quantity >= 200,
								onClick: () => setQuantity(Math.min(200, quantity + 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
							})
						]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "panel-scroll min-h-0 overflow-y-auto overscroll-contain border-t border-border touch-pan-y lg:border-t-0 lg:border-l",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlPanel, {})
			})]
		})]
	});
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-primary text-primary-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.48),0_0_0_1px_rgba(0,0,0,0.38)]",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 32 32",
			className: "size-[22px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "16,3.8 28.4,27.2 3.6,27.2",
				fill: "currentColor"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "16,12.2 22.8,25.4 9.2,25.4",
				className: "fill-ok",
				opacity: "0.85"
			})]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workbench, {});
}
//#endregion
export { Home as component };

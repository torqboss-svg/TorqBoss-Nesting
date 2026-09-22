// @ts-nocheck — restored from cache; public API unchanged
import type {
  AABB,
  NestClearance,
  NestFamily,
  NestResult,
  NestedPiece,
  Point,
  Polygon,
  Pose,
  Sheet,
  Triangle,
} from "./types.ts";

import { aabbHeight, aabbOf, aabbSeparation, aabbUsable, aabbWidth, applyPoseAll, area, canonicalize, canonicalizeTriangle, centroid, convexHull, cross, inflateTriangle, insetAabb, interiorsOverlap, isChevronLike, isDeltaLike, isDegenerate, isInsideAabb, isInsideCircle, minPolygonDistance, offsetConvex, rotate, signedArea, sub } from "./geometry.ts";
export const MAX_QUANTITY = 200;
/** Recuo máximo: metade do menor lado, menos 1 mm. */
export function maxSheetMargin(sheet: Sheet) {
	if (sheet.kind === "disc") return Math.max(0, Math.max(sheet.width, 0) / 2 - 1);
	return Math.max(0, Math.min(sheet.width, sheet.length) / 2 - 1);
}
/** ▽ se dois vértices definem o topo; △ se o ápice é o único ponto alto. */
export function pointingOf(world: readonly Point[]) {
	const ys = world.map((p) => p.y);
	const maxY = Math.max(...ys);
	const minY = Math.min(...ys);
	const span = Math.max(maxY - minY, 1);
	const atMax = world.filter((p) => Math.abs(p.y - maxY) <= span * .08).length;
	return atMax === 1 ? "up" : "down";
}
export function seedPointingDown(poly: Polygon) {
	if (pointingOf(poly) === "down") return poly;
	const flipped = applyPoseAll(poly, {
		x: 0,
		y: 0,
		rotationDeg: 180
	});
	return canonicalize(flipped);
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
		x: (dy / len) * g,
		y: (-dx / len) * g
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
	const even = hull.length >= 4 && hull.length % 2 === 0;
	if (!even) {
		const lat = aabbLattice(box, M);
		lat.pairOffset = pairOffset;
		lat.v1 = { x: w + g, y: 0 };
		lat.v2 = { x: 0, y: h + g };
		return lat;
	}
	const k = hull.length / 2;
	const e = [];
	for (let i = 0; i < k; i++) {
		e.push(sub(hull[(i + 1) % hull.length], hull[i]));
	}
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
		lat.v1 = { x: w + g, y: 0 };
		lat.v2 = { x: 0, y: h + g };
		return lat;
	}
	const cr = v1.x * v2.y - v1.y * v2.x;
	if (Math.hypot(v1.x, v1.y) < 1 || Math.hypot(v2.x, v2.y) < 1 || Math.abs(cr) < 1) {
		const lat = aabbLattice(box, M);
		lat.pairOffset = pairOffset;
		lat.v1 = { x: w + g, y: 0 };
		lat.v2 = { x: 0, y: h + g };
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
			x: v1.x + (v1.x / len1) * g,
			y: v1.y + (v1.y / len1) * g
		},
		v2: {
			x: v2.x + (v2.x / len2) * g,
			y: v2.y + (v2.y / len2) * g
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
const BAND = .75;
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
export function rowBands(placements: readonly NestedPiece[]) {
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
		for (let i = 1; i < row.length; i++) {
			if (row[i].pointing !== row[i - 1].pointing) alt += 1;
		}
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
	if (lattice) {
		const cross = Math.abs(lattice.v1.x * lattice.v2.y - lattice.v1.y * lattice.v2.x);
		const mag = Math.hypot(lattice.v1.x, lattice.v1.y) * Math.hypot(lattice.v2.x, lattice.v2.y) || 1;
		twoD = cross / mag;
	}
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
	const seen = new Set();
	const fitted = [];
	for (let n = -span; n <= span; n++) {
		for (let m = -span; m <= span; m++) {
			for (const pose of posesForCell(lattice, m, n)) {
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
		}
	}
	fitted.sort((a, b) => {
		const ay = aabbOf(a.world).minY;
		const by = aabbOf(b.world).minY;
		const dy = ay - by;
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
	if (dx === 0 && dy === 0) {
		return placements.map((p, index) => ({
			...p,
			index
		}));
	}
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
			const worldSlot = applyPoseAll(slot, slotPose);
			const world = inflateTriangle(worldSlot, -half);
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
		for (const q of out) {
			if (need <= 0) {
				if (interiorsOverlap(p.world, q.world)) {
					ok = false;
					break;
				}
			} else if (minPolygonDistance(p.world, q.world) < need) {
				ok = false;
				break;
			}
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
	for (let i = 0; i < placed.length; i++) {
		for (let j = i + 1; j < placed.length; j++) {
			const d = minPolygonDistance(placed[i].world, placed[j].world);
			if (d <= lim) n += 1;
		}
	}
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
	for (const p of a) {
		for (const q of b) {
			pts.push({
				x: p.x + q.x,
				y: p.y + q.y
			});
		}
	}
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
	const expanded = offsetConvex(stationary, Math.max(0, gap));
	const neg = moving.map((p) => ({
		x: -p.x,
		y: -p.y
	}));
	return minkowskiVertices(expanded, neg);
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
			if (placed.length < 8 && local.length <= 12) {
				for (let i = 0; i < nfps.length; i++) {
					for (let j = i + 1; j < nfps.length; j++) {
						candidates.push(...nfpIntersections(nfps[i], nfps[j]));
					}
				}
			}
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
			const dot = (eA.x * eB.x + eA.y * eB.y) / (lenA * lenB);
			if (dot > -.999) continue;
			if (Math.abs(lenA - lenB) > 1) continue;
			consider({
				x: A1.x - B2.x,
				y: A1.y - B2.y
			});
		}
	}
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			if (i === j) continue;
			consider({
				x: poly[i].x - poly[j].x,
				y: poly[i].y - poly[j].y
			});
		}
	}
	return ts;
}
function pickLatticeVectors(vectors, cellMin) {
	const sorted = [...vectors].sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
	let best = null;
	let bestArea = Infinity;
	let bestRect = -1;
	for (let i = 0; i < sorted.length; i++) {
		for (let j = i + 1; j < sorted.length; j++) {
			const a = sorted[i];
			const b = sorted[j];
			const cr = a.x * b.y - a.y * b.x;
			const cell = Math.abs(cr);
			if (cell < cellMin * .85 || cell > cellMin * 2.5) continue;
			const mag = (Math.hypot(a.x, a.y) || 1) * (Math.hypot(b.x, b.y) || 1);
			const rect = cell / mag;
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
	}
	return best;
}
function lattice2x2Clear(poly, v1, v2) {
	const origins = [
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
	];
	const pieces = origins.map((t) => poly.map((p) => ({
		x: p.x + t.x,
		y: p.y + t.y
	})));
	for (let i = 0; i < pieces.length; i++) {
		for (let j = i + 1; j < pieces.length; j++) {
			if (interiorsOverlap(pieces[i], pieces[j])) return false;
		}
	}
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
	for (const rot of [0, 90, 180, 270]) {
		const local = canonicalize(applyPoseAll(poly, {
			x: 0,
			y: 0,
			rotationDeg: rot
		}));
		const half = Math.max(0, gap) / 2;
		const inflated = half > 1e-9 ? offsetConvex(local, half) : local;
		if (inflated.length < 3 || signedArea(inflated) < signedArea(local) * .5) continue;
		const slot = canonicalize(inflated);
		const contacts = contactTranslations(slot);
		const lat = pickLatticeVectors(contacts, area(slot));
		if (!lat || !lattice2x2Clear(slot, lat.v1, lat.v2)) continue;
		const len1 = Math.hypot(lat.v1.x, lat.v1.y) || 1;
		const len2 = Math.hypot(lat.v2.x, lat.v2.y) || 1;
		const span = Math.min(48, Math.ceil(Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / Math.min(len1, len2)) + 6);
		const seen = new Set();
		const fitted = [];
		for (let n = -span; n <= span; n++) {
			for (let m = -span; m <= span; m++) {
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
				fitted.push({
					world
				});
			}
		}
		fitted.sort((a, b) => {
			const ay = aabbOf(a.world).minY;
			const by = aabbOf(b.world).minY;
			const dy = ay - by;
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
		if (clear.length > best.length || clear.length === best.length && nestAreaOf(clear) < nestAreaOf(best)) {
			best = clear;
		}
	}
	return best;
}
/**
 * Three extrema of a delta-like outline: base corners of the AABB plus the
 * unique apex. The curved sides sit slightly outside this triangle.
 */
function apexTriangle(poly) {
	const box = aabbOf(poly);
	const span = Math.max(box.maxY - box.minY, 1);
	const band = span * .08;
	const atMax = [];
	const atMin = [];
	for (const p of poly) {
		if (Math.abs(p.y - box.maxY) <= band) atMax.push(p);
		if (Math.abs(p.y - box.minY) <= band) atMin.push(p);
	}
	if (atMax.length === 1) {
		return [
			{ x: box.minX, y: box.minY },
			{ x: box.maxX, y: box.minY },
			{ x: atMax[0].x, y: atMax[0].y }
		];
	}
	if (atMin.length === 1) {
		return [
			{ x: box.minX, y: box.maxY },
			{ x: box.maxX, y: box.maxY },
			{ x: atMin[0].x, y: atMin[0].y }
		];
	}
	return null;
}
function distOutsideTriangle(p, tri) {
	const [A, B, C] = tri;
	const side = (a, b, q) => (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
	const sAB = side(A, B, C);
	const dAB = side(A, B, p);
	const dBC = side(B, C, p);
	const dCA = side(C, A, p);
	const inside = sAB >= 0 ? dAB >= -1e-6 && dBC >= -1e-6 && dCA >= -1e-6 : dAB <= 1e-6 && dBC <= 1e-6 && dCA <= 1e-6;
	if (inside) return 0;
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
		for (let a = 0; a < cand.length; a++) {
			for (let b = a + 1; b < cand.length; b++) {
				if (interiorsOverlap(cand[a].world, cand[b].world)) ov = true;
				const d = minPolygonDistance(cand[a].world, cand[b].world);
				if (d < minD) minD = d;
			}
		}
		const ok = !ov && cand.length > 0 && (cand.length < 2 || minD >= gap - .05);
		if (ok) {
			if (cand.length > best.length || cand.length === best.length && nestAreaOf(cand) < nestAreaOf(best) - 1) {
				best = cand;
			}
			hi = mid;
		} else lo = mid;
	}
	return keepClear(best, gap);
}
function packLatticeN(poly, sheet, requested, gap) {
	const seed = seedPointingDown(poly);
	const hull = convexHull(seed);
	if (hull.length === 3) {
		const packed = packLatticeTri(hull, sheet, requested, gap, true);
		return keepClear(packed.map((p) => {
			const world = applyPoseAll(seed, p.pose);
			return {
				...p,
				world,
				pointing: pointingOf(world)
			};
		}), gap);
	}
	const concave = hull.length !== seed.length;
	if (concave && !isChevronLike(seed)) {
		return packGrid(seed, sheet, requested, gap, [
			0,
			90,
			180,
			270
		]);
	}
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
					const worldSlot = applyPoseAll(slot, pose);
					const world = offsetConvex(worldSlot, -half);
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
	if (concave && isChevronLike(seed)) {
		const trans = packTranslationLattice(seed, sheet, requested, gap);
		return pickDense([
			trans,
			pair,
			grid
		], gap);
	}
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
		for (let j = 0; j < rows && placed.length < requested; j++) {
			for (let i = 0; i < cols && placed.length < requested; i++) {
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
	const D = Math.min(aabbWidth(box), aabbHeight(box));
	const pitch = D + gap;
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
	if (family === "grid") {
		const rots = [0, 90];
		return packGrid(poly, sheet, requested, gap, rots, holes, obstacles);
	}
	if (family === "pair180") {
		return poly.length === 3 ? packLatticeTri(poly, sheet, requested, gap) : packLatticeN(poly, sheet, requested, gap);
	}
	const pair = poly.length === 3 ? packLatticeTri(poly, sheet, requested, gap) : packLatticeN(poly, sheet, requested, gap);
	const grid = packGrid(poly, sheet, requested, gap, [
		0,
		90,
		180,
		270
	], holes, obstacles);
	return pickBest([pair, grid]);
}
function respectsGap(world, obstacles, gap) {
	if (obstacles.length === 0) return true;
	const need = Math.max(0, gap) - .05;
	const wb = aabbOf(world);
	for (const o of obstacles) {
		if (aabbSeparation(wb, aabbOf(o)) >= need) continue;
		if (need <= 0) {
			if (interiorsOverlap(world, o)) return false;
		} else if (minPolygonDistance(world, o) < need) {
			return false;
		}
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
		{ x: 0, y: 0 },
		{ x: 0, y: blob.maxY + gap },
		{ x: blob.minX, y: blob.maxY + gap },
		{ x: blob.maxX + gap, y: 0 },
		{ x: blob.maxX + gap, y: blob.minY },
		{ x: blob.maxX + gap, y: blob.maxY + gap },
	];
	const topSpan = Math.max(0, blob.maxX - blob.minX);
	const step = Math.max(60, topSpan / 10);
	for (let x = Math.max(0, blob.minX); x <= blob.maxX + 1; x += step) {
		pockets.push({ x, y: blob.maxY + gap });
	}
	for (let y = Math.max(0, blob.minY); y <= blob.maxY + 1; y += step) {
		pockets.push({ x: blob.maxX + gap, y });
	}
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
		if (t.x < -0.05 || t.y < -0.05) continue;
		const moved = shiftCluster(origin, t.x, t.y);
		if (!clusterFits(moved, obstacles, bounds, gap)) continue;
		const nb = aabbOf(moved.flatMap((p) => p.world));
		const score = nb.minY * 1_000_000 + nb.minX;
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

function shiftToDiscCenter(placed, D) {
	if (!placed.length) return placed;
	const box = aabbOf(placed.flatMap((p) => p.world));
	const mx = (box.minX + box.maxX) / 2;
	const my = (box.minY + box.maxY) / 2;
	const c = D / 2;
	return shiftCluster(placed, c - mx, c - my);
}

/** Hexágono no retalho circular: malha deslocada para ocupar a faixa da borda. */
function packHexRings(poly, D, requested, gap, holes, margin, obstacles) {
	const box = aabbOf(poly);
	const pw = aabbWidth(box);
	const ph = aabbHeight(box);
	const pitch = Math.min(pw, ph) + gap;
	if (pitch < 0.5 || requested <= 0) return [];
	const pitchY = pitch * (Math.sqrt(3) / 2);
	const c = D / 2;
	const rIn = c - Math.max(0, margin);
	if (rIn <= 0) return [];
	const radMax = Math.hypot(pw, ph) / 2;
	const span = Math.ceil((2 * rIn) / Math.min(pitch, pitchY)) + 3;

	const toPieces = (hits) => {
		hits.sort((a, b) => a.dist - b.dist || a.y - b.y || a.x - b.x);
		return hits.slice(0, requested).map((h) => {
			const pose = { x: h.x, y: h.y, rotationDeg: 0 };
			return {
				index: 0,
				pose,
				world: h.world,
				holes: mapHoles(holes, pose),
				pointing: pointingOf(h.world),
				pack: "hex",
			};
		});
	};

	const fill = (ox, oy, ang) => {
		const rad = (ang * Math.PI) / 180;
		const ca = Math.cos(rad);
		const sa = Math.sin(rad);
		const v1x = pitch * ca;
		const v1y = pitch * sa;
		const v2x = (pitch / 2) * ca - pitchY * sa;
		const v2y = (pitch / 2) * sa + pitchY * ca;
		const hits = [];
		for (let j = -span; j <= span; j++) {
			for (let i = -span; i <= span; i++) {
				const x = ox + i * v1x + j * v2x;
				const y = oy + i * v1y + j * v2y;
				const d = Math.hypot(x + pw / 2 - c, y + ph / 2 - c);
				if (d - radMax > rIn) continue;
				let world;
				if (d + radMax <= rIn) {
					world = poly.map((p) => ({ x: p.x + x, y: p.y + y }));
				} else {
					world = poly.map((p) => ({ x: p.x + x, y: p.y + y }));
					if (!isInsideCircle(world, c, c, rIn)) continue;
				}
				if (!respectsGap(world, obstacles, gap)) continue;
				hits.push({ x, y, world, dist: d });
			}
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
		return take.length * 1e12 - maxd * 1e6 - sum;
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
	for (const ang of [0, 15, 30]) {
		const rad = (ang * Math.PI) / 180;
		const ca = Math.cos(rad);
		const sa = Math.sin(rad);
		const v1x = pitch * ca;
		const v1y = pitch * sa;
		const v2x = (pitch / 2) * ca - pitchY * sa;
		const v2y = (pitch / 2) * sa + pitchY * ca;
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
	const wantPair =
		family === "pair180" ||
		family === "auto" ||
		(family !== "grid" && family !== "hex" && poly.length === 3);
	const wantGrid = family === "grid" || family === "auto";

	if (wantPair) {
		if (poly.length === 3) {
			const half = Math.max(0, gap) / 2;
			const seed = seedPointingDown(poly);
			const slot = canonicalizeTriangle(inflateTriangle(seed, half));
			for (let edge = 0; edge < 3; edge++) {
				specs.push({ type: "tri", seed, slot, half, lattice: makeLatticeTri(slot, edge), pack: "pair" });
			}
		} else if (poly.length <= 20) {
			const seed = seedPointingDown(canonicalize(poly));
			const limit = Math.min(seed.length, 6);
			for (let edge = 0; edge < limit; edge++) {
				const lattice = makeLatticeFromPair(seed, edge, gap);
				if (!lattice) continue;
				specs.push({ type: "pair", seed, slot: seed, half: 0, lattice, pack: "pair" });
			}
		}
	}
	if (wantGrid) {
		const rots = family === "grid" ? [0, 90] : [0, 90, 180, 270];
		for (const rot of rots) {
			const local = canonicalize(applyPoseAll(poly, { x: 0, y: 0, rotationDeg: rot }));
			const box = aabbOf(local);
			const pw = aabbWidth(box);
			const ph = aabbHeight(box);
			if (pw < 0.5 || ph < 0.5) continue;
			specs.push({
				type: "grid",
				seed: poly,
				local,
				rot,
				v1: { x: pw + gap, y: 0 },
				v2: { x: 0, y: ph + gap },
				pack: "grid",
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
		return take.length * 1e12 - maxd * 1e6 - sum;
	};

	let bestHits = [];
	let bestSpec = specs[0];
	let bestScore = -Infinity;

	for (const spec of specs) {
		const v1 = spec.type === "grid" ? spec.v1 : spec.lattice.v1;
		const v2 = spec.type === "grid" ? spec.v2 : spec.lattice.v2;
		const len1 = Math.hypot(v1.x, v1.y) || 1;
		const len2 = Math.hypot(v2.x, v2.y) || 1;
		const span = Math.min(48, Math.ceil((2 * rIn) / Math.min(len1, len2)) + 4);
		const steps = span >= 24 ? 4 : span >= 12 ? 6 : 8;
		const probe = spec.type === "grid" ? spec.local : spec.slot;
		const box = aabbOf(probe);
		const pw = aabbWidth(box);
		const ph = aabbHeight(box);
		const radMax = Math.hypot(pw, ph) / 2;

		const fill = (ox, oy) => {
			const hits = [];
			const seen = new Set();
			const accept = (world, dist, extra) => {
				if (world.length < 3) return;
				if (dist - radMax > rIn) return;
				if (dist + radMax > rIn && !isInsideCircle(world, c, c, rIn)) return;
				if (!respectsGap(world, obstacles, gap)) return;
				const key = centroidKey(world);
				if (seen.has(key)) return;
				seen.add(key);
				hits.push({ world, dist, ...extra });
			};

			if (spec.type === "grid") {
				for (let n = -span; n <= span; n++) {
					for (let m = -span; m <= span; m++) {
						const x = ox + m * v1.x + n * v2.x;
						const y = oy + m * v1.y + n * v2.y;
						const world = spec.local.map((p) => ({ x: p.x + x, y: p.y + y }));
						const d = Math.hypot(x + pw / 2 - c, y + ph / 2 - c);
						accept(world, d, { x, y, rot: spec.rot });
					}
				}
			} else {
				for (let n = -span; n <= span; n++) {
					for (let m = -span; m <= span; m++) {
						for (const pose0 of posesForCell(spec.lattice, m, n)) {
							const pose = { x: pose0.x + ox, y: pose0.y + oy, rotationDeg: pose0.rotationDeg };
							const worldSlot = applyPoseAll(spec.slot, pose);
							const wb = aabbOf(worldSlot);
							const d = Math.hypot((wb.minX + wb.maxX) / 2 - c, (wb.minY + wb.maxY) / 2 - c);
							const world =
								spec.half > 1e-9 && spec.slot.length === 3
									? inflateTriangle(worldSlot, -spec.half)
									: applyPoseAll(spec.seed, pose);
							accept(world, d, { pose, rot: pose.rotationDeg });
						}
					}
				}
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
			pack: bestSpec.pack,
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
	return (a * 180) / Math.PI;
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
	const phi = (phiDeg * Math.PI) / 180;
	const rot = ((phi - Math.atan2(by, bx)) * 180) / Math.PI;
	const target = {
		x: cx + d * Math.cos(phi),
		y: cy + d * Math.sin(phi),
	};
	const Vr = rotate(V, rot);
	return {
		x: target.x - Vr.x,
		y: target.y - Vr.y,
		rotationDeg: rot,
	};
}

function discPackScore(placed, c) {
	if (!placed.length) return -Infinity;
	let sum = 0;
	let maxd = 0;
	for (const p of placed) {
		for (const v of p.world) {
			const d = Math.hypot(v.x - c, v.y - c);
			if (d > maxd) maxd = d;
			sum += d;
		}
	}
	return placed.length * 1e12 - maxd * 1e6 - sum;
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
		hubs.push({ index: i, deg, fold });
	}
	if (hubs.length === 0) return [];

	let best = [];
	let bestScore = -Infinity;
	for (const hub of hubs) {
		const theta = (hub.deg * Math.PI) / 180;
		const sinHalf = Math.sin(theta / 2);
		const d = sinHalf > 1e-6 ? g / 2 / sinHalf : g / 2;
		const step = 360 / hub.fold;
		const starts = hub.fold === 4 ? [45, 0, 22.5] : [0, step / 4, step / 2];
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
					pack: "pair",
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
	const rest = packLatticeRings(
		poly,
		D,
		requested - best.length,
		gap,
		family,
		holes,
		margin,
		[...obstacles, ...best.map((p) => p.world)],
	);
	return [...best, ...rest].slice(0, requested);
}

export function tessellate(
  poly: readonly Point[],
  sheet: Sheet,
  count: number,
  clearance: Partial<NestClearance> = {},
): NestResult {
	const requested = Math.max(0, Math.min(MAX_QUANTITY, Math.floor(count)));
	const margin = Math.max(0, clearance.margin ?? 0);
	const gap = Math.max(0, clearance.gap ?? 0);
	const verts = poly.length === 3 ? poly : canonicalize(poly);
	if (requested === 0 || isDegenerate(verts)) return emptyResult(requested, margin, gap);
	const family = clearance.family ?? (verts.length === 3 ? "pair180" : "auto");
	const holes = clearance.holes ?? [];
	const rawObstacles = clearance.obstacles ?? [];

	if (sheet.kind === "disc") {
		const D = Math.max(1, sheet.width);
		if (D / 2 - margin <= 0.5) return emptyResult(requested, margin, gap);
		let fitted;
		if (family === "hex") {
			fitted = packHexRings(verts, D, requested, gap, holes, margin, rawObstacles);
		} else {
			const lattice = clipDisc(
				packLatticeRings(verts, D, requested, gap, family, holes, margin, rawObstacles),
				D,
				margin,
			).slice(0, requested);
			if (family === "grid") {
				fitted = lattice;
			} else {
				const wheel = clipDisc(
					packPinwheelOnDisc(verts, D, requested, gap, family, holes, margin, rawObstacles),
					D,
					margin,
				).slice(0, requested);
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
			gap,
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
	})) {
		return emptyResult(requested, margin, gap);
	}
	const innerObstacles = margin === 0 ? rawObstacles : rawObstacles.map((o) => o.map((p) => ({
		x: p.x - margin,
		y: p.y - margin
	})));
	const packed = packFamily(verts, inner, requested, gap, family, clearance.holes ?? []);
	const fitted = innerObstacles.length === 0 ? packed : placeAroundObstacles(packed, innerObstacles, inner, gap, verts, requested, family, clearance.holes ?? []);
	const placements = translatePlacements(fitted, margin, margin);
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
export function patternPreview(placements: readonly NestedPiece[], rows = 2) {
	return rowBands(placements).slice(0, rows).map(rowGlyphs).join(" ");
}
export function nestHasInteriorOverlap(placements: readonly NestedPiece[]) {
	for (let i = 0; i < placements.length; i++) {
		for (let j = i + 1; j < placements.length; j++) {
			if (interiorsOverlap(placements[i].world, placements[j].world)) return true;
		}
	}
	return false;
}

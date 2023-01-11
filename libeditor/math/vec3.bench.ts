import { Vec3 } from "./vec3.ts"

Deno.bench("new Vec3", () => {
	new Vec3();
});

const m = new Vec3();
const b = new Float32Array(3);
Deno.bench("Vec3.toArrayBuffer", () => {
	m.toArrayBuffer(b);
});

Deno.bench("Vec3.fromArrayBuffer", () => {
	m.fromArrayBuffer(b);
});
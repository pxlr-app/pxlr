import { Mat4 } from "./mat4.ts"

Deno.bench("new Mat4", () => {
	new Mat4();
});

const m = new Mat4();
const b = new Float32Array(16);
Deno.bench("Mat4.toArrayBuffer", () => {
	m.toArrayBuffer(b);
});

Deno.bench("Mat4.fromArrayBuffer", () => {
	m.fromArrayBuffer(b);
});
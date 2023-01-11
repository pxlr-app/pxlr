import { Extent2 } from "./extent2.ts"

Deno.bench("new Extent2", () => {
	new Extent2();
});

const m = new Extent2();
const b = new Float32Array(3);
Deno.bench("Extent2.toArrayBuffer", () => {
	m.toArrayBuffer(b);
});

Deno.bench("Extent2.fromArrayBuffer", () => {
	m.fromArrayBuffer(b);
});
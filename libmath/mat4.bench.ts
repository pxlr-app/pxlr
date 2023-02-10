import * as Mat4 from "./mat4.ts";

const m = Mat4.create();
const b = Mat4.create(Float32Array);

Deno.bench("Mat4.toFloat32Array", () => {
	Mat4.toArrayBuffer(b, m);
});

Deno.bench("Mat4.fromArrayBuffer", () => {
	Mat4.fromArrayBuffer(m, b);
});

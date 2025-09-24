import { Mat4 } from "./mat4.ts";

Deno.bench("Mat4 as NumberArray", () => {
	new Mat4();
});

Deno.bench("Mat4 as Float32Array", () => {
	new Mat4(Float32Array);
});

Deno.bench("Mat4 as Float64Array", () => {
	new Mat4(Float64Array);
});

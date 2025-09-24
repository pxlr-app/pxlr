import { assertEquals } from "@std/assert";
import { Buffer } from "@std/streams";
import { ResponseReaderStream, ResponseWriterStream } from "./response.ts";

Deno.test("ResponseReaderStream", async () => {
	const ser1 = new ResponseReaderStream();
	const w1 = ser1.writable.getWriter();
	w1.write({ type: "header", key: "foo", value: "1" });
	w1.write({ type: "header", key: "bar", value: "2" });
	w1.write({
		type: "body",
		data: new Uint8Array([1, 2, 3, 4]),
	});
	w1.close();

	const buf1 = new Buffer();
	await ser1.readable.pipeTo(buf1.writable);

	assertEquals(
		buf1.bytes(),
		new Uint8Array([
			102,
			111,
			111,
			58,
			32,
			49,
			13,
			10,
			98,
			97,
			114,
			58,
			32,
			50,
			13,
			10,
			13,
			10,
			1,
			2,
			3,
			4,
		]),
	);
});

Deno.test("ResponseWriterStream", async () => {
	const buf1 = new Buffer([
		102,
		111,
		111,
		58,
		32,
		49,
		13,
		10,
		98,
		97,
		114,
		58,
		32,
		50,
		13,
		10,
		13,
		10,
		1,
		2,
		3,
		4,
	]);

	const der1 = new ResponseWriterStream();
	buf1.readable.pipeThrough(der1);
	const r1 = der1.readable.getReader();
	assertEquals(await r1.read(), { done: false, value: { type: "header", key: "foo", value: "1" } });
	assertEquals(await r1.read(), { done: false, value: { type: "header", key: "bar", value: "2" } });
	assertEquals(await r1.read(), { done: false, value: { type: "body", data: new Uint8Array([1, 2, 3, 4]) } });
	assertEquals(await r1.read(), { done: true, value: undefined });
});

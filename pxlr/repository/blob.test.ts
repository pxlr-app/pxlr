import { assert, assertEquals } from "@std/assert";
import { Blob } from "./blob.ts";

Deno.test("Blob", async (t) => {
	const helloWorld = new TextEncoder().encode("Hello World!");
	await t.step("create", async () => {
		const obj1 = await Blob.new({ "content-type": "text/plain" }, helloWorld);
		assertEquals(obj1.hash, "6cbc8283ce4d3ea32335b222b021b7c135958ec4");
		assertEquals(obj1.headers.get("content-type"), "text/plain");
		assertEquals(obj1.content, helloWorld);
	});

	await t.step("toReadableStream", async () => {
		const obj1 = await Blob.new({ "content-type": "text/plain" }, helloWorld);
		assertEquals(
			await new Response(obj1.toReadableStream()).text(),
			`content-length: 12\r\ncontent-type: text/plain\r\n\r\nHello World!`,
		);
	});

	await t.step("fromArrayBuffer", async () => {
		const obj1 = await Blob.new(helloWorld);
		const obj2 = await Blob.fromReadableStream(obj1.toReadableStream());
		assertEquals(obj2, obj1);
	});
});

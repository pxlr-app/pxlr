import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../autoid.ts";
import { readResponse, writeResponse } from "./helper.ts";
import { Object, ObjectSerializer } from "./object.ts";

Deno.test("Object", async (t) => {
	class DummyObject extends Object {
		constructor(id: string, type: string) {
			super(id, type);
		}
	}
	class DummyObjectSerializer extends ObjectSerializer<DummyObject> {
		async serialize(stream: WritableStream, object: DummyObject) {
			await writeResponse(stream, { id: object.id, type: object.type });
		}
		async deserialize(stream: ReadableStream) {
			const { headers } = await readResponse(stream);
			return new DummyObject(headers.get("id")!, headers.get("type")!);
		}
	}
	await t.step("serialize and deserialize", async () => {
		const ser = new DummyObjectSerializer();
		const obj1 = new DummyObject(autoid(), "Dummy");
		const buf = new Buffer();
		await ser.serialize(buf.writable, obj1);
		const obj2 = await ser.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.type, obj1.type);
	});
});

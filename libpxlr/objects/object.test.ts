import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../autoid.ts";
import { simpleDeserialize, simpleSerialize } from "./helper.ts";
import { Object, ObjectSerializer } from "./object.ts";

Deno.test("Object", async (t) => {
	class DummyObject extends Object {
		constructor(id: string, kind: string) {
			super(id, kind);
		}
	}
	class DummyObjectSerializer extends ObjectSerializer<DummyObject> {
		async serialize(stream: WritableStream, object: DummyObject) {
			await simpleSerialize(stream, { id: object.id, kind: object.kind });
		}
		async deserialize(stream: ReadableStream) {
			const { headers } = await simpleDeserialize(stream);
			return new DummyObject(headers.get("id")!, headers.get("kind")!);
		}
	}
	await t.step("serialize and deserialize", async () => {
		const ser = new DummyObjectSerializer();
		const obj1 = new DummyObject(autoid(), "Dummy");
		const buf = new Buffer();
		await ser.serialize(buf.writable, obj1);
		const obj2 = await ser.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.kind, obj1.kind);
	});
});

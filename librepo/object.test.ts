import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../libpxlr/autoid.ts";
import { BaseObject, deserializeBaseObject, serializeBaseObject } from "./object.ts";

Deno.test("ObjectBase", async (t) => {
	await t.step("serialize and deserialize", async () => {
		// const obj1 = new BaseObject({ id: autoid(), kind: "foo" }, "Foo");
		// const buf = new Buffer();
		// await serializeBaseObject(obj1, buf.writable);
		// const obj2 = await deserializeBaseObject(buf.readable);
		// assertEquals(obj2.headers.get("id"), obj1.headers.get("id"));
		// assertEquals(obj2.headers.get("kind"), obj1.headers.get("kind"));
		// assertEquals(await obj2.text(), await obj1.text());
	});
});

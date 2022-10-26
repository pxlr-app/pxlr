import { assert, assertEquals, assertFalse } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { BufferedRepository, MemoryFilesystem, Object, Reference } from "./mod.ts";
import { autoid } from "../autoid.ts";

Deno.test("Repository", async (t) => {
	await t.step("set/get reference", async () => {
		const fs = new MemoryFilesystem();
		const repo = new BufferedRepository(fs);
		const ref1 = new Reference("refs/heads/main", autoid());
		await repo.writeReference(ref1);
		assertFalse(fs.entries.has("refs/heads/main"));
		const ref2 = await repo.getReference("refs/heads/main");
		assertEquals(ref1, ref2);
		await repo.flushToFilesystem();
		assert(fs.entries.has("refs/heads/main"));
	});

	await t.step("list reference", async () => {
		const fs = new MemoryFilesystem();
		const repo = new BufferedRepository(fs);
		await repo.writeReference(new Reference("refs/heads/main", autoid()));

		const iterReference1 = repo.listReferencePath("refs/heads");
		assertEquals((await iterReference1.next()).value, "refs/heads/main");
		assertEquals((await iterReference1.next()).done, true);

		await repo.flushToFilesystem();

		const iterReference2 = repo.listReferencePath("refs/heads");
		assertEquals((await iterReference2.next()).value, "refs/heads/main");
		assertEquals((await iterReference2.next()).done, true);

		await repo.writeReference(new Reference("refs/heads/fix-hero", autoid()));

		const iterReference3 = repo.listReferencePath("refs/heads");
		assertEquals((await iterReference3.next()).value, "refs/heads/fix-hero");
		assertEquals((await iterReference3.next()).value, "refs/heads/main");
		assertEquals((await iterReference3.next()).done, true);
	});

	await t.step("set/get object", async () => {
		const fs = new MemoryFilesystem();
		const repo = new BufferedRepository(fs);
		const object1 = new Object(autoid(), autoid(), "note", { name: "README" }, "# Hello World");
		await repo.writeObject(object1);
		assertFalse(fs.entries.has(`objects/${object1.hash[0]}/${object1.hash[1]}/${object1.hash}`));
		const object2 = await repo.getObject(object1.hash);
		assertEquals(object1, object2);
		await repo.flushToFilesystem();
		assert(fs.entries.has(`objects/${object1.hash[0]}/${object1.hash[1]}/${object1.hash}`));
	});
});

import { MemoryRootFolder } from "@pxlr/vfs/memory";
import { Repository } from "./repository.ts";
import { assertEquals } from "@std/assert";

Deno.test("Repository", async (t) => {
	await t.step("constructor", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);
	});

	await t.step("head ops", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);
		await repo.setHead("refs/heads/main");
		assertEquals(await repo.getHead(), "refs/heads/main");
	});

	await t.step("object ops", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);
		const hash = await repo.setBlob(new TextEncoder().encode("Hello World"));
		assertEquals(hash, "0a4d55a8d778e5022fab701977c5d840bbc486d0");
		const file = await repo.getBlob(hash);
		assertEquals(await file.text(), "Hello World");
	});
});

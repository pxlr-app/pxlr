import { MemoryRootFolder } from "./memory.ts";
import { testFilesystemImpl } from "./impl.test.ts";
import { assertEquals } from "@std/assert";

Deno.test("Memory filesystem", async (t) => {
	await testFilesystemImpl(new MemoryRootFolder(), t);

	await t.step("fromArrayBuffer", async () => {
		const rootA = new MemoryRootFolder();
		const fileA = await rootA.getFile("a.txt");
		const folderA = await rootA.mkdir("folderA");
		const fileB = await folderA.getFile("b.txt");
		const fileC = await folderA.getFile("c.txt");
		await fileA.open({ write: true, create: true });
		await fileB.open({ write: true, create: true });
		await fileC.open({ write: true, create: true });
		await fileA.write(new TextEncoder().encode("Hello A"), 0);
		await fileB.write(new TextEncoder().encode("Hello B"), 0);
		await fileC.write(new TextEncoder().encode("Hello C"), 0);

		const entries1 = Array.from(rootA.storage.entries());
		entries1.sort((a, b) => a[0].localeCompare(b[0]));
		assertEquals(entries1.length, 4);

		const rootB = MemoryRootFolder.fromArrayBuffer(rootA.toArrayBuffer());
		const entries2 = Array.from(rootB.storage.entries());
		entries2.sort((a, b) => a[0].localeCompare(b[0]));
		assertEquals(entries2.length, 4);
		assertEquals(entries1, entries2);
	});
});

import { File, Folder } from "../mod.ts";
import { assert, assertEquals } from "@std/assert";

export async function testFilesystemImpl(
	root: Folder,
	ctx: Deno.TestContext,
): Promise<void> {
	await ctx.step("open file", async () => {
		const file = await root.open("a.txt");
		assertEquals(file.base, "a.txt");
		assertEquals(await file.exists(), false);
		assertEquals(await file.size(), 0);

		const written = await file.write(new TextEncoder().encode("Hello, world!"));
		assertEquals(written, 13);
		assertEquals(await file.exists(), true);
		assertEquals(await file.size(), 13);
	});

	await ctx.step("open dir", async () => {
		const entries = await Array.fromAsync(root.list());
		entries.sort((a, b) => a.base.localeCompare(b.base));
		assertEquals(entries.length, 1);
		assert(entries[0] instanceof File);
		assertEquals(entries[0].base, "a.txt");
		assertEquals(await entries[0].exists(), true);
		assertEquals(await entries[0].size(), 13);
	});

	// await ctx.step("mkdir", async () => {
	// 	const folder = await root.mkdir("subdir");
	// 	assertEquals(folder.base, "subdir");
	// 	assertEquals(await folder.exists(), true);
	// });
}

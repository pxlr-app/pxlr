import { DenoFolder } from "./deno.ts";
import { testFilesystemImpl } from "./impl.test.ts";

Deno.test("Deno filesystem", async (t) => {
	const root = await Deno.makeTempDir({ prefix: "vfs-deno-test-" });
	await testFilesystemImpl(new DenoFolder(root), t);
});

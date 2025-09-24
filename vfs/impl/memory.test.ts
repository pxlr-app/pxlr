import { MemoryRootFolder } from "./memory.ts";
import { testFilesystemImpl } from "./impl.test.ts";

Deno.test("Memory filesystem", async (t) => {
	await testFilesystemImpl(new MemoryRootFolder(), t);
});

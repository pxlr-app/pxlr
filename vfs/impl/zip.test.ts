import { ZipRootFolder } from "./zip.ts";
import { MemoryRootFolder } from "./memory.ts";
import { testFilesystemImpl } from "./impl.test.ts";
import { Zip } from "@pxlr/zip";

Deno.test("Zip filesystem", async (t) => {
	const storage = new MemoryRootFolder();
	await using file = await storage.getFile("test.zip");
	await file.open({ read: true, write: true, create: true });
	const zip = new Zip(file);
	await testFilesystemImpl(new ZipRootFolder(zip), t);
});

import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { ZipFilesystem } from "./zip.ts";
import { DenoFile, Zip } from "../../../libzip/mod.ts";

Deno.test("ZipFilesystem", async (t) => {
	const textEncoder = new TextEncoder();
	const textDecoder = new TextDecoder();
	await t.step("write", async () => {
		const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		{
			const fsFile = await Deno.open(tmpFile, { create: true, read: true, write: true, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();
			const zipfs = new ZipFilesystem(zip);

			const stream = await zipfs.write("README.md");
			const writer = stream.getWriter();
			await writer.write(textEncoder.encode("# Hello World"));
			await writer.close();

			for await (const path of zipfs.list("")) {
				console.log(path);
			}

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
		{
			const fsFile = await Deno.open(tmpFile, { read: true, write: false, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const readableContent = textDecoder.decode(await zip.get("README.md"));
			assertEquals(readableContent, "# Hello World");

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
	});
});

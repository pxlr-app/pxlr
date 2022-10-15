import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { ZipFilesystem } from "./zip.ts";
import { DenoFile, Zip } from "../../../libzip/mod.ts";

const textEncoder = new TextEncoder();

Deno.test("ZipFilesystem", async (t) => {
	await t.step("write", async () => {
		const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		console.log(tmpFile);
		{
			const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const zipfs = new ZipFilesystem(zip);
			const stream = await zipfs.write("README.md");
			const writer = stream.getWriter();
			await writer.write(textEncoder.encode("# Hello World"));
			await writer.close();

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
		{
			const fsFile = await Deno.open(tmpFile, { read: true, write: false, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const readableStream = await zip.getFile("README.md");
			assertEquals(await new Response(readableStream).text(), "# Hello World");

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
	});
});

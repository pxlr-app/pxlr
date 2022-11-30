import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts";
import { ZipFilesystem } from "./zip";
import { Zip } from "../../../libzip/index";
import { DenoFile } from "../../../libzip/file/deno";

Deno.test("ZipFilesystem", async (t) => {
	const textEncoder = new TextEncoder();
	const textDecoder = new TextDecoder();
	await t.step("write", async () => {
		const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		{
			const fsFile = await Deno.open(tmpFile, {
				create: true,
				read: true,
				write: true,
				truncate: false,
			});
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();
			const zipfs = new ZipFilesystem(zip);

			const stream = await zipfs.write("refs/heads/README.md");
			const writer = stream.getWriter();
			await writer.write(textEncoder.encode("# Hello World"));
			await writer.close();

			const listIter = zipfs.list("refs/heads");
			assertEquals((await listIter.next()).value, "README.md");
			assertEquals((await listIter.next()).done, true);

			const listIter2 = zipfs.list("");
			assertEquals((await listIter2.next()).value, "refs");
			assertEquals((await listIter2.next()).done, true);

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
		{
			const fsFile = await Deno.open(tmpFile, {
				read: true,
				write: false,
				truncate: false,
			});
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const readableContent = textDecoder.decode(await zip.get("refs/heads/README.md"));
			assertEquals(readableContent, "# Hello World");

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
	});
});

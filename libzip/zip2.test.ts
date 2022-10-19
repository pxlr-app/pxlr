import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { fromFileUrl } from "https://deno.land/std@0.159.0/path/mod.ts";
import { Zip } from "./zip2.ts";
import { DenoFile } from "./file/deno.ts";

Deno.test("Zip2", async (t) => {
	const textEncoder = new TextEncoder();

	await t.step("open", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-store2.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		// const fooHeader = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
		// console.log(fooHeader.fileName, fooHeader.uncompressedLength, fooHeader.compressedLength, fooHeader.localFileOffset);
		// const fooLocal = await zip.getLocalFileHeader("foobar/foo.txt");
		// console.log(fooLocal.fileName, fooLocal.uncompressedLength, fooLocal.compressedLength);
		const fooContent = await new Response(await zip.getStream("foobar/foo.txt")).text();
		console.log(fooContent);

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	await t.step("open64", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-store.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		// const fooHeader = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
		// console.log(fooHeader.fileName, fooHeader.uncompressedLength, fooHeader.compressedLength, fooHeader.localFileOffset);
		// const fooLocal = await zip.getLocalFileHeader("foobar/foo.txt");
		// console.log(fooLocal.fileName, fooLocal.uncompressedLength, fooLocal.compressedLength);
		const fooContent = await new Response(await zip.getStream("foobar/foo.txt")).text();
		console.log(fooContent);

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	await t.step("put", async () => {
		// const tmpFile = await Deno.makeTempFile({ suffix: '.zip' });
		// console.log(tmpFile);
		// const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: true });
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-put.zip")), { create: true, read: true, write: true, truncate: true });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		// const fooHeader = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
		// console.log(fooHeader.fileName, fooHeader.uncompressedLength, fooHeader.compressedLength, fooHeader.localFileOffset);
		// const fooLocal = await zip.getLocalFileHeader("foobar/foo.txt");
		// console.log(fooLocal.fileName, fooLocal.uncompressedLength, fooLocal.compressedLength);
		await zip.put("foobar/foo.txt", new TextEncoder().encode("foo"));
		// await zip.put("foobar/bar.txt", new TextEncoder().encode("bar"));
		// const fooContent = await new Response(await zip.get("foobar/foo.txt")).text();
		// console.log(fooContent);

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});
});

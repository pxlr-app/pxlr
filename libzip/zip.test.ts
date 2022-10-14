import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { fromFileUrl } from "https://deno.land/std@0.159.0/path/mod.ts";
import { Zip } from "./zip.ts";
import { DenoFile } from "./file/deno.ts";

Deno.test("Zip", async (t) => {
	await t.step("open", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-store.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();
		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	await t.step("iterCentralDirectoryFileHeaders", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-store.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		const fileHeaderIter = zip.iterCentralDirectoryFileHeaders();
		assertEquals((await fileHeaderIter.next()).value.fileName, "lipsum.txt");
		assertEquals((await fileHeaderIter.next()).value.fileName, "foobar/");
		assertEquals((await fileHeaderIter.next()).value.fileName, "foobar/foo.txt");
		assertEquals((await fileHeaderIter.next()).done, true);

		// for (const f of zip.iterCentralDirectoryFileHeaders()) {
		// 	console.log(f);
		// }

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	await t.step("getCentralDirectoryFileHeader", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-store.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		const centralDirectoryFileHeader = await zip.getCentralDirectoryFileHeader("lipsum.txt");
		assertEquals(centralDirectoryFileHeader.fileName, "lipsum.txt");

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	await t.step("getLocalFileHeader", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-store.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		const localFileHeader = await zip.getLocalFileHeader("lipsum.txt");
		assertEquals(localFileHeader.fileName, "lipsum.txt");

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	await t.step("getReadableStream (store)", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-store.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		const readableStream = await zip.getReadableStream("lipsum.txt");
		assertEquals(await new Response(readableStream).text().then((c) => hashContent(c)), "9f00f9c8e0aabc56ce4af7d5e29b369daa6de786d5a2a2b21318d36c4ba0638e");

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	await t.step("getReadableStream (delate)", async () => {
		const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("../.testdata/libzip-deflate.zip")), { read: true, write: false, truncate: false });
		const denoFile = new DenoFile(fsFile);
		const zip = new Zip(denoFile);
		await zip.open();

		const readableStream = await zip.getReadableStream("lipsum.txt");
		assertEquals(await new Response(readableStream).text().then((c) => hashContent(c)), "9f00f9c8e0aabc56ce4af7d5e29b369daa6de786d5a2a2b21318d36c4ba0638e");

		await zip.close();
		await denoFile.close();
		fsFile.close();
	});

	
	await t.step("putReadableStream", async () => {
		const tmpFile = await Deno.makeTempFile();
		await Deno.copyFile(fromFileUrl(import.meta.resolve("../.testdata/libzip-deflate.zip")), tmpFile);
		{
			const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const readableStream = new Response("foobar").body!;
			await zip.putReadableStream({ fileName: "foobar.txt", compressionMethod: 0, readableStream });

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
		{
			const fsFile = await Deno.open(tmpFile, { read: true, write: false, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const readableStream = await zip.getReadableStream("foobar.txt");
			assertEquals(await new Response(readableStream).text().then((c) => hashContent(c)), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
	});
});

async function hashContent(content: string) {
	const msgUint8 = new TextEncoder().encode(content);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return hashHex;
}

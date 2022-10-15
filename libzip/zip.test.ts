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

	await t.step("putReadableStream (store)", async () => {
		const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		await Deno.copyFile(fromFileUrl(import.meta.resolve("../.testdata/libzip-deflate.zip")), tmpFile);
		{
			const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const readableStream = new Response(
				`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vehicula lectus et risus commodo placerat id et magna. Nunc viverra nulla dolor, id lacinia nibh gravida et. Proin quis ante turpis. Praesent vitae diam imperdiet, maximus ligula eget, faucibus sapien. Nulla varius, ex sit amet molestie posuere, urna nunc facilisis diam, vel pretium neque nisl non sapien. Aenean sit amet pellentesque metus. Aenean ullamcorper finibus nibh, ut semper ipsum euismod eu.\r\n\r\nIn ut augue lectus. Etiam aliquet, est in sollicitudin dapibus, lorem felis rhoncus mi, id tristique eros velit eget orci. Maecenas pharetra feugiat ipsum sit amet efficitur. Vivamus odio quam, tincidunt in tincidunt sed, vehicula vitae ligula. Praesent ac faucibus nibh, ut rutrum justo. Donec at diam turpis. Nulla efficitur turpis accumsan pulvinar tincidunt. Aliquam et lacinia orci. Etiam et rutrum ipsum, ac interdum neque. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.`,
			).body!;
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
			assertEquals(await new Response(readableStream).text().then((c) => hashContent(c)), "d3a2e9b356625be299414f5a52c59a82a0935e2bca2ca5b6c085448f117d308c");

			await zip.close();
			await denoFile.close();
			fsFile.close();
		}
	});

	await t.step("putReadableStream (deflate)", async () => {
		const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		await Deno.copyFile(fromFileUrl(import.meta.resolve("../.testdata/libzip-deflate.zip")), tmpFile);
		{
			const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: false });
			const denoFile = new DenoFile(fsFile);
			const zip = new Zip(denoFile);
			await zip.open();

			const readableStream = new Response(
				`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vehicula lectus et risus commodo placerat id et magna. Nunc viverra nulla dolor, id lacinia nibh gravida et. Proin quis ante turpis. Praesent vitae diam imperdiet, maximus ligula eget, faucibus sapien. Nulla varius, ex sit amet molestie posuere, urna nunc facilisis diam, vel pretium neque nisl non sapien. Aenean sit amet pellentesque metus. Aenean ullamcorper finibus nibh, ut semper ipsum euismod eu.\r\n\r\nIn ut augue lectus. Etiam aliquet, est in sollicitudin dapibus, lorem felis rhoncus mi, id tristique eros velit eget orci. Maecenas pharetra feugiat ipsum sit amet efficitur. Vivamus odio quam, tincidunt in tincidunt sed, vehicula vitae ligula. Praesent ac faucibus nibh, ut rutrum justo. Donec at diam turpis. Nulla efficitur turpis accumsan pulvinar tincidunt. Aliquam et lacinia orci. Etiam et rutrum ipsum, ac interdum neque. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.`,
			).body!;
			await zip.putReadableStream({ fileName: "foobar.txt", compressionMethod: 8, readableStream });

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
			assertEquals(await new Response(readableStream).text().then((c) => hashContent(c)), "d3a2e9b356625be299414f5a52c59a82a0935e2bca2ca5b6c085448f117d308c");

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

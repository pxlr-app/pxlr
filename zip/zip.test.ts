import { assertEquals } from "@std/assert";
import { fromFileUrl } from "@std/path";
import { Zip } from "./zip.ts";
import { DenoFile } from "@pxlr/vfs/deno";

Deno.test("Zip", async (t) => {
	const textEncoder = new TextEncoder();
	const textDecoder = new TextDecoder();

	await t.step("open", async () => {
		await using file = new DenoFile(fromFileUrl(import.meta.resolve("./fixtures/libzip-store.zip")));
		await file.open({ read: true });
		const zip = new Zip(file);
		await zip.open();

		const fooFH = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
		assertEquals(fooFH.crc, 1996459178);

		await zip.close();
	});

	await t.step("open zip64", async () => {
		await using file = new DenoFile(fromFileUrl(import.meta.resolve("./fixtures/libzip-store64.zip")));
		await file.open({ read: true });
		const zip = new Zip(file);
		await zip.open();

		const fooFH = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
		assertEquals(fooFH.crc, 1996459178);

		await zip.close();
		await file.close();
	});

	await t.step("get", async () => {
		await using file = new DenoFile(fromFileUrl(import.meta.resolve("./fixtures/libzip-store64.zip")));
		await file.open({ read: true });
		const zip = new Zip(file);
		await zip.open();

		const fooContent = textDecoder.decode(await zip.get("foobar/foo.txt"));
		assertEquals(fooContent, "bar");

		await zip.close();
	});

	await t.step("getStream", async () => {
		await using file = new DenoFile(fromFileUrl(import.meta.resolve("./fixtures/libzip-store64.zip")));
		await file.open({ read: true });
		const zip = new Zip(file);
		await zip.open();

		const fooContent = await new Response(await zip.getStream("foobar/foo.txt"))
			.text();
		assertEquals(fooContent, "bar");

		await zip.close();
	});

	await t.step("put", async () => {
		const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		{
			await using file = new DenoFile(tmpFile);
			await file.open({ write: true });
			const zip = new Zip(file);
			await zip.open();

			assertEquals(
				await zip.put(`foobar.txt`, textEncoder.encode("foobar")),
				46,
			);

			await zip.close();
		}
		{
			await using file = new DenoFile(tmpFile);
			await file.open({ read: true });
			const zip = new Zip(file);
			await zip.open();

			const fooContent = textDecoder.decode(await zip.get("foobar.txt"));
			assertEquals(fooContent, "foobar");

			await zip.close();
		}
	});

	await t.step("putStream", async () => {
		const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
		{
			await using file = new DenoFile(tmpFile);
			await file.open({ write: true });
			const zip = new Zip(file);
			await zip.open();

			const stream = await zip.putStream("foobar.txt");
			const writer = stream.getWriter();
			await writer.write(textEncoder.encode("foobar"));
			await writer.close();

			await zip.close();
		}
		{
			await using file = new DenoFile(tmpFile);
			await file.open({ read: true });
			const zip = new Zip(file);
			await zip.open();

			const fooContent = await new Response(await zip.getStream("foobar.txt"))
				.text();
			assertEquals(fooContent, "foobar");

			await zip.close();
		}
	});

	// await t.step("put mixed", async () => {
	// 	const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			create: true,
	// 			read: true,
	// 			write: true,
	// 			truncate: true,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile);
	// 		await zip.open();

	// 		assertEquals(await zip.put(`foo.txt`, textEncoder.encode("foo")), 40);

	// 		await zip.remove(`foo.txt`);

	// 		const stream = await zip.putStream("bar.txt");
	// 		const writer = stream.getWriter();
	// 		await writer.write(textEncoder.encode("bar"));
	// 		await writer.close();

	// 		assertEquals(await zip.put(`foo.txt`, textEncoder.encode("foo2")), 41);

	// 		await zip.close();
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: false,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile);
	// 		await zip.open();

	// 		const barContent = textDecoder.decode(await zip.get("bar.txt"));
	// 		assertEquals(barContent, "bar");

	// 		const fooContent = textDecoder.decode(await zip.get("foo.txt"));
	// 		assertEquals(fooContent, "foo2");

	// 		await zip.close();
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// });

	// await t.step("non-awaited mixed", async () => {
	// 	const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			create: true,
	// 			read: true,
	// 			write: true,
	// 			truncate: true,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile);
	// 		await zip.open();

	// 		zip.put(`foo.txt`, textEncoder.encode("foo"));

	// 		zip.remove(`foo.txt`);

	// 		const stream = await zip.putStream("foo.txt");
	// 		const writer = stream.getWriter();
	// 		await writer.write(textEncoder.encode("foo2"));
	// 		await writer.close();

	// 		zip.put(`bar.txt`, textEncoder.encode("bar"));

	// 		assertEquals(
	// 			await new Response(await zip.getStream("bar.txt")).text(),
	// 			"bar",
	// 		);

	// 		zip.put(`baz.txt`, textEncoder.encode("baz"));

	// 		await zip.close();
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: false,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile);
	// 		await zip.open();

	// 		const barContent = textDecoder.decode(await zip.get("bar.txt"));
	// 		assertEquals(barContent, "bar");

	// 		const fooContent = textDecoder.decode(await zip.get("foo.txt"));
	// 		assertEquals(fooContent, "foo2");

	// 		const bazContent = textDecoder.decode(await zip.get("baz.txt"));
	// 		assertEquals(bazContent, "baz");

	// 		await zip.close();
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// });

	// await t.step("put padding", async () => {
	// 	const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
	// 	const centralDirectoryPaddingSize = 300;
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			create: true,
	// 			read: true,
	// 			write: true,
	// 			truncate: true,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		assertEquals(await zip.put(`foo.txt`, textEncoder.encode("foo")), 40);

	// 		assertEquals(await zip.close(), 411);
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: true,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		assertEquals(await zip.put(`bar.txt`, textEncoder.encode("bar")), 40);

	// 		assertEquals(await zip.close(), 103);
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: true,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		assertEquals(await zip.put(`baz.txt`, textEncoder.encode("baz")), 40);

	// 		assertEquals(await zip.close(), 103);
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: false,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		const fooContent = textDecoder.decode(await zip.get("foo.txt"));
	// 		assertEquals(fooContent, "foo");
	// 		const barContent = textDecoder.decode(await zip.get("bar.txt"));
	// 		assertEquals(barContent, "bar");
	// 		const bazContent = textDecoder.decode(await zip.get("baz.txt"));
	// 		assertEquals(bazContent, "baz");

	// 		assertEquals(await zip.close(), 0);
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// });

	// await t.step("1k files", async () => {
	// 	const tmpFile = await Deno.makeTempFile({ suffix: ".zip" });
	// 	const centralDirectoryPaddingSize = 100_000;
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			create: true,
	// 			read: true,
	// 			write: true,
	// 			truncate: true,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		for (let i = 1000; --i >= 0;) {
	// 			await zip.put(`file${i}.txt`, textEncoder.encode(i.toString()));
	// 		}

	// 		await zip.close();
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: true,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		assertEquals(await zip.put(`bar.txt`, textEncoder.encode("bar")), 40);

	// 		assertEquals(await zip.close(), 103);
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: true,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		//await zip.put(`file10.txt`, textEncoder.encode("101010101010"));
	// 		//await zip.rename(`file4.txt`, `file4444.txt`);
	// 		await zip.remove(`file4.txt`);

	// 		assertEquals(await zip.put(`baz.txt`, textEncoder.encode("baz")), 40);

	// 		assertEquals(await zip.close(), 516);
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// 	{
	// 		const fsFile = await Deno.open(tmpFile, {
	// 			read: true,
	// 			write: false,
	// 			truncate: false,
	// 		});
	// 		const denoFile = new DenoFile(fsFile);
	// 		const zip = new Zip(denoFile, { centralDirectoryPaddingSize });
	// 		await zip.open();

	// 		const a = textDecoder.decode(await zip.get("file3.txt"));
	// 		assertEquals(a, "3");

	// 		assertEquals(await zip.close(), 0);
	// 		await denoFile.close();
	// 		fsFile.close();
	// 	}
	// });

	// await t.step("put", async () => {
	// 	// const tmpFile = await Deno.makeTempFile({ suffix: '.zip' });
	// 	// console.log(tmpFile);
	// 	// const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: true });
	// 	const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("./fixtures/libzip-put.zip")), { create: true, read: true, write: true, truncate: true });
	// 	const denoFile = new DenoFile(fsFile);
	// 	const zip = new Zip(denoFile);
	// 	await zip.open();

	// 	// const fooHeader = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
	// 	// console.log(fooHeader.fileName, fooHeader.uncompressedLength, fooHeader.compressedLength, fooHeader.localFileOffset);
	// 	// const fooLocal = await zip.getLocalFileHeader("foobar/foo.txt");
	// 	// console.log(fooLocal.fileName, fooLocal.uncompressedLength, fooLocal.compressedLength);
	// 	const t = new TextEncoder().encode("foobar");
	// 	for (let i = 1_000_000; --i >= 0;) {
	// 		await zip.put(`file${i}.txt`, t);
	// 	}
	// 	// await zip.put("foobar/bar.txt", new TextEncoder().encode("bar"));
	// 	// const fooContent = await new Response(await zip.get("foobar/foo.txt")).text();
	// 	// console.log(fooContent);

	// 	await zip.close();
	// 	await denoFile.close();
	// 	fsFile.close();
	// });

	// await t.step("open64 put", async () => {
	// 	const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("./fixtures/libzip-put.zip")), { read: true, write: false, truncate: false });
	// 	const denoFile = new DenoFile(fsFile);
	// 	const zip = new Zip(denoFile);
	// 	await zip.open();

	// 	// const fooHeader = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
	// 	// console.log(fooHeader.fileName, fooHeader.uncompressedLength, fooHeader.compressedLength, fooHeader.localFileOffset);
	// 	// const fooLocal = await zip.getLocalFileHeader("foobar/foo.txt");
	// 	// console.log(fooLocal.fileName, fooLocal.uncompressedLength, fooLocal.compressedLength);
	// 	const fooContent = await new Response(await zip.getStream("file99999.txt")).text();
	// 	console.log(fooContent);

	// 	await zip.close();
	// 	await denoFile.close();
	// 	fsFile.close();
	// });

	// await t.step("ctf", async () => {
	// 	// const tmpFile = await Deno.makeTempFile({ suffix: '.zip' });
	// 	// console.log(tmpFile);
	// 	// const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: true });
	// 	const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("./fixtures/ctf.zip")), { create: true, read: true, write: true, truncate: true });
	// 	const denoFile = new DenoFile(fsFile);
	// 	const zip = new Zip(denoFile);
	// 	await zip.open();

	// 	await zip.put(`README.md`, new TextEncoder().encode(`# Mini Zip CTF\n\nLe flag se retrouve dans cet archive!`), { compressionMethod: 0 });
	// 	await zip.put(`flag.txt`, new TextEncoder().encode(`flag{I_kNoW_zIpFu!}`), { compressionMethod: 8 });
	// 	zip.remove(`flag.txt`);
	// 	await zip.put(`flag.txt`, new TextEncoder().encode(`Ça sera pas aussi facile!`), { compressionMethod: 0 });

	// 	await zip.close();
	// 	await denoFile.close();
	// 	fsFile.close();
	// });
});

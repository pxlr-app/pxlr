import { describe, expect, test } from '@jest/globals';
import { Zip } from "./zip";
import { NodeFile } from "./file";
import { open } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Zip", () => {
	const textEncoder = new TextEncoder();
	const textDecoder = new TextDecoder();

	test("open", async () => {
		const fsFile = await open(
			join(__dirname, ".testdata/libzip-store.zip"),
			"r",
		);
		const file = new NodeFile(fsFile);
		const zip = new Zip(file);
		await zip.open();

		const fooFH = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
		expect(fooFH.crc).toEqual(1996459178);

		await zip.close();
		await file.close();
		await fsFile.close();
	});

	test("open zip64", async () => {
		const fsFile = await open(
			join(__dirname, ".testdata/libzip-store64.zip"),
			"r",
		);
		const file = new NodeFile(fsFile);
		const zip = new Zip(file);
		await zip.open();

		const fooFH = zip.getCentralDirectoryFileHeader("foobar/foo.txt");
		expect(fooFH.crc).toEqual(1996459178);

		await zip.close();
		await file.close();
		await fsFile.close();
	});

	test("get", async () => {
		const fsFile = await open(
			join(__dirname, ".testdata/libzip-store64.zip"),
			"r",
		);
		const file = new NodeFile(fsFile);
		const zip = new Zip(file);
		await zip.open();

		const fooContent = textDecoder.decode(await zip.get("foobar/foo.txt"));
		expect(fooContent).toEqual("bar");

		await zip.close();
		await file.close();
		await fsFile.close();
	});

	test("getStream", async () => {
		const fsFile = await open(
			join(__dirname, ".testdata/libzip-store64.zip"),
			"r",
		);
		const file = new NodeFile(fsFile);
		const zip = new Zip(file);
		await zip.open();

		const fooContent = await new Response(await zip.getStream("foobar/foo.txt")).text();
		expect(fooContent).toEqual("bar");

		await zip.close();
		await file.close();
		await fsFile.close();
	});

	test("put", async () => {
		const tmpFile = join(tmpdir(), "test-zip-put.zip");
		{
			const fsFile = await open(tmpFile, "w+");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			expect(await zip.put(`foobar.txt`, textEncoder.encode("foobar"))).toEqual(46);

			await zip.close();
			await file.close();
			await fsFile.close();
		}
		{
			const fsFile = await open(tmpFile, "r");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			const fooContent = textDecoder.decode(await zip.get("foobar.txt"));
			expect(fooContent).toEqual("foobar");

			await zip.close();
			await file.close();
			await fsFile.close();
		}
	});

	test("putStream", async () => {
		const tmpFile = join(tmpdir(), "test-zip-putStream.zip");
		{
			const fsFile = await open(tmpFile, "w+");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			const stream = await zip.putStream("foobar.txt");
			const writer = stream.getWriter();
			await writer.write(textEncoder.encode("foobar"));
			await writer.close();

			await zip.close();
			await file.close();
			await fsFile.close();
		}
		{
			const fsFile = await open(tmpFile, "r");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			const fooContent = await new Response(await zip.getStream("foobar.txt"))
				.text();
			expect(fooContent).toEqual("foobar");

			await zip.close();
			await file.close();
			await fsFile.close();
		}
	});

	test("put mixed", async () => {
		const tmpFile = join(tmpdir(), "test-zip-put-mixed.zip");
		{
			const fsFile = await open(tmpFile, "w+");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			expect(await zip.put(`foo.txt`, textEncoder.encode("foo"))).toEqual(40);

			await zip.remove(`foo.txt`);

			const stream = await zip.putStream("bar.txt");
			const writer = stream.getWriter();
			await writer.write(textEncoder.encode("bar"));
			await writer.close();

			expect(await zip.put(`foo.txt`, textEncoder.encode("foo2"))).toEqual(41);

			await zip.close();
			await file.close();
			await fsFile.close();
		}
		{
			const fsFile = await open(tmpFile, "r");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			const barContent = textDecoder.decode(await zip.get("bar.txt"));
			expect(barContent).toEqual("bar");

			const fooContent = textDecoder.decode(await zip.get("foo.txt"));
			expect(fooContent).toEqual("foo2");

			await zip.close();
			await file.close();
			await fsFile.close();
		}
	});

	test("non-awaited mixed", async () => {
		const tmpFile = join(tmpdir(), "test-zip-non-awaited-mixed.zip");
		{
			const fsFile = await open(tmpFile, "w+");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			zip.put(`foo.txt`, textEncoder.encode("foo"));

			zip.remove(`foo.txt`);

			const stream = await zip.putStream("foo.txt");
			const writer = stream.getWriter();
			await writer.write(textEncoder.encode("foo2"));
			await writer.close();

			zip.put(`bar.txt`, textEncoder.encode("bar"));

			expect(await new Response(await zip.getStream("bar.txt")).text()).toEqual("bar");

			zip.put(`baz.txt`, textEncoder.encode("baz"));

			await zip.close();
			await file.close();
			await fsFile.close();
		}
		{
			const fsFile = await open(tmpFile, "r");
			const file = new NodeFile(fsFile);
			const zip = new Zip(file);
			await zip.open();

			const barContent = textDecoder.decode(await zip.get("bar.txt"));
			expect(barContent).toEqual("bar");

			const fooContent = textDecoder.decode(await zip.get("foo.txt"));
			expect(fooContent).toEqual("foo2");

			const bazContent = textDecoder.decode(await zip.get("baz.txt"));
			expect(bazContent).toEqual("baz");

			await zip.close();
			await file.close();
			await fsFile.close();
		}
	});

	// test("1k files", async () => {
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

	// test("put", async () => {
	// 	// const tmpFile = await Deno.makeTempFile({ suffix: '.zip' });
	// 	// console.log(tmpFile);
	// 	// const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: true });
	// 	const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("./.testdata/libzip-put.zip")), { create: true, read: true, write: true, truncate: true });
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

	// test("open64 put", async () => {
	// 	const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("./.testdata/libzip-put.zip")), { read: true, write: false, truncate: false });
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

	// test("ctf", async () => {
	// 	// const tmpFile = await Deno.makeTempFile({ suffix: '.zip' });
	// 	// console.log(tmpFile);
	// 	// const fsFile = await Deno.open(tmpFile, { read: true, write: true, truncate: true });
	// 	const fsFile = await Deno.open(fromFileUrl(import.meta.resolve("./.testdata/ctf.zip")), { create: true, read: true, write: true, truncate: true });
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

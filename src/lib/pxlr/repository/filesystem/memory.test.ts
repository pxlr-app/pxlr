import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts";
import { MemoryFilesystem } from "./memory";

const textEncoder = new TextEncoder();
//const textDecoder = new TextDecoder();

Deno.test("MemoryFilesystem", async () => {
	const fs = new MemoryFilesystem();
	fs.entries.set("refs/heads/main", textEncoder.encode("a"));
	fs.entries.set("objects/F/1/F123", textEncoder.encode("b"));
	fs.entries.set("objects/F/1/F124", textEncoder.encode("c"));
	fs.entries.set("objects/j/1/j123", textEncoder.encode("d"));
	fs.entries.set("objects/k/1/k123", textEncoder.encode("e"));
	fs.entries.set("objects/u/1/u123", textEncoder.encode("f"));

	const iter1 = fs.list("");
	assertEquals((await iter1.next()).value, "objects");
	assertEquals((await iter1.next()).value, "refs");
	assertEquals((await iter1.next()).done, true);

	const iter2 = fs.list("objects");
	assertEquals((await iter2.next()).value, "F");
	assertEquals((await iter2.next()).value, "j");
	assertEquals((await iter2.next()).value, "k");
	assertEquals((await iter2.next()).value, "u");
	assertEquals((await iter2.next()).done, true);
});

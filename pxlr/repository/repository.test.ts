import { MemoryRootFolder } from "@pxlr/vfs/memory";
import { Repository } from "./repository.ts";
import { assertEquals } from "@std/assert";
import { Blob } from "./blob.ts";
import { Commit } from "./commit.ts";
import { Tree } from "./tree.ts";
import { Reference } from "./reference.ts";

Deno.test("Repository", async (t) => {
	await t.step("blob", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);
		const blob1 = await Blob.new(new TextEncoder().encode("Hello World"));
		await repo.setObject(blob1);
		const blob2 = await repo.getBlob(blob1.hash);
		assertEquals(blob2, blob1);
	});

	await t.step("commit", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);

		const commitA = Commit.new({ tree: "", commiter: "commiter", date: new Date("2025-09-24T08:48:00.000Z"), message: "A" });
		const commitB = Commit.new({
			parent: commitA.hash,
			tree: "",
			commiter: "commiter",
			date: new Date("2025-09-24T08:49:00.000Z"),
			message: "B",
		});
		const commitC = Commit.new({
			parent: commitB.hash,
			tree: "",
			commiter: "commiter",
			date: new Date("2025-09-24T08:50:00.000Z"),
			message: "C",
		});

		await repo.setObject(commitA);
		await repo.setObject(commitB);
		await repo.setObject(commitC);

		const chains = await Array.fromAsync(repo.iterCommitChain(commitC.hash));
		assertEquals(chains.length, 3);
		assertEquals(chains[0][0], commitC.hash);
		assertEquals(chains[1][0], commitB.hash);
		assertEquals(chains[2][0], commitA.hash);
	});

	await t.step("reference", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);
		const ref1 = new Reference("refs/heads/main");
		await repo.setReference("refs/tags/init", ref1);
		const ref2 = await repo.getReference("refs/tags/init");
		assertEquals(ref2, ref1);

		const items = await Array.fromAsync(repo.iterReference("refs/tags"));

		assertEquals(items.length, 1);
		assertEquals(items[0][0], "refs/tags/init");
		assertEquals(items[0][1], ref1);

		await repo.setHead(ref1.reference);
		const head1 = await repo.getHead();
		assertEquals(head1, ref1);
	});

	await t.step("tree", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);

		const blobA = await Blob.new(new TextEncoder().encode("A"));
		const blobB = await Blob.new(new TextEncoder().encode("B"));
		const blobC = await Blob.new(new TextEncoder().encode("C"));
		const treeA = await Tree.new([
			{ hash: blobA.hash, kind: "blob", name: "fileA.txt" },
			{ hash: blobB.hash, kind: "blob", name: "fileB.txt" },
		]);
		const treeB = await Tree.new([
			{ hash: treeA.hash, kind: "tree", name: "folder" },
			{ hash: blobC.hash, kind: "blob", name: "fileC.txt" },
		]);

		await Promise.all([
			repo.setObject(blobA),
			repo.setObject(blobB),
			repo.setObject(blobC),
			repo.setObject(treeA),
			repo.setObject(treeB),
		]);

		const items = await Array.fromAsync(repo.iterTree(treeB.hash));

		assertEquals(items.length, 2);
		assertEquals(items[0][0], treeB.hash);
		assertEquals(items[1][0], treeA.hash);
	});
});

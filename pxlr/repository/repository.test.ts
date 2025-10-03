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
		const blob1 = Blob.create("blob", new TextEncoder().encode("Hello World"));
		await repo.setBlob(blob1);
		const blob2 = await repo.getBlob(blob1.hash);
		assertEquals(blob2, blob1);
	});

	await t.step("commit", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);

		const commitA = Commit.create(null, "", "commiter", new Date("2025-09-24T08:48:00.000Z"), "A");
		const commitB = Commit.create(commitA.hash, "", "commiter", new Date("2025-09-24T08:49:00.000Z"), "B");
		const commitC = Commit.create(commitB.hash, "", "commiter", new Date("2025-09-24T08:50:00.000Z"), "C");

		await repo.setCommit(commitA);
		await repo.setCommit(commitB);
		await repo.setCommit(commitC);

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

		const blobA = Blob.create("blob", new TextEncoder().encode("A"));
		const blobB = Blob.create("blob", new TextEncoder().encode("B"));
		const blobC = Blob.create("blob", new TextEncoder().encode("C"));
		const treeA = Tree.create([
			{ hash: blobA.hash, kind: "blob", name: "fileA.txt" },
			{ hash: blobB.hash, kind: "blob", name: "fileB.txt" },
		]);
		const treeB = Tree.create([
			{ hash: treeA.hash, kind: "tree", name: "folder" },
			{ hash: blobC.hash, kind: "blob", name: "fileC.txt" },
		]);

		await Promise.all([
			repo.setBlob(blobA),
			repo.setBlob(blobB),
			repo.setBlob(blobC),
			repo.setTree(treeA),
			repo.setTree(treeB),
		]);

		const items = await Array.fromAsync(repo.iterTree(treeB.hash));

		assertEquals(items.length, 2);
		assertEquals(items[0][0], treeB.hash);
		assertEquals(items[1][0], treeA.hash);
	});
});

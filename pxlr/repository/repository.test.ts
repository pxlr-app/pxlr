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
		const blob1 = new Blob("blob", new TextEncoder().encode("Hello World"));
		const hash = await repo.setBlob(blob1);
		assertEquals(hash, "5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689");
		const blob2 = await repo.getBlob(hash);
		assertEquals(blob2.content, blob1.content);
	});

	await t.step("commit", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);

		const hashCommitA = await repo.setCommit(new Commit(null, "", "commiter", new Date("2025-09-24T08:48:00.000Z"), "A"));
		const hashCommitB = await repo.setCommit(new Commit(hashCommitA, "", "commiter", new Date("2025-09-24T08:49:00.000Z"), "B"));
		const hashCommitC = await repo.setCommit(new Commit(hashCommitB, "", "commiter", new Date("2025-09-24T08:50:00.000Z"), "C"));
		assertEquals(hashCommitA, "cd6c155b9f8c0f69ddf88ea295429d03cd850390");
		assertEquals(hashCommitB, "fd16ae039789960ec31922b3361ea70aa9195cd6");
		assertEquals(hashCommitC, "5b13f4544d3aa207c418daabf1cbfbceacd86288");

		const chains = await Array.fromAsync(repo.iterCommitChain(hashCommitC));
		assertEquals(chains.length, 3);
		assertEquals(chains[0][0], hashCommitC);
		assertEquals(chains[1][0], hashCommitB);
		assertEquals(chains[2][0], hashCommitA);
	});

	await t.step("reference", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);
		await repo.setReference("refs/tags/init", new Reference("refs/heads/main"));
		const ref2 = await repo.getReference("refs/tags/init");
		assertEquals(ref2.kind, "ref");
		assertEquals(ref2.reference, "refs/heads/main");

		const items = await Array.fromAsync(repo.iterReference("refs/tags"));

		assertEquals(items.length, 1);
		assertEquals(items[0][0], "refs/tags/init");
		assertEquals(items[0][1].kind, "ref");
		assertEquals(items[0][1].reference, "refs/heads/main");

		await repo.setHead("refs/heads/main");
		const head1 = await repo.getHead();
		assertEquals(head1.kind, "ref");
		assertEquals(head1.reference, "refs/heads/main");
	});

	await t.step("tree", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);

		const hashBlobA = await repo.setBlob(new Blob("blob", new TextEncoder().encode("A")));
		const hashBlobB = await repo.setBlob(new Blob("blob", new TextEncoder().encode("B")));
		const hashBlobC = await repo.setBlob(new Blob("blob", new TextEncoder().encode("C")));
		const hashTreeA = await repo.setTree(
			new Tree([
				{ hash: hashBlobA, kind: "blob", name: "fileA.txt" },
				{ hash: hashBlobB, kind: "blob", name: "fileB.txt" },
			]),
		);
		const hashTreeB = await repo.setTree(
			new Tree([
				{ hash: hashTreeA, kind: "tree", name: "folder" },
				{ hash: hashBlobC, kind: "blob", name: "fileC.txt" },
			]),
		);

		assertEquals(hashTreeB, "5f2f2163df256339cd1613702dbd590ef461e502");

		const items = await Array.fromAsync(repo.iterTree(hashTreeB));

		assertEquals(items.length, 2);
		assertEquals(items[0][0], hashTreeB);
		assertEquals(items[1][0], hashTreeA);
	});
});

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
		const blob1 = new Blob(new TextEncoder().encode("Hello World"));
		const blob1h = await repo.setObject(blob1);
		const blob2 = await repo.getBlob(blob1h);
		assertEquals(blob2.content, blob1.content);
	});

	await t.step("commit", async () => {
		const root = new MemoryRootFolder();
		const repo = new Repository(root);

		const commitA = new Commit({ tree: "", commiter: "commiter", date: new Date("2025-09-24T08:48:00.000Z"), message: "A" });
		const commitAh = await repo.setObject(commitA);
		const commitB = new Commit({
			parent: commitAh,
			tree: "",
			commiter: "commiter",
			date: new Date("2025-09-24T08:49:00.000Z"),
			message: "B",
		});
		const commitBh = await repo.setObject(commitB);
		const commitC = new Commit({
			parent: commitBh,
			tree: "",
			commiter: "commiter",
			date: new Date("2025-09-24T08:50:00.000Z"),
			message: "C",
		});
		const commitCh = await repo.setObject(commitC);

		const chains = await Array.fromAsync(repo.iterCommitChain(commitCh));
		assertEquals(chains.length, 3);
		assertEquals(chains[0].hash, commitCh);
		assertEquals(chains[1].hash, commitBh);
		assertEquals(chains[2].hash, commitAh);
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

		const blobA = new Blob(new TextEncoder().encode("A"));
		const blobAh = await repo.setObject(blobA);
		const blobB = new Blob(new TextEncoder().encode("B"));
		const blobBh = await repo.setObject(blobB);
		const blobC = new Blob(new TextEncoder().encode("C"));
		const blobCh = await repo.setObject(blobC);
		const treeA = new Tree([
			{ hash: blobAh, kind: "blob", name: "fileA.txt" },
			{ hash: blobBh, kind: "blob", name: "fileB.txt" },
		]);
		const treeAh = await repo.setObject(treeA);
		const treeB = new Tree([
			{ hash: treeAh, kind: "tree", name: "folder" },
			{ hash: blobCh, kind: "blob", name: "fileC.txt" },
		]);
		const treeBh = await repo.setObject(treeB);

		const items = await Array.fromAsync(repo.iterTree(treeBh));

		assertEquals(items.length, 2);
		assertEquals(items[0].hash, treeBh);
		assertEquals(items[1].hash, treeAh);
	});
});

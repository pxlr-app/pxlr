import { assert, assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { autoid } from "../libpxlr/autoid.ts";
import { Commit } from "./commit.ts";
import { MemoryFilesystem, Object, Repository } from "./mod.ts";
import { Reference } from "./reference.ts";
import { Tree } from "./tree.ts";

Deno.test("Repository", async (t) => {
	await t.step("set/get reference", async () => {
		const fs = new MemoryFilesystem();
		const repo = new Repository(fs);
		const ref1 = new Reference("refs/heads/main", autoid());
		await repo.writeReference(ref1);
		assert(fs.entries.has("refs/heads/main"));
		const ref2 = await repo.getReference("refs/heads/main");
		assertEquals(ref1, ref2);
		assert(fs.entries.has("refs/heads/main"));
	});

	await t.step("list reference", async () => {
		const fs = new MemoryFilesystem();
		const repo = new Repository(fs);
		await repo.writeReference(new Reference("refs/heads/main", autoid()));

		const iterReference1 = repo.listReferencePath("refs/heads");
		assertEquals((await iterReference1.next()).value, "refs/heads/main");
		assertEquals((await iterReference1.next()).done, true);

		await repo.writeReference(new Reference("refs/heads/fix-hero", autoid()));

		const iterReference3 = repo.listReferencePath("refs/heads");
		assertEquals((await iterReference3.next()).value, "refs/heads/fix-hero");
		assertEquals((await iterReference3.next()).value, "refs/heads/main");
		assertEquals((await iterReference3.next()).done, true);
	});

	await t.step("set/get object", async () => {
		const fs = new MemoryFilesystem();
		const repo = new Repository(fs);
		const object1 = new Object(
			autoid(),
			autoid(),
			"Note",
			{ name: "README" },
			"# Hello World",
		);
		await repo.writeObject(object1);
		const object2 = await repo.getObject(object1.hash);
		assertEquals(object1, object2);
	});

	await t.step("iter tree", async () => {
		const fs = new MemoryFilesystem();
		const repo = new Repository(fs);
		const object1 = new Object(
			autoid(),
			autoid(),
			"Note",
			{ name: "README" },
			"# Hello World",
		);
		const tree1 = new Tree(autoid(), autoid(), "Group", "Parent", [{
			hash: object1.hash,
			id: object1.id,
			kind: object1.kind,
			name: object1.headers.get("name")!,
		}]);
		const tree2 = new Tree(autoid(), autoid(), "Group", "Parent", [{
			hash: tree1.hash,
			id: tree1.id,
			kind: "tree",
			name: tree1.name,
		}]);
		await repo.writeObject(object1);
		await repo.writeTree(tree1);
		await repo.writeTree(tree2);

		const iterTree1 = repo.iterTree(tree2.hash);
		assertEquals((await iterTree1.next()).value.hash, tree2.hash);
		assertEquals((await iterTree1.next()).value.hash, tree1.hash);
		assertEquals((await iterTree1.next()).done, true);
	});

	await t.step("iter history", async () => {
		const fs = new MemoryFilesystem();
		const repo = new Repository(fs);
		const object1 = new Object(
			autoid(),
			autoid(),
			"Note",
			{ name: "README" },
			"# Hello World",
		);
		const tree1 = new Tree(autoid(), autoid(), "Group", "Parent", [{
			hash: object1.hash,
			id: object1.id,
			kind: object1.kind,
			name: object1.headers.get("name")!,
		}]);
		const tree2 = new Tree(autoid(), autoid(), "Group", "Parent", [{
			hash: tree1.hash,
			id: tree1.id,
			kind: "tree",
			name: tree1.name,
		}]);
		const tree3 = new Tree(autoid(), tree2.id, "Group", "Parent2", [{
			hash: tree1.hash,
			id: tree1.id,
			kind: "tree",
			name: tree1.name,
		}]);
		const commit1 = new Commit(
			autoid(),
			"",
			tree2.hash,
			"Test <test@test.local>",
			new Date(),
			"",
		);
		const commit2 = new Commit(
			autoid(),
			commit1.hash,
			tree3.hash,
			"Test <test@test.local>",
			new Date(),
			"",
		);
		await repo.writeObject(object1);
		await repo.writeTree(tree1);
		await repo.writeTree(tree2);
		await repo.writeTree(tree3);
		await repo.writeCommit(commit1);
		await repo.writeCommit(commit2);

		const iterHistory1 = repo.iterHistory(commit1.hash);
		assertEquals((await iterHistory1.next()).value.hash, commit1.hash);
		assertEquals((await iterHistory1.next()).done, true);

		const iterHistory2 = repo.iterHistory(commit2.hash);
		assertEquals((await iterHistory2.next()).value.hash, commit2.hash);
		assertEquals((await iterHistory2.next()).value.hash, commit1.hash);
		assertEquals((await iterHistory2.next()).done, true);
	});
});

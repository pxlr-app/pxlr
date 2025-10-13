import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { id } from "../id.ts";
import { RenameCommand } from "../commands/rename.ts";
import { GroupNode } from "./group.ts";
import { Vec2 } from "@pxlr/math";

Deno.test("GroupNode", async (t) => {
	await t.step("immutable structure", () => {
		const node1 = GroupNode.new({ name: "Name" });
		assertEquals(node1.kind, "Group");
		assertEquals(node1.name, "Name");
		assertEquals(node1.children, []);
	});

	await t.step("handles rename command name", () => {
		const node1 = GroupNode.new({ name: "A" });
		const node2 = node1.execCommand(node1.rename("B")) as GroupNode;
		assert(node2 !== node1);
		assertEquals(node2.id, node1.id);
		assertEquals(node2.name, "B");
	});

	await t.step("handles add child command", () => {
		const node1 = GroupNode.new({ name: "A" });
		const node2 = GroupNode.new({ name: "B" });
		const node3 = node1.execCommand(node1.addChild(node2)) as GroupNode;
		assert(node3 !== node1);
		assertEquals(node3.id, node1.id);
		assertEquals(node3.children.length, 1);
		assertEquals(node3.children[0], node2);
	});

	await t.step("handles remove child command", () => {
		const node1 = GroupNode.new({ name: "A" });
		const node2 = GroupNode.new({ name: "B", children: [node1] });
		const node3 = node2.execCommand(
			node2.removeChild(node1.id),
		) as GroupNode;
		assert(node3 !== node2);
		assertEquals(node3.id, node2.id);
		assertEquals(node3.children.length, 0);
	});

	await t.step("handles move child command", () => {
		const node1 = GroupNode.new({ name: "A" });
		const node2 = GroupNode.new({ name: "B" });
		const node3 = GroupNode.new({ name: "C" });
		const node4 = GroupNode.new({ name: "D", children: [node1, node2, node3] });
		const node5 = node4.execCommand(
			node4.moveChild(node2.id, 2),
		) as GroupNode;
		assert(node5 !== node4);
		assertEquals(node5.id, node4.id);
		assertEquals(node5.children.length, 3);
		assertEquals(node5.children[0], node1);
		assertEquals(node5.children[1], node3);
		assertEquals(node5.children[2], node2);
		const node6 = node4.execCommand(
			node4.moveChild(node2.id, 0),
		) as GroupNode;
		assert(node6 !== node4);
		assertEquals(node6.id, node4.id);
		assertEquals(node6.children.length, 3);
		assertEquals(node6.children[0], node2);
		assertEquals(node6.children[1], node1);
		assertEquals(node6.children[2], node3);
	});

	await t.step("forward command to children", () => {
		const child1 = GroupNode.new({ name: "Child1" });
		const child2 = GroupNode.new({ name: "Child2" });
		const parent1 = GroupNode.new({ name: "Parent", children: [child1, child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1] });
		const root1p = root1.execCommand(child1.rename("NewChild")) as GroupNode;
		assertEquals(root1p.id, root1.id);
		assertEquals(root1p.name, root1.name);
		const parent1p = root1p.children[0] as GroupNode;
		assertEquals(parent1p.id, parent1.id);
		assertEquals(parent1p.name, parent1.name);
		const child1p = parent1p.children[0] as GroupNode;
		const child2p = parent1p.children[1] as GroupNode;
		assertEquals(child1p.id, child1.id);
		assertEquals(child1p.name, "NewChild");
		assert(child2p === child2);
		const root1pp = root1.execCommand(
			new RenameCommand(id(), "Foo"),
		);
		assert(root1pp === root1);
	});

	await t.step("iterate group", () => {
		const child1 = GroupNode.new({ name: "Child1" });
		const child2 = GroupNode.new({ name: "Child2" });
		const parent1 = GroupNode.new({ name: "Parent", children: [child1, child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1] });
		assertEquals(Array.from(root1), [parent1]);
		assertEquals(Array.from(parent1), [child1, child2]);
	});

	await t.step("get child by id", () => {
		const child1 = GroupNode.new({ name: "Child1" });
		const child2 = GroupNode.new({ name: "Child2" });
		const parent1 = GroupNode.new({ name: "Parent", children: [child1, child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1] });
		assertEquals(root1.getChildById(parent1.id), parent1);
		assertEquals(parent1.getChildById(child2.id), child2);
	});

	await t.step("get child by name", () => {
		const child1 = GroupNode.new({ name: "Child1" });
		const child2 = GroupNode.new({ name: "Child2" });
		const parent1 = GroupNode.new({ name: "Parent", children: [child1, child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1] });
		assertEquals(root1.getChildByName("Parent"), parent1);
		assertEquals(parent1.getChildByName("Child2"), child2);
	});

	await t.step("get child at name path", () => {
		const child1 = GroupNode.new({ name: "Child1" });
		const child2 = GroupNode.new({ name: "Child2" });
		const parent1 = GroupNode.new({ name: "Parent", children: [child1, child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1] });
		assertEquals(root1.getChildAtNamePath([parent1.name, child1.name]), child1);
		assertEquals(root1.getChildAtNamePath([parent1.name, child2.name]), child2);
	});
});

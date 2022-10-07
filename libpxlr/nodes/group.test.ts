import { assert, assertEquals, assertNotEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { autoid } from "../autoid.ts";
import { AddChildCommand, MoveChildCommand, RemoveChildCommand, RenameCommand } from "../commands/mod.ts";
import { TreeObjectSerializer } from "../objects/tree.ts";
import { GroupNode } from "./group.ts";

Deno.test("GroupNode", async (t) => {
	await t.step("valide if provided id is an AutoId", () => {
		assertThrows(() => {
			new GroupNode("foo", "Name", []);
		});
	});

	await t.step("immutable structure", () => {
		const node1 = GroupNode.new("Name", []);
		assertEquals(node1.kind, "group");
		assertEquals(node1.name, "Name");
		assertEquals(node1.children, []);
	});

	await t.step("handles rename command name", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = node1.executeCommand(new RenameCommand(node1.id, "B"));
		assert(node2 !== node1);
		assertNotEquals(node2.id, node1.id);
		assertEquals(node2.name, "B");
	});

	await t.step("handles add child command", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", []);
		const node3 = node1.executeCommand(new AddChildCommand(node1.id, node2));
		assert(node3 !== node1);
		assertNotEquals(node3.id, node1.id);
		assertEquals(node3.children.length, 1);
		assertEquals(node3.children[0], node2);
	});

	await t.step("handles remove child command", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", [node1]);
		const node3 = node2.executeCommand(new RemoveChildCommand(node2.id, node1.id));
		assert(node3 !== node2);
		assertNotEquals(node3.id, node2.id);
		assertEquals(node3.children.length, 0);
	});

	await t.step("handles move child command", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", []);
		const node3 = GroupNode.new("C", []);
		const node4 = GroupNode.new("D", [node1, node2, node3]);
		const node5 = node4.executeCommand(new MoveChildCommand(node4.id, node2.id, 2));
		assert(node5 !== node4);
		assertNotEquals(node5.id, node4.id);
		assertEquals(node5.children.length, 3);
		assertEquals(node5.children[0], node1);
		assertEquals(node5.children[1], node3);
		assertEquals(node5.children[2], node2);
		const node6 = node4.executeCommand(new MoveChildCommand(node4.id, node2.id, 0));
		assert(node6 !== node4);
		assertNotEquals(node6.id, node4.id);
		assertEquals(node6.children.length, 3);
		assertEquals(node6.children[0], node2);
		assertEquals(node6.children[1], node1);
		assertEquals(node6.children[2], node3);
	});

	await t.step("forward command to children", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		const root1p = root1.executeCommand(new RenameCommand(child1.id, "NewChild"));
		assertNotEquals(root1p.id, root1.id);
		assertEquals(root1p.name, root1.name);
		const parent1p = root1p.children[0] as GroupNode;
		assertNotEquals(parent1p.id, parent1.id);
		assertEquals(parent1p.name, parent1.name);
		const child1p = parent1p.children[0] as GroupNode;
		const child2p = parent1p.children[1] as GroupNode;
		assertNotEquals(child1p.id, child1.id);
		assertEquals(child1p.name, "NewChild");
		assert(child2p === child2);
		const root1pp = root1.executeCommand(new RenameCommand(autoid(), "Foo"));
		assert(root1pp === root1);
	});

	await t.step("iterate group", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		const iter1 = root1.iter();
		assertEquals(iter1.next(), { done: false, value: root1 });
		assertEquals(iter1.next(), { done: false, value: parent1 });
		assertEquals(iter1.next(), { done: false, value: child1 });
		assertEquals(iter1.next(), { done: false, value: child2 });
		assertEquals(iter1.next(), { done: true, value: undefined });
	});

	await t.step("serialize and deserialize", async () => {
		const ser = new TreeObjectSerializer();
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const buf = new Buffer();
		const obj1 = parent1.toObject();
		await ser.serialize(buf.writable, obj1);
		const obj2 = await ser.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.name, obj1.name);
		assertEquals(obj2.items.length, obj1.items.length);
		assertEquals(obj2.items[0].id, obj1.items[0].id);
		assertEquals(obj2.items[1].id, obj1.items[1].id);
	});
});

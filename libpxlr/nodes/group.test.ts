import { assert, assertEquals, assertNotEquals, assertInstanceOf, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { GroupNode } from "./group.ts";

Deno.test("GroupNode", async (t) => {
	await t.step("valide if provided id is an AutoId", () => {
		assertThrows(() => { new GroupNode("foo", "Name", []) });
	});

	await t.step("immutable structure", () => {
		const node1 = GroupNode.new("Name", []);
		assertEquals(node1.name, "Name");
		assertEquals(node1.children, []);
		assertThrows(() => { (node1 as any).id = "id" });
		assertThrows(() => { (node1 as any).name = "Foo" });
		assertThrows(() => { (node1 as any).children = [] });
	});

	await t.step("immutable name", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = node1.setName("B");
		assert(node2 !== node1);
		assertNotEquals(node2.id, node1.id);
		assertEquals(node2.name, "B");
	});

	await t.step("immutable addChild", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", []);
		const node3 = node1.addChild(node2);
		assert(node3 !== node1);
		assertNotEquals(node3.id, node1.id);
		assertEquals(node3.children.length, 1);
		assertEquals(node3.children[0], node2);
	});

	await t.step("immutable removeChild", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", [node1]);
		const node3 = node2.removeChild(node1.id);
		assert(node3 !== node2);
		assertNotEquals(node3.id, node2.id);
		assertEquals(node3.children.length, 0);
	});

	await t.step("immutable moveChild", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", []);
		const node3 = GroupNode.new("C", []);
		const node4 = GroupNode.new("D", [node1, node2, node3]);
		const node5 = node4.moveChild(node2.id, 2);
		assert(node5 !== node4);
		assertNotEquals(node5.id, node4.id);
		assertEquals(node5.children.length, 3);
		assertEquals(node5.children[0], node1);
		assertEquals(node5.children[1], node3);
		assertEquals(node5.children[2], node2);
		const node6 = node4.moveChild(node2.id, 0);
		assert(node6 !== node4);
		assertNotEquals(node6.id, node4.id);
		assertEquals(node6.children.length, 3);
		assertEquals(node6.children[0], node2);
		assertEquals(node6.children[1], node1);
		assertEquals(node6.children[2], node3);
	});
});
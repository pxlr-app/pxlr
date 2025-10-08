import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { NoteNode } from "./note.ts";

Deno.test("NoteNode", async (t) => {
	await t.step("immutable structure", () => {
		const node1 = NoteNode.new("A", "Content");
		assertEquals(node1.kind, "Note");
		assertEquals(node1.name, "A");
		assertEquals(node1.content, "Content");
	});

	await t.step("handles rename command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.dispatch(node1.rename("B")) as NoteNode;
		assert(node2 !== node1);
		assertEquals(node2.id, node1.id);
		assertEquals(node2.name, "B");
	});

	await t.step("handles set content command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.dispatch(node1.setContent("New content")) as NoteNode;
		assert(node2 !== node1);
		assertEquals(node2.id, node1.id);
		assertEquals(node2.content, "New content");
	});

	await t.step("iterate note", () => {
		const node1 = NoteNode.new("A", "Content");
		const iter1 = node1.iter();
		assertEquals(iter1.next(), { done: true, value: undefined });
	});
});

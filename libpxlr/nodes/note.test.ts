import { assert, assertEquals, assertNotEquals, assertThrows } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { RenameCommand, SetContentCommand } from "./commands/mod.ts";
import { NoteNode } from "./note.ts";

Deno.test("NoteNode", async (t) => {
	await t.step("valide if provided id is an AutoId", () => {
		assertThrows(() => {
			new NoteNode("foo", "Name", "Content");
		});
	});

	await t.step("immutable structure", () => {
		const node1 = NoteNode.new("A", "Content");
		assertEquals(node1.kind, "note");
		assertEquals(node1.name, "A");
		assertEquals(node1.content, "Content");
	});

	await t.step("handles rename command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.executeCommand(new RenameCommand(node1.id, "B")) as NoteNode;
		assert(node2 !== node1);
		assertNotEquals(node2.id, node1.id);
		assertEquals(node2.name, "B");
	});

	await t.step("handles set content command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.executeCommand(new SetContentCommand(node1.id, "New content")) as NoteNode;
		assert(node2 !== node1);
		assertNotEquals(node2.id, node1.id);
		assertEquals(node2.content, "New content");
	});

	await t.step("iterate note", () => {
		const node1 = NoteNode.new("A", "Content");
		const iter1 = node1.iter();
		assertEquals(iter1.next(), { done: false, value: node1 });
		assertEquals(iter1.next(), { done: true, value: undefined });
	});
});

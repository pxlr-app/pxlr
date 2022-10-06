import { assert, assertEquals, assertNotEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { RenameCommand, SetContentCommand } from "../commands/mod.ts";
import { NoteNode, NoteObject, NoteObjectSerializer } from "./note.ts";

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
		assertThrows(() => {
			(node1 as any).id = "id";
		});
		assertThrows(() => {
			(node1 as any).name = "Foo";
		});
		assertThrows(() => {
			(node1 as any).content = "Bar";
		});
	});

	await t.step("handles rename command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.executeCommand(new RenameCommand(node1.id, "B"));
		assert(node2 !== node1);
		assertNotEquals(node2.id, node1.id);
		assertEquals(node2.name, "B");
	});

	await t.step("handles set content command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.executeCommand(new SetContentCommand(node1.id, "New content"));
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

	await t.step("serialize and deserialize", async () => {
		const ser = new NoteObjectSerializer();
		const node1 = NoteNode.new("A", "Content");
		const buf = new Buffer();
		const obj1 = node1.toObject();
		await ser.serialize(buf.writable, obj1);
		const obj2 = await ser.deserialize(buf.readable);
		assertEquals(obj2.id, obj1.id);
		assertEquals(obj2.name, obj1.name);
		assertEquals(obj2.content, obj1.content);
	});
});

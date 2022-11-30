import { describe, expect, test } from '@jest/globals';
import { NoteNode } from "./note";

describe("NoteNode", () => {
	test("immutable structure", () => {
		const node1 = NoteNode.new("A", "Content");
		expect(node1.kind).toEqual("note");
		expect(node1.name).toEqual("A");
		expect(node1.content).toEqual("Content");
	});

	test("handles rename command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.executeCommand(node1.rename("B")) as NoteNode;
		expect(node2).not.toEqual(node1);
		expect(node2.hash).toEqual(node1.hash);
		expect(node2.id).toEqual(node1.id);
		expect(node2.name).toEqual("B");
	});

	test("handles set content command", () => {
		const node1 = NoteNode.new("A", "Content");
		const node2 = node1.executeCommand(
			node1.setContent("New content"),
		) as NoteNode;
		expect(node2).not.toEqual(node1);
		expect(node2.hash).toEqual(node1.hash);
		expect(node2.id).toEqual(node1.id);
		expect(node2.content).toEqual("New content");
	});

	test("iterate note", () => {
		const node1 = NoteNode.new("A", "Content");
		const iter1 = node1.iter();
		expect(iter1.next()).toEqual({ done: true, value: undefined });
	});
});

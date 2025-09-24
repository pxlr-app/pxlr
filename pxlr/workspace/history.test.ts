import { assert } from "@std/assert";
import { NoteNode } from "./nodes/note.ts";
import { History } from "./history.ts";

Deno.test("History", async (t) => {
	await t.step("initialize", () => {
		const node1 = NoteNode.new("A", "Content");
		const history1 = new History([node1]);
		assert(history1.length === 1);
		assert(history1.tail === node1);
		assert(history1.head === node1);
		assert(history1.current === node1);
	});

	await t.step("dispatch", () => {
		const node1 = NoteNode.new("A", "Content");
		const history1 = new History([node1]);
		const history2 = history1.dispatch(node1.rename("B"));
		assert(history1 !== history2);
		assert(history2.length === 2);
		assert(history2.cursor === 1);
		assert(history2.tail === node1);
		assert(history2.head.name === "B");
		assert(history2.current.name === "B");
	});

	await t.step("seek", () => {
		const node1 = NoteNode.new("A", "Content");
		const history1 = new History([node1]);
		const history2 = history1.dispatch(node1.rename("B"));
		const history3 = history2.seek(-1);
		assert(history3 !== history2);
		assert(history3.length === history2.length);
		assert(history3.current === history1.current);
		const history4 = history3.dispatch(node1.rename("C"));
		assert(history4.length === history3.length);
		assert(history4.current !== history1.current);
		const history5 = history3.seek(-1);
		assert(history5 === history3);
	});
});

import { assertEquals } from "@std/assert";
import { Node } from "./node.ts";
import { NoteNode } from "./nodes/note.ts";
import { GroupNode } from "./nodes/group.ts";
import { visit, VisitorResult } from "./node_visit.ts";

Deno.test("visit", async (t) => {
	await t.step("continue", () => {
		const child1 = NoteNode.new({ name: "Child1", content: "" });
		const child2 = NoteNode.new({ name: "Child2", content: "" });
		const parent1 = GroupNode.new({ name: "Parent1", children: [child1] });
		const parent2 = GroupNode.new({ name: "Parent2", children: [child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1, parent2] });
		const visited = visit(root1, (node, ctx) => {
			ctx.push(node);
		}, [] as Node[]);
		assertEquals(visited, [root1, parent1, child1, parent2, child2]);
	});

	await t.step("skip", () => {
		const child1 = NoteNode.new({ name: "Child1", content: "" });
		const child2 = NoteNode.new({ name: "Child2", content: "" });
		const parent1 = GroupNode.new({ name: "Parent1", children: [child1] });
		const parent2 = GroupNode.new({ name: "Parent2", children: [child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1, parent2] });
		const visited = visit(root1, (node, ctx) => {
			ctx.push(node);
			if (node.name === "Parent1") {
				return VisitorResult.Skip;
			}
			return VisitorResult.Continue;
		}, [] as Node[]);
		assertEquals(visited, [root1, parent1, parent2, child2]);
	});

	await t.step("break", () => {
		const child1 = NoteNode.new({ name: "Child1", content: "" });
		const child2 = NoteNode.new({ name: "Child2", content: "" });
		const parent1 = GroupNode.new({ name: "Parent1", children: [child1] });
		const parent2 = GroupNode.new({ name: "Parent2", children: [child2] });
		const root1 = GroupNode.new({ name: "Root", children: [parent1, parent2] });
		const visited = visit(root1, (node, ctx) => {
			ctx.push(node);
			if (node.name === "Parent1") {
				return VisitorResult.Break;
			}
			return VisitorResult.Continue;
		}, [] as Node[]);
		assertEquals(visited, [root1, parent1]);
	});
});

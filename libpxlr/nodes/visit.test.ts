import { assertEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { GroupNode, Node, NoteNode } from "./mod.ts";
import { visit, VisitorResult } from "./visit.ts";

Deno.test("visit", async (t) => {
	await t.step("continue", () => {
		const child1 = NoteNode.new("Child1", "");
		const child2 = NoteNode.new("Child2", "");
		const parent1 = GroupNode.new("Parent1", [child1]);
		const parent2 = GroupNode.new("Parent2", [child2]);
		const root1 = GroupNode.new("Root", [parent1, parent2]);
		const visited: Node[] = [];
		visit(root1, {
			enter(node) {
				visited.push(node);
				return VisitorResult.Continue;
			},
		});
		assertEquals(visited, [root1, parent1, child1, parent2, child2]);
	});

	await t.step("skip", () => {
		const child1 = NoteNode.new("Child1", "");
		const child2 = NoteNode.new("Child2", "");
		const parent1 = GroupNode.new("Parent1", [child1]);
		const parent2 = GroupNode.new("Parent2", [child2]);
		const root1 = GroupNode.new("Root", [parent1, parent2]);
		const visited: Node[] = [];
		visit(root1, {
			enter(node) {
				visited.push(node);
				if (node.name === "Parent1") {
					return VisitorResult.Skip;
				}
				return VisitorResult.Continue;
			},
		});
		assertEquals(visited, [root1, parent1, parent2, child2]);
	});

	await t.step("break", () => {
		const child1 = NoteNode.new("Child1", "");
		const child2 = NoteNode.new("Child2", "");
		const parent1 = GroupNode.new("Parent1", [child1]);
		const parent2 = GroupNode.new("Parent2", [child2]);
		const root1 = GroupNode.new("Root", [parent1, parent2]);
		const visited: Node[] = [];
		visit(root1, {
			enter(node) {
				visited.push(node);
				if (node.name === "Parent1") {
					return VisitorResult.Break;
				}
				return VisitorResult.Continue;
			},
		});
		assertEquals(visited, [root1, parent1]);
	});
});

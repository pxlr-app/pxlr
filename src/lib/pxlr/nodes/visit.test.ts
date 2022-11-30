import { describe, expect, test } from '@jest/globals';
import { GroupNode, Node, NoteNode } from "./index";
import { visit, VisitorResult } from "./visit";

describe("visit", () => {
	test("continue", () => {
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
		expect(visited).toEqual([root1, parent1, child1, parent2, child2]);
	});

	test("skip", () => {
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
		expect(visited).toEqual([root1, parent1, parent2, child2]);
	});

	test("break", () => {
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
		expect(visited).toEqual([root1, parent1]);
	});
});

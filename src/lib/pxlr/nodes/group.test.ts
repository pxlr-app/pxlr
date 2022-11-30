import { describe, expect, test } from '@jest/globals';
import { autoid } from "../autoid";
import { RenameCommand } from "./commands/index";
import { GroupNode } from "./group";

describe("GroupNode", () => {
	test("immutable structure", () => {
		const node1 = GroupNode.new("Name", []);
		expect(node1.kind).toEqual("group");
		expect(node1.name).toEqual("Name");
		expect(node1.children).toEqual([]);
	});

	test("handles rename command name", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = node1.executeCommand(node1.rename("B")) as GroupNode;
		expect(node2).not.toEqual(node1);
		expect(node2.hash).not.toEqual(node1.hash);
		expect(node2.id).toEqual(node1.id);
		expect(node2.name).toEqual("B");
	});

	test("handles add child command", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", []);
		const node3 = node1.executeCommand(node1.addChild(node2)) as GroupNode;
		expect(node3).not.toEqual(node1);
		expect(node3.hash).not.toEqual(node1.hash);
		expect(node3.id).toEqual(node1.id);
		expect(node3.children.length).toEqual(1);
		expect(node3.children[0]).toEqual(node2);
	});

	test("handles remove child command", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", [node1]);
		const node3 = node2.executeCommand(
			node2.removeChild(node1.id),
		) as GroupNode;
		expect(node3).not.toEqual(node2);
		expect(node3.hash).not.toEqual(node2.hash);
		expect(node3.id).toEqual(node2.id);
		expect(node3.children.length).toEqual(0);
	});

	test("handles move child command", () => {
		const node1 = GroupNode.new("A", []);
		const node2 = GroupNode.new("B", []);
		const node3 = GroupNode.new("C", []);
		const node4 = GroupNode.new("D", [node1, node2, node3]);
		const node5 = node4.executeCommand(
			node4.moveChild(node2.id, 2),
		) as GroupNode;
		expect(node5).not.toEqual(node4);
		expect(node5.hash).not.toEqual(node4.hash);
		expect(node5.id).toEqual(node4.id);
		expect(node5.children.length).toEqual(3);
		expect(node5.children[0]).toEqual(node1);
		expect(node5.children[1]).toEqual(node3);
		expect(node5.children[2]).toEqual(node2);
		const node6 = node4.executeCommand(
			node4.moveChild(node2.id, 0),
		) as GroupNode;
		expect(node6).not.toEqual(node4);
		expect(node6.hash).not.toEqual(node4.hash);
		expect(node6.id).toEqual(node4.id);
		expect(node6.children.length).toEqual(3);
		expect(node6.children[0]).toEqual(node2);
		expect(node6.children[1]).toEqual(node1);
		expect(node6.children[2]).toEqual(node3);
	});

	test("forward command to children", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		const root1p = root1.executeCommand(child1.rename("NewChild")) as GroupNode;
		expect(root1p.hash).not.toEqual(root1.hash);
		expect(root1p.id).toEqual(root1.id);
		expect(root1p.name).toEqual(root1.name);
		const parent1p = root1p.children[0] as GroupNode;
		expect(parent1p.hash).not.toEqual(parent1.hash);
		expect(parent1p.id).toEqual(parent1.id);
		expect(parent1p.name).toEqual(parent1.name);
		const child1p = parent1p.children[0] as GroupNode;
		const child2p = parent1p.children[1] as GroupNode;
		expect(child1p.hash).not.toEqual(child1.hash);
		expect(child1p.id).toEqual(child1.id);
		expect(child1p.name).toEqual("NewChild");
		expect(child2p).toEqual(child2);
		const root1pp = root1.executeCommand(
			new RenameCommand(autoid(), autoid(), "Foo"),
		);
		expect(root1pp).toEqual(root1);
	});

	test("iterate group", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		const iter1 = root1.iter();
		expect(iter1.next()).toEqual({ done: false, value: parent1 });
		// expect(iter1.next(), { done: false).toEqual(value: parent1 });
		// expect(iter1.next(), { done: false).toEqual(value: child1 });
		// expect(iter1.next(), { done: false).toEqual(value: child2 });
		expect(iter1.next()).toEqual({ done: true, value: undefined });
	});

	test("get child by hash", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		expect(root1.getChildByHash(parent1.hash)).toEqual(parent1);
		expect(parent1.getChildByHash(child2.hash)).toEqual(child2);
	});

	test("get child by id", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		expect(root1.getChildById(parent1.id)).toEqual(parent1);
		expect(parent1.getChildById(child2.id)).toEqual(child2);
	});

	test("get child by name", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		expect(root1.getChildByName("Parent")).toEqual(parent1);
		expect(parent1.getChildByName("Child2")).toEqual(child2);
	});

	test("get child at name path", () => {
		const child1 = GroupNode.new("Child1", []);
		const child2 = GroupNode.new("Child2", []);
		const parent1 = GroupNode.new("Parent", [child1, child2]);
		const root1 = GroupNode.new("Root", [parent1]);
		expect(root1.getChildAtNamePath([parent1.name, child1.name])).toEqual(child1);
		expect(root1.getChildAtNamePath([parent1.name, child2.name])).toEqual(child2);
	});
});

import { Node } from "./node.ts";

export enum VisitorResult {
	Break = "break",
	Continue = "continue",
	Skip = "skip",
}

export function visit(
	node: Node,
	{ enter, leave }: {
		enter: (node: Node) => VisitorResult;
		leave?: (node: Node) => void;
	},
): VisitorResult {
	const result = enter(node);
	if (result === VisitorResult.Continue) {
		for (const child of node) {
			if (visit(child, { enter, leave }) === VisitorResult.Break) {
				break;
			}
		}
		leave?.(node);
	}
	return result;
}

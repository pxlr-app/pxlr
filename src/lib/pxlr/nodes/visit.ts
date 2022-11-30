import { GroupNode } from "./group";
import { Node } from "./node";

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
		if (node instanceof GroupNode) {
			for (const child of node) {
				if (visit(child, { enter, leave }) === VisitorResult.Break) {
					break;
				}
			}
		}
		leave?.(node);
	}
	return result;
}

import { GroupNode } from "./group.ts";
import { Node } from "./node.ts";

export enum VisitorResult {
	Break = "break",
	Continue = "continue",
	Skip = "skip",
}

export async function visit(node: Node, { enter, leave }: { enter: (node: Node) => VisitorResult | Promise<VisitorResult>; leave?: (node: Node) => void }): Promise<VisitorResult> {
	const result = await enter(node);
	if (result === VisitorResult.Continue) {
		if (node instanceof GroupNode) {
			for (const child of node) {
				if (await visit(child, { enter, leave }) === VisitorResult.Break) {
					break;
				}
			}
		}
		leave?.(node);
	}
	return result;
}

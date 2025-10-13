import { Node } from "./node.ts";

export enum VisitorResult {
	Break = "break",
	Continue = "continue",
	Skip = "skip",
}

export type Visitor2<Context = unknown> =
	| Visitor<Context>
	| Visitor<Context>["enter"];

export interface Visitor<Context = unknown> {
	enter?: (node: Node, context: Context) => VisitorResult | void;
	leave?: (node: Node, context: Context) => void;
}

export function visit(node: Node, visitor: Visitor2): void;
export function visit<Context>(node: Node, visitor: Visitor2<Context>, context: Context): Context;
export function visit(node: Node, visitor: Visitor2, context: unknown = void 0): unknown {
	visitor = typeof visitor === "function" ? { enter: visitor } : { ...visitor };
	_visit(node, visitor, context);
	return context;

	function _visit(node: Node, visitor: Visitor, context: unknown = void 0): VisitorResult {
		const result = visitor.enter?.(node, context) ?? VisitorResult.Continue;
		if (result === VisitorResult.Continue) {
			for (const child of node) {
				if (_visit(child, visitor, context) === VisitorResult.Break) {
					break;
				}
			}
		}
		visitor.leave?.(node, context);
		return result;
	}
}

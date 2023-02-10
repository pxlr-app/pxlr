import { Node } from "/libpxlr/nodes/node.ts";
import { AutoId } from "/libpxlr/autoid.ts";

export abstract class ToolNode extends Node {
	public constructor(
		hash: AutoId,
		id: AutoId,
		kind: string,
		name: string,
	) {
		super(hash, id, kind, name);
	}
}

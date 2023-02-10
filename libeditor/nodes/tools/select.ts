import { ToolNode } from "./tool.ts";
import { AutoId } from "/libpxlr/autoid.ts";

export class ToolSelectNode extends ToolNode {
	public constructor(
		hash: AutoId,
		id: AutoId,
	) {
		super(hash, id, "ToolSelect", "select");
	}
}

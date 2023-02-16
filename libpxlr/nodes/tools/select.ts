import { ToolNode } from "./tool.ts";
import { AutoId, autoid } from "/libpxlr/autoid.ts";
import { Object } from "/librepo/object.ts";
import { NodeRegistryEntry } from "../registry.ts";

export const ToolSelectNodeRegistryEntry = new NodeRegistryEntry<ToolSelectNode>(
	"ToolSelect",
	({ object }) => {
		return new ToolSelectNode(
			object.hash,
			object.id,
		);
	},
	(node) => {
		return new Object(
			node.hash,
			node.id,
			"ToolSelect",
			{
				name: node.name,
			},
		);
	},
);

export class ToolSelectNode extends ToolNode {
	public constructor(
		hash: AutoId,
		id: AutoId,
	) {
		super(hash, id, "ToolSelect", "select");
	}

	static new() {
		return new ToolSelectNode(autoid(), autoid());
	}
}

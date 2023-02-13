import { Node } from "/libpxlr/nodes/node.ts";
import { AutoId, autoid } from "/libpxlr/autoid.ts";
import { ToolNode } from "./tools/tool.ts";
import { SetActiveToolCommand } from "./commands/set_active_tool.ts";

export class EditorNode extends Node {
	#activeTool: ToolNode;

	public constructor(
		hash: AutoId,
		id: AutoId,
		name: string,
		activeTool: ToolNode,
	) {
		super(hash, id, "Editor", name);
		this.#activeTool = activeTool;
	}

	get activeTool() {
		return this.#activeTool;
	}

	setActiveTool(tool: ToolNode): SetActiveToolCommand {
		return new SetActiveToolCommand(autoid(), this.hash, tool);
	}
}

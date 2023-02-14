import { AutoId } from "/libpxlr/autoid.ts";
import { ToolNode } from "../tools/tool.ts";
import { Command } from "/libpxlr/nodes/commands/command.ts";

export class SetActiveToolCommand extends Command {
	#toolNode: ToolNode;
	public constructor(hash: AutoId, target: AutoId, toolNode: ToolNode) {
		super(hash, target);
		this.#toolNode = toolNode;
	}

	get toolNode() {
		return this.#toolNode;
	}
}

import { AutoId } from "../autoid.ts";
import { ToolNode } from "../nodes/tools/tool.ts";
import { Command } from "./command.ts";

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

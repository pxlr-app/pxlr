import { AutoId } from "/libpxlr/autoid.ts";
import { Command } from "/libpxlr/nodes/commands/command.ts";
import { Workspace } from "/libpxlr/workspace/workspace.ts";

export class SetWorkspaceCommand extends Command {
	#workspace: Workspace;
	public constructor(hash: AutoId, target: AutoId, workspace: Workspace) {
		super(hash, target);
		this.#workspace = workspace;
	}

	get workspace() {
		return this.#workspace;
	}
}

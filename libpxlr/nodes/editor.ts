import { Node } from "/libpxlr/nodes/node.ts";
import { AutoId, autoid } from "/libpxlr/autoid.ts";
import { ToolNode } from "./tools/tool.ts";
import { SetActiveToolCommand } from "./commands/set_active_tool.ts";
import { Document, Workspace } from "/libpxlr/workspace/mod.ts";
import { SetWorkspaceCommand } from "./commands/set_workspace.ts";
import { SetDocumentCommand } from "./commands/set_document.ts";

export class EditorNode extends Node {
	#workspace: Workspace;
	#document: Document | undefined;
	#activeTool: ToolNode;

	public constructor(
		hash: AutoId,
		id: AutoId,
		name: string,
		workspace: Workspace,
		activeTool: ToolNode,
	) {
		super(hash, id, "Editor", name);
		this.#workspace = workspace;
		this.#activeTool = activeTool;
	}

	get workspace() {
		return this.#workspace;
	}

	get document() {
		return this.#document;
	}

	get activeTool() {
		return this.#activeTool;
	}

	setWorkspace(workspace: Workspace): SetWorkspaceCommand {
		return new SetWorkspaceCommand(autoid(), this.hash, workspace);
	}

	setDocument(document: Document): SetDocumentCommand {
		return new SetDocumentCommand(autoid(), this.hash, document);
	}

	setActiveTool(tool: ToolNode): SetActiveToolCommand {
		return new SetActiveToolCommand(autoid(), this.hash, tool);
	}
}

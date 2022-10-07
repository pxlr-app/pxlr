import { autoid } from "../autoid.ts";
import { Command, RenameCommand, SetContentCommand } from "../commands/mod.ts";
import { Node } from "./node.ts";

export class NoteNode extends Node {
	public constructor(
		id: string,
		name: string,
		public readonly content: string,
	) {
		super(id, "note", name);
	}

	static new(name: string, content: string) {
		return new NoteNode(autoid(), name, content);
	}

	executeCommand(command: Command) {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new NoteNode(autoid(), command.renameTo, this.content);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(autoid(), this.name, command.setContent);
			}
		}
		return this;
	}
}

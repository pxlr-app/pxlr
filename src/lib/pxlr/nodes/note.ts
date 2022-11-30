import { AutoId, autoid } from "../autoid";
import { Command, RenameCommand, ReplaceNodeCommand, SetContentCommand } from "./commands/index";
import { Object } from "../repository/index";
import { Node } from "./node";
import { NodeRegistryEntry } from "./registry";

export const NoteNodeRegistryEntry = new NodeRegistryEntry(
	"note",
	async ({ object }) => {
		return new NoteNode(
			object.hash,
			object.id,
			object.headers.get("name") ?? "",
			await object.text(),
		);
	},
);

export class NoteNode extends Node {
	#content: string;
	public constructor(
		hash: AutoId,
		id: AutoId,
		name: string,
		content: string,
	) {
		super(hash, id, "note", name);
		this.#content = content;
	}

	get content() {
		return this.#content;
	}

	static new(name: string, content: string) {
		return new NoteNode(autoid(), autoid(), name, content);
	}

	executeCommand(command: Command): Node {
		if (command.target === this.hash) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new NoteNode(
					autoid(command.target + this.hash),
					this.id,
					command.renameTo,
					this.content,
				);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(
					autoid(command.target + this.hash),
					this.id,
					this.name,
					command.newContent,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
		}
		return this;
	}

	toObject(): Object {
		return new Object(
			this.hash,
			this.id,
			"note",
			{ name: this.name },
			this.content,
		);
	}

	setContent(newContent: string): SetContentCommand {
		return new SetContentCommand(autoid(), this.hash, newContent);
	}
}

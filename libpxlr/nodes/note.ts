import { AutoId, autoid } from "../autoid.ts";
import { Command } from "../commands/command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { SetContentCommand } from "../commands/set_content.ts";
import { Object } from "../../librepo/object.ts";
import { Node } from "./node.ts";
import { NodeRegistryEntry } from "./registry.ts";

export const NoteNodeRegistryEntry = new NodeRegistryEntry<NoteNode>(
	"Note",
	async ({ object }) => {
		return new NoteNode(
			object.hash,
			object.id,
			object.headers.get("name") ?? "",
			await object.text(),
		);
	},
	(node) => {
		return new Object(
			node.hash,
			node.id,
			"Note",
			{ name: node.name },
			node.content,
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
		super(hash, id, "Note", name);
		this.#content = content;
	}

	get content() {
		return this.#content;
	}

	static new(name: string, content: string) {
		return new NoteNode(autoid(), autoid(), name, content);
	}

	dispatch(command: Command): Node {
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

	setContent(newContent: string): SetContentCommand {
		return new SetContentCommand(autoid(), this.hash, newContent);
	}
}

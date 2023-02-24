import { AutoId, autoid } from "../autoid.ts";
import { Command } from "../commands/command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { SetContentCommand } from "../commands/set_content.ts";
import { Node } from "./node.ts";
import { NodeRegistryEntry } from "./registry.ts";

export const NoteNodeRegistryEntry = new NodeRegistryEntry<NoteNode>(
	"Note",
	async ({ item, stream }) => {
		return new NoteNode(
			item.hash,
			item.id,
			item.name,
			await new Response(stream).text(),
		);
	},
	(node) => {
		return new Response(node.content).body!;
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
					autoid(),
					this.id,
					command.renameTo,
					this.content,
				);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(
					autoid(),
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

import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { SetContentCommand } from "../commands/set_content.ts";

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
		hash: ID,
		id: ID,
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
		return new NoteNode(id(), id(), name, content);
	}

	dispatch(command: Command): Node {
		if (command.target === this.hash) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new NoteNode(
					id(),
					this.id,
					command.renameTo,
					this.content,
				);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(
					id(),
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
		return new SetContentCommand(id(), this.hash, newContent);
	}
}

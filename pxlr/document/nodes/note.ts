import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { SetContentCommand } from "../commands/set_content.ts";
import { ReadonlyVec2, Vec2 } from "@pxlr/math";
import { MoveCommand } from "../commands/move.ts";

// export const NoteNodeRegistryEntry = new NodeRegistryEntry<NoteNode>(
// 	"Note",
// 	async ({ item, stream }) => {
// 		return new NoteNode(
// 			item.hash,
// 			item.id,
// 			item.name,
// 			await new Response(stream).text(),
// 		);
// 	},
// 	(node) => {
// 		return new Response(node.content).body!;
// 	},
// );

export class NoteNode extends Node {
	#content: string;
	#position: ReadonlyVec2;
	public constructor(
		hash: string,
		id: ID,
		name: string,
		content: string,
		position: ReadonlyVec2,
	) {
		super(hash, id, "Note", name);
		this.#content = content;
		this.#position = position;
	}

	get content() {
		return this.#content;
	}

	get position() {
		return this.#position;
	}

	static new(name: string, content: string, position: ReadonlyVec2 = Vec2.ZERO) {
		return new NoteNode(id(), id(), name, content, position);
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
					this.position,
				);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(
					id(),
					this.id,
					this.name,
					command.newContent,
					this.position,
				);
			} else if (command instanceof MoveCommand) {
				return new NoteNode(
					id(),
					this.id,
					this.name,
					this.content,
					new Vec2().copy(command.position),
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

	moveTo(position: ReadonlyVec2): MoveCommand {
		return new MoveCommand(id(), this.hash, new Vec2().copy(position));
	}
}

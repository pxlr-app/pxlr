import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { SetContentCommand } from "../commands/set_content.ts";
import { ReadonlyVec2, Rect, Vec2 } from "@pxlr/math";
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
		id: ID,
		name: string,
		content: string,
		position: ReadonlyVec2,
	) {
		super(id, "Note", name);
		this.#content = content;
		this.#position = position;
	}

	get content() {
		return this.#content;
	}

	get rect() {
		return new Rect(this.#position.x, this.#position.y, 0, 0);
	}

	static new(name: string, content: string, position: ReadonlyVec2 = Vec2.ZERO) {
		return new NoteNode(id(), name, content, position);
	}

	dispatch(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new NoteNode(
					this.id,
					command.renameTo,
					this.content,
					new Vec2(this.rect.x, this.rect.y),
				);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(
					this.id,
					this.name,
					command.content,
					new Vec2(this.rect.x, this.rect.y),
				);
			} else if (command instanceof MoveCommand) {
				return new NoteNode(
					this.id,
					this.name,
					this.content,
					command.position,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
		}
		return this;
	}

	setContent(content: string): SetContentCommand {
		return new SetContentCommand(this.id, content);
	}

	moveTo(position: ReadonlyVec2): MoveCommand {
		return new MoveCommand(this.id, new Vec2().copy(position));
	}
}

import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { assertID, ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { SetContentCommand } from "../commands/set_content.ts";
import { ReadonlyVec2, Rect, Vec2 } from "@pxlr/math";
import { MoveCommand } from "../commands/move.ts";
import { Blob } from "../../repository/blob.ts";
import { assert } from "@std/assert/assert";

export const NoteNodeRegistryEntry = new NodeRegistryEntry<NoteNode>(
	"Note",
	async ({ stream }) => {
		const blob = await Blob.fromReadableStream(stream);
		const id = blob.headers.get("id");
		const name = blob.headers.get("name");
		const kind = blob.headers.get("kind");
		const x = Number(blob.headers.get("x"));
		const y = Number(blob.headers.get("y"));
		assertID(id);
		assert(kind === "Note");
		assert(name);
		const content = new TextDecoder().decode(blob.content);
		return new NoteNode(id, name, content, new Vec2(x, y));
	},
	({ node }) => {
		const rect = node.rect;
		return Blob.new(
			{ "content-type": "text/plain", kind: node.kind, id: node.id, name: node.name, x: rect.x.toString(), y: rect.y.toString() },
			new TextEncoder().encode(node.content),
		);
	},
);

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

	static new({
		name,
		content,
		position = Vec2.ZERO,
	}: {
		name: string;
		content: string;
		position?: ReadonlyVec2;
	}) {
		return new NoteNode(id(), name, content, position);
	}

	execCommand(command: Command): Node {
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

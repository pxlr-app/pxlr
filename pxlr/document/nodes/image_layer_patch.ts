import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ReadonlyExtent2, ReadonlyVec2, Rect, Vec2 } from "@pxlr/math";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { MoveCommand } from "../commands/move.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";

export class ImageLayerPatchNode extends Node {
	#position: ReadonlyVec2;
	#size: ReadonlyExtent2;
	#data: ArrayBuffer;

	public constructor(
		id: ID,
		position: ReadonlyVec2,
		size: ReadonlyExtent2,
		data: ArrayBuffer,
	) {
		super(id, "ImageLayer", "");
		this.#position = position;
		this.#size = size;
		this.#data = data;
	}

	get position() {
		return this.#position;
	}

	get size() {
		return this.#size;
	}

	get data() {
		return this.#data;
	}

	get rect() {
		return new Rect(this.#position.x, this.#position.y, this.#size.width, this.#size.height);
	}

	static new({
		position,
		size,
		data,
	}: {
		position: ReadonlyVec2;
		size: ReadonlyExtent2;
		data: ArrayBuffer;
	}) {
		return new ImageLayerPatchNode(id(), position, size, data);
	}

	execCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof MoveCommand) {
				return new ImageLayerPatchNode(
					this.id,
					command.position,
					this.size,
					this.data,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
			return this;
		}
		return this;
	}

	moveTo(position: ReadonlyVec2): MoveCommand {
		return new MoveCommand(this.id, new Vec2().copy(position));
	}
}

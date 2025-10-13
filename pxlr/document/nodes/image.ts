import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ReadonlyExtent2, ReadonlyVec2, Rect, Vec2 } from "@pxlr/math";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { ImageChannelNode } from "./image_channel.ts";
import { RenameCommand } from "../commands/rename.ts";
import { MoveCommand } from "../commands/move.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { GroupNode } from "./group.ts";

export class ImageNode extends Node {
	#channels: ImageChannelNode[];
	#layers: GroupNode;
	#position: ReadonlyVec2;
	#size: ReadonlyExtent2;
	public constructor(
		id: ID,
		name: string,
		size: ReadonlyExtent2,
		channels: ImageChannelNode[],
		layers: GroupNode,
		position: ReadonlyVec2,
	) {
		super(id, "Image", name);
		this.#channels = channels;
		this.#layers = layers;
		this.#position = position;
		this.#size = size;
	}

	get position() {
		return this.#position;
	}

	get size() {
		return this.#size;
	}

	get rect() {
		return new Rect(this.#position.x, this.#position.y, this.#size.width, this.#size.height);
	}

	get channels() {
		return this.#channels;
	}

	get layers() {
		return this.#layers;
	}

	static new({
		name,
		size,
		channels,
		layers = [],
		position = Vec2.ZERO,
	}: {
		name: string;
		size: ReadonlyExtent2;
		channels: ImageChannelNode[];
		layers?: Node[];
		position?: ReadonlyVec2;
	}) {
		return new ImageNode(id(), name, size, channels, GroupNode.new({ name: "", children: layers }), position);
	}

	override *iter(): Iterator<Node> {
		yield* this.channels;
		yield this.layers;
	}

	execCommand(command: Command): Node {
		// if (command.target === this.hash) {
		// 	if (command instanceof RenameCommand) {
		// 		if (command.renameTo === this.name) {
		// 			return this;
		// 		}
		// 		return new ImageNode(
		// 			id(),
		// 			this.id,
		// 			command.renameTo,
		// 			this.position,
		// 			this.size,
		// 			this.format,
		// 			this.layers,
		// 		);
		// 	} else if (command instanceof MoveCommand) {
		// 		return new ImageNode(
		// 			id(),
		// 			this.id,
		// 			this.name,
		// 			new Vec2().copy(command.position),
		// 			this.size,
		// 			this.format,
		// 			this.layers,
		// 		);
		// 	} else if (command instanceof ReplaceNodeCommand) {
		// 		return command.node;
		// 	}
		// }
		return this;
	}
}

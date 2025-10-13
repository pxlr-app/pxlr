import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ReadonlyExtent2, ReadonlyVec2, Rect, Vec2 } from "@pxlr/math";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { MoveCommand } from "../commands/move.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { ImageLayerPatchNode } from "./image_layer_patch.ts";

export class ImageLayerNode extends Node {
	#position: ReadonlyVec2;
	#channelPatches: Map<string, ImageLayerPatchNode[]>;

	public constructor(
		id: ID,
		name: string,
		position: ReadonlyVec2,
		channelPatches: Map<string, ImageLayerPatchNode[]>,
	) {
		super(id, "ImageLayer", name);
		this.#position = position;
		this.#channelPatches = channelPatches;
	}

	get position() {
		return this.#position;
	}

	get channelPatches() {
		return this.#channelPatches;
	}

	static new({
		name,
		position = Vec2.ZERO,
		channels = {},
	}: {
		name: string;
		position?: ReadonlyVec2;
		channels?: Record<string, ImageLayerPatchNode[]>;
	}) {
		return new ImageLayerNode(id(), name, position, new Map(Object.entries(channels)));
	}

	override *iter(): Iterator<Node> {
		for (const layer of this.channelPatches.values()) {
			yield* layer;
		}
	}

	execCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new ImageLayerNode(
					this.id,
					command.renameTo,
					this.position,
					this.channelPatches,
				);
			} else if (command instanceof MoveCommand) {
				return new ImageLayerNode(
					this.id,
					this.name,
					command.position,
					this.channelPatches,
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

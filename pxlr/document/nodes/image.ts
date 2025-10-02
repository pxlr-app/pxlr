import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ReadonlyExtent2, ReadonlyVec2, Vec2 } from "@pxlr/math";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { MoveCommand } from "../commands/move.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";

export const ImageFormat = {
	PALETTE: "palette",
	UV: "uv",
	RGB: "rgb",
	RGBA: "rgba",
} as const;

export type ImageFormat = (typeof ImageFormat)[keyof typeof ImageFormat];

export class ImageNode extends Node {
	#size: ReadonlyExtent2;
	#format: ImageFormat;
	#layers: unknown[];
	#position: ReadonlyVec2;
	public constructor(
		hash: string,
		id: ID,
		name: string,
		position: ReadonlyVec2,
		size: ReadonlyExtent2,
		format: ImageFormat,
		layers: unknown[],
	) {
		super(hash, id, "Image", name);
		this.#position = position;
		this.#size = size;
		this.#format = format;
		this.#layers = layers;
	}

	get position() {
		return this.#position;
	}

	get size() {
		return this.#size;
	}

	get format() {
		return this.#format;
	}

	get layers() {
		return this.#layers;
	}

	static new(name: string, size: ReadonlyExtent2, format: ImageFormat, position: ReadonlyVec2 = Vec2.ZERO, layers: unknown[] = []) {
		return new ImageNode(id(), id(), name, position, size, format, layers);
	}

	dispatch(command: Command): Node {
		if (command.target === this.hash) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new ImageNode(
					id(),
					this.id,
					command.renameTo,
					this.position,
					this.size,
					this.format,
					this.layers,
				);
			} else if (command instanceof MoveCommand) {
				return new ImageNode(
					id(),
					this.id,
					this.name,
					new Vec2().copy(command.position),
					this.size,
					this.format,
					this.layers,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
		}
		return this;
	}
}

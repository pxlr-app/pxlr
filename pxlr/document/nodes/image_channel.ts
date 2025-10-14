import { NodeRegistryEntry } from "../node_registry.ts";
import { Node } from "../node.ts";
import { ID, id } from "../id.ts";
import { Command } from "../command.ts";
import { RenameCommand } from "../commands/rename.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";
import { ImageLayerPatchFormat } from "./image_layer_patch.ts";

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

export type ImageChannelRenderAs =
	| "grayscale"
	| "palette"
	| "uv"
	| "rgb"
	| "rgba";

export class ImageChannelNode extends Node {
	#identifier: string;
	#storageFormat: ImageLayerPatchFormat;
	#renderAs: ImageChannelRenderAs;
	#palette: ID | null;
	#sourceImage: ID | null;

	public constructor(
		id: ID,
		name: string,
		identifier: string,
		storageFormat: ImageLayerPatchFormat,
		renderAs: ImageChannelRenderAs,
		palette: ID | null,
		sourceImage: ID | null = null,
	) {
		super(id, "ImageChannel", name);
		this.#identifier = identifier;
		this.#storageFormat = storageFormat;
		this.#renderAs = renderAs;
		this.#palette = palette;
		this.#sourceImage = sourceImage;
	}

	get identifier() {
		return this.#identifier;
	}

	get storageFormat() {
		return this.#storageFormat;
	}

	get renderAs() {
		return this.#renderAs;
	}

	get palette() {
		return this.#palette;
	}

	get sourceImage() {
		return this.#sourceImage;
	}

	static new({
		name,
		identifier,
		storageFormat,
		renderAs,
		palette = null,
		sourceImage = null,
	}: {
		name: string;
		identifier: string;
		storageFormat: ImageLayerPatchFormat;
		renderAs: ImageChannelRenderAs;
		palette?: ID | null;
		sourceImage?: ID | null;
	}) {
		return new ImageChannelNode(id(), name, identifier, storageFormat, renderAs, palette, sourceImage);
	}

	execCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				if (command.renameTo === this.name) {
					return this;
				}
				return new ImageChannelNode(
					this.id,
					command.renameTo,
					this.identifier,
					this.storageFormat,
					this.renderAs,
					this.palette,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
		}
		return this;
	}
}

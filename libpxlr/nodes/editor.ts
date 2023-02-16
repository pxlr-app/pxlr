import { Node } from "/libpxlr/nodes/node.ts";
import { AutoId, autoid } from "/libpxlr/autoid.ts";
import { ToolNode } from "./tools/tool.ts";
import { SetActiveToolCommand } from "../commands/set_active_tool.ts";
import { SetZoomCommand } from "../commands/set_zoom.ts";
import { SetCenterCommand } from "../commands/set_center.ts";
import { Object } from "/librepo/object.ts";
import { NodeRegistryEntry } from "./registry.ts";
import { ToolSelectNode } from "./tools/select.ts";
import { Command } from "../commands/command.ts";
import { ReplaceNodeCommand } from "../commands/replace_node.ts";

export const EditorNodeRegistryEntry = new NodeRegistryEntry<EditorNode>(
	"Editor",
	async ({ object, getNodeByHash, shallow, abortSignal }) => {
		const activeToolHash = object.headers.get("activeTool");
		const activeTool = activeToolHash ? await getNodeByHash(activeToolHash, shallow, abortSignal) : undefined;
		const zoom = parseFloat(object.headers.get("zoom") ?? "") || 0.0;
		const center = object.headers.get("center")?.split(",");
		const centerX = parseFloat(center?.at(0) ?? "") || 0.0;
		const centerY = parseFloat(center?.at(1) ?? "") || 0.0;

		return new EditorNode(
			object.hash,
			object.id,
			object.headers.get("name") ?? "",
			activeTool,
			zoom,
			[centerX, centerY],
		);
	},
	(node) => {
		return new Object(
			node.hash,
			node.id,
			"Editor",
			{
				name: node.name,
				activeTool: node.activeTool.hash,
				zoom: node.zoom.toString(),
				center: `${node.center[0]},${node.center[1]}`,
			},
		);
	},
);

export class EditorNode extends Node {
	#activeTool: ToolNode;
	#zoom: number;
	#center: readonly [number, number];

	public constructor(
		hash: AutoId,
		id: AutoId,
		name: string,
		activeTool = ToolSelectNode.new(),
		zoom = 1.0,
		center: readonly [number, number] = [0, 0],
	) {
		super(hash, id, "Editor", name);
		this.#activeTool = activeTool;
		this.#zoom = zoom;
		this.#center = center;
	}

	get activeTool() {
		return this.#activeTool;
	}

	get zoom() {
		return this.#zoom;
	}

	get center() {
		return [...this.#center] as [number, number];
	}

	setActiveTool(tool: ToolNode): SetActiveToolCommand {
		return new SetActiveToolCommand(autoid(), this.hash, tool);
	}

	setZoom(zoom: number): SetZoomCommand {
		return new SetZoomCommand(autoid(), this.hash, zoom);
	}

	setCenter(center: readonly [number, number]): SetCenterCommand {
		return new SetCenterCommand(autoid(), this.hash, center);
	}

	dispatch(command: Command): Node {
		if (command.target === this.hash) {
			if (command instanceof SetZoomCommand) {
				return new EditorNode(
					autoid(command.target + this.hash),
					this.id,
					this.name,
					this.activeTool,
					command.newZoom,
					this.center,
				);
			} else if (command instanceof SetCenterCommand) {
				return new EditorNode(
					autoid(command.target + this.hash),
					this.id,
					this.name,
					this.activeTool,
					this.zoom,
					command.newCenter,
				);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
		}
		return this;
	}
}

import { Node } from "../node.ts";
import { Command } from "../command.ts";

export class ReplaceNodeCommand extends Command {
	#node: Node;
	public constructor(node: Node) {
		super(node.id);
		this.#node = node;
	}

	get node() {
		return this.#node;
	}
}

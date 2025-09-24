import { ID } from "../id.ts";
import { Node } from "../node.ts";
import { Command } from "../command.ts";

export class ReplaceNodeCommand extends Command {
	#node: Node;
	public constructor(hash: ID, node: Node) {
		super(hash, node.hash);
		this.#node = node;
	}

	get node() {
		return this.#node;
	}
}

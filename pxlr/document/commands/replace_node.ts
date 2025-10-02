import { Node } from "../node.ts";
import { Command } from "../command.ts";

export class ReplaceNodeCommand extends Command {
	#node: Node;
	public constructor(hash: string, node: Node) {
		super(hash, node.hash);
		this.#node = node;
	}

	get node() {
		return this.#node;
	}
}

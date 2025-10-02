import { Node } from "../node.ts";
import { Command } from "../command.ts";

export class AddChildCommand extends Command {
	#childNode: Node;
	public constructor(hash: string, target: string, childNode: Node) {
		super(hash, target);
		this.#childNode = childNode;
	}

	get childNode() {
		return this.#childNode;
	}
}

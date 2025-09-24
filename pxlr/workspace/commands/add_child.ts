import { ID } from "../id.ts";
import { Node } from "../node.ts";
import { Command } from "../command.ts";

export class AddChildCommand extends Command {
	#childNode: Node;
	public constructor(hash: ID, target: ID, childNode: Node) {
		super(hash, target);
		this.#childNode = childNode;
	}

	get childNode() {
		return this.#childNode;
	}
}

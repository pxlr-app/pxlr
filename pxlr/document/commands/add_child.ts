import { Node } from "../node.ts";
import { Command } from "../command.ts";
import { ID } from "../id.ts";

export class AddChildCommand extends Command {
	#childNode: Node;
	public constructor(target: ID, childNode: Node) {
		super(target);
		this.#childNode = childNode;
	}

	get childNode() {
		return this.#childNode;
	}
}

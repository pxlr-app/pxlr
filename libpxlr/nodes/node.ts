import { AutoId, InvalidAutoIdError, isAutoId } from "../autoid.ts";
import { Command } from "../commands/mod.ts";

export abstract class Node {
	public constructor(
		public readonly id: AutoId,
		public readonly kind: string,
		public readonly name: string,
	) {
		if (!isAutoId(id)) {
			throw new InvalidAutoIdError(id);
		}
	}

	*iter(): IterableIterator<Node> {
		yield this;
	}
	[Symbol.iterator](): Iterator<Node> {
		return this.iter();
	}
	abstract executeCommand(command: Command): Node;
}

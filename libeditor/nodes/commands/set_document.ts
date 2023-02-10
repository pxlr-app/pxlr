import { AutoId } from "/libpxlr/autoid.ts";
import { Command } from "/libpxlr/nodes/commands/command.ts";
import { Document } from "/libpxlr/workspace/mod.ts";

export class SetDocumentCommand extends Command {
	#document: Document | undefined;
	public constructor(hash: AutoId, target: AutoId, document: Document | undefined) {
		super(hash, target);
		this.#document = document;
	}

	get document() {
		return this.#document;
	}
}

import { clamp } from "@pxlr/math";
import { Command } from "./command.ts";
import { Node } from "./node.ts";

export class NodeHistory {
	#cursor: number;
	#entries: Node[];

	public constructor(initialEntries: Node[], cursor = initialEntries.length - 1) {
		if (initialEntries.length === 0) {
			throw new RangeError(`Expected "initialEntries" to contain at least one Node.`);
		}
		this.#entries = [...initialEntries];
		this.#cursor = Math.min(cursor, this.#entries.length - 1);
	}

	get cursor() {
		return this.#cursor;
	}

	get length() {
		return this.#entries.length;
	}

	get entries() {
		return [...this.#entries];
	}

	get tail() {
		return this.#entries.at(0)!;
	}

	get head() {
		return this.#entries.at(-1)!;
	}

	get current() {
		return this.#entries.at(this.#cursor)!;
	}

	execCommand(command: Command) {
		const newNode = this.current.execCommand(command);
		return new NodeHistory([...this.#entries.slice(0, this.#cursor + 1), newNode]);
	}

	seek(delta: number) {
		const newCursor = clamp(this.#cursor + delta, 0, this.#entries.length - 1);
		return this.goto(newCursor);
	}

	goto(cursor: number) {
		cursor = clamp(cursor, 0, this.#entries.length - 1);
		if (cursor === this.#cursor) {
			return this;
		}
		return new NodeHistory(this.#entries, cursor);
	}
}

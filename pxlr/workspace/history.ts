import { Command } from "./command.ts";
import { Node } from "./node.ts";

export class History {
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
		return this.#entries.at(0);
	}

	get head() {
		return this.#entries.at(-1)!;
	}

	get current() {
		return this.#entries.at(this.#cursor)!;
	}

	dispatch(command: Command) {
		const newNode = this.current.dispatch(command);
		return new History([...this.#entries.slice(0, this.#cursor + 1), newNode]);
	}

	seek(delta = 1) {
		const newCursor = Math.max(0, Math.min(this.#entries.length - 1, this.#cursor + delta));
		return this.goto(newCursor);
	}

	goto(cursor: number) {
		if (cursor === this.#cursor) {
			return this;
		}
		return new History(this.#entries, cursor);
	}
}

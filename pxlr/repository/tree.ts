import { crypto } from "@std/crypto/crypto";

export interface TreeItem {
	hash: string;
	kind: string;
	name: string;
}

export class Tree {
	#hash: string;
	#items: ReadonlyArray<TreeItem>;
	constructor(
		hash: string,
		items: ReadonlyArray<TreeItem>,
	) {
		this.#hash = hash;
		this.#items = [...items];
	}

	static async create(
		items: ReadonlyArray<TreeItem>,
	): Promise<Tree> {
		const hashBuffer = await crypto.subtle.digest("SHA-1", Tree.#toArrayBuffer(items));
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return new Tree(hash, items);
	}

	static #toArrayBuffer(
		items: ReadonlyArray<TreeItem>,
	): Uint8Array<ArrayBuffer> {
		const payload = items
			.map((item) => {
				const { kind, hash, name } = item;
				return `${encodeURIComponent(kind)} ${hash} ${encodeURIComponent(name)}`;
			})
			.join(`\n`);
		const data = new TextEncoder().encode(payload);
		return data;
	}

	get hash() {
		return this.#hash;
	}

	get items() {
		return [...this.#items];
	}

	static async fromReadableStream(stream: ReadableStream<Uint8Array<ArrayBuffer>>) {
		const payload = await new Response(stream).text();
		const items = payload
			.split(`\n`)
			.reduce(
				(acc, line) => {
					const [kind, hash, name] = line.split(" ");
					acc.push({ kind, hash, name });
					return acc;
				},
				[] as Array<TreeItem>,
			);

		return Tree.create(items);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return ReadableStream.from([Tree.#toArrayBuffer(this.items)]);
	}
}

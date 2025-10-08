import { sha1 } from "@noble/hashes/legacy.js";
import { Rect } from "@pxlr/math";

export interface TreeItem {
	hash: string;
	kind: string;
	rect?: Rect;
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

	static create(
		items: ReadonlyArray<TreeItem>,
	): Tree {
		const hashBuffer = sha1.create()
			.update(Tree.#toArrayBuffer(items))
			.digest();
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
				const { hash, kind, name, rect } = item;
				return `${encodeURIComponent(kind)} ${hash} ${rect?.x ?? 0} ${rect?.y ?? 0} ${rect?.width ?? 0} ${rect?.height ?? 0} ${
					encodeURIComponent(name)
				}`;
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
					const [kind, hash, x, y, width, height, name] = line.split(" ");
					acc.push({ kind, hash, name, rect: new Rect(Number(x), Number(y), Number(width), Number(height)) });
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

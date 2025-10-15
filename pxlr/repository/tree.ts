import { Blob } from "./blob.ts";

export interface TreeItem {
	hash: string;
	kind: string;
	name: string;
}

export class Tree {
	#headers: Headers;
	#items: ReadonlyArray<TreeItem>;

	constructor(items: ReadonlyArray<TreeItem>);
	constructor(headerInits: HeadersInit, items: ReadonlyArray<TreeItem>);
	constructor(items_or_headerInits: ReadonlyArray<TreeItem> | HeadersInit, items?: ReadonlyArray<TreeItem>) {
		const headerInits = items ? items_or_headerInits as HeadersInit : new Headers();
		items = items ?? items_or_headerInits as ReadonlyArray<TreeItem>;
		this.#headers = new Headers(headerInits);
		this.#items = [...items];
		this.#headers.set("content-type", "text/x-pxlr-tree");
	}

	get headers() {
		return this.#headers;
	}

	get items() {
		return [...this.#items];
	}

	static async fromReadableStream(stream: ReadableStream<Uint8Array<ArrayBuffer>>) {
		const blob = await Blob.fromReadableStream(stream);
		return Tree.fromBlob(blob);
	}

	static async fromBlob(blob: Blob) {
		const payload = new TextDecoder().decode(blob.content);
		const items = payload
			.split(`\n`)
			.filter(Boolean)
			.reduce(
				(acc, line) => {
					const [kind, hash, name] = line.split(" ");
					acc.push({ kind, hash, name });
					return acc;
				},
				[] as Array<TreeItem>,
			);

		return new Tree(blob.headers, items);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		const payload = this.items
			.map((item) => {
				const { hash, kind, name } = item;
				return `${encodeURIComponent(kind)} ${hash} ${encodeURIComponent(name)}`;
			})
			.join(`\n`);
		const headers = new Headers(this.headers);
		headers.set("content-type", "text/x-pxlr-tree");
		const content = new TextEncoder().encode(payload);
		return new Blob(headers, content).toReadableStream();
	}
}

import { sha1 } from "@noble/hashes/legacy.js";
import { Rect } from "@pxlr/math";
import { ResponseTransformStream } from "./response.ts";
import { assert } from "@std/assert/assert";

export interface TreeItem {
	hash: string;
	kind: string;
	name: string;
}

export class Tree {
	#hash: string;
	#headers: Headers;
	#items: ReadonlyArray<TreeItem>;
	constructor(
		hash: string,
		headers: Headers,
		items: ReadonlyArray<TreeItem>,
	) {
		this.#hash = hash;
		this.#headers = headers;
		this.#items = [...items];
	}

	static async new(items: ReadonlyArray<TreeItem>): Promise<Tree>;
	static async new(headersInit: HeadersInit, items: ReadonlyArray<TreeItem>): Promise<Tree>;
	static async new(headersInit_or_items: HeadersInit | ReadonlyArray<TreeItem>, items?: ReadonlyArray<TreeItem>): Promise<Tree> {
		const headersInit = items ? headersInit_or_items as HeadersInit : {};
		items = items ? items : headersInit_or_items as ReadonlyArray<TreeItem>;

		const content = Tree.#toArrayBuffer(items);

		const headers = new Headers(headersInit);
		headers.has("content-type") || headers.set("content-type", "text/pxlr-tree");
		headers.set("content-length", content.byteLength.toString());

		const tmp = new Tree("", headers, items);
		const hasher = sha1.create();
		for await (const chunk of tmp.toReadableStream()) {
			hasher.update(chunk);
		}
		const hashBuffer = hasher.digest();
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return new Tree(hash, headers, items);
	}

	static #toArrayBuffer(
		items: ReadonlyArray<TreeItem>,
	): Uint8Array<ArrayBuffer> {
		const payload = items
			.map((item) => {
				const { hash, kind, name } = item;
				return `${encodeURIComponent(kind)} ${hash} ${encodeURIComponent(name)}`;
			})
			.join(`\n`);
		const data = new TextEncoder().encode(payload);
		return data;
	}

	get hash() {
		return this.#hash;
	}

	get headers() {
		return this.#headers;
	}

	get items() {
		return [...this.#items];
	}

	static async fromReadableStream(stream: ReadableStream<Uint8Array<ArrayBuffer>>) {
		const headers = new Headers();
		const content = new Uint8Array(new ArrayBuffer(0, { maxByteLength: 1024 * 1024 * 100 }));
		const transformer = new ResponseTransformStream();
		stream.pipeThrough(transformer);
		for await (const chunk of transformer.readable) {
			if (chunk.type === "header") {
				headers.append(chunk.key, chunk.value);
			} else {
				const len = content.byteLength;
				content.buffer.resize(len + chunk.data.byteLength);
				content.set(chunk.data, len);
			}
		}
		assert(Number(headers.get("content-length")) === content.byteLength, "Content-Length does not match content size.");

		const payload = new TextDecoder().decode(content);
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

		return Tree.new(headers, items);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return new ReadableStream<Uint8Array<ArrayBuffer>>({
			start: (controller) => {
				const encoder = new TextEncoder();
				const separator = encoder.encode(": ");
				const eol = encoder.encode("\r\n");

				for (const [key, value] of this.headers) {
					controller.enqueue(encoder.encode(encodeURI(key)));
					controller.enqueue(separator);
					controller.enqueue(encoder.encode(encodeURI(value)));
					controller.enqueue(eol);
				}
				controller.enqueue(eol);
				controller.enqueue(Tree.#toArrayBuffer(this.items));
				controller.close();
			},
		});
	}
}

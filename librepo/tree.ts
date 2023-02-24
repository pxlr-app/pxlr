import { assertAutoId, AutoId } from "../libpxlr/autoid.ts";
import { ResponseReaderStream, ResponseWriterStream } from "./response.ts";

export interface TreeItem {
	hash: AutoId;
	id: AutoId;
	kind: string;
	name: string;
}

export class Tree {
	#hash: AutoId;
	#id: AutoId;
	#subKind: string;
	#name: string;
	#items: ReadonlyArray<TreeItem>;
	public constructor(
		hash: AutoId,
		id: AutoId,
		subKind: string,
		name: string,
		items: ReadonlyArray<TreeItem>,
	) {
		assertAutoId(hash);
		assertAutoId(id);
		if (subKind === "") {
			throw new InvalidTreeError();
		}
		this.#hash = hash;
		this.#id = id;
		this.#subKind = subKind;
		this.#name = name;
		this.#items = items;
	}

	get hash() {
		return this.#hash;
	}
	get id() {
		return this.#id;
	}
	get subKind() {
		return this.#subKind;
	}
	get name() {
		return this.#name;
	}
	get items() {
		return this.#items;
	}

	static async fromStream(hash: AutoId, stream: ReadableStream<Uint8Array>) {
		const decoder = new TextDecoder();
		const headers = new Map<string, string>();
		let itemLines = "";
		const transformer = new ResponseWriterStream();
		stream.pipeThrough(transformer);
		for await (const chunk of transformer.readable) {
			if (chunk.type === "header") {
				headers.set(chunk.key, chunk.value);
			} else {
				itemLines += decoder.decode(chunk.data);
			}
		}
		const items = itemLines.split(`\r\n`).filter((l) => l.length).map((line) => {
			const [kind, hash, id, name] = line.split(" ");
			assertAutoId(hash);
			assertAutoId(id);
			return {
				kind: decodeURIComponent(kind),
				hash,
				id,
				name: decodeURIComponent(name),
			};
		});
		return new Tree(
			hash,
			headers.get("id") ?? "",
			headers.get("sub-kind") ?? "",
			headers.get("name") ?? "",
			items,
		);
	}

	toStream() {
		const items = this.items.map((item) => {
			const { kind, hash, id, name } = item;
			assertAutoId(hash);
			assertAutoId(id);
			return `${encodeURIComponent(kind)} ${hash} ${id} ${encodeURIComponent(name)}}`;
		}).join(`\r\n`);
		const transformer = new ResponseReaderStream();
		const writer = transformer.writable.getWriter();
		writer.write({ type: "header", key: "sub-kind", value: this.subKind });
		writer.write({
			type: "body",
			data: new TextEncoder().encode(items),
		});
		writer.close();
		return transformer.readable;
	}
}

export class InvalidTreeError extends Error {
	public name = "InvalidTreeError";
}

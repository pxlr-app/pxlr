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
	#subKind: string;
	#items: ReadonlyArray<TreeItem>;
	public constructor(
		hash: AutoId,
		subKind: string,
		items: ReadonlyArray<TreeItem>,
	) {
		assertAutoId(hash);
		if (subKind === "") {
			throw new InvalidTreeError();
		}
		this.#hash = hash;
		this.#subKind = subKind;
		this.#items = items;
	}

	get hash() {
		return this.#hash;
	}
	get subKind() {
		return this.#subKind;
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
			headers.get("subkind") ?? "",
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
		writer.write({ type: "header", key: "subkind", value: this.subKind });
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

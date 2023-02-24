import { assertAutoId, AutoId } from "../libpxlr/autoid.ts";
import { BaseObject, deserializeBaseObject, serializeBaseObject } from "./object.ts";

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

	static async readFromStream(hash: AutoId, readableStream: ReadableStream<Uint8Array>) {
		const obj = await deserializeBaseObject(readableStream);
		const itemLines = await obj.text();
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
			obj.headers.get("id") ?? "",
			obj.headers.get("sub-kind") ?? "",
			obj.headers.get("name") ?? "",
			items,
		);
	}

	async writeToStream(writableStream: WritableStream<Uint8Array>) {
		const items = this.items.map((item) => {
			const { kind, hash, id, name } = item;
			assertAutoId(hash);
			assertAutoId(id);
			return `${encodeURIComponent(kind)} ${hash} ${id} ${encodeURIComponent(name)}}`;
		}).join(`\r\n`);
		const obj = new BaseObject({ id: this.id, subKind: this.subKind, name: this.name }, items);
		await serializeBaseObject(obj, writableStream);
	}
}

export class InvalidTreeError extends Error {
	public name = "InvalidTreeError";
}

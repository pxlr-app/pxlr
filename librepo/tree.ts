import { assertAutoId, AutoId } from "../libpxlr/autoid.ts";
import { Object } from "./object.ts";

export interface TreeItem {
	hash: AutoId;
	id: AutoId;
	kind: string;
	name: string;
}

export class Tree<T extends Record<string, string> = Record<never, never>> {
	#hash: AutoId;
	#id: AutoId;
	#subKind: string;
	#name: string;
	#items: ReadonlyArray<T & TreeItem>;
	public constructor(
		hash: AutoId,
		id: AutoId,
		subKind: string,
		name: string,
		items: ReadonlyArray<T & TreeItem>,
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

	toObject(otherFieldOrder: (keyof T)[] = []): Object {
		return new Object(
			this.#hash,
			this.id,
			"tree",
			{
				"sub-kind": this.subKind,
				name: this.name,
			},
			this.items.map((item) => {
				const { kind, hash, id, name, ...rest } = item;
				assertAutoId(hash);
				assertAutoId(id);
				const other = otherFieldOrder.reduce((other, name) => {
					other.push(encodeURIComponent(rest[name as string]));
					return other;
				}, [] as string[]);
				return `${encodeURIComponent(kind)} ${hash} ${id} ${encodeURIComponent(name)} ${other.join(" ")}`;
			}).join(`\n`),
		);
	}

	static async fromObject<
		T extends Record<string, string> = Record<never, never>,
	>(object: Object, otherFieldOrder: (keyof T)[] = []): Promise<Tree<T>> {
		const itemLines = await object.text();
		const items = itemLines.split(`\n`).filter((l) => l.length).map((line) => {
			const [kind, hash, id, name, ...rest] = line.split(" ");
			assertAutoId(hash);
			assertAutoId(id);
			const other = otherFieldOrder.reduce((other, name, i) => {
				other[name] = decodeURIComponent(rest[i] ?? "") as T[keyof T];
				return other;
			}, {} as T);
			return {
				kind: decodeURIComponent(kind),
				hash,
				id,
				name: decodeURIComponent(name),
				...other,
			};
		});
		return new Tree(
			object.hash,
			object.id,
			object.headers.get("sub-kind") ?? "",
			object.headers.get("name") ?? "",
			items,
		);
	}
}

export class InvalidTreeError extends Error {
	public name = "InvalidTreeError";
}

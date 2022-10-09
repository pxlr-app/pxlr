import { assertAutoId, AutoId } from "../autoid.ts";
import { Object } from "./object.ts";

export interface TreeItem {
	id: AutoId;
	kind: string;
	name: string;
}

export class Tree<T extends Record<string, string> = Record<never, never>> {
	public constructor(
		public readonly id: AutoId,
		public readonly subKind: string,
		public readonly name: string,
		public readonly items: ReadonlyArray<T & TreeItem>,
	) {
		assertAutoId(id);
		if (subKind === "") {
			throw new InvalidTreeError();
		}
	}

	toObject(otherFieldOrder: (keyof T)[] = []): Object {
		return new Object(
			this.id,
			"tree",
			{
				"sub-kind": this.subKind,
				name: this.name,
			},
			this.items.map((item) => {
				const { kind, id, name, ...rest } = item;
				assertAutoId(id);
				const other = otherFieldOrder.reduce((other, name) => {
					other.push(encodeURIComponent(rest[name as string]));
					return other;
				}, [] as string[]);
				return `${encodeURIComponent(kind)} ${encodeURIComponent(id)} ${encodeURIComponent(name)} ${other.join(" ")}`;
			}).join(`\r\n`),
		);
	}

	static async fromObject<T extends Record<string, string> = Record<never, never>>(object: Object, otherFieldOrder: (keyof T)[] = []): Promise<Tree<T>> {
		const itemLines = await object.text();
		const items = itemLines.split(`\r\n`).map((line) => {
			const [kind, id, name, ...rest] = line.split(" ");
			assertAutoId(id);
			const other = otherFieldOrder.reduce((other, name, i) => {
				other[name] = decodeURIComponent(rest[i] ?? "") as T[keyof T];
				return other;
			}, {} as T);
			return { kind: decodeURIComponent(kind), id: decodeURIComponent(id), name: decodeURIComponent(name), ...other };
		});
		return new Tree(
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

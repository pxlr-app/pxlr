export interface TreeItem {
	hash: string;
	kind: string;
	name: string;
}

export class Tree {
	#items: ReadonlyArray<TreeItem>;
	constructor(
		items: ReadonlyArray<TreeItem>,
	) {
		this.#items = [...items];
	}

	get items() {
		return [...this.#items];
	}

	static async fromArrayBuffer(buffer: ArrayBuffer) {
		const payload = new TextDecoder().decode(buffer);
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

		return new Tree(items);
	}

	toArrayBuffer() {
		const payload = this.items
			.map((item) => {
				const { kind, hash, name } = item;
				return `${encodeURIComponent(kind)} ${hash} ${encodeURIComponent(name)}`;
			})
			.join(`\n`);
		const data = new TextEncoder().encode(payload);
		return data.buffer;
	}
}

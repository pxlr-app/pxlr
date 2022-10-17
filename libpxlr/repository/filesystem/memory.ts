import { Filesystem } from "./filesystem.ts";

export class MemoryFilesystem extends Filesystem {
	public entries: Map<string, ArrayBuffer>;
	constructor(
		entries: Record<string, ArrayBuffer> = {},
	) {
		super();
		this.entries = new Map(Object.entries(entries));
	}

	// deno-lint-ignore require-await
	async exists(path: string) {
		if (!this.entries.has(path)) {
			for (const [key] of this.entries) {
				if (key.substring(0, path.length) + "/" === path) {
					return true;
				}
			}
			return false;
		}
		return true;
	}

	async *list(path: string) {
		const entries = Array.from(
			new Set(
				Array.from(this.entries.keys())
					.filter((key) => key.substring(0, path.length) === path && key.substring(path.length, path.length + 1) === "/")
					.map((key) => key.substring(path.length + 1).split("/").shift()!),
			),
		);
		entries.sort();
		yield* entries;
	}

	// deno-lint-ignore require-await
	async read(path: string): Promise<ReadableStream<Uint8Array>> {
		const buffer = this.entries.get(path);
		if (!buffer) {
			throw new Error(`File not found.`);
		}
		return new ReadableStream({
			pull(controller) {
				controller.enqueue(new Uint8Array(buffer));
				controller.close();
			},
		});
	}

	// deno-lint-ignore require-await
	async write(path: string): Promise<WritableStream<Uint8Array>> {
		const chunks: Uint8Array[] = [];
		return new WritableStream({
			write(chunk) {
				if (!(chunk instanceof Uint8Array)) {
					throw new TypeError(`Expected chunk to be an Uint8Array, got ${chunk}.`);
				}
				chunks.push(chunk);
			},
			close: () => {
				const buffer = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.byteLength, 0));
				let offset = 0;
				for (const chunk of chunks) {
					buffer.set(chunk, offset);
					offset += chunk.byteLength;
				}
				this.entries.set(path, buffer);
			},
		});
	}
}

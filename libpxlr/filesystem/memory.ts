import { Buffer } from "https://deno.land/std@0.158.0/streams/mod.ts";
import { dirname } from "https://deno.land/std@0.156.0/path/mod.ts";
import { Filesystem } from "./filesystem.ts";

export class MemoryFilesystem extends Filesystem {
	public entries: Map<string, Buffer>;
	constructor(
		entries: Record<string, Buffer>,
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
		const entries = Array.from(new Set(Array.from(this.entries.keys())
							.filter(key => key.substring(0, path.length) === path && key.substring(path.length, path.length + 1) === "/")
							.map(key => key.substring(path.length + 1).split('/').shift()!)));
		yield* entries;
	}

	// deno-lint-ignore require-await
	async read(path: string): Promise<ReadableStream> {
		const buffer = this.entries.get(path);
		if (!buffer) {
			throw new Error(`File not found.`);
		}
		return buffer.readable;
	}

	// deno-lint-ignore require-await
	async write(path: string): Promise<WritableStream> {
		const buffer = this.entries.get(path);
		if (!buffer) {
			throw new Error(`File not found.`);
		}
		return buffer.writable;
	}
}

import { join } from "https://deno.land/std@0.156.0/path/mod.ts";
import { Filesystem } from "./filesystem.ts";

export class DenoFilesystem extends Filesystem {
	constructor(public readonly root: string) {
		super();
	}

	async exists(path: string) {
		try {
			const _stat = await Deno.stat(join(this.root, path));
			return true;
		} catch (_err) {
			return false;
		}
	}

	async *list(path: string) {
		for await (const entry of Deno.readDir(join(this.root, path))) {
			yield entry.name;
		}
	}
	async read(path: string): Promise<ReadableStream> {
		const file = await Deno.open(join(this.root, path));
		return file.readable;
	}
	async write(path: string): Promise<WritableStream> {
		const file = await Deno.open(join(this.root, path));
		return file.writable;
	}
}

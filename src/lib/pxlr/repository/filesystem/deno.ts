import { join } from "https://deno.land/std@0.156.0/path/index";
import { Filesystem } from "./filesystem";

export class DenoFilesystem extends Filesystem {
	#root: string;
	constructor(root: string) {
		super();
		this.#root = root;
	}

	get root() {
		return this.#root;
	}

	async exists(path: string) {
		try {
			const _stat = await Deno.stat(join(this.root, path));
			return true;
		} catch (_err) {
			return false;
		}
	}

	async *list(prefix: string) {
		for await (const entry of Deno.readDir(join(this.root, prefix))) {
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

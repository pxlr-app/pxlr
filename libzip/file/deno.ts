import { File, SeekFrom } from "./file.ts";

export class DenoFile implements File {
	#file: Deno.FsFile | undefined;
	constructor(file: Deno.FsFile) {
		this.#file = file;
	}

	// deno-lint-ignore require-await
	async read(buffer: Uint8Array): Promise<number | null> {
		if (this.#file) {
			return this.#file.read(buffer);
		}
		return 0;
	}

	// deno-lint-ignore require-await
	async seek(offset: number, from: SeekFrom): Promise<number> {
		if (this.#file) {
			let seekMode = Deno.SeekMode.Start;
			if (from === SeekFrom.Current) {
				seekMode = Deno.SeekMode.Current;
			} else if (from === SeekFrom.End) {
				seekMode = Deno.SeekMode.End;
			}
			return this.#file.seek(offset, seekMode);
		}
		return 0;
	}

	// deno-lint-ignore require-await
	async write(buffer: Uint8Array): Promise<number> {
		if (this.#file) {
			return this.#file.write(buffer);
		}
		return 0;
	}

	// deno-lint-ignore require-await
	async close(): Promise<void> {
		this.#file = undefined;
	}
}

import { File, FileClosedError, SeekFrom } from "./file.ts";

export class DenoFile implements File {
	#file: Deno.FsFile | undefined;
	constructor(file: Deno.FsFile) {
		this.#file = file;
	}

	seek(offset: number, from: SeekFrom): Promise<number> {
		if (!this.#file) {
			throw new FileClosedError();
		}
		let seekMode = Deno.SeekMode.Start;
		if (from === SeekFrom.Current) {
			seekMode = Deno.SeekMode.Current;
		} else if (from === SeekFrom.End) {
			seekMode = Deno.SeekMode.End;
		}
		return this.#file.seek(offset, seekMode);
	}

	// deno-lint-ignore require-await
	async readIntoBuffer(buffer: Uint8Array): Promise<number | null> {
		if (this.#file) {
			return this.#file.read(buffer);
		}
		return 0;
	}

	// deno-lint-ignore require-await
	async readStream(size: number): Promise<ReadableStream<Uint8Array>> {
		if (!this.#file) {
			throw new FileClosedError();
		}
		let offset = 0;
		return new ReadableStream({
			pull: async (controller) => {
				if (
					offset >= size ||
					!this.#file
				) {
					controller.close();
					return;
				}
				const chunkSize = Math.min(controller.desiredSize ?? 4 * 1024, size - offset);
				const buffer = new Uint8Array(chunkSize);
				const bytesRead = await this.#file.read(buffer);
				if (bytesRead === null) {
					controller.close();
					return;
				}
				if (bytesRead > 0) {
					controller.enqueue(buffer);
					offset += bytesRead;
				}
			},
		});
	}

	// deno-lint-ignore require-await
	async writeBuffer(buffer: Uint8Array): Promise<number> {
		if (this.#file) {
			return this.#file.write(buffer);
		}
		return 0;
	}

	// deno-lint-ignore require-await
	async writeStream(): Promise<WritableStream<Uint8Array>> {
		if (!this.#file) {
			throw new FileClosedError();
		}
		return new WritableStream<Uint8Array>({
			write: async (chunk, _controller) => {
				await this.#file?.write(chunk);
			},
		});
	}

	// deno-lint-ignore require-await
	async close(): Promise<void> {
		this.#file = undefined;
	}
}

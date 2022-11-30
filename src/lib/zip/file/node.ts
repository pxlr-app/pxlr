import { File, FileClosedError, SeekFrom } from "./file";
import { FileHandle } from "node:fs/promises";

export class NodeFile implements File {
	#fileHandle: FileHandle | undefined;
	#offset: number;
	constructor(file: FileHandle) {
		this.#fileHandle = file;
		this.#offset = 0;
	}

	async seek(offset: number, from: SeekFrom): Promise<number> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		if (from === SeekFrom.Current) {
			this.#offset += offset;
		} else if (from === SeekFrom.End) {
			const stat = await this.#fileHandle.stat()
			this.#offset = stat.size + offset;
		} else {
			this.#offset = offset;
		}
		return this.#offset;
	}

	truncate(length?: number): Promise<void> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		return this.#fileHandle.truncate(length);
	}

	async readIntoBuffer(buffer: Uint8Array): Promise<number> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		const { bytesRead } = await this.#fileHandle.read(buffer, 0, buffer.byteLength, this.#offset);
		this.#offset += bytesRead;
		return bytesRead;
	}

	async readStream(size: number): Promise<ReadableStream<Uint8Array>> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		let offset = 0;
		return new ReadableStream({
			pull: async (controller) => {
				if (
					offset >= size ||
					!this.#fileHandle
				) {
					controller.close();
					return;
				}
				const chunkSize = Math.min(
					controller.desiredSize ?? 4 * 1024,
					size - offset,
				);
				const buffer = new Uint8Array(chunkSize);
				const { bytesRead } = await this.#fileHandle.read(buffer, 0, buffer.byteLength, this.#offset);
				this.#offset += bytesRead;
				if (bytesRead === 0) {
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

	async writeBuffer(buffer: Uint8Array): Promise<number> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		const { bytesWritten } = await this.#fileHandle.write(buffer, 0, buffer.byteLength, this.#offset);
		this.#offset += bytesWritten;
		return bytesWritten;
	}

	async writeStream(): Promise<WritableStream<Uint8Array>> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		return new WritableStream<Uint8Array>({
			write: async (chunk, _controller) => {
				const { bytesWritten } = await this.#fileHandle!.write(chunk, 0, chunk.byteLength, this.#offset);
				this.#offset += bytesWritten;
			},
		});
	}

	async close(): Promise<void> {
		await this.#fileHandle?.close();
		this.#fileHandle = undefined;
		this.#offset = 0;
	}
}

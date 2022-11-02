import { File, FileClosedError, SeekFrom } from "./file.ts";

// deno-lint-ignore no-explicit-any
type FileSystemFileHandle = any;

export class WebFile implements File {
	#fileHandle: FileSystemFileHandle | undefined;
	#offset: number;
	constructor(file: FileSystemFileHandle) {
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
			const file = await this.#fileHandle.getFile();
			this.#offset = file.size + offset;
		} else {
			this.#offset = offset;
		}
		return this.#offset;
	}

	async truncate(length?: number): Promise<void> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		const writableStream = await this.#fileHandle.createWritable({ keepExistingData: true });
		await writableStream.truncate(length);
		await writableStream.close();
	}

	async readIntoBuffer(buffer: Uint8Array): Promise<number | null> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		const len = buffer.byteLength;
		const file = await this.#fileHandle.getFile();
		const blob = file.slice(this.#offset, this.#offset + len);
		const arrayBuffer = new Uint8Array(await blob.arrayBuffer());
		buffer.set(arrayBuffer, 0);
		this.#offset += len;
		return arrayBuffer.byteLength;
	}

	async readStream(size: number): Promise<ReadableStream<Uint8Array>> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		const file = await this.#fileHandle.getFile();
		let offset = 0;
		return new ReadableStream({
			pull: async (controller) => {
				if (offset >= size) {
					controller.close();
					return;
				}
				const chunkSize = Math.min(controller.desiredSize ?? 4 * 1024, size - offset);
				const blob = file.slice(this.#offset, this.#offset + chunkSize);
				const arrayBuffer = new Uint8Array(await blob.arrayBuffer());
				controller.enqueue(arrayBuffer);
				this.#offset += arrayBuffer.byteLength;
				offset += arrayBuffer.byteLength;
			},
		});
	}

	async writeBuffer(buffer: Uint8Array): Promise<number> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		const writableStream = await this.#fileHandle.createWritable({ keepExistingData: true });
		await writableStream.write({ type: "write", data: buffer, position: this.#offset, size: buffer.byteLength });
		await writableStream.close();
		this.#offset += buffer.byteLength;
		return buffer.byteLength;
	}

	async writeStream(): Promise<WritableStream<Uint8Array>> {
		if (!this.#fileHandle) {
			throw new FileClosedError();
		}
		const writableStream = await this.#fileHandle.createWritable({ keepExistingData: true });
		//return writableStream;
		let byteWritten = 0;
		return new WritableStream({
			write: async (chunk) => {
				await writableStream.write(chunk);
				byteWritten += chunk.byteLength;
			},
			close: () => {
				this.#offset += byteWritten;
			},
		});
	}

	// deno-lint-ignore require-await
	async close(): Promise<void> {
		this.#fileHandle = undefined;
		this.#offset = 0;
	}
}

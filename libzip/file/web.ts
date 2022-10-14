import { File, SeekFrom } from "./file.ts";

// deno-lint-ignore no-explicit-any
type FileSystemFileHandle = any;

export class WebFile implements File {
	#fileHandle: FileSystemFileHandle;
	#offset: number;
	constructor(file: FileSystemFileHandle) {
		this.#fileHandle = file;
		this.#offset = 0;
	}

	async read(buffer: Uint8Array): Promise<number> {
		const len = buffer.byteLength;
		const file = await this.#fileHandle.getFile();
		const blob = file.slice(this.#offset, this.#offset + len);
		const arrayBuffer = new Uint8Array(await blob.arrayBuffer());
		buffer.set(arrayBuffer, 0);
		return arrayBuffer.byteLength;
	}

	async seek(offset: number, from: SeekFrom): Promise<number> {
		if (from === SeekFrom.Current) {
			this.#offset += offset;
		} else if (from === SeekFrom.End) {
			const file = await this.#fileHandle.getFile();
			this.#offset = file.size - offset;
		} else {
			this.#offset = offset;
		}
		return this.#offset;
	}

	async write(buffer: Uint8Array): Promise<number> {
		const writableStream = await this.#fileHandle.createWritable({ keepExistingData: true });
		await writableStream.write({ type: "write", data: buffer, position: this.#offset, size: buffer.byteLength });
		await writableStream.close();
		return buffer.byteLength;
	}

	async close(): Promise<void> {
	}
}

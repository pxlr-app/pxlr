// import { File, FileClosedError, Filesystem, IOError, SeekFrom } from "../mod.ts";

// export class WebFileSystem extends Filesystem {
// 	#folderHandle: FileSystemDirectoryHandle | undefined;
// 	constructor(
// 		folderHandle: FileSystemDirectoryHandle,
// 	) {
// 		super();
// 		this.#folderHandle = folderHandle;
// 	}

// 	async #getFileSystemHandleAtPath(path: string, asFile = true) {
// 		const parts = path.split("/");
// 		if (this.#folderHandle) {
// 			let dir = this.#folderHandle;
// 			let name;
// 			while ((name = parts.shift())) {
// 				if (parts.length > 0) {
// 					dir = await dir.getDirectoryHandle(name);
// 				} else {
// 					if (asFile) {
// 						return await dir.getFileHandle(name);
// 					} else {
// 						return await dir.getDirectoryHandle(name);
// 					}
// 				}
// 			}
// 		}
// 	}

// 	async exists(path: string) {
// 		try {
// 			const fileHandle = await this.#getFileSystemHandleAtPath(path);
// 			return !!fileHandle;
// 		} catch {
// 			return false;
// 		}
// 	}

// 	async *list(prefix: string) {
// 		const directoryHandle = prefix === "" ? this.#folderHandle : await this.#getFileSystemHandleAtPath(prefix, false);
// 		if (directoryHandle instanceof FileSystemDirectoryHandle) {
// 			for await (const entry of directoryHandle.values()) {
// 				yield entry.name;
// 			}
// 		}
// 	}

// 	async get(path: string): Promise<File> {
// 		const fileHandle = await this.#getFileSystemHandleAtPath(path);
// 		if (!(fileHandle instanceof FileSystemFileHandle)) {
// 			throw new IOError();
// 		}
// 		const file = await fileHandle.getFile();
// 		return new WebFile(fileHandle);
// 	}
// }

// export class WebFile extends File {
// 	#fileHandle: FileSystemFileHandle | undefined;
// 	#offset: number;
// 	constructor(file: FileSystemFileHandle) {
// 		super();
// 		this.#fileHandle = file;
// 		this.#offset = 0;
// 	}

// 	async seek(offset: number, from: SeekFrom): Promise<number> {
// 		if (!this.#fileHandle) {
// 			throw new FileClosedError();
// 		}
// 		if (from === SeekFrom.Current) {
// 			this.#offset += offset;
// 		} else if (from === SeekFrom.End) {
// 			const file = await this.#fileHandle.getFile();
// 			this.#offset = file.size + offset;
// 		} else {
// 			this.#offset = offset;
// 		}
// 		return this.#offset;
// 	}

// 	async truncate(length?: number): Promise<void> {
// 		if (!this.#fileHandle) {
// 			throw new FileClosedError();
// 		}
// 		const writableStream = await this.#fileHandle.createWritable({
// 			keepExistingData: true,
// 		});
// 		await writableStream.truncate(length ?? 0);
// 		await writableStream.close();
// 	}

// 	async arrayBuffer(): Promise<ArrayBuffer> {
// 		if (!this.#fileHandle) {
// 			throw new FileClosedError();
// 		}
// 		const file = await this.#fileHandle.getFile();
// 		return file.arrayBuffer();
// 	}

// 	async readIntoBuffer(buffer: Uint8Array): Promise<number | null> {
// 		if (!this.#fileHandle) {
// 			throw new FileClosedError();
// 		}
// 		const len = buffer.byteLength;
// 		const file = await this.#fileHandle.getFile();
// 		const blob = file.slice(this.#offset, this.#offset + len);
// 		const arrayBuffer = new Uint8Array(await blob.arrayBuffer());
// 		buffer.set(arrayBuffer, 0);
// 		this.#offset += len;
// 		return arrayBuffer.byteLength;
// 	}

// 	async readStream(size: number): Promise<ReadableStream<Uint8Array>> {
// 		if (!this.#fileHandle) {
// 			throw new FileClosedError();
// 		}
// 		const file = await this.#fileHandle.getFile();
// 		let offset = 0;
// 		return new ReadableStream({
// 			pull: async (controller) => {
// 				if (offset >= size) {
// 					controller.close();
// 					return;
// 				}
// 				const chunkSize = Math.min(
// 					controller.desiredSize ?? 4 * 1024,
// 					size - offset,
// 				);
// 				const blob = file.slice(this.#offset, this.#offset + chunkSize);
// 				const arrayBuffer = new Uint8Array(await blob.arrayBuffer());
// 				controller.enqueue(arrayBuffer);
// 				this.#offset += arrayBuffer.byteLength;
// 				offset += arrayBuffer.byteLength;
// 			},
// 		});
// 	}

// 	async writeBuffer(buffer: Uint8Array): Promise<number> {
// 		if (!this.#fileHandle) {
// 			throw new FileClosedError();
// 		}
// 		const writableStream = await this.#fileHandle.createWritable({
// 			keepExistingData: true,
// 		});
// 		await writableStream.write({
// 			type: "write",
// 			data: buffer as any,
// 			position: this.#offset,
// 			size: buffer.byteLength,
// 		});
// 		await writableStream.close();
// 		this.#offset += buffer.byteLength;
// 		return buffer.byteLength;
// 	}

// 	async writeStream(): Promise<WritableStream<Uint8Array>> {
// 		if (!this.#fileHandle) {
// 			throw new FileClosedError();
// 		}
// 		const writableStream = await this.#fileHandle.createWritable({
// 			keepExistingData: true,
// 		});
// 		//return writableStream;
// 		let byteWritten = 0;
// 		return new WritableStream({
// 			write: async (chunk) => {
// 				await writableStream.write(chunk as any);
// 				byteWritten += chunk.byteLength;
// 			},
// 			close: () => {
// 				this.#offset += byteWritten;
// 			},
// 		});
// 	}

// 	// deno-lint-ignore require-await
// 	async close(): Promise<void> {
// 		this.#fileHandle = undefined;
// 		this.#offset = 0;
// 	}
// }

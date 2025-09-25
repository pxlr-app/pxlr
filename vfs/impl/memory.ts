import { File, FileNotFoundError, FileOpenOptions, Folder, IOError } from "../mod.ts";
import { join, parse } from "@std/path";

const storageSymbol = Symbol("storage");

type StorageEntry =
	| { type: "file"; content: Uint8Array<ArrayBuffer> }
	| { type: "folder" };

export class MemoryFolder extends Folder {
	[storageSymbol]: Map<string, StorageEntry>;
	#fullPath: string;
	constructor(fullPath: string, storage: Map<string, StorageEntry>) {
		super();
		this.#fullPath = fullPath;
		this[storageSymbol] = storage ?? new Map();
	}

	get base() {
		return parse(this.#fullPath).base;
	}

	async exists(abortSignal?: AbortSignal): Promise<boolean> {
		return this[storageSymbol].has(this.#fullPath);
	}

	async *list(abortSignal?: AbortSignal): AsyncIterableIterator<File | Folder> {
		const prefix = this.#fullPath.split("/").filter(Boolean);
		for (const [path, entry] of this[storageSymbol].entries()) {
			abortSignal?.throwIfAborted();
			const parts = path.split("/").filter(Boolean);
			if (
				prefix.every((part, i) => part === parts[i]) &&
				parts.length === prefix.length + 1
			) {
				if (entry.type === "file") {
					yield new MemoryFile(path, this[storageSymbol]);
				} else {
					yield new MemoryFolder(path, this[storageSymbol]);
				}
			}
		}
	}

	async getFile(name: string, abortSignal?: AbortSignal): Promise<File> {
		const fullPath = join(this.#fullPath, name);
		return new MemoryFile(fullPath, this[storageSymbol]);
	}

	async getDir(path: string, abortSignal?: AbortSignal): Promise<Folder> {
		const fullPath = join(this.#fullPath, path);
		return new MemoryFolder(fullPath, this[storageSymbol]);
	}

	async mkdir(name: string, abortSignal?: AbortSignal): Promise<Folder> {
		const fullPath = join(this.#fullPath, name);
		this[storageSymbol].set(fullPath, { type: "folder" });
		return new MemoryFolder(fullPath, this[storageSymbol]);
	}

	async rmdir(name: string, abortSignal?: AbortSignal): Promise<void> {
		const fullPath = join(this.#fullPath, name);
		this[storageSymbol].delete(fullPath);
	}
}

export class MemoryRootFolder extends MemoryFolder {
	constructor(storage: Map<string, StorageEntry> = new Map()) {
		super("", storage);
	}

	get storage() {
		return this[storageSymbol];
	}

	static fromArrayBuffer(buffer: ArrayBuffer) {
		const storage = new Map<string, StorageEntry>();
		const data = new Uint8Array(buffer);
		let offset = 0;
		while (offset < data.byteLength) {
			const nullIndex = data.indexOf(0, offset);
			if (nullIndex === -1) {
				break;
			}
			const header = new TextDecoder().decode(data.subarray(offset, nullIndex));
			const [type, path, lengthStr] = header.split(" ");
			const length = parseInt(lengthStr, 10) || 0;
			offset = nullIndex + 1;
			if (type === "file") {
				const content = data.subarray(offset, offset + length);
				storage.set(decodeURIComponent(path), { type: "file", content: new Uint8Array(content) });
				offset += length;
			} else if (type === "folder") {
				storage.set(decodeURIComponent(path), { type: "folder" });
			} else {
				throw new IOError(`Unknown entry type: ${type}`);
			}
		}
		return new MemoryRootFolder(storage);
	}

	toArrayBuffer(): ArrayBuffer {
		const entries = Array.from(this.storage.entries());
		const maxByteLength = entries.reduce((acc, [path, entry]) => {
			return acc + 1024 + (entry.type === "file" ? entry.content.byteLength : 0);
		}, 0);

		const data = entries
			.reduce((acc, [path, entry]) => {
				const header = entry.type === "file"
					? `file ${encodeURIComponent(path)} ${entry.content.byteLength}\0`
					: `folder ${encodeURIComponent(path)}\0`;
				const headerData = new TextEncoder().encode(header);
				const offset = acc.byteLength;
				acc.buffer.resize(acc.byteLength + headerData.byteLength + (entry.type === "file" ? entry.content.byteLength : 0));
				acc.set(headerData, offset);
				if (entry.type === "file") {
					acc.set(entry.content, offset + headerData.byteLength);
				}
				return acc;
			}, new Uint8Array(new ArrayBuffer(0, { maxByteLength })));

		return data.buffer;
	}
}

export class MemoryFile extends File {
	#storage: Map<string, StorageEntry>;
	#fullPath: string;
	#open: boolean;
	constructor(fullPath: string, storage: Map<string, StorageEntry>) {
		super();
		this.#fullPath = fullPath;
		this.#storage = storage;
		this.#open = false;
	}

	get base() {
		return parse(this.#fullPath).base;
	}

	async open(options: FileOpenOptions, abortSignal?: AbortSignal): Promise<void> {
		let entry = this.#storage.get(this.#fullPath);
		if (!entry && options.create) {
			entry = { type: "file", content: new Uint8Array(new ArrayBuffer(0, { maxByteLength: 1024 * 1024 * 1024 })) };
			this.#storage.set(this.#fullPath, entry);
		}
		if (!entry) {
			throw new FileNotFoundError();
		}
		this.#open = true;
	}

	async close(abortSignal?: AbortSignal): Promise<void> {
		this.#open = false;
	}

	get isOpen(): boolean {
		return this.#open;
	}

	async exists(abortSignal?: AbortSignal): Promise<boolean> {
		return this.#storage.has(this.#fullPath);
	}

	async size(abortSignal?: AbortSignal): Promise<number> {
		const entry = this.#storage.get(this.#fullPath);
		return entry?.type === "file" ? entry.content.byteLength : 0;
	}

	async arrayBuffer(abortSignal?: AbortSignal): Promise<ArrayBuffer> {
		const entry = this.#storage.get(this.#fullPath);
		if (entry?.type !== "file") {
			throw new IOError();
		}
		return entry.content.buffer;
	}

	async text(abortSignal?: AbortSignal): Promise<string> {
		return new TextDecoder().decode(await this.arrayBuffer(abortSignal));
	}

	async json(abortSignal?: AbortSignal): Promise<unknown> {
		return JSON.parse(await this.text(abortSignal));
	}

	async read(buffer: Uint8Array<ArrayBuffer>, offset?: number, abortSignal?: AbortSignal): Promise<number | null>;
	async read(size: number, offset?: number, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array<ArrayBuffer>>>;
	async read(
		buffer_or_size: Uint8Array<ArrayBuffer> | number,
		offset?: number,
		abortSignal?: AbortSignal,
	): Promise<number | null | ReadableStream<Uint8Array<ArrayBuffer>>> {
		const entry = this.#storage.get(this.#fullPath);
		if (entry?.type !== "file") {
			throw new IOError();
		}
		offset ??= 0;
		if (buffer_or_size instanceof Uint8Array) {
			const slice = entry.content.subarray(offset, offset + buffer_or_size.byteLength);
			buffer_or_size.set(slice);
			return slice.byteLength;
		} else {
			const size = buffer_or_size;
			return new Response(entry.content.subarray(offset, offset + size)).body;
		}
	}

	async write(buffer: Uint8Array<ArrayBuffer>, offset?: number, abortSignal?: AbortSignal): Promise<number>;
	async write(offset?: number, abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array<ArrayBuffer>>>;
	async write(
		buffer_or_offset?: Uint8Array<ArrayBuffer> | number,
		offset_or_abortSignal?: number | AbortSignal,
		abortSignal?: AbortSignal,
	): Promise<number | WritableStream<Uint8Array<ArrayBuffer>>> {
		let entry = this.#storage.get(this.#fullPath);
		if (entry?.type === "folder") {
			throw new IOError();
		}
		if (buffer_or_offset instanceof Uint8Array) {
			const buffer = buffer_or_offset;
			const offset = offset_or_abortSignal as number | undefined ?? 0;
			return writeAt(this.#fullPath, buffer, offset, this.#storage);
		} else {
			let offset = offset_or_abortSignal as number | undefined ?? 0;
			return Promise.resolve(
				new WritableStream<Uint8Array>({
					write: (chunk) => {
						offset += writeAt(this.#fullPath, chunk, offset, this.#storage);
					},
				}),
			);
		}

		function writeAt(fullPath: string, buffer: Uint8Array, offset: number, storage: Map<string, StorageEntry>): number {
			if (entry?.type === "folder") {
				throw new IOError();
			}
			const oldBuffer = entry?.content;
			const newBuffer = new Uint8Array(Math.max(oldBuffer?.byteLength ?? 0, buffer.byteLength + offset));
			oldBuffer && newBuffer.set(oldBuffer, 0);
			newBuffer.set(buffer, offset);
			storage.set(fullPath, { type: "file", content: newBuffer });
			return buffer.byteLength;
		}
	}

	async truncate(length?: number, offset?: number, abortSignal?: AbortSignal): Promise<void> {
		const entry = this.#storage.get(this.#fullPath);
		if (entry?.type !== "file") {
			throw new IOError();
		}
		const buffer = new Uint8Array(length ?? offset ?? 0);
		buffer.set(entry.content.subarray(0, buffer.byteLength));
		entry.content = buffer;
	}
}

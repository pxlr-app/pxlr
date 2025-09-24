import { File, Folder, IOError } from "../mod.ts";
import { join, parse } from "@std/path";
import { Zip, Zip64ExtensibleDataField } from "@pxlr/zip";

export class ZipFolder extends Folder {
	#storage: Zip;
	#fullPath: string;
	constructor(fullPath: string, storage: Zip) {
		super();
		this.#fullPath = fullPath;
		this.#storage = storage ?? new Map();
	}

	get base() {
		return parse(this.#fullPath).base;
	}

	async exists(abortSignal?: AbortSignal): Promise<boolean> {
		try {
			await this.#storage.getCentralDirectoryFileHeader(this.#fullPath);
			return true;
		} catch {
			return false;
		}
	}

	async *list(abortSignal?: AbortSignal): AsyncIterableIterator<File | Folder> {
		const prefix = this.#fullPath.split("/").filter(Boolean);
		const folders = new Set<string>();
		for (const entry of this.#storage.iterCentralDirectoryFileHeader()) {
			abortSignal?.throwIfAborted();
			const parts = entry.fileName.split("/").filter(Boolean);
			if (prefix.every((part, i) => part === parts[i])) {
				if (parts.length === prefix.length + 1) {
					yield new ZipFile(entry.fileName, this.#storage);
				} else {
					folders.add(parts.slice(0, prefix.length + 1).join("/"));
				}
			}
		}
		for (const folder of folders) {
			abortSignal?.throwIfAborted();
			yield new ZipFolder(folder, this.#storage);
		}
	}

	async open(name: string, abortSignal?: AbortSignal): Promise<File> {
		const fullPath = join(this.#fullPath, name);
		return new ZipFile(fullPath, this.#storage);
	}

	async openDir(path: string, abortSignal?: AbortSignal): Promise<Folder> {
		const fullPath = join(this.#fullPath, path);
		return new ZipFolder(fullPath, this.#storage);
	}

	async mkdir(name: string, abortSignal?: AbortSignal): Promise<Folder> {
		throw "unimplemented!";
	}

	async rmdir(name: string, abortSignal?: AbortSignal): Promise<void> {
		throw "unimplemented!";
	}
}

export class ZipRootFolder extends ZipFolder {
	constructor(zip: Zip) {
		super("", zip);
	}
}

export class ZipFile extends File {
	#storage: Zip;
	#fullPath: string;
	constructor(fullPath: string, storage: Zip) {
		super();
		this.#fullPath = fullPath;
		this.#storage = storage;
	}

	get base() {
		return parse(this.#fullPath).base;
	}

	async exists(abortSignal?: AbortSignal): Promise<boolean> {
		try {
			await this.#storage.getCentralDirectoryFileHeader(this.#fullPath);
			return true;
		} catch {
			return false;
		}
	}

	async size(abortSignal?: AbortSignal): Promise<number> {
		try {
			const entry = await this.#storage.getCentralDirectoryFileHeader(this.#fullPath);
			for (const fields of entry.extensibleDataFields) {
				if (fields instanceof Zip64ExtensibleDataField) {
					return fields.originalUncompressedData ?? entry.uncompressedLength;
				}
			}
			return entry.uncompressedLength;
		} catch {
			return 0;
		}
	}

	async arrayBuffer(abortSignal?: AbortSignal): Promise<ArrayBuffer> {
		const uint8Array = await this.#storage.get(this.#fullPath);
		return uint8Array.buffer;
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
		offset ??= 0;
		if (offset !== 0) {
			throw "TODO!";
		}
		if (buffer_or_size instanceof Uint8Array) {
			const content = await this.#storage.get(this.#fullPath);
			const slice = content.subarray(offset, offset + buffer_or_size.byteLength);
			buffer_or_size.set(slice);
			return slice.byteLength;
		} else {
			return this.#storage.getStream(this.#fullPath);
		}
	}

	async write(buffer: Uint8Array<ArrayBuffer>, offset?: number, abortSignal?: AbortSignal): Promise<number>;
	async write(offset?: number, abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array<ArrayBuffer>>>;
	async write(
		buffer_or_offset?: Uint8Array<ArrayBuffer> | number,
		offset_or_abortSignal?: number | AbortSignal,
		abortSignal?: AbortSignal,
	): Promise<number | WritableStream<Uint8Array<ArrayBuffer>>> {
		if (buffer_or_offset instanceof Uint8Array) {
			const buffer = buffer_or_offset;
			const offset = offset_or_abortSignal as number | undefined ?? 0;
			if (offset !== 0) {
				throw "TODO!";
			}
			await this.#storage.put(this.#fullPath, buffer, { compressionMethod: 8, abortSignal });
			return this.size();
		} else {
			const offset = buffer_or_offset as number | undefined ?? 0;
			const abortSignal = offset_or_abortSignal as AbortSignal | undefined;
			if (offset !== 0) {
				throw "TODO!";
			}
			return this.#storage.putStream(this.#fullPath, { compressionMethod: 8, abortSignal });
		}
	}

	async truncate(length?: number, offset?: number, abortSignal?: AbortSignal): Promise<void> {
		const content = await this.#storage.get(this.#fullPath);
		const buffer = new Uint8Array(length ?? offset ?? 0);
		buffer.set(content.subarray(0, buffer.byteLength));
		await this.#storage.put(this.#fullPath, buffer);
	}
}

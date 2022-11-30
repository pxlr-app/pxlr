import { Filesystem } from "./filesystem";

type FileSystemDirectoryHandle = any;

export class WebFilesystem extends Filesystem {
	#folderHandle: FileSystemDirectoryHandle | undefined;
	constructor(
		folderHandle: FileSystemDirectoryHandle,
	) {
		super();
		this.#folderHandle = folderHandle;
	}

	async #getFileSystemHandleAtPath(path: string, asFile = true) {
		const parts = path.split("/");
		let dir = this.#folderHandle;
		let name;
		while ((name = parts.shift())) {
			if (parts.length > 0) {
				dir = await dir.getDirectoryHandle(name);
			} else {
				if (asFile) {
					return await dir.getFileHandle(name);
				} else {
					return await dir.getDirectoryHandle(name);
				}
			}
		}
	}

	async exists(path: string) {
		try {
			const fileHandle = await this.#getFileSystemHandleAtPath(path);
			return !!fileHandle;
		} catch {
			return false;
		}
	}

	async *list(prefix: string) {
		const directoryHandle = prefix === "" ? this.#folderHandle : await this.#getFileSystemHandleAtPath(prefix, false);
		for await (const entry of directoryHandle.values()) {
			yield entry.name;
		}
	}

	async read(path: string): Promise<ReadableStream<Uint8Array>> {
		const fileHandle = await this.#getFileSystemHandleAtPath(path);
		const file = await fileHandle.getFile();
		return file.stream();
	}

	async write(path: string): Promise<WritableStream<Uint8Array>> {
		const parts = path.split("/");
		let dir = this.#folderHandle;
		let name;
		let fileHandle;
		while ((name = parts.shift())) {
			if (parts.length > 0) {
				dir = await dir.getDirectoryHandle(name, { create: true });
			} else {
				fileHandle = await dir.getFileHandle(name, { create: true });
			}
		}
		const writableStream = await fileHandle.createWritable();
		return writableStream;
	}
}

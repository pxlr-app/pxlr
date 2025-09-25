import { File, FileAlreadyOpenedError, FileNotFoundError, FileNotOpenedError, FileOpenOptions, Folder, IOError } from "../mod.ts";
import { join, parse } from "@std/path";

export class DenoFolder extends Folder {
	#fullPath: string;
	constructor(fullPath: string) {
		super();
		this.#fullPath = fullPath;
	}

	get base() {
		return parse(this.#fullPath).base;
	}

	async exists(abortSignal?: AbortSignal): Promise<boolean> {
		try {
			const stat = await Deno.stat(this.#fullPath);
			return stat.isDirectory;
		} catch (cause) {
			if (cause instanceof Deno.errors.NotFound) {
				return false;
			}
			throw new IOError(undefined, { cause });
		}
	}

	async *list(abortSignal?: AbortSignal): AsyncIterableIterator<File | Folder> {
		for await (const entry of Deno.readDir(this.#fullPath)) {
			if (entry.isFile) {
				yield new DenoFile(join(this.#fullPath, entry.name));
			} else {
				yield new DenoFolder(join(this.#fullPath, entry.name));
			}
		}
	}

	async getFile(name: string, abortSignal?: AbortSignal): Promise<File> {
		const fullPath = join(this.#fullPath, name);
		return new DenoFile(fullPath);
	}

	async getDir(path: string, abortSignal?: AbortSignal): Promise<Folder> {
		const fullPath = join(this.#fullPath, path);
		return new DenoFolder(fullPath);
	}

	async mkdir(name: string, abortSignal?: AbortSignal): Promise<Folder> {
		const fullPath = join(this.#fullPath, name);
		await Deno.mkdir(fullPath, { recursive: true });
		return new DenoFolder(fullPath);
	}

	async rmdir(name: string, abortSignal?: AbortSignal): Promise<void> {
		const fullPath = join(this.#fullPath, name);
		await Deno.remove(fullPath, { recursive: true });
	}
}

export class DenoFile extends File {
	#fullPath: string;
	#handle: Deno.FsFile | null = null;
	constructor(fullPath: string) {
		super();
		this.#fullPath = fullPath;
	}

	get base() {
		return parse(this.#fullPath).base;
	}

	async open(options: FileOpenOptions, abortSignal?: AbortSignal): Promise<void> {
		if (this.isOpen) {
			throw new FileAlreadyOpenedError();
		}
		try {
			this.#handle = await Deno.open(this.#fullPath, options);
		} catch (cause) {
			if (cause instanceof Deno.errors.NotFound) {
				throw new FileNotFoundError();
			}
			throw cause;
		}
	}

	async close(abortSignal?: AbortSignal): Promise<void> {
		if (this.#handle) {
			this.#handle.close();
			this.#handle = null;
		}
	}

	get isOpen(): boolean {
		return this.#handle !== null;
	}

	async exists(abortSignal?: AbortSignal): Promise<boolean> {
		try {
			const stat = await Deno.stat(this.#fullPath);
			return stat.isFile;
		} catch (cause) {
			if (cause instanceof Deno.errors.NotFound) {
				return false;
			}
			throw new IOError(undefined, { cause });
		}
	}

	async size(abortSignal?: AbortSignal): Promise<number> {
		try {
			const stat = await Deno.stat(this.#fullPath);
			return stat.size;
		} catch (cause) {
			return 0;
		}
	}

	async arrayBuffer(abortSignal?: AbortSignal): Promise<ArrayBuffer> {
		if (!this.isOpen) {
			throw new FileNotOpenedError();
		}
		const uint8Array = await Deno.readFile(this.#fullPath);
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
		if (!this.isOpen) {
			throw new FileNotOpenedError();
		}
		await this.#handle!.seek(offset ?? 0, Deno.SeekMode.Start);
		if (buffer_or_size instanceof Uint8Array) {
			return this.#handle!.read(buffer_or_size);
		} else {
			const size = buffer_or_size;
			let offset = 0;
			return new ReadableStream({
				pull: async (controller) => {
					if (offset >= size || !this.#handle!) {
						controller.close();
						return;
					}
					const chunkSize = Math.min(
						controller.desiredSize ?? 4 * 1024,
						size - offset,
					);
					const buffer = new Uint8Array(chunkSize);
					const bytesRead = await this.#handle!.read(buffer);
					if (bytesRead === null) {
						controller.close();
						return;
					}
					if (bytesRead > 0) {
						controller.enqueue(buffer);
						offset += bytesRead;
					}
				},
				cancel: () => {
				},
			});
		}
	}

	async write(buffer: Uint8Array<ArrayBuffer>, offset?: number, abortSignal?: AbortSignal): Promise<number>;
	async write(offset?: number, abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array<ArrayBuffer>>>;
	async write(
		buffer_or_offset?: Uint8Array<ArrayBuffer> | number,
		offset_or_abortSignal?: number | AbortSignal,
		abortSignal?: AbortSignal,
	): Promise<number | WritableStream<Uint8Array<ArrayBuffer>>> {
		if (!this.isOpen) {
			throw new FileNotOpenedError();
		}
		if (buffer_or_offset instanceof Uint8Array) {
			const offset = offset_or_abortSignal as number | undefined;
			await this.#handle!.seek(offset ?? 0, Deno.SeekMode.Start);
			return await this.#handle!.write(buffer_or_offset);
		} else {
			const offset = buffer_or_offset as number | undefined;
			const abortSignal = offset_or_abortSignal as AbortSignal | undefined;
			await this.#handle!.seek(offset ?? 0, Deno.SeekMode.Start);
			return new WritableStream<Uint8Array>({
				write: async (chunk, _controller) => {
					await this.#handle!.write(chunk);
				},
			});
		}
	}

	async truncate(length?: number, offset?: number, abortSignal?: AbortSignal): Promise<void> {
		if (!this.isOpen) {
			throw new FileNotOpenedError();
		}
		await this.#handle!.seek(offset ?? 0, Deno.SeekMode.Start);
		await this.#handle!.truncate(length);
	}
}

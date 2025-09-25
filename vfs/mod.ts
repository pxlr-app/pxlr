export abstract class Folder {
	abstract readonly base: string;
	abstract exists(abortSignal?: AbortSignal): Promise<boolean>;
	abstract list(abortSignal?: AbortSignal): AsyncIterableIterator<File | Folder>;
	abstract getFile(name: string, abortSignal?: AbortSignal): Promise<File>;
	abstract getDir(name: string, abortSignal?: AbortSignal): Promise<Folder>;
	abstract mkdir(name: string, abortSignal?: AbortSignal): Promise<Folder>;
	abstract rmdir(name: string, abortSignal?: AbortSignal): Promise<void>;
}

export interface FileOpenOptions {
	read?: boolean;
	write?: boolean;
	create?: boolean;
	append?: boolean;
	truncate?: boolean;
}

export abstract class File {
	abstract readonly base: string;
	abstract open(options: FileOpenOptions, abortSignal?: AbortSignal): Promise<void>;
	abstract close(abortSignal?: AbortSignal): Promise<void>;
	abstract readonly isOpen: boolean;
	abstract exists(abortSignal?: AbortSignal): Promise<boolean>;
	abstract size(abortSignal?: AbortSignal): Promise<number>;
	abstract arrayBuffer(abortSignal?: AbortSignal): Promise<ArrayBuffer>;
	abstract text(abortSignal?: AbortSignal): Promise<string>;
	abstract json(abortSignal?: AbortSignal): Promise<unknown>;
	abstract read(buffer: Uint8Array<ArrayBuffer>, offset?: number, abortSignal?: AbortSignal): Promise<number | null>;
	abstract read(size: number, offset?: number, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array<ArrayBuffer>>>;
	abstract write(buffer: Uint8Array<ArrayBuffer>, offset?: number, abortSignal?: AbortSignal): Promise<number>;
	abstract write(offset?: number, abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array<ArrayBuffer>>>;
	abstract truncate(length?: number, offset?: number, abortSignal?: AbortSignal): Promise<void>;
	[Symbol.asyncDispose](): Promise<void> {
		if (this.isOpen) {
			return this.close();
		}
		return Promise.resolve();
	}
}

export const SeekFrom = {
	Start: 0,
	Current: 1,
	End: 2,
} as const;

export type SeekFrom = typeof SeekFrom[keyof typeof SeekFrom];

export class FileExt {
	#file: File;
	#offset: number;
	constructor(file: File) {
		this.#file = file;
		this.#offset = 0;
	}

	async seek(offset: number, from: SeekFrom): Promise<number> {
		if (!this.#file.isOpen) {
			throw new FileNotOpenedError();
		}
		if (from === SeekFrom.Start) {
			this.#offset = offset;
		} else if (from === SeekFrom.Current) {
			this.#offset += offset;
		} else if (from === SeekFrom.End) {
			const size = await this.#file.size();
			this.#offset = Math.min(size, Math.max(0, size + offset));
		}
		return this.#offset;
	}

	async read(buffer: Uint8Array<ArrayBuffer>, abortSignal?: AbortSignal): Promise<number | null>;
	async read(size: number, abortSignal?: AbortSignal): Promise<ReadableStream<Uint8Array<ArrayBuffer>>>;
	async read(
		buffer_or_size: Uint8Array<ArrayBuffer> | number,
		abortSignal?: AbortSignal,
	): Promise<number | null | ReadableStream<Uint8Array<ArrayBuffer>>> {
		if (!this.#file.isOpen) {
			throw new FileNotOpenedError();
		}
		if (buffer_or_size instanceof Uint8Array) {
			const bytesRead = await this.#file.read(buffer_or_size, this.#offset, abortSignal);
			this.#offset += bytesRead ?? 0;
			return bytesRead;
		} else {
			const readableStream = await this.#file.read(buffer_or_size, this.#offset, abortSignal);
			let bytesRead = 0;
			const reader = readableStream.getReader();
			return new ReadableStream({
				pull: async (controller) => {
					const { done, value } = await reader.read();
					if (done) {
						controller.close();
						return;
					}
					bytesRead += value.byteLength;
					controller.enqueue(value);
				},
				cancel: () => {
					this.#offset += bytesRead;
					reader.cancel();
					readableStream.cancel();
				},
			});
		}
	}

	async write(buffer: Uint8Array<ArrayBuffer>, abortSignal?: AbortSignal): Promise<number>;
	async write(abortSignal?: AbortSignal): Promise<WritableStream<Uint8Array<ArrayBuffer>>>;
	async write(
		buffer_or_abortSignal?: Uint8Array<ArrayBuffer> | AbortSignal,
		abortSignal?: AbortSignal,
	): Promise<number | WritableStream<Uint8Array<ArrayBuffer>>> {
		if (!this.#file.isOpen) {
			throw new FileNotOpenedError();
		}
		if (buffer_or_abortSignal instanceof Uint8Array) {
			const bytesWritten = await this.#file.write(buffer_or_abortSignal, this.#offset, abortSignal);
			this.#offset += bytesWritten;
			return bytesWritten;
		} else {
			let byteWritten = 0;
			const writableStream = await this.#file.write(this.#offset, abortSignal);
			const writer = writableStream.getWriter();
			return new WritableStream({
				write: async (chunk) => {
					await writer.write(chunk as any);
					byteWritten += chunk.byteLength;
				},
				close: () => {
					this.#offset += byteWritten;
					writer.releaseLock();
					writableStream.close();
				},
			});
		}
	}

	async truncate(length?: number, abortSignal?: AbortSignal): Promise<void> {
		if (!this.#file.isOpen) {
			throw new FileNotOpenedError();
		}
		await this.#file.truncate(length, this.#offset, abortSignal);
		this.#offset = length ?? 0;
	}
}

export class IOError extends Error {
	public override name = "IOError";
}

export class FileNotOpenedError extends Error {
	public override name = "FileNotOpenedError";
}

export class FileAlreadyOpenedError extends Error {
	public override name = "FileAlreadyOpenedError";
}

export class FileNotFoundError extends Error {
	public override name = "FileNotFoundError";
}

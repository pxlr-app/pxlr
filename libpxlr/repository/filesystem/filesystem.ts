export abstract class Filesystem {
	abstract exists(path: string, abortSignal?: AbortSignal): Promise<boolean>;
	abstract list(
		prefix: string,
		abortSignal?: AbortSignal,
	): AsyncIterableIterator<string>;
	abstract read(
		path: string,
		abortSignal?: AbortSignal,
	): Promise<ReadableStream<Uint8Array>>;
	abstract write(
		path: string,
		abortSignal?: AbortSignal,
	): Promise<WritableStream<Uint8Array>>;
}

export class IOError extends Error {
	public name = "IOError";
	public constructor(cause: Error) {
		super(`IO Reference, got ${cause}.`);
		this.cause = cause;
	}
}

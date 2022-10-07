export abstract class Filesystem {
	abstract exists(path: string): Promise<boolean>;
	abstract list(path: string): AsyncIterableIterator<string>;
	abstract read(path: string): Promise<ReadableStream>;
	abstract write(path: string): Promise<WritableStream>;
}

export class IOError extends Error {
	public name = "IOError";
	public constructor(cause: Error) {
		super(`IO Reference, got ${cause}.`);
		this.cause = cause;
	}
}

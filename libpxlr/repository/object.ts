import { assertAutoId, AutoId } from "../autoid.ts";

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

export class Object {
	public readonly headers: ReadonlyMap<string, string>;

	constructor(
		public readonly id: AutoId,
		public readonly kind: string,
		headers: Record<string, string> | Map<string, string> = {},
		public readonly body?: ReadableStream | ArrayBuffer | string | undefined,
	) {
		assertAutoId(id);
		this.headers = headers instanceof Map ? headers : new Map(globalThis.Object.entries(headers));
	}

	async serialize(stream: WritableStream) {
		const encoder = new TextEncoder();
		const writer = stream.getWriter();
		await writer.write(encoder.encode(`id ${this.id}\r\n`));
		await writer.write(encoder.encode(`kind ${this.kind}\r\n`));
		for (const [key, value] of this.headers) {
			await writer.write(encoder.encode(`${encodeURIComponent(key)} ${encodeURIComponent(value)}\r\n`));
		}
		await writer.write(encoder.encode(`\r\n`));
		if (this.body instanceof ReadableStream) {
			await this.body.pipeTo(stream);
		} else if (this.body instanceof ArrayBuffer) {
			await writer.write(this.body);
		} else if (typeof this.body === "string") {
			await writer.write(encoder.encode(this.body));
		}
		await writer.close();
	}

	async arrayBuffer() {
		if (this.body instanceof ReadableStream) {
			(this as { body: ArrayBuffer }).body = await new Response(this.body).arrayBuffer();
		}
		if (this.body instanceof ArrayBuffer) {
			return this.body;
		} else if (typeof this.body === "string") {
			return textEncoder.encode(this.body);
		}
		throw new TypeError(`Object's body is undefined.`);
	}

	async text() {
		if (this.body instanceof ReadableStream) {
			(this as { body: ArrayBuffer }).body = await new Response(this.body).arrayBuffer();
		}
		if (this.body instanceof ArrayBuffer) {
			return textDecoder.decode(this.body);
		} else if (typeof this.body === "string") {
			return this.body;
		}
		throw new TypeError(`Object's body is undefined.`);
	}

	static async deserialize(stream: ReadableStream): Promise<Object> {
		const decoder = new TextDecoder();
		const reader = stream.getReader();
		const headers = new Map<string, string>();
		let body: ReadableStream | undefined;
		let inKey = true;
		let inValue = false;
		let key = "";
		let tmp = "";
		reader:
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			const chunk = decoder.decode(value);
			for (let i = 0, l = chunk.length; i < l; ++i) {
				if (chunk.at(i) === " " && inKey) {
					key = tmp;
					tmp = "";
					inKey = false;
					inValue = true;
				} else if (chunk.at(i) === `\r` && chunk.at(i + 1) === `\n`) {
					if (inValue) {
						headers.set(decodeURIComponent(key), decodeURIComponent(tmp));
						tmp = "";
						inKey = true;
						inValue = false;
						++i;
					} else if (inKey) {
						body = new ReadableStream({
							start(controller) {
								controller.enqueue(value.slice(i + 2));
							},
							async pull(controller) {
								const { done, value } = await reader.read();
								if (done) {
									controller.close();
								} else {
									controller.enqueue(value);
								}
							},
						});
						break reader;
					}
				} else {
					tmp += chunk.at(i);
				}
			}
		}
		const id = headers.get("id") ?? "";
		headers.delete("id");
		assertAutoId(id);
		const kind = headers.get("kind") ?? "";
		headers.delete("kind");
		return new Object(id, kind, headers, body);
	}
}

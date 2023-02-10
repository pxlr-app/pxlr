import { assertAutoId, AutoId } from "../libpxlr/autoid.ts";

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

export class Object {
	#hash: AutoId;
	#id: AutoId;
	#kind: string;
	#headers: ReadonlyMap<string, string>;
	#body?: ReadableStream | ArrayBuffer | string | undefined;

	constructor(
		hash: AutoId,
		id: AutoId,
		kind: string,
		headers: Record<string, string> | Map<string, string> = {},
		body?: ReadableStream | ArrayBuffer | string | undefined,
	) {
		assertAutoId(hash);
		assertAutoId(id);
		this.#hash = hash;
		this.#id = id;
		this.#kind = kind;
		this.#headers = headers instanceof Map ? headers : new Map(globalThis.Object.entries(headers));
		this.#body = body;
	}

	get hash() {
		return this.#hash;
	}
	get id() {
		return this.#id;
	}
	get kind() {
		return this.#kind;
	}
	get headers() {
		return this.#headers;
	}
	get body() {
		return this.#body;
	}

	private set body(value) {
		this.#body = value;
	}

	async serialize(stream: WritableStream<Uint8Array>) {
		const encoder = new TextEncoder();
		const writer = stream.getWriter();
		await writer.write(encoder.encode(`hash ${this.hash}\n`));
		await writer.write(encoder.encode(`id ${this.id}\n`));
		await writer.write(encoder.encode(`kind ${this.kind}\n`));
		for (const [key, value] of this.headers) {
			await writer.write(
				encoder.encode(
					`${encodeURIComponent(key)} ${encodeURIComponent(value)}\n`,
				),
			);
		}
		await writer.write(encoder.encode(`\n`));
		if (this.body instanceof ReadableStream) {
			await this.body.pipeTo(stream);
		} else if (this.body instanceof ArrayBuffer) {
			await writer.write(new Uint8Array(this.body));
		} else if (typeof this.body === "string") {
			await writer.write(encoder.encode(this.body));
		}
		await writer.close();
	}

	async arrayBuffer() {
		if (this.body instanceof ReadableStream) {
			(this as { body: ArrayBuffer }).body = await new Response(this.body)
				.arrayBuffer();
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
			(this as { body: ArrayBuffer }).body = await new Response(this.body)
				.arrayBuffer();
		}
		if (this.body instanceof ArrayBuffer) {
			return textDecoder.decode(this.body);
		} else if (typeof this.body === "string") {
			return this.body;
		}
		throw new TypeError(`Object's body is undefined.`);
	}

	static async deserialize(
		stream: ReadableStream<Uint8Array>,
	): Promise<Object> {
		const { headers, body } = await deserializeObjectLike(stream);
		const hash = headers.get("hash") ?? "";
		headers.delete("hash");
		assertAutoId(hash);
		const id = headers.get("id") ?? "";
		headers.delete("id");
		assertAutoId(id);
		const kind = headers.get("kind") ?? "";
		headers.delete("kind");
		return new Object(hash, id, kind, headers, body);
	}
}

export async function deserializeObjectLike(
	stream: ReadableStream<Uint8Array>,
) {
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
			} else if (chunk.at(i) === `\n`) {
				if (inValue) {
					headers.set(decodeURIComponent(key), decodeURIComponent(tmp));
					tmp = "";
					inKey = true;
					inValue = false;
				} else if (inKey) {
					body = new ReadableStream({
						start(controller) {
							controller.enqueue(value.slice(i + 1));
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

	return { headers, body };
}

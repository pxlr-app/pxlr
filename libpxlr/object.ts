import { isAutoid, AutoId, autoid } from "./autoid.ts";

export type ObjectHeaders = Map<string, string>;
export type ObjectBody = ReadableStream | ArrayBuffer | string | undefined;

export class Object {
	#id: AutoId;
	#type: string;
	#headers: Map<string, string>;
	#body: ObjectBody;

	public constructor(
		id: AutoId,
		type: string,
		headers: ObjectHeaders,
		body?: ObjectBody
	) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
		if (typeof headers !== 'object') {
			throw new TypeError(`Parameter "headers" does not appear to be an dictionnary of key-value.`);
		}
		if (!!body && !(body instanceof ReadableStream || body instanceof ArrayBuffer || typeof body === 'string')) {
			throw new TypeError(`Parameter "body" must be either a ReadableStream, ArrayBuffer, string or undefined.`);
		}
		this.#id = id;
		this.#type = type.toString();
		this.#headers = headers;
		this.#body = body;
	}

	static new(id: AutoId, type: string, headers: Record<string, string>, body?: ObjectBody) {
		return new Object(id, type, new Map(globalThis.Object.entries(headers)), body);
	}

	get id() {
		return this.#id;
	}

	get type() {
		return this.#type;
	}

	get headers() {
		return this.#headers as ReadonlyMap<string, string>;
	}

	async arrayBuffer() {
		if (!(this.#body instanceof ArrayBuffer)) {
			const resp = new Response(this.#body);
			this.#body = await resp.arrayBuffer();
		}
		return this.#body;
	}

	async text() {
		if (typeof this.#body !== "string") {
			const resp = new Response(this.#body);
			this.#body = await resp.text();
		}
		return this.#body;
	}

	async serialize(stream: WritableStream)  {
		const encoder = new TextEncoder();
		const writer = stream.getWriter();
		await writer.write(encoder.encode(`id: ${this.#id}\r\n`));
		await writer.write(encoder.encode(`type: ${this.#type}\r\n`));
		for (const [key, value] of this.#headers) {
			await writer.write(encoder.encode(`${key}: ${value}\r\n`));
		}
		await writer.write(encoder.encode(`\r\n`));
		if (this.#body instanceof ReadableStream) {
			await this.#body.pipeTo(stream);
		}
		else if (this.#body instanceof ArrayBuffer) {
			await writer.write(this.#body);
		}
		else if (typeof this.#body === 'string') {
			await writer.write(encoder.encode(this.#body));
		}
	}

	static async deserialize(stream: ReadableStream) {
		const decoder = new TextDecoder();
		const reader = stream.getReader();
		let id: AutoId | undefined;
		let type = "";
		const headers = new Map<string, string>();
		let body: ReadableStream | undefined;
		let inKey = true;
		let inValue = false;
		let key = "";
		let tmp = "";
		reader:
		while (true) {
			const { done, value }  = await reader.read();
			if (done) {
				break;
			}
			const chunk = decoder.decode(value);
			for (let i = 0, l = chunk.length; i < l; ++i) {
				if (chunk.at(i) === ":" && inKey) {
					key = tmp;
					tmp = "";
					inKey = false;
					inValue = true;
					++i;
				}
				else if (chunk.at(i) === `\r` && chunk.at(i + 1) === `\n`) {
					if (inValue) {
						headers.set(key, tmp);
						tmp = "";
						inKey = true;
						inValue = false;
						++i;
					}
					else if (inKey) {
						body = new ReadableStream({
							start(controller) {
								controller.enqueue(value.slice(i+2))
							},
							async pull(controller) {
								const { done, value } = await reader.read();
								if (done) {
									controller.close();
								} else {
									controller.enqueue(value);
								}
							}
						});
						break reader;
					}
				}
				else {
					tmp += chunk.at(i);
				}
			}
		}
		if (headers.has("id")) {
			id = headers.get("id")!;
			headers.delete("id");
			if (!isAutoid(id)) {
				throw new SyntaxError(`Object's "id" is not a valid AutoId.`)
			}
		} else {
			throw new SyntaxError(`Object's headers did not contain an "id" key.`)
		}
		if (headers.has("type")) {
			type = headers.get("type")!;
			headers.delete("type");
		} else {
			throw new SyntaxError(`Object header's did not contain an "type" key.`)
		}
		return new Object(id, type, headers, body);
	}
}
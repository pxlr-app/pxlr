const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

export class BaseObject {
	#headers: ReadonlyMap<string, string>;
	#body?: ReadableStream | ArrayBuffer | string | undefined;

	constructor(
		headers: Record<string, string> | Map<string, string> = {},
		body?: ReadableStream | ArrayBuffer | string | undefined,
	) {
		this.#headers = headers instanceof Map ? headers : new Map(globalThis.Object.entries(headers));
		this.#body = body;
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
}

export async function serializeBaseObject(object: BaseObject, stream: WritableStream<Uint8Array>) {
	const encoder = new TextEncoder();
	const writer = stream.getWriter();
	for (const [key, value] of object.headers) {
		await writer.write(
			encoder.encode(
				`${encodeURIComponent(key)}: ${encodeURIComponent(value)}\r\n`,
			),
		);
	}
	await writer.write(encoder.encode(`\r\n`));
	if (object.body instanceof ReadableStream) {
		await object.body.pipeTo(stream);
	} else if (object.body instanceof ArrayBuffer) {
		await writer.write(new Uint8Array(object.body));
	} else if (typeof object.body === "string") {
		await writer.write(encoder.encode(object.body));
	}
	await writer.close();
}

export async function deserializeBaseObject(
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
			if (chunk.at(i) === ":" && chunk.at(i + 1) === " " && inKey) {
				key = tmp;
				tmp = "";
				inKey = false;
				inValue = true;
				i += 1;
			} else if (chunk.at(i) === `\r` && chunk.at(i + 1) === `\n`) {
				if (inValue) {
					headers.set(decodeURIComponent(key), decodeURIComponent(tmp));
					tmp = "";
					inKey = true;
					inValue = false;
					i += 1;
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

	return new BaseObject(headers, body);
}

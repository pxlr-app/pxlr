export interface ResponseChunkHeader {
	type: "header";
	key: string;
	value: string;
}
export interface ResponseChunkBody {
	type: "body";
	data: ArrayBuffer;
}
export type ResponseChunk = ResponseChunkHeader | ResponseChunkBody;
export class ResponseReaderStream extends TransformStream<ResponseChunk, Uint8Array> {
	constructor() {
		const encoder = new TextEncoder();
		let inBody = false;
		super({
			transform(chunk, controller) {
				switch (chunk.type) {
					case "header":
						if (inBody) {
							throw new Error("Body sent, can not send header.");
						}
						controller.enqueue(encoder.encode(encodeURIComponent(chunk.key)));
						controller.enqueue(encoder.encode(": "));
						controller.enqueue(encoder.encode(encodeURIComponent(chunk.value)));
						controller.enqueue(encoder.encode(`\r\n`));
						break;
					case "body":
						if (!inBody) {
							controller.enqueue(encoder.encode(`\r\n`));
							inBody = true;
						}
						controller.enqueue(new Uint8Array(chunk.data));
				}
			},
			flush(controller) {
				if (!inBody) {
					controller.enqueue(encoder.encode(`\r\n`));
				}
			},
		});
	}
}
export class ResponseWriterStream extends TransformStream<Uint8Array, ResponseChunk> {
	constructor() {
		const encoder = new TextEncoder();
		const decoder = new TextDecoder();
		let inBody = false;
		let inKey = true;
		let inValue = false;
		let key = "";
		let tmp = "";
		super({
			transform(chunk, controller) {
				if (inBody === false) {
					const text = decoder.decode(chunk);
					for (let i = 0, l = chunk.length; i < l; ++i) {
						// Reached key-value seperator
						if (inKey && text.at(i) === ":" && text.at(i + 1) === " ") {
							key = tmp;
							tmp = "";
							inKey = false;
							inValue = true;
							i += 1;
						} // Reached EOL
						else if (text.at(i) === `\r` && text.at(i + 1) === `\n`) {
							// End of header value
							if (inValue) {
								controller.enqueue({ type: "header", key: decodeURIComponent(key), value: decodeURIComponent(tmp) });
								tmp = "";
								inKey = true;
								inValue = false;
								i += 1;
							} // End of head
							else if (inKey) {
								inBody = true;
								controller.enqueue({ type: "body", data: encoder.encode(text.slice(i + 2)) });
								break;
							}
						} // Buffer character
						else {
							tmp += text.at(i);
						}
					}
				} else {
					controller.enqueue({ type: "body", data: chunk });
				}
			},
		});
	}
}

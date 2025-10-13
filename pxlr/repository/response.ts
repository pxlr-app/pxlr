export interface ResponseChunkHeader {
	type: "header";
	key: string;
	value: string;
}
export interface ResponseChunkBody {
	type: "body";
	data: Uint8Array<ArrayBuffer>;
}
export type ResponseChunk = ResponseChunkHeader | ResponseChunkBody;

export class ResponseTransformStream extends TransformStream<Uint8Array<ArrayBuffer>, ResponseChunk> {
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
								controller.enqueue({ type: "body", data: chunk.slice(i + 2) });
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

export async function simpleSerialize(stream: WritableStream, headers: Record<string, string> | Map<string, string>, body?: ReadableStream | ArrayBuffer | string | undefined) {
	headers = headers instanceof Map ? headers : new Map(Object.entries(headers));

	// TODO validate for \r\n in keys and values -> break deserialize
	const encoder = new TextEncoder();
	const writer = stream.getWriter();
	for (const [key, value] of headers) {
		await writer.write(encoder.encode(`${key}: ${value}\r\n`));
	}
	await writer.write(encoder.encode(`\r\n`));
	if (body instanceof ReadableStream) {
		await body.pipeTo(stream);
	} else if (body instanceof ArrayBuffer) {
		await writer.write(body);
	} else if (typeof body === "string") {
		await writer.write(encoder.encode(body));
	}
}

export async function simpleDeserialize(stream: ReadableStream): Promise<{ headers: Map<string, string>; body: ReadableStream | undefined }> {
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
			if (chunk.at(i) === ":" && inKey) {
				key = tmp;
				tmp = "";
				inKey = false;
				inValue = true;
				++i;
			} else if (chunk.at(i) === `\r` && chunk.at(i + 1) === `\n`) {
				if (inValue) {
					headers.set(key, tmp);
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
	return { headers, body };
}

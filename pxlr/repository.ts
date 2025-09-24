import { File, Folder } from "@pxlr/vfs";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class Repository {
	#root: Folder;

	constructor(fs: Folder) {
		this.#root = fs;
	}

	async getHead(): Promise<string | undefined> {
		const file = await this.#root.open("HEAD");
		const content = await file.text();
		const ref = content.match(/ref: (.+)\n/)?.[1];
		return ref;
	}

	async setHead(ref: string): Promise<void> {
		const file = await this.#root.open("HEAD");
		await file.write(textEncoder.encode(`ref: ${ref}\n`));
	}

	async #computeHash(data: Uint8Array<ArrayBuffer>): Promise<string> {
		const hashBuffer = await crypto.subtle.digest("SHA-1", data);
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return hash;
	}

	async setBlob(data: Uint8Array<ArrayBuffer>): Promise<string> {
		const hash = await this.#computeHash(data);
		const file = await this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`);
		await file.write(data);
		return hash;
	}

	getBlob(hash: string): Promise<File> {
		return this.#root.open(`objects/${hash.slice(0, 2)}/${hash.slice(2)}`);
	}
}

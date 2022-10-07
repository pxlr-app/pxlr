export type AutoId = string;

// // Git
// const AutoIdSize = 40;
// const AutoIdChars = "abcdef0123456789";
const AutoIdSize = 20;
const AutoIdChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const AutoIdCharsLength = AutoIdChars.length;
const AutoIdRegExp = new RegExp(`^[${AutoIdChars}]{${AutoIdSize}}$`);

/**
 * Generate an AutoId
 * @returns An AutoId
 */
export function autoid(): AutoId {
	let autoid = "";
	const buffer = new Uint8Array(AutoIdSize);
	crypto.getRandomValues(buffer);
	for (let i = 0; i < AutoIdSize; ++i) {
		autoid += AutoIdChars.charAt(buffer[i] % AutoIdCharsLength);
	}
	return autoid;
}

/**
 * Test if value is an AutoId
 * @param value The value to test
 * @returns If value is an AutoId
 */
export function isAutoId(value?: unknown): value is AutoId {
	return !!value && typeof value === "string" && AutoIdRegExp.test(value);
}

export class InvalidAutoIdError extends Error {
	public name = "InvalidAutoIdError";
	public constructor(value: string) {
		super(`Invalid AutoId, got ${value}.`);
	}
}

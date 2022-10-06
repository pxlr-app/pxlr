export type AutoId = string;

// // Git
// const AutoIdSize = 40;
// const AutoIdChars = "abcdef0123456789";
const AutoIdSize = 20;
const AutoIdChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const AutoIdCharsLength = AutoIdChars.length;

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
export function isAutoid(value: unknown): value is AutoId {
	return !!value && typeof value === "string" && value.length === AutoIdSize;
}

export type AutoId = string;

const AutoIdSize = 40;
const AutoIdChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const AutoIdCharsLength = AutoIdChars.length;
const AutoIdRegExp = new RegExp(`^[${AutoIdChars}]{${AutoIdSize}}$`);
const textEncoder = new TextEncoder();

/**
 * Generate an AutoId
 * @param seed The seed for the AutoId
 * @returns An AutoId
 */
export function autoid(): AutoId;
export function autoid(seed: number): AutoId;
export function autoid(seed: AutoId): AutoId;
export function autoid(seed_or_autoid?: number | AutoId): AutoId {
	let result = "";
	if (seed_or_autoid !== undefined) {
		if (typeof seed_or_autoid === "number") {
			const rand = sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, seed_or_autoid);
			for (let i = 0; i < AutoIdSize; ++i) {
				result += AutoIdChars.charAt(rand() * AutoIdCharsLength);
			}
		} else if (typeof seed_or_autoid === "string") {
			assertAutoId(seed_or_autoid);
			const seed = cyrb128(seed_or_autoid);
			const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);
			for (let i = 0; i < AutoIdSize; ++i) {
				result += AutoIdChars.charAt(rand() * AutoIdCharsLength);
			}
		} else {
			throw new TypeError(`Expected seed parameter to be a number or an AutoId, got ${typeof seed_or_autoid}.`)
		}
	} else {
		const buffer = new Uint8Array(AutoIdSize);
		crypto.getRandomValues(buffer);
		for (let i = 0; i < AutoIdSize; ++i) {
			result += AutoIdChars.charAt(buffer[i] % AutoIdCharsLength);
		}
	}
	return result;
}

/**
 * Create a 128 hash of a string
 * @param str
 * @returns An array of 4 32bit integer
 */
function cyrb128(str: string): [number, number, number, number] {
	let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
	for (let i = 0, k; i < str.length; i++) {
		k = str.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
		h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
		h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
	}
	h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
	h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
	h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
	h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
	return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

/**
 * Simple Fast Counter 32
 * @param a
 * @param b
 * @param c
 * @param d
 * @returns
 */
function sfc32(a: number, b: number, c: number, d: number) {
	return function () {
		a >>>= 0;
		b >>>= 0;
		c >>>= 0;
		d >>>= 0;
		var t = (a + b) | 0;
		a = b ^ b >>> 9;
		b = c + (c << 3) | 0;
		c = c << 21 | c >>> 11;
		d = d + 1 | 0;
		t = t + d | 0;
		c = c + t | 0;
		return (t >>> 0) / 4294967296;
	};
}

/**
 * Test if value is an AutoId
 * @param value The value to test
 * @returns If value is an AutoId
 */
export function assertAutoId(value?: unknown): asserts value is AutoId {
	if (!value || typeof value !== "string" || !AutoIdRegExp.test(value)) {
		throw new InvalidAutoIdError(value);
	}
}

export class InvalidAutoIdError extends Error {
	public name = "InvalidAutoIdError";
	public constructor(value: unknown) {
		super(`Invalid AutoId, got ${value}.`);
	}
}

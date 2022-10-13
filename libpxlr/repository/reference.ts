export type Reference = string;

const ReferenceRegExp = new RegExp(`^([a-z0-9-]+/){1,}[a-z0-9%.+-]+$`, "i");

/**
 * Test if value is a Reference
 * @param value The value to test
 * @returns If value is a Reference
 */
export function assertReference(value?: unknown): asserts value is Reference {
	if (!value || typeof value !== "string" || !ReferenceRegExp.test(value)) {
		throw new InvalidReferenceError(value);
	}
}

export class InvalidReferenceError extends Error {
	public name = "InvalidReferenceError";
	public constructor(value: unknown) {
		super(`Invalid Reference, got ${value}.`);
	}
}

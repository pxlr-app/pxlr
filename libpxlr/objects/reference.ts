export type Reference = string;

const RefRegExp = new RegExp(`^refs/[a-z]+/[^/\\.%&;]+$`);

/**
 * Test if value is a Reference
 * @param value The value to test
 * @returns If value is a Reference
 */
export function assertReference(value?: unknown): asserts value is Reference {
	if (!value || typeof value !== "string" || !RefRegExp.test(value)) {
		throw new InvalidReferenceError(value);
	}
}

export class InvalidReferenceError extends Error {
	public name = "InvalidReferenceError";
	public constructor(value: unknown) {
		super(`Invalid Reference, got ${value}.`);
	}
}

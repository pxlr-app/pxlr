export type Reference = string;

const RefRegExp = new RegExp(`^refs/[a-z]+/[^/\\.%&;]+$`);

/**
 * Test if value is a Reference
 * @param value The value to test
 * @returns If value is a Reference
 */
export function isReference(value?: unknown): value is Reference {
	return !!value && typeof value === "string" && RefRegExp.test(value);
}

export class InvalidReferenceError extends Error {
	public name = "InvalidReferenceError";
	public constructor(value: string) {
		super(`Invalid Reference, got ${value}.`);
	}
}

import { AutoId, isAutoid } from "../autoid.ts";

export abstract class Command {
	public constructor(
		public readonly target: AutoId,
	) {
		if (!isAutoid(target)) {
			throw new TypeError(`Parameter "target" does not appear to be an AutoId.`);
		}
	}
}

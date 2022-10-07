import { AutoId, InvalidAutoIdError, isAutoId } from "../autoid.ts";

export abstract class Command {
	public constructor(
		public readonly target: AutoId,
	) {
		if (!isAutoId(target)) {
			throw new InvalidAutoIdError(target);
		}
	}
}

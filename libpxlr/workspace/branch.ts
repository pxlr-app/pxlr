import { AutoId } from "../autoid.ts";
import { Commit, Reference } from "../repository/mod.ts";
import { Workspace } from "./workspace.ts";

export class Branch {
	#workspace: Workspace;
	#reference: Reference;
	constructor(workspace: Workspace, reference: Reference) {
		this.#workspace = workspace;
		this.#reference = reference;
	}

	get workspace(): Readonly<Workspace> {
		return this.#workspace;
	}

	get name() {
		return this.#reference.ref.split("/").at(-1)!;
	}

	get reference() {
		return this.#reference;
	}

	iterHistory(
		options?: { fromHash?: AutoId; abortSignal?: AbortSignal },
	): AsyncIterableIterator<Commit> {
		const fromHash = options?.fromHash ?? this.#reference.commit;
		return this.workspace.repository.iterHistory(fromHash);
	}
}

import { Deferred, deferred } from "https://deno.land/std@0.160.0/async/deferred.ts";

export type LockReleaser = () => void;

export class Lock {
	#tail: Deferred<void> | undefined;

	async acquire(): Promise<LockReleaser> {
		const lock = deferred<void>();
		if (this.#tail) {
			const tail = this.#tail;
			this.#tail = lock;
			await tail;
		} else {
			this.#tail = lock;
		}
		return () => {
			lock.resolve();
			if (this.#tail === lock) {
				this.#tail = undefined;
			}
		};
	}

	get isFree() {
		return !this.#tail;
	}
}

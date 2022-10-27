import { assertEquals, assertNotEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { autoid } from "./autoid.ts";

Deno.test("AutoID", () => {
	assertEquals(autoid().length, 40);
	assertNotEquals(autoid(), autoid());
	assertEquals(autoid("iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK"), "e0k54WlkOQU6XmhVq36wT91tlGadvtoIkFh8cDAZ");
	assertEquals(autoid(autoid("iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK")), "J0AIOHElG1kbWUCrMVQeX6qc6wMSZo7ec67BmH1f");
});

import { assertEquals, assertNotEquals } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import { autoid } from "./autoid.ts";

Deno.test("AutoID", () => {
	assertEquals(autoid().length, 40);
	assertNotEquals(autoid(), autoid());
	assertEquals(
		autoid("iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK"),
		"r3vpUQxRIagPLcHGP19ie0GbX6PHVkXDNBEYEcTH",
	);
	assertEquals(
		autoid(autoid("iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK")),
		"hGTEANcwSJyE015dg7U0jGtcftBSpxHFsayvm7gw",
	);
	assertEquals(
		autoid(
			"iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK" +
				"iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK",
		),
		"v4hEhDwyVNGWJsxUig5PfU28dvDHhWC5HxhTrFK6",
	);
});

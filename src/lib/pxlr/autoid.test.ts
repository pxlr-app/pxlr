import { expect, test } from '@jest/globals';
import { autoid } from "./autoid";

test("AutoID", () => {
	expect(autoid().length).toEqual(40);
	expect(autoid()).not.toEqual(autoid());
	expect(
		autoid("iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK")).toEqual(
			"r3vpUQxRIagPLcHGP19ie0GbX6PHVkXDNBEYEcTH",
		);
	expect(
		autoid(autoid("iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK"))).toEqual(
			"hGTEANcwSJyE015dg7U0jGtcftBSpxHFsayvm7gw",
		);
	expect(
		autoid(
			"iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK" +
			"iRHeRoI634JxFmKf9EUeFukqcpBAH18TAHTW82NK",
		)).toEqual(
			"v4hEhDwyVNGWJsxUig5PfU28dvDHhWC5HxhTrFK6",
		);
});

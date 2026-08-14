import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppIdentity } from "../app-identity";

describe("AppIdentity", () => {
	it("keeps the product name visible to users", () => {
		render(<AppIdentity />);

		expect(screen.getByRole("heading", { name: "Showcase Dashboard" })).toBeVisible();
	});
});

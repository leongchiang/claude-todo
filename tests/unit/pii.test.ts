import { describe, expect, it } from "vitest";

import { detectPii } from "@/lib/pii";

describe("detectPii", () => {
  it("TC-P-01: detects Singapore NRIC", () => {
    expect(detectPii("My ID is S1234567D")).toEqual({ found: true, type: "nric" });
  });

  it("TC-P-02: detects email", () => {
    expect(detectPii("ping me at alice@example.com")).toEqual({ found: true, type: "email" });
  });

  it("TC-P-03: detects international phone", () => {
    expect(detectPii("call +65 9123 4567")).toEqual({ found: true, type: "phone" });
  });

  it("TC-P-04: detects credit card (4-4-4-4 format)", () => {
    expect(detectPii("pay 4111 1111 1111 1111")).toEqual({ found: true, type: "credit_card" });
  });

  it("TC-P-05: clean text returns found:false", () => {
    expect(detectPii("Buy milk")).toEqual({ found: false });
  });

  it("TC-P-06: 'S12' is too short to trigger NRIC false-positive", () => {
    expect(detectPii("S12 is short")).toEqual({ found: false });
  });

  it("TC-P-07-precondition: email in notes is detected (storage wires this in)", () => {
    expect(detectPii("notes: contact me at bob@bob.com later")).toEqual({
      found: true,
      type: "email",
    });
  });

  it("TC-P-08: case-insensitive email match", () => {
    expect(detectPii("Alice@EXAMPLE.com")).toEqual({ found: true, type: "email" });
  });

  it("null / undefined / empty returns found:false (defensive)", () => {
    expect(detectPii(null)).toEqual({ found: false });
    expect(detectPii(undefined)).toEqual({ found: false });
    expect(detectPii("")).toEqual({ found: false });
  });
});

import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { expect } from "vitest";

import spec from "../fixtures/api.json";

/**
 * Contract checks against the spec snapshot (test/fixtures/api.json — itself generated from the
 * published OpenAPI document, the source of truth for API shape). Every fixture a test feeds
 * into the code, and every response the fake upstream emits, must validate here; when the
 * spec changes shape, this is where it fails first.
 */

const SPEC_ID = "api.json";

const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: true });
addFormats(ajv);
ajv.addSchema({ ...spec, $id: SPEC_ID });

export type SchemaName = keyof typeof spec.components.schemas;

/** Returns validation errors (empty when valid). */
export function schemaErrors(schema: SchemaName, value: unknown): ErrorObject[] {
  const valid = ajv.validate({ $ref: `${SPEC_ID}#/components/schemas/${schema}` }, value);
  return valid ? [] : (ajv.errors ?? []);
}

export function expectValid(schema: SchemaName, value: unknown): void {
  const errors = schemaErrors(schema, value);
  expect(
    errors.map((error) => `${error.instancePath || "<root>"} ${error.message ?? ""}`),
    `value does not match ${schema}`,
  ).toEqual([]);
}

/** Validates once, then returns the value so fixtures can be declared as `fixture("X", {...})`. */
export function fixture<T>(schema: SchemaName, value: T): T {
  expectValid(schema, value);
  return value;
}

import assert from "node:assert/strict";
import test from "node:test";
import { SshTargetNotFoundError } from "../services/sshScanService";
import { apiError } from "./apiError";
import { apiErrorResponse, withApiErrorFallback } from "./apiErrorMapping";

test("maps explicit API errors to JSON response bodies", () => {
  const response = apiErrorResponse(
    apiError(400, "Invalid input", {
      details: { fieldErrors: { name: ["Required"] } }
    })
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    error: "Invalid input",
    details: { fieldErrors: { name: ["Required"] } }
  });
});

test("preserves known domain errors when adding fallback context", () => {
  const error = new SshTargetNotFoundError("ssh-missing");

  assert.equal(
    withApiErrorFallback(error, {
      error: "SSH scan failed",
      statusCode: 502
    }),
    error
  );
  assert.deepEqual(apiErrorResponse(error), {
    body: { error: "SSH target not found" },
    statusCode: 404
  });
});

test("wraps unknown errors with endpoint-specific fallback context", () => {
  const response = apiErrorResponse(
    withApiErrorFallback(new Error("docker unavailable"), {
      error: "Local Docker scan failed",
      statusCode: 502
    })
  );

  assert.deepEqual(response, {
    body: {
      error: "Local Docker scan failed",
      message: "docker unavailable"
    },
    statusCode: 502
  });
});

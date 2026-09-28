import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../../scripts/import-catalog";

test("csv: quotes, commas, newlines", () => {
  const rows = parseCsv('name,price,description\r\n"Lehenga, Red",1299,"Line 1\nLine ""2"""\nSaree,999,\n');
  assert.deepEqual(rows, [
    { name: "Lehenga, Red", price: "1299", description: 'Line 1\nLine "2"' },
    { name: "Saree", price: "999", description: "" },
  ]);
});

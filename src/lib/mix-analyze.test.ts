import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeMix } from "./mix-analyze.ts";

describe("analyzeMix", () => {
  it("tags Devanagari tokens as Hindi", () => {
    const result = analyzeMix("तुम कैसे हो");
    assert.equal(result.tokens.length, 3);
    for (const token of result.tokens) {
      assert.equal(token.lang, "hi-deva");
    }
  });

  it("tags Roman-script Hindi words as Hindi", () => {
    const result = analyzeMix("yaar tum kya kar rahe ho");
    assert.ok(result.tokens.length > 0);
    for (const token of result.tokens) {
      assert.equal(token.lang, "hi-roman");
    }
  });

  it("tags plain English words as English", () => {
    const result = analyzeMix("the match was unreal yesterday");
    assert.ok(result.tokens.length > 0);
    for (const token of result.tokens) {
      assert.equal(token.lang, "en");
    }
  });

  it("tags everyday Roman Hindi verbs like chahiye as Hindi", () => {
    const result = analyzeMix("mujhe ek break chahiye tha");
    const byText = Object.fromEntries(result.tokens.map((t) => [t.text, t.lang]));
    assert.equal(byText["chahiye"], "hi-roman");
    assert.equal(byText["tha"], "hi-roman");
  });

  it("splits a code-mixed sentence and reports the mix ratio", () => {
    const result = analyzeMix("yaar kal match dekha unreal tha");
    const langs = result.tokens.map((t) => t.lang);
    assert.ok(langs.includes("hi-roman"));
    assert.ok(langs.includes("en"));
    assert.equal(result.counts["hi-roman"]! + result.counts["en"]!, result.tokens.length);
    const total = result.tokens.length;
    assert.ok(Math.abs(result.ratio["hi-roman"]! - result.counts["hi-roman"]! / total) < 1e-9);
  });

  it("keeps punctuation attached without creating extra tokens", () => {
    const result = analyzeMix("dekha? unreal!");
    assert.equal(result.tokens.length, 2);
    assert.equal(result.tokens[0]!.text, "dekha?");
    assert.equal(result.tokens[1]!.text, "unreal!");
  });

  it("returns no tokens for empty input", () => {
    const result = analyzeMix("   ");
    assert.equal(result.tokens.length, 0);
    assert.deepEqual(result.counts, {});
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KeyStateTracker } from "./key-state.js";

describe("KeyStateTracker", () => {
  it("tracks press and release", () => {
    const tracker = new KeyStateTracker();
    assert.equal(tracker.press("KeyW"), true);
    assert.equal(tracker.press("KeyW"), false);
    assert.equal(tracker.isPressed("KeyW"), true);
    assert.equal(tracker.release("KeyW"), true);
    assert.equal(tracker.isPressed("KeyW"), false);
  });

  it("releaseAll returns held keys and clears state", () => {
    const tracker = new KeyStateTracker();
    tracker.press("KeyA");
    tracker.press("KeyS");
    const released = tracker.releaseAll();
    assert.deepEqual(released.sort(), ["KeyA", "KeyS"]);
    assert.deepEqual(tracker.getPressed(), []);
  });
});

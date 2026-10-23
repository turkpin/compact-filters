import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// Clicks and key presses in jsdom, against the build output like render.test.js

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
// Radix dispatches its own CustomEvents, Node's built-in Event classes would not reach jsdom
const globals = ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "CustomEvent", "KeyboardEvent", "MouseEvent", "FocusEvent", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"];
for (const name of globals) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement: h } = await import("react");
const { createRoot } = await import("react-dom/client");
const { FilterBar } = await import("../dist/index.js");

after(() => dom.window.close());

const customers = [{ value: 7, label: "Can Demir" }];

async function renderBar(filter, values = { customer: 7 }) {
  const changes = [];
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const render = (props = {}) => act(() => root.render(h(FilterBar, { filters: [filter], values, onChange: (patch) => changes.push(patch), ...props })));
  await render();
  return {
    changes,
    render,
    async open() {
      await act(async () => container.querySelector("button[aria-haspopup='dialog']").click());
    },
    input: () => document.querySelector("[role='dialog'] input"),
    options: () => Array.from(document.querySelectorAll("[role='option']"), (option) => option.textContent),
    listText: () => document.querySelector("[role='listbox']").textContent,
    async type(text) {
      const input = this.input();
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, text);
        input.dispatchEvent(new window.Event("input", { bubbles: true }));
      });
    },
    async press(key) {
      await act(async () => this.input().dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true })));
    },
    async close() {
      await act(async () => document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    },
    async unmount() {
      await act(() => root.unmount());
      container.remove();
    },
  };
}

describe("FilterBar option search", () => {
  it("picks the only match with Enter", async () => {
    const bar = await renderBar({ key: "customer", label: "Müşteri", defaultValue: "all", searchable: true, options: [...customers, { value: 9, label: "Ada Yılmaz" }] });
    await bar.open();
    await bar.type("ada");

    assert.deepEqual(bar.options(), ["Ada Yılmaz"]);
    await bar.press("Enter");
    assert.deepEqual(bar.changes, [{ customer: 9 }]);
    await bar.unmount();
  });

  it("leaves the search to onSearchChange", async () => {
    const queries = [];
    const filter = { key: "customer", label: "Müşteri", defaultValue: "all", options: customers, onSearchChange: (query) => queries.push(query) };
    const bar = await renderBar(filter);
    await bar.open();

    assert.ok(bar.input(), "search box with a single option");
    await bar.type("ada");
    assert.deepEqual(queries, ["ada"]);
    assert.deepEqual(bar.options(), ["Can Demir"], "options are not filtered here");

    // "Can Demir" is still the previous query's result, Enter must not pick it
    await bar.press("Enter");
    assert.deepEqual(bar.changes, []);

    await bar.close();
    assert.equal(document.querySelector("[role='dialog']"), null);
    assert.deepEqual(queries, ["ada", ""]);
    await bar.unmount();
  });

  it("says loading instead of no results", async () => {
    const filter = { key: "customer", label: "Müşteri", defaultValue: "all", options: [], onSearchChange: () => {}, valueLabel: "Can Demir" };
    const bar = await renderBar(filter);
    await bar.open();
    assert.match(bar.listText(), /Sonuç bulunamadı/);

    await bar.render({ filters: [{ ...filter, loading: true }] });
    assert.match(bar.listText(), /Yükleniyor…/);
    assert.equal(document.querySelector("[role='listbox']").getAttribute("aria-busy"), "true");

    await bar.render({ filters: [{ ...filter, loading: true }], locale: "en" });
    assert.match(bar.listText(), /Loading…/);
    await bar.unmount();
  });
});

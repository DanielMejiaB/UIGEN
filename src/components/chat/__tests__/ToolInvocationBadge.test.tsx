import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// str_replace_editor commands

test("shows 'Creating {filename}' for str_replace_editor create command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/components/Button.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("shows 'Editing {filename}' for str_replace_editor str_replace command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "src/components/Card.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("shows 'Editing {filename}' for str_replace_editor insert command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "src/utils/helpers.ts" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("shows 'Undoing edit in {filename}' for str_replace_editor undo_edit command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "undo_edit", path: "src/App.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Undoing edit in App.tsx")).toBeDefined();
});

test("shows 'Viewing {filename}' for str_replace_editor view command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "5",
    toolName: "str_replace_editor",
    args: { command: "view", path: "src/index.ts" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Viewing index.ts")).toBeDefined();
});

test("shows 'Editing file' for str_replace_editor unknown command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "6",
    toolName: "str_replace_editor",
    args: { command: "unknown_future_command", path: "src/foo.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing file")).toBeDefined();
});

test("shows 'Editing file' for str_replace_editor missing command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "7",
    toolName: "str_replace_editor",
    args: { path: "src/foo.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing file")).toBeDefined();
});

test("shows green dot and no spinner when str_replace_editor is complete", () => {
  const toolInvocation: ToolInvocation = {
    state: "result",
    toolCallId: "8",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/components/Button.tsx" },
    result: "Success",
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// file_manager commands

test("shows 'Renaming {filename} to {new_filename}' for file_manager rename command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "9",
    toolName: "file_manager",
    args: { command: "rename", path: "src/old.tsx", new_path: "src/new.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Renaming old.tsx to new.tsx")).toBeDefined();
});

test("shows 'Deleting {filename}' for file_manager delete command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "10",
    toolName: "file_manager",
    args: { command: "delete", path: "src/temp.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Deleting temp.tsx")).toBeDefined();
});

test("shows 'Managing file' for file_manager unknown command", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "11",
    toolName: "file_manager",
    args: { command: "unknown" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Managing file")).toBeDefined();
});

test("shows green dot and no spinner when file_manager is complete", () => {
  const toolInvocation: ToolInvocation = {
    state: "result",
    toolCallId: "12",
    toolName: "file_manager",
    args: { command: "delete", path: "src/temp.tsx" },
    result: { success: true },
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// Path edge cases

test("extracts only the filename from a deeply nested path", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "13",
    toolName: "str_replace_editor",
    args: { command: "create", path: "deeply/nested/dir/Component.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  const text = screen.getByText("Creating Component.tsx");
  expect(text).toBeDefined();
  expect(text.textContent).not.toContain("deeply/nested");
});

test("shows 'Creating file' when path arg is missing", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "14",
    toolName: "str_replace_editor",
    args: { command: "create" },
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating file")).toBeDefined();
});

// Unknown tool

test("falls back to raw tool name for unknown tools", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "15",
    toolName: "some_future_tool",
    args: {},
  };
  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("some_future_tool")).toBeDefined();
});

// Visual state tests

test("shows spinner when state is 'call'", () => {
  const toolInvocation: ToolInvocation = {
    state: "call",
    toolCallId: "16",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/App.tsx" },
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows spinner when state is 'partial-call'", () => {
  const toolInvocation: ToolInvocation = {
    state: "partial-call",
    toolCallId: "17",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/App.tsx" },
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows green dot and no spinner when state is 'result' with a result", () => {
  const toolInvocation: ToolInvocation = {
    state: "result",
    toolCallId: "18",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/App.tsx" },
    result: "Success",
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is 'result' but result is null", () => {
  const toolInvocation: ToolInvocation = {
    state: "result",
    toolCallId: "19",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/App.tsx" },
    result: null,
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

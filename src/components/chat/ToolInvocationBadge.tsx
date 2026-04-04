import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFilename(path: string | undefined): string {
  if (!path) return "file";
  return path.split("/").pop() || "file";
}

function getToolDescription(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;

  if (toolName === "str_replace_editor") {
    const filename = getFilename(args?.path);
    switch (args?.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "undo_edit":
        return `Undoing edit in ${filename}`;
      case "view":
        return `Viewing ${filename}`;
      default:
        return "Editing file";
    }
  }

  if (toolName === "file_manager") {
    const filename = getFilename(args?.path);
    switch (args?.command) {
      case "rename":
        return `Renaming ${filename} to ${getFilename(args?.new_path)}`;
      case "delete":
        return `Deleting ${filename}`;
      default:
        return "Managing file";
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const description = getToolDescription(toolInvocation);
  const isDone = toolInvocation.state === "result" && toolInvocation.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{description}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{description}</span>
        </>
      )}
    </div>
  );
}

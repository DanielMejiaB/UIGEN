import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import * as actions from "@/actions";
import * as anonTracker from "@/lib/anon-work-tracker";
import * as getProjectsAction from "@/actions/get-projects";
import * as createProjectAction from "@/actions/create-project";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

const mockProject = { id: "proj-123", name: "Test Project" };
const mockAnonWork = {
  messages: [{ role: "user", content: "hello" }],
  fileSystemData: { "/app.tsx": { type: "file", content: "code" } },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
  vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject as any);
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    test("returns success result and redirects to existing project", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([
        { id: "proj-456", name: "Existing" } as any,
      ]);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;

      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "password123");
      });

      expect(returnValue).toEqual({ success: true });
      expect(mockPush).toHaveBeenCalledWith("/proj-456");
    });

    test("creates a new project when no projects exist", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProjectAction.createProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: [], data: {} })
      );
      expect(mockPush).toHaveBeenCalledWith("/proj-123");
    });

    test("migrates anonymous work on sign in", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(mockAnonWork);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProjectAction.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        })
      );
      expect(anonTracker.clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-123");
    });

    test("does not redirect or create project on failure", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());
      let returnValue: any;

      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrong");
      });

      expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockPush).not.toHaveBeenCalled();
      expect(createProjectAction.createProject).not.toHaveBeenCalled();
    });

    test("sets isLoading to true during sign in and false after", async () => {
      let resolveSignIn: (v: any) => void;
      const pendingSignIn = new Promise((resolve) => { resolveSignIn = resolve; });
      vi.mocked(actions.signIn).mockReturnValue(pendingSignIn as any);
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([{ id: "p1" } as any]);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("user@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn!({ success: true });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false when signIn throws", async () => {
      vi.mocked(actions.signIn).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("returns success result and redirects to new project when no projects exist", async () => {
      vi.mocked(actions.signUp).mockResolvedValue({ success: true });
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([]);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject as any);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;

      await act(async () => {
        returnValue = await result.current.signUp("new@example.com", "password123");
      });

      expect(returnValue).toEqual({ success: true });
      expect(createProjectAction.createProject).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-123");
    });

    test("redirects to most recent project after sign up", async () => {
      vi.mocked(actions.signUp).mockResolvedValue({ success: true });
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([
        { id: "proj-789", name: "Recent" } as any,
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-789");
    });

    test("migrates anonymous work on sign up", async () => {
      vi.mocked(actions.signUp).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(mockAnonWork);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(createProjectAction.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        })
      );
      expect(anonTracker.clearAnonWork).toHaveBeenCalled();
    });

    test("does not redirect on failure", async () => {
      vi.mocked(actions.signUp).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());
      let returnValue: any;

      await act(async () => {
        returnValue = await result.current.signUp("existing@example.com", "password123");
      });

      expect(returnValue).toEqual({ success: false, error: "Email already registered" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("resets isLoading to false when signUp throws", async () => {
      vi.mocked(actions.signUp).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("anonymous work edge cases", () => {
    test("does not create anon project when messages array is empty", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      vi.mocked(getProjectsAction.getProjects).mockResolvedValue([
        { id: "proj-existing" } as any,
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-existing");
      expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
    });

    test("skips getProjects when anonymous work is migrated", async () => {
      vi.mocked(actions.signIn).mockResolvedValue({ success: true });
      vi.mocked(anonTracker.getAnonWorkData).mockReturnValue(mockAnonWork);
      vi.mocked(createProjectAction.createProject).mockResolvedValue(mockProject as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(getProjectsAction.getProjects).not.toHaveBeenCalled();
    });
  });
});

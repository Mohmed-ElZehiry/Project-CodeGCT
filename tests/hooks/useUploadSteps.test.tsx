import { renderHook, act } from "@testing-library/react";
import { useUploadSteps } from "@/features/user/hooks/useUploadSteps";
import {
  getStepsClient,
  addStepClient,
} from "@/features/user/services/uploads/uploadStepsClientService";

jest.mock("@/features/user/services/uploads/uploadStepsClientService", () => ({
  getStepsClient: jest.fn(),
  addStepClient: jest.fn(),
}));

describe("useUploadSteps", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("returns empty array when fetch fails", async () => {
    (getStepsClient as jest.Mock).mockResolvedValue({
      success: false,
      error: "Failed",
    });

    const { result } = renderHook(() => useUploadSteps("upload-123"));

    await act(async () => {
      // wait for useEffect to finish
    });

    expect(result.current.steps).toEqual([]);
    expect(result.current.error).toBe("Failed");
    expect(result.current.loading).toBe(false);
  });

  it("appends new step on addUploadStep", async () => {
    const step = {
      id: "step-1",
      uploadId: "upload-123",
      step: "analysis",
      outcome: "done",
      createdAt: new Date().toISOString(),
    };

    (getStepsClient as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    (addStepClient as jest.Mock).mockResolvedValue({
      success: true,
      data: step,
    });

    const { result } = renderHook(() => useUploadSteps("upload-123"));

    await act(async () => {});

    await act(async () => {
      await result.current.addUploadStep("analysis");
    });

    expect(result.current.steps).toHaveLength(1);
    expect(result.current.steps[0].id).toBe("step-1");
  });
});

<<<<<<< HEAD
/**
 * Unit tests for external link health check logic
 * 
 * Run with: npm test (if jest is configured)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ExternalLink } from "@/config/external-links";

// Mock fetch globally
global.fetch = vi.fn();

// Mock prisma
vi.mock("@/prisma", () => ({
  prisma: {
    externalLinkHealth: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { checkExternalLink, updateLinkHealth } from "../external-link-health";
import { prisma } from "@/prisma";

describe("External Link Health Check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkExternalLink", () => {
    it("should return ok status for 200 response", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
        checkMethod: "HEAD",
        expectedStatus: [200],
      };

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
      });

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("ok");
      expect(result.statusCode).toBe(200);
      expect(result.linkId).toBe("test_link");
    });

    it("should return unavailable status for 404 response", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
        checkMethod: "HEAD",
        expectedStatus: [200],
      };

      (global.fetch as any).mockResolvedValueOnce({
        status: 404,
      });

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("unavailable");
      expect(result.statusCode).toBe(404);
    });

    it("should return unavailable status on network error", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
      };

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("unavailable");
      expect(result.error).toBe("Network error");
    });

    it("should accept 301/302 redirects as ok", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
        expectedStatus: [200, 301, 302],
      };

      (global.fetch as any).mockResolvedValueOnce({
        status: 301,
      });

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("ok");
      expect(result.statusCode).toBe(301);
    });
  });

  describe("updateLinkHealth", () => {
    it("should increment consecutive failures on unavailable status", async () => {
      const mockExisting = {
        linkId: "test_link",
        url: "https://example.com",
        status: "ok",
        consecutiveFailures: 0,
        lastCheckedAt: new Date(),
        lastStatusCode: 200,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.externalLinkHealth.findUnique as any).mockResolvedValueOnce(mockExisting);
      (prisma.externalLinkHealth.upsert as any).mockResolvedValueOnce({});

      await updateLinkHealth({
        linkId: "test_link",
        url: "https://example.com",
        status: "unavailable",
        statusCode: 404,
        timestamp: new Date(),
      });

      expect(prisma.externalLinkHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            consecutiveFailures: 1,
          }),
        })
      );
    });

    it("should reset consecutive failures on ok status", async () => {
      const mockExisting = {
        linkId: "test_link",
        url: "https://example.com",
        status: "unavailable",
        consecutiveFailures: 2,
        lastCheckedAt: new Date(),
        lastStatusCode: 404,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.externalLinkHealth.findUnique as any).mockResolvedValueOnce(mockExisting);
      (prisma.externalLinkHealth.upsert as any).mockResolvedValueOnce({});

      await updateLinkHealth({
        linkId: "test_link",
        url: "https://example.com",
        status: "ok",
        statusCode: 200,
        timestamp: new Date(),
      });

      expect(prisma.externalLinkHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            consecutiveFailures: 0,
          }),
        })
      );
    });

    it("should mark as unavailable after 3 consecutive failures", async () => {
      const mockExisting = {
        linkId: "test_link",
        url: "https://example.com",
        status: "ok",
        consecutiveFailures: 2,
        lastCheckedAt: new Date(),
        lastStatusCode: 200,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.externalLinkHealth.findUnique as any).mockResolvedValueOnce(mockExisting);
      (prisma.externalLinkHealth.upsert as any).mockResolvedValueOnce({});

      await updateLinkHealth({
        linkId: "test_link",
        url: "https://example.com",
        status: "unavailable",
        statusCode: 404,
        timestamp: new Date(),
      });

      expect(prisma.externalLinkHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: "unavailable",
            consecutiveFailures: 3,
          }),
        })
      );
    });
  });
});
=======
/**
 * Unit tests for external link health check logic
 * 
 * Run with: npm test (if jest is configured)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ExternalLink } from "@/config/external-links";

// Mock fetch globally
global.fetch = vi.fn();

// Mock prisma
vi.mock("@/prisma", () => ({
  prisma: {
    externalLinkHealth: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { checkExternalLink, updateLinkHealth } from "../external-link-health";
import { prisma } from "@/prisma";

describe("External Link Health Check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkExternalLink", () => {
    it("should return ok status for 200 response", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
        checkMethod: "HEAD",
        expectedStatus: [200],
      };

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
      });

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("ok");
      expect(result.statusCode).toBe(200);
      expect(result.linkId).toBe("test_link");
    });

    it("should return unavailable status for 404 response", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
        checkMethod: "HEAD",
        expectedStatus: [200],
      };

      (global.fetch as any).mockResolvedValueOnce({
        status: 404,
      });

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("unavailable");
      expect(result.statusCode).toBe(404);
    });

    it("should return unavailable status on network error", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
      };

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("unavailable");
      expect(result.error).toBe("Network error");
    });

    it("should accept 301/302 redirects as ok", async () => {
      const mockLink: ExternalLink = {
        id: "test_link",
        label: "Test Link",
        labelCn: "测试链接",
        url: "https://example.com",
        description: "Test",
        expectedStatus: [200, 301, 302],
      };

      (global.fetch as any).mockResolvedValueOnce({
        status: 301,
      });

      const result = await checkExternalLink(mockLink);

      expect(result.status).toBe("ok");
      expect(result.statusCode).toBe(301);
    });
  });

  describe("updateLinkHealth", () => {
    it("should increment consecutive failures on unavailable status", async () => {
      const mockExisting = {
        linkId: "test_link",
        url: "https://example.com",
        status: "ok",
        consecutiveFailures: 0,
        lastCheckedAt: new Date(),
        lastStatusCode: 200,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.externalLinkHealth.findUnique as any).mockResolvedValueOnce(mockExisting);
      (prisma.externalLinkHealth.upsert as any).mockResolvedValueOnce({});

      await updateLinkHealth({
        linkId: "test_link",
        url: "https://example.com",
        status: "unavailable",
        statusCode: 404,
        timestamp: new Date(),
      });

      expect(prisma.externalLinkHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            consecutiveFailures: 1,
          }),
        })
      );
    });

    it("should reset consecutive failures on ok status", async () => {
      const mockExisting = {
        linkId: "test_link",
        url: "https://example.com",
        status: "unavailable",
        consecutiveFailures: 2,
        lastCheckedAt: new Date(),
        lastStatusCode: 404,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.externalLinkHealth.findUnique as any).mockResolvedValueOnce(mockExisting);
      (prisma.externalLinkHealth.upsert as any).mockResolvedValueOnce({});

      await updateLinkHealth({
        linkId: "test_link",
        url: "https://example.com",
        status: "ok",
        statusCode: 200,
        timestamp: new Date(),
      });

      expect(prisma.externalLinkHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            consecutiveFailures: 0,
          }),
        })
      );
    });

    it("should mark as unavailable after 3 consecutive failures", async () => {
      const mockExisting = {
        linkId: "test_link",
        url: "https://example.com",
        status: "ok",
        consecutiveFailures: 2,
        lastCheckedAt: new Date(),
        lastStatusCode: 200,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.externalLinkHealth.findUnique as any).mockResolvedValueOnce(mockExisting);
      (prisma.externalLinkHealth.upsert as any).mockResolvedValueOnce({});

      await updateLinkHealth({
        linkId: "test_link",
        url: "https://example.com",
        status: "unavailable",
        statusCode: 404,
        timestamp: new Date(),
      });

      expect(prisma.externalLinkHealth.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: "unavailable",
            consecutiveFailures: 3,
          }),
        })
      );
    });
  });
});
>>>>>>> origin/main

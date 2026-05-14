/**
 * @jest-environment node
 */

// Set env vars before imports
process.env.R2_ENDPOINT = "https://r2.example.com";
process.env.R2_ACCESS_KEY = "test-access-key";
process.env.R2_SECRET_KEY = "test-secret-key";

// Mock S3Client
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    config: {
      region: "auto",
    },
  })),
}));

describe("libs/s3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create S3Client with correct config", () => {
    const { S3Client } = require("@aws-sdk/client-s3");
    require("@/libs/s3");

    expect(S3Client).toHaveBeenCalledWith({
      region: "auto",
      endpoint: "https://r2.example.com",
      credentials: {
        accessKeyId: "test-access-key",
        secretAccessKey: "test-secret-key",
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  });

  it("should export default S3Client instance", () => {
    const s3Client = require("@/libs/s3").default;
    expect(s3Client.send).toBeDefined();
    expect(typeof s3Client.send).toBe("function");
  });
});

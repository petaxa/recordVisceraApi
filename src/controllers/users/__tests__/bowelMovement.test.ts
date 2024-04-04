import { Request, Response } from "express";
import { registBowelMovement } from "@/controllers/users/bowelMovement";
import {
  BadRequestError,
  DbRecordNotFoundError,
} from "@/utils/errorHandle/errors";
import { findUniqueUserAbsoluteExist } from "@/services/users/users";
import { customizedPrisma } from "@/utils/prismaClients";
import { basicHttpResponceIncludeData } from "@/utils/utilResponse";
import { logResponse } from "@/utils/logger/utilLogger";
import { errorResponseHandler } from "@/utils/errorHandle";

jest.mock("@/services/users/users", () => ({
  ...jest.requireActual("@/services/users/users"),
  findUniqueUserAbsoluteExist: jest.fn(),
}));
jest.mock("@/utils/utilResponse", () => ({
  ...jest.requireActual("@/utils/utilResponse"),
  basicHttpResponceIncludeData: jest.fn(),
}));
jest.mock("@/utils/logger/utilLogger", () => ({
  ...jest.requireActual("@/utils/logger/utilLogger"),
  logResponse: jest.fn(),
}));
jest.mock("@/utils/prismaClients", () => ({
  customizedPrisma: {
    bowel_Movement: {
      create: jest.fn().mockImplementation(() => ({
        id: 1,
        note: "mock-note",
        day: new Date("2023-10-13T17:40:33.000Z"),
        time: new Date("2023-10-13T17:40:33.000Z"),
        blood: 1,
        drainage: 1,
        bristolStoolScale: 1,
        userId: 10,
        createdAt: new Date("2023-11-01T07:01:13.000Z"),
        updatedAt: new Date("2023-11-11T07:01:13.000Z"),
      })),
    },
  },
}));
jest.mock("@/utils/errorHandle", () => ({
  ...jest.requireActual("@/utils/errorHandle"),
  errorResponseHandler: jest.fn(),
}));

describe("registBowelMovementのテスト", () => {
  let mockReq: Partial<Request>;
  const mockRes: Partial<Response> = {};
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      ip: "mock-ip",
      method: "mock-method",
      path: "mock-path",
      body: {},
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("正常", async () => {
    mockReq = {
      ip: "mock-ip",
      method: "mock-method",
      path: "mock-path",
      body: {
        userId: "10",
        bristolStoolScale: "1",
        blood: "1",
        drainage: "1",
        note: "mock-note",
        date: "2023-10-13T17:40:33.000Z",
      },
    };

    // テスト対象実行
    await registBowelMovement(mockReq as Request, mockRes as Response, next);

    // 確認
    expect(findUniqueUserAbsoluteExist).toHaveBeenCalledWith(
      { id: 10 },
      customizedPrisma
    );

    const customizedPrismaBowelMovementCreateInstance = customizedPrisma
      .bowel_Movement.create as jest.Mock;
    expect(customizedPrismaBowelMovementCreateInstance).toHaveBeenCalledWith({
      data: {
        userId: 10,
        day: new Date("2023-10-13T17:40:33.000Z"),
        time: new Date("2023-10-13T17:40:33.000Z"),
        blood: 1,
        drainage: 1,
        note: "mock-note",
        bristolStoolScale: 1,
      },
    });

    const httpStatus = 200;
    const responseStatus = true;
    const responseMsg = "排便記録を記録しました。";
    expect(basicHttpResponceIncludeData).toHaveBeenCalledWith(
      mockRes,
      httpStatus,
      responseStatus,
      responseMsg,
      {
        id: 1,
        note: "mock-note",
        day: new Date("2023-10-13T17:40:33.000Z"),
        time: new Date("2023-10-13T17:40:33.000Z"),
        blood: 1,
        drainage: 1,
        bristolStoolScale: 1,
        userId: 10,
        createdAt: new Date("2023-11-01T07:01:13.000Z"),
        updatedAt: new Date("2023-11-11T07:01:13.000Z"),
      }
    );

    expect(logResponse).toHaveBeenCalledWith(
      10,
      mockReq,
      httpStatus,
      responseMsg,
      "registBowelMovement"
    );
  });
  test("userIdがない", async () => {
    mockReq = {
      ip: "mock-ip",
      method: "mock-method",
      path: "mock-path",
      body: {
        bristolStoolScale: "1",
        blood: "1",
        drainage: "1",
        note: "mock-note",
        date: "2023-10-13T17:40:33.000Z",
      },
    };

    // テスト対象実行
    await registBowelMovement(mockReq as Request, mockRes as Response, next);

    // 確認
    expect(errorResponseHandler).toHaveBeenCalledWith(
      new BadRequestError("不正なリクエストです"),
      "unspecified",
      mockReq,
      mockRes,
      "registBowelMovement"
    );
  });
  test("bristolStoolScaleがない", async () => {
    mockReq = {
      ip: "mock-ip",
      method: "mock-method",
      path: "mock-path",
      body: {
        userId: "10",
        blood: "1",
        drainage: "1",
        note: "mock-note",
        date: "2023-10-13T17:40:33.000Z",
      },
    };

    // テスト対象実行
    await registBowelMovement(mockReq as Request, mockRes as Response, next);

    // 確認
    expect(errorResponseHandler).toHaveBeenCalledWith(
      new BadRequestError("不正なリクエストです"),
      10,
      mockReq,
      mockRes,
      "registBowelMovement"
    );
  });
  test("bloodがない", async () => {
    mockReq = {
      ip: "mock-ip",
      method: "mock-method",
      path: "mock-path",
      body: {
        userId: "10",
        bristolStoolScale: "1",
        drainage: "1",
        note: "mock-note",
        date: "2023-10-13T17:40:33.000Z",
      },
    };

    // テスト対象実行
    await registBowelMovement(mockReq as Request, mockRes as Response, next);

    // 確認
    expect(errorResponseHandler).toHaveBeenCalledWith(
      new BadRequestError("不正なリクエストです"),
      10,
      mockReq,
      mockRes,
      "registBowelMovement"
    );
  });
  test("drainageがない", async () => {
    mockReq = {
      ip: "mock-ip",
      method: "mock-method",
      path: "mock-path",
      body: {
        userId: "10",
        bristolStoolScale: "1",
        blood: "1",
        note: "mock-note",
        date: "2023-10-13T17:40:33.000Z",
      },
    };

    // テスト対象実行
    await registBowelMovement(mockReq as Request, mockRes as Response, next);

    // 確認
    expect(errorResponseHandler).toHaveBeenCalledWith(
      new BadRequestError("不正なリクエストです"),
      10,
      mockReq,
      mockRes,
      "registBowelMovement"
    );
  });
  test("findUniqueUserAbsoluteExistがエラーを投げる", async () => {
    mockReq = {
      ip: "mock-ip",
      method: "mock-method",
      path: "mock-path",
      body: {
        userId: "10",
        bristolStoolScale: "1",
        blood: "1",
        drainage: "1",
        note: "mock-note",
        date: "2023-10-13T17:40:33.000Z",
      },
    };

    // findUniqueUserAbsoluteExistがDbRecordNotFoundErrorを投げる
    (findUniqueUserAbsoluteExist as jest.Mock).mockImplementation(() => {
      throw new DbRecordNotFoundError();
    });

    // テスト対象実行
    await registBowelMovement(mockReq as Request, mockRes as Response, next);

    // 確認
    expect(errorResponseHandler).toHaveBeenCalledWith(
      new DbRecordNotFoundError(),
      10,
      mockReq,
      mockRes,
      "registBowelMovement"
    );
  });
});
import * as edit from "@/services/users/bowelMovements/endpoints/edit";
import {
  accessForbiddenErrorHandle,
  badRequestErrorHandle,
  dbRecordNotFoundErrorHandle,
} from "@/utils/errorHandle/errorHandling";
import {
  AccessForbiddenError,
  BadRequestError,
} from "@/utils/errorHandle/errors";
import { logResponse } from "@/utils/logger/utilLogger";
import { customizedPrisma } from "@/utils/prismaClients";
import { basicHttpResponceIncludeData } from "@/utils/utilResponse";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

jest.mock("@/utils/errorHandle/errorHandling", () => ({
  ...jest.requireActual("@/utils/errorHandle/errorHandling"),
  badRequestErrorHandle: jest.fn(),
  dbRecordNotFoundErrorHandle: jest.fn(),
  accessForbiddenErrorHandle: jest.fn(),
}));

jest.mock("@/utils/prismaClients", () => ({
  customizedPrisma: {
    bowel_Movement: {
      findUniqueOrThrow: jest
        .fn()
        .mockImplementation(
          (arg: Prisma.Bowel_MovementFindUniqueOrThrowArgs) => {
            if (arg.where.id === 90) {
              // idに合致するレコードがなかった
              throw new Prisma.PrismaClientKnownRequestError("message", {
                code: "mock-code",
                clientVersion: "mock-version",
                batchRequestIdx: 1,
              });
            } else {
              // 正常
              const bowelMovement = {
                id: arg.where.id,
                date: new Date("2022-11-11"),
                day: new Date("2022-11-11"),
                bristolStoolScale: 1,
                blood: 1,
                drainage: 1,
                note: "note",
                userId: 1,
                createdAt: new Date("2022-11-11"),
                updatedAt: new Date("2022-11-11"),
              };
              return bowelMovement;
            }
          },
        ),
      update: jest
        .fn()
        .mockImplementation((arg: Prisma.Bowel_MovementUpdateArgs) => {
          if (arg.where.id === 91) {
            // idに合致するレコードがなかった
            throw new Prisma.PrismaClientKnownRequestError("message", {
              code: "mock-code",
              clientVersion: "mock-version",
              batchRequestIdx: 1,
            });
          } else if (arg.where.id === 10) {
            const bowelMovement = {
              id: arg.where.id,
              date: new Date("2022-11-11"),
              day: undefined,
              bristolStoolScale: 1,
              blood: 1,
              drainage: 1,
              note: "note",
              userId: 1,
              createdAt: new Date("2022-11-11"),
              updatedAt: new Date("2022-11-11"),
            };
            return bowelMovement;
          } else {
            const bowelMovement = {
              id: arg.where.id,
              date: new Date("2022-11-11"),
              day: new Date("2022-11-11"),
              bristolStoolScale: 1,
              blood: 1,
              drainage: 1,
              note: "note",
              userId: 1,
              createdAt: new Date("2022-11-11"),
              updatedAt: new Date("2022-11-11"),
            };
            return bowelMovement;
          }
        }),
    },
  },
}));

jest.mock("@/utils/utilResponse", () => ({
  ...jest.requireActual("@/utils/utilResponse"),
  basicHttpResponceIncludeData: jest.fn(),
}));
jest.mock("@/utils/logger/utilLogger", () => ({
  ...jest.requireActual("@/utils/logger/utilLogger"),
  logResponse: jest.fn(),
}));

describe("validationErrorHandleのテスト", () => {
  const mockReq: Partial<Request> = {};
  const mockRes: Partial<Response> = {};
  test("BadRequestErrorを受けたらbadRequestErrorHandleが実行される", () => {
    edit.validationErrorHandle(
      new BadRequestError("message"),
      mockReq as Request,
      mockRes as Response,
    );

    expect(badRequestErrorHandle).toHaveBeenCalledWith(
      new BadRequestError("message"),
      "unspecified",
      mockReq,
      mockRes,
      "editBowelMovement",
    );
  });

  test("それ以外のエラーだったらそのまま投げられる", () => {
    const test = () => {
      edit.validationErrorHandle(
        new Error("message"),
        mockReq as Request,
        mockRes as Response,
      );
    };

    expect(test).toThrow(new Error("message"));
  });
});

describe("updateBowelMovementのテスト", () => {
  test("dateに値を入れて実行するとdayパラメータが追加されて更新処理が行われる", async () => {
    const result = await edit.updateBowelMovement(1, 1, {
      date: new Date("2023-10-11"),
      blood: 1,
      drainage: 2,
      note: "hoge",
      bristolStoolScale: 2,
    });

    expect(
      customizedPrisma.bowel_Movement.findUniqueOrThrow,
    ).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(customizedPrisma.bowel_Movement.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        date: new Date("2023-10-11"),
        day: new Date("2023-10-11"),
        blood: 1,
        drainage: 2,
        note: "hoge",
        bristolStoolScale: 2,
      },
    });
    expect(result).toEqual({
      id: 1,
      date: new Date("2022-11-11"),
      day: new Date("2022-11-11"),
      bristolStoolScale: 1,
      blood: 1,
      drainage: 1,
      note: "note",
      userId: 1,
      createdAt: new Date("2022-11-11"),
      updatedAt: new Date("2022-11-11"),
    });
  });

  test("dateをundefinedで実行するとそのまま更新処理が行われる", async () => {
    const result = await edit.updateBowelMovement(10, 1, {
      date: undefined,
      blood: 1,
      drainage: 2,
      note: "hoge",
      bristolStoolScale: 2,
    });

    expect(
      customizedPrisma.bowel_Movement.findUniqueOrThrow,
    ).toHaveBeenCalledWith({
      where: { id: 10 },
    });
    expect(customizedPrisma.bowel_Movement.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        date: undefined,
        blood: 1,
        drainage: 2,
        note: "hoge",
        bristolStoolScale: 2,
      },
    });
    expect(result).toEqual({
      id: 10,
      date: new Date("2022-11-11"),
      day: undefined,
      bristolStoolScale: 1,
      blood: 1,
      drainage: 1,
      note: "note",
      userId: 1,
      createdAt: new Date("2022-11-11"),
      updatedAt: new Date("2022-11-11"),
    });
  });

  test("指定したbowelMovementが存在しなかったらPrismaClientKnownRequestError", async () => {
    const test = async () => {
      await edit.updateBowelMovement(90, 1, {
        date: new Date("2023-10-11"),
        blood: 1,
        drainage: 2,
        note: "hoge",
        bristolStoolScale: 2,
      });
    };

    await expect(test).rejects.toThrow(
      new Prisma.PrismaClientKnownRequestError("message", {
        code: "mock-code",
        clientVersion: "mock-version",
        batchRequestIdx: 1,
      }),
    );
  });

  test("指定したbowelMovementとuserIdが一致しなかったらAccessForbiddenError", async () => {
    const test = async () => {
      await edit.updateBowelMovement(1, 50, {
        date: new Date("2023-10-11"),
        blood: 1,
        drainage: 2,
        note: "hoge",
        bristolStoolScale: 2,
      });
    };

    await expect(test).rejects.toThrow(
      new AccessForbiddenError("この排便記録は編集できません"),
    );
  });

  test("削除に失敗したらPrismaClientKnownRequestError", async () => {
    const test = async () => {
      await edit.updateBowelMovement(91, 1, {
        date: new Date("2023-10-11"),
        blood: 1,
        drainage: 2,
        note: "hoge",
        bristolStoolScale: 2,
      });
    };

    await expect(test).rejects.toThrow(
      new Prisma.PrismaClientKnownRequestError("message", {
        code: "mock-code",
        clientVersion: "mock-version",
        batchRequestIdx: 1,
      }),
    );
  });
});

describe("updateBowelMovementErrorHandleのテスト", () => {
  const mockReq: Partial<Request> = {};
  const mockRes: Partial<Response> = {};
  test("PrismaClientKnownRequestErrorを受けたらdbRecordNotFoundErrorHandleが実行される", () => {
    edit.updateBowelMovementErrorHandle(
      new Prisma.PrismaClientKnownRequestError("message", {
        code: "mock-code",
        clientVersion: "mock-version",
        batchRequestIdx: 1,
      }),
      1,
      mockReq as Request,
      mockRes as Response,
    );

    expect(dbRecordNotFoundErrorHandle).toHaveBeenCalledWith(
      new Prisma.PrismaClientKnownRequestError("message", {
        code: "mock-code",
        clientVersion: "mock-version",
        batchRequestIdx: 1,
      }),
      1,
      mockReq,
      mockRes,
      "editBowelMovement",
    );
  });

  test("AccessForbiddenErrorを受けたらaccessForbiddenErrorHandleが実行される", () => {
    edit.updateBowelMovementErrorHandle(
      new AccessForbiddenError("message"),
      1,
      mockReq as Request,
      mockRes as Response,
    );

    expect(accessForbiddenErrorHandle).toHaveBeenCalledWith(
      new AccessForbiddenError("message"),
      1,
      mockReq,
      mockRes,
      "editBowelMovement",
    );
  });

  test("それ以外のエラーだったらそのまま投げられる", () => {
    const test = () => {
      edit.updateBowelMovementErrorHandle(
        new Error("message"),
        1,
        mockReq as Request,
        mockRes as Response,
      );
    };

    expect(test).toThrow(new Error("message"));
  });
});

describe("sendResponseのテスト", () => {
  const mockReq: Partial<Request> = {};
  const mockRes: Partial<Response> = {};
  test("正常に動作", () => {
    edit.sendResponse(1, mockReq as Request, mockRes as Response, {
      id: 11,
      date: new Date("2022-11-11"),
      day: new Date("2022-11-11"),
      bristolStoolScale: 1,
      blood: 1,
      drainage: 1,
      note: "note",
      userId: 1,
      createdAt: new Date("2022-11-11"),
      updatedAt: new Date("2022-11-11"),
    });

    expect(basicHttpResponceIncludeData).toHaveBeenCalledWith(
      mockRes,
      200,
      true,
      "排便記録を編集しました。",
      {
        id: 11,
        date: new Date("2022-11-11"),
        day: new Date("2022-11-11"),
        bristolStoolScale: 1,
        blood: 1,
        drainage: 1,
        note: "note",
        userId: 1,
        createdAt: new Date("2022-11-11"),
        updatedAt: new Date("2022-11-11"),
      },
    );
    expect(logResponse).toHaveBeenCalledWith(
      1,
      mockReq,
      200,
      "排便記録を編集しました。",
      "editBowelMovement",
    );
  });
});

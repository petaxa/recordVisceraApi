import { Prisma } from "@prisma/client";
import { customizedPrisma } from "../prismaClients";
import { basicHttpResponce } from "../utilResponseService";
import { BOWEL_MOVEMENT_NOT_FOUND } from "@/consts/responseConsts/bowelMovement";
import { Response } from "express";
import { DbRecordNotFoundError } from ".";

/**
 * DBより、排便記録の存在確認、取得を行う。
 * 排便記録が存在しなかった場合はDbRecordNotFoundErrorを投げる
 * @param where 検索条件
 * @param res
 * @returns
 */
export const findUniqueBowelMovementAbsoluteExist = async (where: Prisma.Bowel_MovementWhereUniqueInput, res: Response) => {
    // idから排便記録を取得
    const bowelMovementData = await customizedPrisma.bowel_Movement.findUnique({ where })
    // 排便記録が無かったらDbRecordNotFoundErrorを投げる
    if (!bowelMovementData) {
        const responseMsg = BOWEL_MOVEMENT_NOT_FOUND.message
        throw new DbRecordNotFoundError(responseMsg)
    }

    return bowelMovementData
}
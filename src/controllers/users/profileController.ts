import { PROCESS_SUCCESS } from "@/consts/logConsts";
import { COMPLETE_GET_PROFILE, COMPLETE_UPDATE_PROFILE } from "@/consts/responseConsts";
import { CustomLogger, LoggingObjType, maskConfInfoInReqBody } from "@/services/LoggerService";
import { ErrorHandleIncludeDbRecordNotFound } from "@/services/errorHandlingService";
import { customizedPrisma } from "@/services/prismaClients";
import { findUniqueProfileAbsoluteExist } from "@/services/prismaService";
import { basicHttpResponceIncludeData } from "@/services/utilResponseService";
import type { Request, Response, NextFunction } from "express";
const logger = new CustomLogger()

/**
 * ユーザーのプロフィールを取得
 * tokenのuserIdからユーザーから取得
 * @param req userId
 * @param res id, createdAt, updatedAt, sex, weight, height, birthday, userId
 * @param next
 * @returns
 */
export const readProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body

    // logのために関数名を取得
    const currentFuncName = readProfile.name
    try {
        // userIdでプロフィールを取得
        const whereByUserId = { userId: userId }
        const profile = await findUniqueProfileAbsoluteExist(whereByUserId, res)

        // レスポンスを返却
        const HttpStatus = 200
        const responseStatus = true
        const responseMsg = COMPLETE_GET_PROFILE.message
        basicHttpResponceIncludeData(res, HttpStatus, responseStatus, responseMsg, profile)

        // ログを出力
        const logBody: LoggingObjType = {
            userId,
            ipAddress: req.ip,
            method: req.method,
            path: req.originalUrl,
            body: maskConfInfoInReqBody(req).body,
            status: String(HttpStatus),
            responseMsg
        }
        logger.log(PROCESS_SUCCESS.message(currentFuncName), logBody)
    } catch (e) {
        ErrorHandleIncludeDbRecordNotFound(e, userId.message, req, res, currentFuncName)
    }
}

/**
 * ユーザーのプロフィール編集
 * tokenのuserIdからユーザーのプロフィールを編集
 * @param req userId, sex, height, birthday
 * @param res
 * @param next
 */
export const editProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sex, height, birthday } = req.body

    // logのために関数名を取得
    const currentFuncName = editProfile.name
    // TODO: バリデーション バリデーションエラーは詳細にエラーを返す

    try {
        // userIdでプロフィールを検索
        const whereByUserId = { userId }
        await findUniqueProfileAbsoluteExist(whereByUserId, res)

        // プロフィールを更新
        const updatedProfile = await customizedPrisma.profile.update({
            where: whereByUserId,
            data: {
                sex,
                height,
                birthday
            }
        })

        // レスポンスを返却
        const HttpStatus = 200
        const responseStatus = true
        const responseMsg = COMPLETE_UPDATE_PROFILE.message
        basicHttpResponceIncludeData(res, HttpStatus, responseStatus, responseMsg, updatedProfile)

        // ログを出力
        const logBody: LoggingObjType = {
            userId,
            ipAddress: req.ip,
            method: req.method,
            path: req.originalUrl,
            body: maskConfInfoInReqBody(req).body,
            status: String(HttpStatus),
            responseMsg
        }
        logger.log(PROCESS_SUCCESS.message(currentFuncName), logBody)

    } catch (e) {
        ErrorHandleIncludeDbRecordNotFound(e, userId.message, req, res, currentFuncName)
    }
}
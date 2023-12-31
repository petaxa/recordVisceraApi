import { PROCESS_FAILURE, PROCESS_SUCCESS, UNSPECIFIED_USER_ID } from "@/consts/logConsts";
import { TITLE_VALID_RESET_PASS, TEXT_VALID_RESET_PASS } from "@/consts/mailConsts";
import { COMPLETE_VALID_RESET_PASS, SEND_MAIL_FOR_RESET_PASS_VALID, TOKEN_NOT_FOUND } from "@/consts/responseConsts";
import { CustomLogger, LoggingObjType, maskConfInfoInReqBody } from "@/services/LoggerService";
import { ErrorHandleIncludeDbRecordNotFound } from "@/services/errorHandlingService";
import { sendMail } from "@/services/nodemailerService";
import { customizedPrisma } from "@/services/prismaClients";
import { findActivedUser, findUniqueUserAbsoluteExist } from "@/services/prismaService";
import { basicHttpResponce } from "@/services/utilResponseService";
import { randomBytes } from "crypto";
import type { Request, Response, NextFunction } from "express";
const logger = new CustomLogger()

/**
 * パスワード再設定のリクエストを行う
 * トークンを生成してurlをメール送信する。
 * @param req
 * @param res
 * @param next
 */
export const requestResettingPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body

    // logのために関数名を取得
    const currentFuncName = requestResettingPassword.name
    // TODO: バリデーション

    try {
        // emailからuserを取得
        const whereByEmail = { email }
        const user = await findActivedUser(whereByEmail)

        // 認証トークン作成
        const passResetHash = randomBytes(32).toString("hex")

        // DBに保存
        const newUser = await customizedPrisma.user.update({
            where: {
                id: user.id
            },
            data: {
                passResetHash
            }
        })

        // メール送信
        // TODO: ここはフロント側のページのURLを送信するべき。フロントを実装したら修正する。
        const verifyUrl = `${process.env.BASE_URL}/reset-password/${newUser.id}/execute/${newUser.passResetHash}`
        await sendMailForResetPasswordVerify(email, verifyUrl)

        // レスポンスを返却
        const HttpStatus = 201
        const responseStatus = true
        const responseMsg = SEND_MAIL_FOR_RESET_PASS_VALID.message
        basicHttpResponce(res, HttpStatus, responseStatus, responseMsg)

        // ログを出力
        const logBody: LoggingObjType = {
            userId: UNSPECIFIED_USER_ID.message,
            ipAddress: req.ip,
            method: req.method,
            path: req.originalUrl,
            body: maskConfInfoInReqBody(req).body,
            status: String(HttpStatus),
            responseMsg
        }
        logger.log(PROCESS_SUCCESS.message(currentFuncName), logBody)
    } catch (e) {
        ErrorHandleIncludeDbRecordNotFound(e, UNSPECIFIED_USER_ID.message, req, res, currentFuncName)
    }
}

/**
 * パスワード再設定を実行する
 * paramのid, tokenを用いて認証、bodyの新パスワードに更新
 * Baseurl/reset-password/:id/execute/:token
 * @param req
 * @param res
 * @param next
 */
export const ExecuteResettingPassword = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.body.id)
    const { token, newPassword } = req.body

    // logのために関数名を取得
    const currentFuncName = ExecuteResettingPassword.name

    // TODO: バリデーション

    try {
        // idからユーザーを検索
        const whereByUserId = { id }
        const user = await findUniqueUserAbsoluteExist(whereByUserId, res)

        // tokenが見つからなかったら400エラー
        if (!user.passResetHash) {
            const HttpStatus = 400
            const responseStatus = false
            const responseMsg = TOKEN_NOT_FOUND.message
            basicHttpResponce(res, HttpStatus, responseStatus, responseMsg)

            // ログを出力
            const logBody: LoggingObjType = {
                userId: UNSPECIFIED_USER_ID.message,
                ipAddress: req.ip,
                method: req.method,
                path: req.originalUrl,
                body: maskConfInfoInReqBody(req).body,
                status: String(HttpStatus),
                responseMsg
            }
            logger.error(PROCESS_FAILURE.message(currentFuncName), logBody)
            return
        }

        // tokenが一致していたらパスワードを更新
        if (user.passResetHash === token) {
            await customizedPrisma.user.update({
                where: whereByUserId,
                data: {
                    passResetHash: "",
                    password: newPassword
                }
            })
        }

        // レスポンス
        const HttpStatus = 200
        const responseStatus = true
        const responseMsg = COMPLETE_VALID_RESET_PASS.message
        basicHttpResponce(res, HttpStatus, responseStatus, responseMsg)

        // ログを出力
        const logBody: LoggingObjType = {
            userId: UNSPECIFIED_USER_ID.message,
            ipAddress: req.ip,
            method: req.method,
            path: req.originalUrl,
            body: maskConfInfoInReqBody(req).body,
            status: String(HttpStatus),
            responseMsg
        }
        logger.log(PROCESS_SUCCESS.message(currentFuncName), logBody)
    } catch (e) {
        // エラーの時のレスポンス
        ErrorHandleIncludeDbRecordNotFound(e, UNSPECIFIED_USER_ID.message, req, res, currentFuncName)
    }
}

/**
 * email認証確認用のメールを送信する。
 * @param email 送信先メールアドレス
 * @param url 認証用URL
 */
const sendMailForResetPasswordVerify = async (email: string, url: string) => {
    // 件名
    const mailSubject = TITLE_VALID_RESET_PASS.message
    // 本文
    const text = TEXT_VALID_RESET_PASS.message(url)
    await sendMail(email, mailSubject, text)
}

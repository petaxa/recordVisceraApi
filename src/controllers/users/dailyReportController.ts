import { PROCESS_FAILURE, PROCESS_SUCCESS } from "@/consts/logConsts";
import {
    DAILY_REPORT_ACCESS_FORBIDDEN,
    DELETE_DAILY_REPORT,
    EDIT_DAILY_REPORT,
    READ_DAILY_REPORT,
    RECORD_DAILY_REPORT,
} from "@/consts/responseConsts";
import {
    LoggingObjType,
    logResponse,
    maskConfInfoInReqBody,
} from "@/services/logger/loggerService";
import {
    createFilterForPrisma,
    createSelectForPrisma,
    createSortsForPrisma,
    FilterOptionsType,
} from "@/services/dataTransferService";
import { errorResponseHandler } from "@/services/errorHandle";
import { customizedPrisma } from "@/services/prismaClients";
import {
    DAILY_REPORT_ALL_INCLUDE,
    createDailyReport,
    findUniqueUserAbsoluteExist,
    updateDailyReport,
} from "@/services/prismaService";
import {
    basicHttpResponce,
    basicHttpResponceIncludeData,
} from "@/services/utilResponseService";
import type { Request, Response, NextFunction } from "express";
import { DAILY_REPORT_DEFAULT_DATA_INFO } from "@/consts/db/dailyReport";
import { CustomLogger } from "@/services/logger/loggerClass";
import { BasedQuery, QueryType } from "@/services/utilRequestService";
const logger = new CustomLogger();

/**
 * 今日の体調を作成
 * 紐づくテーブルの情報も全て受け取り、必要に応じて値の格納を行う。
 * bodyに入っていないテーブルも作成する
 * 体温
 * 体重
 * 腹痛
 * 体調
 * 関節痛の有無
 * 皮膚病変の有無
 * 眼病変の有無
 * 肛門病変の有無
 * 腹部腫瘤の有無
 * @param req
 * @param res
 * @param next
 */
export const registDailyReport = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // logのために関数名を取得
    const currentFuncName = registDailyReport.name;
    // TODO: バリデーション

    // bodyから情報を取得
    // これ、うまくできないかねぇ。
    const userId = Number(req.body.userId);
    const {
        date,
        // 体温
        temp,
        // 体重
        weight,
        // 腹痛
        stomachach,
        // 体調
        condition,
        // 関節痛の有無
        arthritis,
        // 皮膚病変の有無
        skinLesitions,
        // 眼病変の有無
        ocularLesitions,
        // 痔瘻の有無
        anirectalLesitions,
        // その他の肛門病変の有無
        anirectalOtherLesitions,
        // 腹部腫瘤の有無
        abdominal,
    } = req.body;

    try {
        // idからユーザーの存在確認
        const whereByUserId = { id: userId };
        await findUniqueUserAbsoluteExist(whereByUserId, customizedPrisma);

        // dateをDate型に変換
        let dateForDb;
        if (!date) {
            // dateが指定なしの場合、現在日時を入力
            dateForDb = new Date();
        } else {
            // dateが指定されていた場合、指定のdate
            dateForDb = new Date(date);
        }

        // dailyReport追加
        const dailyReport = await createDailyReport(userId, dateForDb, {
            temp,
            weight,
            stomachach,
            condition,
            arthritis,
            skinLesitions,
            ocularLesitions,
            anirectalLesitions,
            anirectalOtherLesitions,
            abdominal,
        });

        // レスポンスを返却
        const httpStatus = 200;
        const responseStatus = true;
        const responseMsg = RECORD_DAILY_REPORT.message;
        basicHttpResponceIncludeData(
            res,
            httpStatus,
            responseStatus,
            responseMsg,
            dailyReport
        );

        // ログを出力
        logResponse(userId, req, httpStatus, responseMsg, currentFuncName);
    } catch (e) {
        errorResponseHandler(e, userId, req, res, currentFuncName);
    }
};

/**
 * 今日の体調を取得
 * @param req
 * @param res
 * @param next
 */
export const readDailyReport = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // logのために関数名を取得
    const currentFuncName = readDailyReport.name;
    // TODO: バリデーション
    // クエリのデータを扱いやすくするための型を定義
    type DailyReportQuery = {
        id: QueryType;
        temp: QueryType;
        weight: QueryType;
        stomachach: QueryType;
        condition: QueryType;
        arthritis: QueryType;
        skinLesitions: QueryType;
        ocularLesitions: QueryType;
        anirectalLesitions: QueryType;
        anirectalOtherLesitions: QueryType;
        abdominal: QueryType;
        createdAt: QueryType;
        updatedAt: QueryType;
    };
    type Query = BasedQuery & DailyReportQuery;
    // フィルター以外の条件を取得
    const { sort, fields, limit, offset } = req.query as Query;
    // 指定されたソートの内容をprismaに渡せるように成型
    const sorts = createSortsForPrisma(sort);
    // 指定されたフィールドのみ取得するように設定
    const select = createSelectForPrisma(fields);

    // クエリで指定されたフィルターの内容を連想配列にまとめる
    const {
        id,
        temp,
        weight,
        stomachach,
        condition,
        arthritis,
        skinLesitions,
        ocularLesitions,
        anirectalLesitions,
        anirectalOtherLesitions,
        abdominal,
        createdAt,
        updatedAt,
    } = req.query as Query;
    const filterOptions = createDailyReportFilterOptions(
        id,
        temp,
        weight,
        stomachach,
        condition,
        arthritis,
        skinLesitions,
        ocularLesitions,
        anirectalLesitions,
        anirectalOtherLesitions,
        abdominal,
        createdAt,
        updatedAt
    );
    // 指定されたフィールドのみのオブジェクトを作成
    const filter = createFilterForPrisma(filterOptions);

    // bodyからuserIdを取得
    const userId = req.body.userId;
    // paramから年月日を取得
    const { year, month, day } = req.query;

    try {
        // bodyの年月日をDate型に変換
        let dateForDb;
        if (year && month && day) {
            dateForDb = new Date(`${year}-${month}-${day}`);
        }
        // 今日の体調を取得
        const includeFields = DAILY_REPORT_ALL_INCLUDE;
        delete includeFields.User;
        const dailyReports = await customizedPrisma.daily_Report.findMany({
            where: {
                userId,
                day: dateForDb,
                ...filter,
            },
            orderBy: sorts,
            skip: offset
                ? Number(offset)
                : DAILY_REPORT_DEFAULT_DATA_INFO.offset,
            take: limit ? Number(limit) : DAILY_REPORT_DEFAULT_DATA_INFO.limit,
            include: includeFields,
            select,
        });

        // NOTE: ひとまずもう一度全検索でallCountを取る。もっといい方法を考える。
        const allCount = await customizedPrisma.daily_Report.count({
            where: {
                userId,
            },
        });

        // レスポンス返却
        const httpStatus = 200;
        const responseStatus = true;
        const responseMsg = READ_DAILY_REPORT.message;
        const resData = {
            allCount: allCount,
            count: dailyReports.length,
            sort: sort ?? "",
            fields: fields ?? "",
            limit: limit ?? "",
            offset: offset ?? "",
            filter: {
                id: id ?? "",
                temp: temp ?? "",
                weight: weight ?? "",
                stomachach: stomachach ?? "",
                condition: condition ?? "",
                arthritis: arthritis ?? "",
                skinLesitions: skinLesitions ?? "",
                ocularLesitions: ocularLesitions ?? "",
                anirectalLesitions: anirectalLesitions ?? "",
                anirectalOtherLesitions: anirectalOtherLesitions ?? "",
                abdominal: abdominal ?? "",
                createdAt: createdAt ?? "",
                updatedAt: updatedAt ?? "",
            },
            dailyReports,
        };
        basicHttpResponceIncludeData(
            res,
            httpStatus,
            responseStatus,
            responseMsg,
            resData
        );

        // ログを出力
        const logBody: LoggingObjType = {
            userId: userId,
            ipAddress: req.ip,
            method: req.method,
            path: req.originalUrl,
            body: maskConfInfoInReqBody(req).body,
            status: String(httpStatus),
            responseMsg,
        };
        logger.log(PROCESS_SUCCESS.message(currentFuncName), logBody);
    } catch (e) {
        errorResponseHandler(e, userId, req, res, currentFuncName);
    }
};

/**
 * 今日の体調のフィルターオプションを作成
 * createFilterForPrismaの引数に使う
 * @param id
 * @param temp
 * @param weight
 * @param stomachach
 * @param condition
 * @param arthritis
 * @param skinLesitions
 * @param ocularLesitions
 * @param anirectalLesitions
 * @param anirectalOtherLesitions
 * @param abdominal
 * @param createdAt
 * @param updatedAt
 * @returns
 */
const createDailyReportFilterOptions = (
    id: QueryType,
    temp: QueryType,
    weight: QueryType,
    stomachach: QueryType,
    condition: QueryType,
    arthritis: QueryType,
    skinLesitions: QueryType,
    ocularLesitions: QueryType,
    anirectalLesitions: QueryType,
    anirectalOtherLesitions: QueryType,
    abdominal: QueryType,
    createdAt: QueryType,
    updatedAt: QueryType
): FilterOptionsType => {
    const filterOptions: FilterOptionsType = {
        id: {
            data: id,
            constructor: (i) => Number(i),
        },
        temp: {
            data: temp,
            constructor: (i) => Number(i),
        },
        weight: {
            data: weight,
            constructor: (i) => Number(i),
        },
        stomachach: {
            data: stomachach,
            constructor: (i) => Number(i),
        },
        condition: {
            data: condition,
            constructor: (i) => Number(i),
        },
        arthritis: {
            data: arthritis,
            constructor: (i) => Number(i),
        },
        skinLesitions: {
            data: skinLesitions,
            constructor: (i) => Number(i),
        },
        ocularLesitions: {
            data: ocularLesitions,
            constructor: (i) => Number(i),
        },
        anirectalLesitions: {
            data: anirectalLesitions,
            constructor: (i) => Number(i),
        },
        anirectalOtherLesitions: {
            data: anirectalOtherLesitions,
            constructor: (i) => Number(i),
        },
        abdominal: {
            data: abdominal,
            constructor: (i) => Number(i),
        },
        createdAt: {
            data: createdAt,
            constructor: (i) => new Date(i),
        },
        updatedAt: {
            data: updatedAt,
            constructor: (i) => new Date(i),
        },
    };

    return filterOptions;
};

/**
 * 今日の体調を編集
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const editDailyReport = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const id = Number(req.params.id);
    const userId = Number(req.body.userId);
    const {
        date,
        temp,
        weight,
        stomachach,
        condition,
        arthritis,
        skinLesitions,
        ocularLesitions,
        anirectalLesitions,
        anirectalOtherLesitions,
        abdominal,
    } = req.body;

    // logのために関数名を取得
    const currentFuncName = editDailyReport.name;

    // TODO: バリデーション
    try {
        // idから今日の体調を取得
        const whereByDailyReportId = { id };
        console.log(whereByDailyReportId);
        const dailyReport =
            await customizedPrisma.daily_Report.findUniqueOrThrow({
                where: whereByDailyReportId,
            });
        // 指定した今日の体調がユーザー本人のものか確認
        const isSelfUser = dailyReport.userId === userId;
        // ユーザー本人のものではない場合、403を返す
        if (!isSelfUser) {
            const httpStatus = 403;
            const responseStatus = false;
            const responseMsg = DAILY_REPORT_ACCESS_FORBIDDEN.message;
            basicHttpResponce(res, httpStatus, responseStatus, responseMsg);

            // ログを出力
            const logBody: LoggingObjType = {
                userId: userId,
                ipAddress: req.ip,
                method: req.method,
                path: req.originalUrl,
                body: maskConfInfoInReqBody(req).body,
                status: String(httpStatus),
                responseMsg,
            };
            logger.error(PROCESS_FAILURE.message(currentFuncName), logBody);

            return;
        }

        // 編集するdataを成型
        const recordData = {
            date,
            temp,
            weight,
            stomachach,
            condition,
            arthritis,
            skinLesitions,
            ocularLesitions,
            anirectalLesitions,
            anirectalOtherLesitions,
            abdominal,
        };
        // 編集
        const newDailyReport = await updateDailyReport(id, date, recordData);

        // レスポンスを返却
        const httpStatus = 200;
        const responseStatus = true;
        const responseMsg = EDIT_DAILY_REPORT.message;
        basicHttpResponceIncludeData(
            res,
            httpStatus,
            responseStatus,
            responseMsg,
            newDailyReport
        );

        // ログを出力
        const logBody: LoggingObjType = {
            userId,
            ipAddress: req.ip,
            method: req.method,
            path: req.originalUrl,
            body: maskConfInfoInReqBody(req).body,
            status: String(httpStatus),
            responseMsg,
        };
        logger.log(PROCESS_SUCCESS.message(currentFuncName), logBody);
    } catch (e) {
        errorResponseHandler(e, userId, req, res, currentFuncName);
    }
};

/**
 * 今日の体調を削除
 * jwtのuserIdと指定した今日の体調のuserIdが合致するときのみ削除可能
 * 今日の体調は、daily_reportのidをパラメータに挿入し指定する
 * @param req
 * @param res
 * @param next
 */
export const deleteDailyReport = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // daily_reportのid
    const id = Number(req.params.id);
    const { userId } = req.body;

    // logのために関数名を取得
    const currentFuncName = deleteDailyReport.name;

    // TODO: バリデーション

    try {
        // idから今日の体調を削除
        const whereByDailyReportId = { id };
        const dailyReport =
            await customizedPrisma.daily_Report.findUniqueOrThrow({
                where: whereByDailyReportId,
            });

        // 指定した今日の体調が本人のものか確認
        const isSelfUser = dailyReport.userId === userId;
        // ユーザー本人のものではない場合、403を返す
        if (!isSelfUser) {
            const httpStatus = 403;
            const responseStatus = false;
            const responseMsg = DAILY_REPORT_ACCESS_FORBIDDEN.message;
            basicHttpResponce(res, httpStatus, responseStatus, responseMsg);

            // ログを出力
            const logBody: LoggingObjType = {
                userId,
                ipAddress: req.ip,
                method: req.method,
                path: req.originalUrl,
                body: maskConfInfoInReqBody(req).body,
                status: String(httpStatus),
                responseMsg,
            };
            logger.error(PROCESS_FAILURE.message(currentFuncName), logBody);

            return;
        }

        // 今日の体調を削除
        const newDailyReport = await customizedPrisma.daily_Report.delete({
            where: whereByDailyReportId,
            include: {
                Daily_report_Temp: true,
                Daily_report_Weight: true,
                Daily_report_Stomachache: true,
                Daily_report_Condition: true,
                Daily_report_Arthritis: true,
                Daily_report_Skin_Lesions: true,
                Daily_report_Ocular_Lesitions: true,
                Daily_report_Anorectal_Lesitions: true,
                Daily_report_Abdominal: true,
            },
        });

        // レスポンスを返却
        const httpStatus = 200;
        const responseStatus = true;
        const responseMsg = DELETE_DAILY_REPORT.message;
        basicHttpResponceIncludeData(
            res,
            httpStatus,
            responseStatus,
            responseMsg,
            newDailyReport
        );

        // ログを出力
        const logBody: LoggingObjType = {
            userId,
            ipAddress: req.ip,
            method: req.method,
            path: req.originalUrl,
            body: maskConfInfoInReqBody(req).body,
            status: String(httpStatus),
            responseMsg,
        };
        logger.log(PROCESS_SUCCESS.message(currentFuncName), logBody);
    } catch (e) {
        errorResponseHandler(e, userId, req, res, currentFuncName);
    }
};

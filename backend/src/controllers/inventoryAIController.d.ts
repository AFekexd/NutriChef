import type { Request, Response } from "express";
export declare const uploadMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadInventoryImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const confirmDetectedItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getExpiringItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getItemsByLocation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getInventoryAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateConsumption: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    uploadMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    uploadInventoryImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    confirmDetectedItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getExpiringItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getItemsByLocation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getInventoryAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateConsumption: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=inventoryAIController.d.ts.map
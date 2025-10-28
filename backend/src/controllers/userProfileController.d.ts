import type { Request, Response } from "express";
export declare const getUserProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePreferences: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateHealthGoals: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getActivityFeed: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    getUserProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updatePreferences: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateHealthGoals: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUserStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getActivityFeed: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=userProfileController.d.ts.map
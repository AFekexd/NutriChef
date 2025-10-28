import type { Request, Response } from "express";
export declare const getInventoryItems: (req: Request, res: Response) => Promise<void>;
export declare const getMyInventoryItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getInventoryItemById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createInventoryItem: (req: Request, res: Response) => Promise<void>;
export declare const updateInventoryItem: (req: Request, res: Response) => Promise<void>;
export declare const deleteInventoryItem: (req: Request, res: Response) => Promise<void>;
export declare const getExpiringItems: (req: Request, res: Response) => Promise<void>;
export declare const getMyExpiringItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getInventoryAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getItemsByLocation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addManualInventoryItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=inventoryController.d.ts.map
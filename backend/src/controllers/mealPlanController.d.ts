import type { Request, Response } from "express";
export declare const getMealPlans: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMealPlanById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createMealPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMealPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMealPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addRecipeToMealPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeRecipeFromMealPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getWeeklySummary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addInventoryItemToMealPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeInventoryItemFromMealPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=mealPlanController.d.ts.map
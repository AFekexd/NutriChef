import type { Request, Response } from "express";
export declare const getRecipes: (req: Request, res: Response) => Promise<void>;
export declare const getRecipeById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createRecipe: (req: Request, res: Response) => Promise<void>;
export declare const updateRecipe: (req: Request, res: Response) => Promise<void>;
export declare const deleteRecipe: (req: Request, res: Response) => Promise<void>;
export declare const getRecipesByUser: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=recipeController.d.ts.map
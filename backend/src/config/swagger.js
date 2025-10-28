import swaggerJsdoc from "swagger-jsdoc";
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "NutriChef API",
            version: "1.0.0",
            description: "API documentation for NutriChef - A smart nutrition and meal planning application",
            contact: {
                name: "NutriChef Team",
                email: "support@nutrichef.com",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT token in the format: Bearer <token>",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    required: ["name", "email", "password"],
                    properties: {
                        userId: {
                            type: "string",
                            format: "uuid",
                            description: "Unique user identifier",
                        },
                        name: {
                            type: "string",
                            description: "User full name",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            description: "User password (only for creation)",
                        },
                        preferences: {
                            type: "object",
                            description: "User dietary preferences and settings",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Recipe: {
                    type: "object",
                    required: ["title", "instructions", "calories", "macros"],
                    properties: {
                        recipeId: {
                            type: "string",
                            format: "uuid",
                        },
                        userId: {
                            type: "string",
                            format: "uuid",
                            description: "User who created the recipe",
                        },
                        title: {
                            type: "string",
                            description: "Recipe title",
                        },
                        instructions: {
                            type: "string",
                            description: "Cooking instructions",
                        },
                        imageURL: {
                            type: "string",
                            format: "uri",
                            description: "Recipe image URL",
                        },
                        calories: {
                            type: "number",
                            description: "Total calories",
                        },
                        macros: {
                            type: "object",
                            description: "Macronutrient information",
                            properties: {
                                protein: { type: "number" },
                                carbs: { type: "number" },
                                fat: { type: "number" },
                            },
                        },
                        ingredients: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    ingredientId: { type: "string", format: "uuid" },
                                    quantity: { type: "number" },
                                    unit: { type: "string" },
                                },
                            },
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Ingredient: {
                    type: "object",
                    required: ["name", "category", "nutritionalInfo", "carbonFootprint"],
                    properties: {
                        ingredientId: {
                            type: "string",
                            format: "uuid",
                        },
                        name: {
                            type: "string",
                            description: "Ingredient name",
                        },
                        category: {
                            type: "string",
                            description: "Category (e.g., vegetables, fruits, dairy)",
                        },
                        nutritionalInfo: {
                            type: "object",
                            description: "Nutritional information per serving",
                            properties: {
                                calories: { type: "number" },
                                protein: { type: "number" },
                                carbs: { type: "number" },
                                fat: { type: "number" },
                            },
                        },
                        carbonFootprint: {
                            type: "number",
                            description: "Carbon footprint rating",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                InventoryItem: {
                    type: "object",
                    required: [
                        "userId",
                        "ingredientId",
                        "quantity",
                        "unit",
                        "expiryDate",
                    ],
                    properties: {
                        inventoryItemId: {
                            type: "string",
                            format: "uuid",
                        },
                        userId: {
                            type: "string",
                            format: "uuid",
                        },
                        ingredientId: {
                            type: "string",
                            format: "uuid",
                        },
                        quantity: {
                            type: "number",
                            description: "Amount in inventory",
                        },
                        unit: {
                            type: "string",
                            description: "Unit of measurement (kg, pieces, etc.)",
                        },
                        expiryDate: {
                            type: "string",
                            format: "date",
                            description: "Expiration date",
                        },
                        consumptionRate: {
                            type: "number",
                            description: "Daily consumption rate",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            description: "Error message",
                        },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.ts"], // Path to the API routes
};
export const swaggerSpec = swaggerJsdoc(options);
//# sourceMappingURL=swagger.js.map
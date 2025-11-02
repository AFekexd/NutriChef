import { PrismaClient } from "../generated/prisma/index.js";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.moodLog.deleteMany();
  await prisma.userHealthData.deleteMany();
  await prisma.consumptionLog.deleteMany();
  await prisma.mealPlanRecipe.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.groceryListItem.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data");

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      passwordHash: hashedPassword,
      preferences: {
        dietaryRestrictions: ["vegetarian"],
        allergies: ["nuts"],
        calorieTarget: 2000,
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      passwordHash: hashedPassword,
      preferences: {
        dietaryRestrictions: ["vegan"],
        allergies: [],
        calorieTarget: 1800,
      },
    },
  });

  console.log("Created users:", { user1: user1.userId, user2: user2.userId });

  // Create ingredients
  const ingredientData = [
    {
      name: "Tomato",
      category: "Vegetables",
      nutritionalInfo: {
        calories: 18,
        protein: 0.9,
        carbs: 3.9,
        fat: 0.2,
        fiber: 1.2,
      },
      carbonFootprint: 0.5,
    },
    {
      name: "Chicken Breast",
      category: "Meat",
      nutritionalInfo: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
      },
      carbonFootprint: 6.9,
    },
    {
      name: "Broccoli",
      category: "Vegetables",
      nutritionalInfo: {
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        fiber: 2.4,
      },
      carbonFootprint: 0.4,
    },
    {
      name: "Rice",
      category: "Grains",
      nutritionalInfo: {
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        fiber: 0.4,
      },
      carbonFootprint: 1.2,
    },
    {
      name: "Olive Oil",
      category: "Oils",
      nutritionalInfo: {
        calories: 884,
        protein: 0,
        carbs: 0,
        fat: 100,
        fiber: 0,
      },
      carbonFootprint: 0.6,
    },
    {
      name: "Salmon",
      category: "Fish",
      nutritionalInfo: {
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 13,
        fiber: 0,
      },
      carbonFootprint: 5.2,
    },
    {
      name: "Spinach",
      category: "Vegetables",
      nutritionalInfo: {
        calories: 23,
        protein: 2.7,
        carbs: 3.6,
        fat: 0.4,
        fiber: 2.2,
      },
      carbonFootprint: 0.3,
    },
    {
      name: "Garlic",
      category: "Vegetables",
      nutritionalInfo: {
        calories: 149,
        protein: 6.4,
        carbs: 33,
        fat: 0.5,
        fiber: 2.1,
      },
      carbonFootprint: 0.2,
    },
  ];

  const ingredients = await Promise.all(
    ingredientData.map((data) => prisma.ingredient.create({ data }))
  );

  console.log("Created", ingredients.length, "ingredients");

  // Create recipes
  const recipe1 = await prisma.recipe.create({
    data: {
      title: "Grilled Chicken with Broccoli",
      instructions:
        "1. Season chicken breast with salt and pepper\n2. Grill for 6-7 minutes per side\n3. Steam broccoli for 5 minutes\n4. Drizzle with olive oil and serve",
      calories: 350,
      macros: {
        protein: 45,
        carbs: 15,
        fat: 12,
      },
      recipeIngredients: {
        create: [
          {
            ingredientId: ingredients[1]!.ingredientId, // Chicken
            quantity: 200,
            unit: "g",
          },
          {
            ingredientId: ingredients[2]!.ingredientId, // Broccoli
            quantity: 150,
            unit: "g",
          },
          {
            ingredientId: ingredients[4]!.ingredientId, // Olive Oil
            quantity: 1,
            unit: "tbsp",
          },
        ],
      },
    },
  });

  const recipe2 = await prisma.recipe.create({
    data: {
      title: "Salmon and Spinach Pasta",
      instructions:
        "1. Cook pasta according to package directions\n2. Pan-sear salmon for 4 minutes per side\n3. Sauté spinach and garlic\n4. Combine all ingredients with olive oil",
      calories: 520,
      macros: {
        protein: 38,
        carbs: 50,
        fat: 15,
      },
      recipeIngredients: {
        create: [
          {
            ingredientId: ingredients[5]!.ingredientId, // Salmon
            quantity: 180,
            unit: "g",
          },
          {
            ingredientId: ingredients[6]!.ingredientId, // Spinach
            quantity: 100,
            unit: "g",
          },
          {
            ingredientId: ingredients[7]!.ingredientId, // Garlic
            quantity: 2,
            unit: "cloves",
          },
          {
            ingredientId: ingredients[4]!.ingredientId, // Olive Oil
            quantity: 2,
            unit: "tbsp",
          },
        ],
      },
    },
  });

  const recipe3 = await prisma.recipe.create({
    data: {
      title: "Tomato and Rice Bowl",
      instructions:
        "1. Cook rice in boiling water for 15 minutes\n2. Chop tomatoes and mix with olive oil\n3. Season with garlic and herbs\n4. Mix with rice and serve",
      calories: 280,
      macros: {
        protein: 6,
        carbs: 55,
        fat: 4,
      },
      recipeIngredients: {
        create: [
          {
            ingredientId: ingredients[0]!.ingredientId, // Tomato
            quantity: 200,
            unit: "g",
          },
          {
            ingredientId: ingredients[3]!.ingredientId, // Rice
            quantity: 150,
            unit: "g",
          },
          {
            ingredientId: ingredients[7]!.ingredientId, // Garlic
            quantity: 1,
            unit: "clove",
          },
          {
            ingredientId: ingredients[4]!.ingredientId, // Olive Oil
            quantity: 1,
            unit: "tbsp",
          },
        ],
      },
    },
  });

  console.log("Created 3 recipes");

  // Create inventory items for user1
  const inventory1 = await prisma.inventoryItem.create({
    data: {
      userId: user1.userId,
      ingredientId: ingredients[1]!.ingredientId, // Chicken
      quantity: 500,
      unit: "g",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      consumptionRate: 200,
    },
  });

  const inventory2 = await prisma.inventoryItem.create({
    data: {
      userId: user1.userId,
      ingredientId: ingredients[2]!.ingredientId, // Broccoli
      quantity: 300,
      unit: "g",
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      consumptionRate: 150,
    },
  });

  const inventory3 = await prisma.inventoryItem.create({
    data: {
      userId: user2.userId,
      ingredientId: ingredients[5]!.ingredientId, // Salmon
      quantity: 400,
      unit: "g",
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      consumptionRate: 180,
    },
  });

  console.log("Created inventory items");

  // Create grocery list items
  await prisma.groceryListItem.create({
    data: {
      userId: user1.userId,
      ingredientId: ingredients[6]!.ingredientId, // Spinach
      plannedQuantity: 200,
      recommendedQuantity: 250,
      lastPurchasedPrice: 3.99,
    },
  });

  await prisma.groceryListItem.create({
    data: {
      userId: user2.userId,
      ingredientId: ingredients[0]!.ingredientId, // Tomato
      plannedQuantity: 500,
      recommendedQuantity: 600,
      lastPurchasedPrice: 2.5,
    },
  });

  console.log("Created grocery list items");

  // Create meal plans
  const mealPlan1 = await prisma.mealPlan.create({
    data: {
      userId: user1.userId,
      date: new Date(2025, 9, 20), // October 20, 2025
      mealType: "lunch",
      mealPlanRecipes: {
        create: [
          {
            recipeId: recipe1.recipeId,
          },
        ],
      },
    },
  });

  const mealPlan2 = await prisma.mealPlan.create({
    data: {
      userId: user2.userId,
      date: new Date(2025, 9, 20),
      mealType: "dinner",
      mealPlanRecipes: {
        create: [
          {
            recipeId: recipe2.recipeId,
          },
        ],
      },
    },
  });

  console.log("Created meal plans");

  // Create consumption logs
  await prisma.consumptionLog.create({
    data: {
      userId: user1.userId,
      inventoryItemId: inventory1.inventoryItemId,
      quantityConsumed: 200,
      dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    },
  });

  await prisma.consumptionLog.create({
    data: {
      userId: user2.userId,
      inventoryItemId: inventory3.inventoryItemId,
      quantityConsumed: 180,
      dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  console.log("Created consumption logs");

  // Create user health data
  await prisma.userHealthData.create({
    data: {
      userId: user1.userId,
      date: new Date(),
      caloriesBurned: 2500,
      activityType: "running",
      heartRate: 140,
      sleepHours: 7.5,
    },
  });

  await prisma.userHealthData.create({
    data: {
      userId: user2.userId,
      date: new Date(),
      caloriesBurned: 2200,
      activityType: "yoga",
      heartRate: 120,
      sleepHours: 8,
    },
  });

  console.log("Created user health data");

  // Create mood logs
  await prisma.moodLog.create({
    data: {
      userId: user1.userId,
      dateTime: new Date(),
      moodDescription: "Feeling energetic and motivated after workout",
    },
  });

  await prisma.moodLog.create({
    data: {
      userId: user2.userId,
      dateTime: new Date(),
      moodDescription: "Feeling calm and relaxed",
    },
  });

  console.log("Created mood logs");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

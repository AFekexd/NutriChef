/**
 * This script updates all recipes that have a null userId
 * It will assign them to the first user in the database
 * Run this with: node fix-recipes-userid.js
 */

import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

async function fixRecipesUserId() {
  try {
    console.log("🔍 Checking for recipes without userId...");

    // Find recipes without userId
    const recipesWithoutUser = await prisma.recipe.findMany({
      where: {
        userId: null,
      },
      select: {
        recipeId: true,
        title: true,
      },
    });

    if (recipesWithoutUser.length === 0) {
      console.log("✅ All recipes have a userId assigned!");
      return;
    }

    console.log(
      `⚠️  Found ${recipesWithoutUser.length} recipes without userId:`
    );
    recipesWithoutUser.forEach((recipe) => {
      console.log(`   - ${recipe.title} (${recipe.recipeId})`);
    });

    // Get the first user to assign these recipes to
    const firstUser = await prisma.user.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!firstUser) {
      console.error("❌ No users found in the database!");
      console.log(
        "   Please create a user account first before running this script."
      );
      return;
    }

    console.log(
      `\n🔧 Assigning recipes to user: ${firstUser.name} (${firstUser.email})...`
    );

    // Update all recipes without userId
    const result = await prisma.recipe.updateMany({
      where: {
        userId: null,
      },
      data: {
        userId: firstUser.userId,
      },
    });

    console.log(`✅ Successfully updated ${result.count} recipes!`);
    console.log("\n✨ All recipes now have a userId assigned.");
  } catch (error) {
    console.error("❌ Error updating recipes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRecipesUserId();

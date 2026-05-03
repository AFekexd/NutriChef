import app from "./app.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Cleanup expired cache entries every hour
const cleanupExpiredCache = async () => {
  try {
    // Clean health insights cache
    const healthResult = await prisma.healthInsightsCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Clean recipe recommendations cache
    const recipeResult = await prisma.recipeRecommendationsCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const totalCleaned = healthResult.count + recipeResult.count;
    if (totalCleaned > 0) {
      console.log(
        `🧹 Cleaned up ${totalCleaned} expired cache entries (${healthResult.count} health insights, ${recipeResult.count} recipe recommendations)`
      );
    }
  } catch (error) {
    console.error("Error cleaning up cache:", error);
  }
};

// Run cleanup on startup
cleanupExpiredCache();

// Run cleanup every hour
setInterval(cleanupExpiredCache, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(
    `📚 Swagger Documentation available at http://localhost:${PORT}/api-docs`
  );
});

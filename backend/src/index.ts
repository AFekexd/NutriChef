import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import ingredientRoutes from "./routes/ingredientRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import inventoryAIRoutes from "./routes/inventoryAIRoutes.js";
import recipeRecommendationRoutes from "./routes/recipeRecommendationRoutes.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet()); // Set security headers
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
); // Enable CORS

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.includes("api-docs")) return next();
  if (req.path.includes("login") || req.path.includes("signup")) {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${
        req.path
      } - Sensitive endpoint accessed`
    );
    return next();
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== "GET" ? req.body : undefined,
    headers: {
      authorization: req.headers.authorization
        ? "Bearer token present"
        : "No token",
      "content-type": req.headers["content-type"],
    },
  });
  next();
});

// Serve uploaded images
app.use("/uploads", express.static(process.env.UPLOAD_DIR || "./uploads"));

// Rate limiting
app.use("/api", apiLimiter);

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "NutriChef API Documentation",
  })
);

// Swagger JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/inventory", inventoryAIRoutes); // Vision AI endpoints (MUST be first - specific routes)
app.use("/api/inventory", inventoryRoutes); // Regular inventory (catch-all /:id route)
app.use("/api/recipe-recommendations", recipeRecommendationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(
    `📚 Swagger Documentation available at http://localhost:${PORT}/api-docs`
  );
});

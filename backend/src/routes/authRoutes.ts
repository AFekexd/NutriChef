import { Router } from "express";
import {
  register,
  registerValidation,
  login,
  loginValidation,
  logout,
  refreshToken,
  getProfile,
  getSessions,
  revokeSession,
  getLoginHistory,
  updateProfile,
  changePassword,
  requestPasswordReset,
  requestPasswordResetValidation,
  resetPassword,
  resetPasswordValidation,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import passport from "../config/passport.js";
import {
  handleOAuthSuccess,
  handleOAuthFailure,
} from "../controllers/oauthController.js";
import {
  uploadAvatar,
  deleteAvatar,
  avatarUpload,
  getAIApiKeyConfig,
  saveAIApiKey,
  deleteAIApiKey,
} from "../controllers/userProfileController.js";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123
 *                 description: Must contain uppercase, lowercase, and number
 *               preferences:
 *                 type: object
 *                 example: { "dietary": "vegetarian" }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post("/register", registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: Authenticate user and receive JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account locked or deactivated
 *       500:
 *         description: Server error
 */
router.post("/login", loginValidation, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Get a new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received during login
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Invalidate current session and refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/logout", authenticate, logout);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     description: Retrieve authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile", authenticate, getProfile);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get active sessions
 *     tags: [Authentication]
 *     description: List all active sessions for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/sessions", authenticate, getSessions);

/**
 * @swagger
 * /api/auth/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a session
 *     tags: [Authentication]
 *     description: Invalidate a specific session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.delete("/sessions/:sessionId", authenticate, revokeSession);

/**
 * @swagger
 * /api/auth/login-history:
 *   get:
 *     summary: Get login history
 *     tags: [Authentication]
 *     description: Retrieve login history for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Login history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       loginHistoryId:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       failureReason:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/login-history", authenticate, getLoginHistory);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     description: Update authenticated user's name and/or email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Server error
 */
router.put("/profile", authenticate, updateProfile);

/**
 * @swagger
 * /api/auth/avatar:
 *   post:
 *     summary: Upload avatar
 *     tags: [Authentication]
 *     description: Upload a profile picture for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP) max 5MB
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 avatarUrl:
 *                   type: string
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/avatar", authenticate, avatarUpload, uploadAvatar);

/**
 * @swagger
 * /api/auth/avatar:
 *   delete:
 *     summary: Delete avatar
 *     tags: [Authentication]
 *     description: Remove the profile picture for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       400:
 *         description: Cannot delete OAuth avatar
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.delete("/avatar", authenticate, deleteAvatar);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Authentication]
 *     description: Change the authenticated user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Current password is incorrect or not authenticated
 *       500:
 *         description: Server error
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     description: Send password reset email to user's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns success for security)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post(
  "/forgot-password",
  requestPasswordResetValidation,
  requestPasswordReset
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     description: Reset user password using the token received via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, and number
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid token or password
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPasswordValidation, resetPassword);

/**
 * @swagger
 * /api/auth/ai-api-key:
 *   get:
 *     summary: Get AI API key configuration
 *     tags: [Authentication]
 *     description: Get the user's AI API key configuration (without exposing the actual key)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI API key configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasApiKey:
 *                   type: boolean
 *                 provider:
 *                   type: string
 *                   enum: [openai, gemini]
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/ai-api-key", authenticate, getAIApiKeyConfig);

/**
 * @swagger
 * /api/auth/ai-api-key:
 *   post:
 *     summary: Save AI API key
 *     tags: [Authentication]
 *     description: Save or update the user's AI API key for using their own AI service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *               - provider
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: The AI API key
 *               provider:
 *                 type: string
 *                 enum: [openai, gemini]
 *                 description: The AI provider
 *     responses:
 *       200:
 *         description: AI API key saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 provider:
 *                   type: string
 *                 hasApiKey:
 *                   type: boolean
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/ai-api-key", authenticate, saveAIApiKey);

/**
 * @swagger
 * /api/auth/ai-api-key:
 *   delete:
 *     summary: Delete AI API key
 *     tags: [Authentication]
 *     description: Remove the user's AI API key and revert to using the website's API
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI API key deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 hasApiKey:
 *                   type: boolean
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.delete("/ai-api-key", authenticate, deleteAIApiKey);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirect to Google for authentication
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Handle Google OAuth callback and create session
 *     responses:
 *       302:
 *         description: Redirect to frontend with authentication tokens
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/oauth/failure",
    session: false,
  }),
  handleOAuthSuccess
);

/**
 * @swagger
 * /api/auth/discord:
 *   get:
 *     summary: Initiate Discord OAuth login
 *     tags: [Authentication]
 *     description: Redirect to Discord for authentication
 *     responses:
 *       302:
 *         description: Redirect to Discord OAuth
 */
router.get(
  "/discord",
  passport.authenticate("discord", { scope: ["identify", "email"] })
);

/**
 * @swagger
 * /api/auth/discord/callback:
 *   get:
 *     summary: Discord OAuth callback
 *     tags: [Authentication]
 *     description: Handle Discord OAuth callback and create session
 *     responses:
 *       302:
 *         description: Redirect to frontend with authentication tokens
 */
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/api/auth/oauth/failure",
    session: false,
  }),
  handleOAuthSuccess
);

/**
 * @swagger
 * /api/auth/oauth/failure:
 *   get:
 *     summary: OAuth failure handler
 *     tags: [Authentication]
 *     description: Handle OAuth authentication failures
 *     responses:
 *       302:
 *         description: Redirect to frontend login with error
 */
router.get("/oauth/failure", handleOAuthFailure);

export default router;

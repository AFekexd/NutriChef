/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    if (req.user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
    }
    next();
};
//# sourceMappingURL=adminAuth.js.map
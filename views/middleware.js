import mysql from 'mysql2'; // Use import for mysql2
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate'; // Import withAccelerate
import { promisify } from 'util'; // Import promisify

// Initialize Prisma client with acceleration support
const prisma = new PrismaClient();

// Create MySQL pool connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '8123412145',
    database: 'portfolioDB1',
});

// Promisify the query method to use async/await
const query = promisify(db.query).bind(db);

// Middleware to save the redirect URL (if any) in the response locals
export const saveUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// Middleware to ensure the user is logged in
export const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in!");
        return res.redirect("/login");
    }
    next();
};

// Middleware to check if the user owns the portfolio
export const isOwner = async (req, res, next) => {
    const { id } = req.params;

    try {
        // Query the portfolio by ID using Prisma
        const portfolio = await prisma.portfolio.findUnique({
            where: { id },  // Find portfolio by ID
        });

        // Check if the portfolio exists
        if (!portfolio) {
            req.flash("error", "Portfolio not found.");
            return res.redirect('/portfolio');
        }

        // Check if the user is logged in and owns the portfolio
        if (!res.locals.CurrUser || res.locals.CurrUser.id !== portfolio.userId) {
            req.flash("error", "You don't have access to this Portfolio");
            return res.redirect(`/portfolio/${id}`);
        }

        next();  // Allow the request to proceed

    } catch (err) {
        console.error("Error fetching portfolio:", err);
        req.flash("error", "An error occurred. Please try again.");
        res.redirect('/portfolio');
    }
};

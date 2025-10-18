import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { userId: id },
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Create a new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, preferences } = req.body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        preferences,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, preferences } = req.body;

    const user = await prisma.user.update({
      where: { userId: id },
      data: {
        name,
        email,
        preferences,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { userId: id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

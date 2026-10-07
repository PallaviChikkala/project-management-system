const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const generateToken = (userId, email) => {
  const secret = process.env.JWT_SECRET || "supersecret_project_management_jwt_key_2026_dev_pms";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ userId, email }, secret, { expiresIn });
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user.id, user.email);

    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  // In stateless JWT auth, token revocation is handled client-side by deleting stored tokens.
  // This endpoint provides explicit confirmation.
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};

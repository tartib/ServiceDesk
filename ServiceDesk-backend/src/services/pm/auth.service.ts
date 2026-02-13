import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import Organization from '../../models/pm/Organization';
import { OrganizationRole, MethodologyCode } from '../../types/pm';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  organizationId?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  }

  async register(input: RegisterInput): Promise<{ user: any; tokens: AuthTokens; organization?: any }> {
    const { email, password, firstName, lastName, organizationName } = input;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      profile: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
      },
      organizations: [],
    });

    let organization;
    if (organizationName) {
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      organization = new Organization({
        name: organizationName,
        slug,
        createdBy: user._id,
        settings: {
          defaultMethodology: MethodologyCode.SCRUM,
        },
      });

      await organization.save();

      user.organizations.push({
        organizationId: organization._id,
        role: OrganizationRole.OWNER,
        joinedAt: new Date(),
      });
    }

    await user.save();

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      organizationId: organization?._id.toString(),
    });

    (user as any).refreshToken = tokens.refreshToken;
    await user.save();

    return { user, tokens, organization };
  }

  async login(input: LoginInput): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, password } = input;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is not active');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const defaultOrg = user.organizations[0];
    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      organizationId: defaultOrg?.organizationId.toString(),
    });

    (user as any).refreshToken = tokens.refreshToken;
    (user as any).lastLoginAt = new Date();
    await user.save();

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as TokenPayload;

      const user = await User.findById(decoded.userId).select('+refreshToken');
      if (!user || (user as any).refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const tokens = this.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        organizationId: decoded.organizationId,
      });

      (user as any).refreshToken = tokens.refreshToken;
      await user.save();

      return tokens;
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    (user as any).refreshToken = undefined;
    await user.save();
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    // Include 'id' for compatibility with v1 auth middleware (verifyToken expects 'id')
    const tokenData = { ...payload, id: payload.userId };
    const accessToken = jwt.sign(tokenData, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn as string,
    } as jwt.SignOptions);

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }
}

export default new AuthService();

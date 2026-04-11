import bcrypt from 'bcryptjs';
import User from '../../../models/User';
import Organization from '../models/Organization';
import { OrganizationRole, MethodologyCode } from '../../../types/pm';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../../utils/jwt';

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

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Hash refresh token before persisting — never store raw tokens
function hashToken(token: string): string {
  return bcrypt.hashSync(token, 6);
}

class AuthService {
  async register(input: RegisterInput): Promise<{ user: any; tokens: AuthTokens; organization?: any }> {
    const { email, password, firstName, lastName, organizationName } = input;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
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

    const tokens = this.buildTokens(user, organization?._id.toString());

    // Persist hashed refresh token
    user.refreshTokenHash = hashToken(tokens.refreshToken);
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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const defaultOrg = user.organizations[0];
    const tokens = this.buildTokens(user, defaultOrg?.organizationId.toString());

    // Persist hashed refresh token
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    await user.save();

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) {
      throw new Error('Invalid refresh token');
    }

    // Validate stored hash matches the presented token
    const valid = bcrypt.compareSync(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new Error('Invalid refresh token');
    }

    const tokens = this.buildTokens(user, decoded.organizationId);

    // Rotate: persist new hashed refresh token
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    await user.save();

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    // Invalidate refresh token — user must re-login
    user.refreshTokenHash = undefined;
    await user.save();
  }

  private buildTokens(user: any, organizationId?: string): AuthTokens {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role || 'prep',
      organizationId,
    };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
      expiresIn: 7 * 24 * 60 * 60,
    };
  }
}

export default new AuthService();

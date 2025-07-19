const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecret();
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    
    // Warn if using default secrets in production
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_ACCESS_SECRET) {
      console.warn('WARNING: Using default JWT secrets in production. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables.');
    }
  }

  /**
   * Generate a secure random secret
   * @returns {string} Base64 encoded secret
   */
  generateSecret() {
    return crypto.randomBytes(64).toString('base64');
  }

  /**
   * Generate access token with user data and tenant info
   * @param {Object} user - User object
   * @returns {string} JWT access token
   */
  generateAccessToken(user) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      customerId: user.customerId, // Critical for tenant isolation
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      type: 'access'
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'flowbit-platform',
      subject: user._id.toString()
    });
  }

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user._id.toString(),
      customerId: user.customerId,
      type: 'refresh'
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'flowbit-platform',
      subject: user._id.toString()
    });
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @returns {Object} { accessToken, refreshToken, expiresIn }
   */
  generateTokenPair(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresIn: this.accessTokenExpiry,
      tokenType: 'Bearer'
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret);
      
      // Ensure it's an access token
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      } else {
        throw error;
      }
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded payload
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret);
      
      // Ensure it's a refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      } else {
        throw error;
      }
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null if not found
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Get token expiry time
   * @param {string} token - JWT token
   * @returns {Date} Expiry date
   */
  getTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Check if token is expired (without verification)
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true; // Consider invalid tokens as expired
    }
  }
}

// Export singleton instance
module.exports = new JWTService();

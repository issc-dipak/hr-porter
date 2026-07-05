import jwt from 'jsonwebtoken';
import connectToDatabase from '@/app/api/lib/mongodb';
import { UserRole } from '@/app/api/models/UserRole';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start safely.');
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  companyName: string;
  companyCode: string;
  companyId: string;
  fullName?: string;
  branchId?: string;
}

export async function getDynamicRole(decoded: DecodedToken): Promise<string> {
  try {
    await connectToDatabase();
    const userRoleObj = await UserRole.findOne({ 
      companyId: decoded.companyId || 'company_001', 
      userId: decoded.userId 
    }).populate('roleId').lean();

    if (userRoleObj && (userRoleObj as any).roleId) {
      return (userRoleObj as any).roleId.name;
    }
  } catch (error) {
    console.error('Failed to fetch dynamic role:', error);
  }
  return decoded.role;
}


export function verifyAuth(req: Request): DecodedToken | null {
  try {
    let token = '';
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const url = new URL(req.url);
      const queryToken = url.searchParams.get('token');
      if (queryToken) {
        token = queryToken;
      }
    }

    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Provide backwards compatibility for existing tokens
    if (decoded) {
      if (!decoded.companyName) {
        decoded.companyName = 'HR Core Labs';
      }
      if (!decoded.companyCode) {
        decoded.companyCode = 'hrcore';
      }
      if (!decoded.companyId) {
        decoded.companyId = decoded.companyCode;
      }
      if (!decoded.fullName) {
        decoded.fullName = decoded.email.split('@')[0];
      }
    }
    
    return decoded as DecodedToken;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null;
  }
}

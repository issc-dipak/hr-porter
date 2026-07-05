import { User, IUser } from '@/app/api/models/User';

export class UserRepository {
  static async findByEmailAndCompanyCode(email: string, companyCode: string): Promise<IUser | null> {
    return User.findOne({ 
      email: email.toLowerCase().trim(), 
      companyCode: companyCode.toLowerCase().trim() 
    }).select('+password');
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  static async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  static async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  static async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async findByOTP(otp: string): Promise<IUser | null> {
    return User.findOne({
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: { $gt: new Date() }
    });
  }
}

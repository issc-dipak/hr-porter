import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { UserSettings } from '@/app/api/models/UserSettings';
import { User } from '@/app/api/models/User';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';
import { Performance } from '@/app/api/models/Performance';

// GET UserSettings for the authenticated employee/user
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let settings = await UserSettings.findOne({
      $or: [
        { userId: decoded.userId },
        { email: decoded.email }
      ]
    });
    if (!settings) {
      settings = await UserSettings.create({
        userId: decoded.userId,
        email: decoded.email,
      });
    } else if (settings.userId && settings.userId.toString() !== decoded.userId.toString()) {
      settings.userId = decoded.userId as any;
      await settings.save();
    }

    // Also fetch core profile details from User and Employee
    const user = await User.findById(decoded.userId);
    const employee = await Employee.findOne({ email: decoded.email }).lean();

    let reportingManagerDetails: any = null;
    if (employee && employee.reportingManagerId) {
      const manager = await Employee.findById(employee.reportingManagerId)
        .select('fullName email designation department phone')
        .lean();
      if (manager) {
        reportingManagerDetails = {
          name: manager.fullName,
          email: manager.email,
          designation: manager.designation,
          department: manager.department,
          phone: manager.phone || ''
        };
      }
    }

    const performances = await Performance.find({
      name: user?.fullName || employee?.fullName || ''
    }).lean();

    return NextResponse.json({
      settings,
      profile: {
        fullName: user?.fullName || employee?.fullName || '',
        email: decoded.email,
        phone: user?.phoneNumber || employee?.phone || '',
        department: user?.department || employee?.department || '',
        designation: employee?.designation || '',
        location: employee?.location || '',
        profilePicture: user?.profilePicture || employee?.profilePicture || '',
        emergencyContact: employee?.emergencyContact || '',
        dateOfBirth: employee?.dateOfBirth || '',
        gender: employee?.gender || '',
        bloodGroup: employee?.bloodGroup || '',
        address: employee?.address || '',
        city: (employee as any)?.city || (employee as any)?.personalInfo?.city || '',
        state: (employee as any)?.state || (employee as any)?.personalInfo?.state || '',
        country: (employee as any)?.country || (employee as any)?.personalInfo?.country || '',
        pinCode: (employee as any)?.pinCode || (employee as any)?.personalInfo?.pinCode || '',
        panNumber: employee?.panNumber || '',
        uanNumber: employee?.uanNumber || '',
        joinedDate: employee?.joinedDate || null,
        salaryStructure: employee?.salaryStructure || null,
        documents: employee?.documents || [],
        performances: performances || [],
        reportingManager: reportingManagerDetails,
        bankDetails: {
          bankName: user?.bankDetails?.bankName || employee?.bankName || '',
          accountNumber: user?.bankDetails?.accountNumber || employee?.accountNumber || '',
          ifscCode: user?.bankDetails?.ifscCode || employee?.ifscCode || '',
          accountHolderName: user?.bankDetails?.accountHolderName || employee?.fullName || '',
        }
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get user settings:', error);
    return NextResponse.json({ error: 'Failed to fetch personal settings', details: error.message }, { status: 500 });
  }
}

// POST/PUT updates to UserSettings and profile details
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json() as any;

    await connectToDatabase();

    let settings = await UserSettings.findOne({
      $or: [
        { userId: decoded.userId },
        { email: decoded.email }
      ]
    });
    if (!settings) {
      settings = new UserSettings({
        userId: decoded.userId,
        email: decoded.email,
      });
    } else if (settings.userId && settings.userId.toString() !== decoded.userId.toString()) {
      settings.userId = decoded.userId as any;
    }

    // Update settings configurations if provided
    if (data.bio !== undefined) settings.bio = data.bio;
    if (data.skills !== undefined) settings.skills = data.skills;
    if (data.privacy !== undefined) {
      settings.privacy = { ...((settings.privacy as any) || {}), ...data.privacy };
      settings.markModified('privacy');
    }
    if (data.notifications !== undefined) {
      settings.notifications = { ...((settings.notifications as any) || {}), ...data.notifications };
      settings.markModified('notifications');
    }
    if (data.appearance !== undefined) {
      settings.appearance = { ...((settings.appearance as any) || {}), ...data.appearance };
      settings.markModified('appearance');
    }
    if (data.productivity !== undefined) {
      settings.productivity = { ...((settings.productivity as any) || {}), ...data.productivity };
      settings.markModified('productivity');
    }
    if (data.availability !== undefined) {
      settings.availability = { ...((settings.availability as any) || {}), ...data.availability };
      settings.markModified('availability');
    }
    if (data.chatSettings !== undefined) {
      settings.chatSettings = { ...((settings.chatSettings as any) || {}), ...data.chatSettings };
      settings.markModified('chatSettings');
    }
    if (data.sessions !== undefined) {
      settings.sessions = data.sessions;
      settings.markModified('sessions');
    }

    await settings.save();

    // Synchronize core profile details to User & Employee collections if provided
    if (data.profile) {
      const {
        fullName, phone, emergencyContact, profilePicture, bankDetails,
        dateOfBirth, gender, bloodGroup, address, panNumber, uanNumber,
        documents
      } = data.profile;
      
      const updateDataUser: any = {};
      if (fullName) updateDataUser.fullName = fullName;
      if (phone) updateDataUser.phoneNumber = phone;
      if (profilePicture !== undefined) updateDataUser.profilePicture = profilePicture;
      if (bankDetails) {
        updateDataUser.bankDetails = {
          bankName: bankDetails.bankName || '',
          accountNumber: bankDetails.accountNumber || '',
          ifscCode: bankDetails.ifscCode || '',
          accountHolderName: bankDetails.accountHolderName || fullName || '',
        };
      }

      await User.findByIdAndUpdate(decoded.userId, { $set: updateDataUser });

      const updateDataEmployee: any = {};
      if (fullName) updateDataEmployee.fullName = fullName;
      if (phone) updateDataEmployee.phone = phone;
      if (profilePicture !== undefined) updateDataEmployee.profilePicture = profilePicture;
      if (emergencyContact) updateDataEmployee.emergencyContact = emergencyContact;
      if (dateOfBirth !== undefined) updateDataEmployee.dateOfBirth = dateOfBirth;
      if (gender !== undefined) updateDataEmployee.gender = gender;
      if (bloodGroup !== undefined) updateDataEmployee.bloodGroup = bloodGroup;
      if (address !== undefined) updateDataEmployee.address = address;
      if (data.profile.city !== undefined) updateDataEmployee.city = data.profile.city;
      if (data.profile.state !== undefined) updateDataEmployee.state = data.profile.state;
      if (data.profile.country !== undefined) updateDataEmployee.country = data.profile.country;
      if (data.profile.pinCode !== undefined) updateDataEmployee.pinCode = data.profile.pinCode;
      if (panNumber !== undefined) updateDataEmployee.panNumber = panNumber;
      if (uanNumber !== undefined) updateDataEmployee.uanNumber = uanNumber;
      if (documents !== undefined) updateDataEmployee.documents = documents;
      if (bankDetails) {
        updateDataEmployee.bankName = bankDetails.bankName || '';
        updateDataEmployee.accountNumber = bankDetails.accountNumber || '';
        updateDataEmployee.ifscCode = bankDetails.ifscCode || '';
      }

      await Employee.findOneAndUpdate({ email: decoded.email }, { $set: updateDataEmployee });
    }

    // Broadcast user settings update via Socket.IO
    try {
      const { emitToRoom } = require('../../../config/socket');
      emitToRoom(`company:${decoded.companyId}`, 'user_settings_update', {
        email: decoded.email,
        chatSettings: settings.chatSettings,
        bio: settings.bio
      });

      // Relate presence change to status online list
      if (settings.chatSettings?.chatPresence) {
        emitToRoom(`company:${decoded.companyId}`, 'user_status', {
          email: decoded.email,
          status: settings.chatSettings.chatPresence === 'online' ? 'online' : 'offline'
        });
      }
    } catch (err) {
      console.error('Failed to broadcast settings update:', err);
    }

    return NextResponse.json({ message: 'Preferences saved successfully', settings }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update user settings:', error);
    return NextResponse.json({ error: 'Failed to update preferences', details: error.message }, { status: 500 });
  }
}


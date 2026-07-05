import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found");
  process.exit(1);
}

import { User } from '../../models/User';
import { Employee } from '../../models/Employee';
import { Attendance } from '../../models/Attendance';
import { Leave } from '../../models/Leave';
import { Payroll } from '../../models/Payroll';
import { Message } from '../../models/Message';
import { Channel } from '../../models/Channel';
import { SystemSettings } from '../../models/SystemSettings';
import { UserSettings } from '../../models/UserSettings';
import { AuditLog } from '../../models/AuditLog';
import { Announcement } from '../../models/Announcement';
import { Asset } from '../../models/Asset';
import { Job } from '../../models/Job';
import { Referral } from '../../models/Referral';
import { Reimbursement } from '../../models/Reimbursement';
import { Report } from '../../models/Report';
import { FeedNotification } from '../../models/FeedNotification';
import { Post } from '../../models/Post';
import { Performance } from '../../models/Performance';
import { UserPresence } from '../../models/UserPresence';
import { Wallet } from '../../models/Wallet';
import { Comment } from '../../models/Comment';

async function migrate() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected.");

  // 1. Migrate Users
  const admins = await User.find({ role: 'Admin' });
  console.log(`Found ${admins.length} Admins.`);
  
  // Set unique companyId for each admin if missing
  let count = 0;
  for (const admin of admins) {
    if (!admin.companyId || admin.companyId === 'company_001') {
      count++;
      admin.companyId = `company_${String(count).padStart(3, '0')}`;
      await admin.save();
      console.log(`Assigned ${admin.companyId} to Admin for companyCode ${admin.companyCode}`);
    }
  }

  // Update non-admins
  const nonAdmins = await User.find({ role: { $ne: 'Admin' } });
  console.log(`Found ${nonAdmins.length} Non-Admins.`);
  for (const user of nonAdmins) {
    // Find Admin with same companyCode
    const admin = await User.findOne({ companyCode: user.companyCode, role: 'Admin' });
    user.companyId = admin?.companyId || 'company_001';
    await user.save();
    console.log(`Assigned ${user.companyId} to user ${user.email}`);
  }

  // 2. Migrate Employees
  const employees = await Employee.find({});
  console.log(`Migrating ${employees.length} Employees...`);
  for (const emp of employees) {
    const user = await User.findOne({ email: emp.email });
    emp.companyId = user?.companyId || 'company_001';
    await emp.save();
  }

  // 3. Migrate all other collections to fallback/default companyId if missing
  const models = [
    { name: 'Attendance', model: Attendance },
    { name: 'Leave', model: Leave },
    { name: 'Payroll', model: Payroll },
    { name: 'Message', model: Message },
    { name: 'Channel', model: Channel },
    { name: 'SystemSettings', model: SystemSettings },
    { name: 'UserSettings', model: UserSettings },
    { name: 'AuditLog', model: AuditLog },
    { name: 'Announcement', model: Announcement },
    { name: 'Asset', model: Asset },
    { name: 'Job', model: Job },
    { name: 'Referral', model: Referral },
    { name: 'Reimbursement', model: Reimbursement },
    { name: 'Report', model: Report },
    { name: 'FeedNotification', model: FeedNotification },
    { name: 'Post', model: Post },
    { name: 'Performance', model: Performance },
    { name: 'UserPresence', model: UserPresence },
    { name: 'Wallet', model: Wallet },
    { name: 'Comment', model: Comment },
  ];

  for (const item of models) {
    const res = await (item.model as any).updateMany(
      { $or: [{ companyId: { $exists: false } }, { companyId: "" }] },
      { $set: { companyId: 'company_001' } }
    );
    console.log(`Updated ${res.modifiedCount} documents in ${item.name} with companyId: 'company_001'`);
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});

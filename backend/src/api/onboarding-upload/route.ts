import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { OnboardingRequest } from '../../models/OnboardingRequest';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (buffer: Buffer, filename: string, companyId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `hr-system/${companyId}/onboarding`,
        public_id: filename.substring(0, filename.lastIndexOf('.')),
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// POST /api/onboarding-upload?requestId=xxx
// Unauthenticated endpoint for onboarding candidates — validates requestId instead of JWT.
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId parameter' }, { status: 400 });
    }

    // Validate that this is a real onboarding request (acts as auth)
    const onboardingReq = await OnboardingRequest.findById(requestId);
    if (!onboardingReq) {
      return NextResponse.json({ error: 'Invalid onboarding request' }, { status: 403 });
    }

    // Only allow uploads for active onboarding statuses
    const allowedStatuses = ['Invited', 'Profile Pending', 'Documents Pending', 'Verification Pending', 'Approved'];
    if (!allowedStatuses.includes(onboardingReq.status)) {
      return NextResponse.json({ error: 'This onboarding request is no longer accepting uploads' }, { status: 403 });
    }

    const companyId = onboardingReq.companyId || 'company_001';

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine if file is an image
    const isImage = file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff)$/i.test(file.name);

    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (isImage && cloudinaryConfigured) {
      try {
        const result = await uploadToCloudinary(buffer, file.name, companyId);
        return NextResponse.json({
          success: true,
          message: 'File uploaded successfully',
          url: result.secure_url
        }, { status: 200 });
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failure, falling back to local:', cloudinaryError);
      }
    }

    // Fallback: local storage
    const uploadsDir = join(process.cwd(), 'public', 'uploads', companyId, 'onboarding');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      // Directory may already exist
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${companyId}/onboarding/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl
    }, { status: 200 });

  } catch (error: any) {
    console.error('Onboarding file upload failure:', error);
    return NextResponse.json({ error: 'File upload failed', details: error.message }, { status: 500 });
  }
}

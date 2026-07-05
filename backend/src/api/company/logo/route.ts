import { NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (buffer: Buffer, filename: string, companyId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `hr-system/${companyId}/branding`,
        public_id: `logo_${Date.now()}`,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. Admin role access required.' }, { status: 403 });
    }

    const companyId = decoded.companyId || 'company_001';
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (cloudinaryConfigured) {
      try {
        const result = await uploadToCloudinary(buffer, file.name, companyId);
        return NextResponse.json({ 
          success: true, 
          message: 'Logo uploaded successfully to Cloudinary', 
          url: result.secure_url 
        }, { status: 200 });
      } catch (cloudinaryError: any) {
        console.error('Cloudinary logo upload failure, falling back to local:', cloudinaryError);
      }
    }

    // Fallback: Local storage
    const uploadsDir = join(process.cwd(), 'public', 'uploads', companyId, 'branding');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (_) {}

    const filename = `logo_${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${companyId}/branding/${filename}`;

    return NextResponse.json({ 
      success: true, 
      message: 'Logo uploaded successfully locally', 
      url: fileUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Logo upload endpoint failure:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { verifyAuth } from '@/app/api/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper to upload a buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer, filename: string, companyId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `hr-system/${companyId}`,
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

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';

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
        console.log(`Uploading image ${file.name} to Cloudinary folder hr-system/${companyId}...`);
        const result = await uploadToCloudinary(buffer, file.name, companyId);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Image uploaded successfully to Cloudinary', 
          url: result.secure_url 
        }, { status: 200 });
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failure, falling back to local storage:', cloudinaryError);
        // Fall through to local upload in case Cloudinary fails
      }
    }

    // Fallback: local storage (or for non-image files like PDFs)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', companyId);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      // Directory already exists or permission error
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${companyId}/${filename}`;

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully locally', 
      url: fileUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error('File upload failure:', error);
    return NextResponse.json({ error: 'File upload failed', details: error.message }, { status: 500 });
  }
}



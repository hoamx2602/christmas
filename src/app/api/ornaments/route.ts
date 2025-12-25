import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Supported media extensions
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];
const SUPPORTED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];

interface MediaFile {
  full: string;
  thumb: string;
}

export async function GET() {
  try {
    const ornamentsDir = path.join(process.cwd(), "public", "ornaments");
    const thumbsDir = path.join(ornamentsDir, "thumbs");

    // Check if directory exists
    if (!fs.existsSync(ornamentsDir)) {
      fs.mkdirSync(ornamentsDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }

    // Read all files in directory
    const files = fs.readdirSync(ornamentsDir);

    // Get list of thumbnails
    const thumbFiles = fs.existsSync(thumbsDir) ? fs.readdirSync(thumbsDir) : [];
    const thumbSet = new Set(thumbFiles);

    // Filter for supported media files and create file objects
    const mediaFiles: MediaFile[] = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
      })
      .map((file) => {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        const isVideo = VIDEO_EXTENSIONS.includes(ext);

        // Check if thumbnail exists
        const thumbName = `${baseName}_thumb.jpg`;
        const hasThumb = thumbSet.has(thumbName);

        return {
          full: `/ornaments/${file}`,
          // Videos don't have thumbnails, images use thumb if available
          thumb: isVideo ? `/ornaments/${file}` : (hasThumb ? `/ornaments/thumbs/${thumbName}` : `/ornaments/${file}`),
        };
      })
      .sort((a, b) => a.full.localeCompare(b.full));

    return NextResponse.json({ files: mediaFiles });
  } catch (error) {
    console.error("Error scanning ornaments:", error);
    return NextResponse.json({ files: [], error: "Failed to scan ornaments" }, { status: 500 });
  }
}

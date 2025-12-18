#!/usr/bin/env python3
"""
Aggressive image compression script for cards that exceed 100KB.
"""

from PIL import Image
import os
import sys
from pathlib import Path

def compress_image(input_path, target_kb=100, quality_start=85):
    """
    Compress image to target file size by adjusting quality.
    """
    img = Image.open(input_path)

    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')

    original_size = os.path.getsize(input_path) / 1024
    print(f"Original size: {original_size:.1f} KB")

    # Try different quality levels
    quality = quality_start
    temp_path = str(input_path) + ".temp.png"

    while quality > 20:
        # Save with current quality
        img.save(temp_path, "PNG", optimize=True, quality=quality)

        file_size = os.path.getsize(temp_path) / 1024
        print(f"  Quality {quality}: {file_size:.1f} KB", end="")

        if file_size <= target_kb:
            print(" ✅")
            # Replace original
            os.replace(temp_path, input_path)
            print(f"Compressed to {file_size:.1f} KB (quality={quality})")
            return file_size
        else:
            print()

        quality -= 5

    # If we couldn't reach target, use best we got
    print(f"Warning: Could not reach {target_kb}KB. Using quality={quality}")
    os.replace(temp_path, input_path)
    return os.path.getsize(input_path) / 1024


def main():
    if len(sys.argv) < 2:
        print("Usage: python compress_images.py <image_path> [target_kb]")
        print("   or: python compress_images.py <folder_path> [target_kb]")
        sys.exit(1)

    path = Path(sys.argv[1])
    target_kb = int(sys.argv[2]) if len(sys.argv) > 2 else 100

    if path.is_file():
        # Single file
        print(f"Compressing: {path.name}")
        compress_image(str(path), target_kb)
    elif path.is_dir():
        # All PNG files in folder
        png_files = list(path.glob("*.png"))
        print(f"Found {len(png_files)} PNG files to compress\n")

        for png_file in png_files:
            print(f"Compressing: {png_file.name}")
            compress_image(str(png_file), target_kb)
            print()
    else:
        print(f"Error: {path} not found")
        sys.exit(1)


if __name__ == "__main__":
    main()

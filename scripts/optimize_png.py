#!/usr/bin/env python3
"""
Aggressive PNG optimization using color quantization.
"""

from PIL import Image
import os
import sys
from pathlib import Path

def optimize_png(input_path, target_kb=100, max_colors=256):
    """
    Optimize PNG by reducing colors and applying aggressive compression.
    """
    img = Image.open(input_path)

    original_size = os.path.getsize(input_path) / 1024
    print(f"Original size: {original_size:.1f} KB")

    # Try different color depths
    colors_to_try = [256, 128, 64, 32]

    for num_colors in colors_to_try:
        print(f"  Trying {num_colors} colors...", end=" ")

        # Convert to palette mode (quantize colors)
        img_quantized = img.convert('RGB').quantize(colors=num_colors, method=2, dither=0)

        # Save with optimization
        temp_path = str(input_path) + ".temp.png"
        img_quantized.save(temp_path, "PNG", optimize=True)

        file_size = os.path.getsize(temp_path) / 1024
        print(f"{file_size:.1f} KB", end="")

        if file_size <= target_kb:
            print(" ✅")
            os.replace(temp_path, input_path)
            print(f"✅ Optimized to {file_size:.1f} KB ({num_colors} colors)")
            return file_size
        else:
            print()
            os.remove(temp_path)

    # If we still can't reach target, use minimum colors
    print(f"  Using aggressive compression (32 colors)...")
    img_quantized = img.convert('RGB').quantize(colors=32, method=2, dither=0)
    img_quantized.save(input_path, "PNG", optimize=True)
    final_size = os.path.getsize(input_path) / 1024
    print(f"Final size: {final_size:.1f} KB")

    return final_size


def batch_optimize(folder_path, target_kb=100):
    """
    Optimize all PNG files in a folder.
    """
    path = Path(folder_path)
    png_files = list(path.glob("**/*.png"))  # Recursive

    print(f"Found {len(png_files)} PNG files\n")

    results = []
    for png_file in png_files:
        print(f"{'='*60}")
        print(f"Optimizing: {png_file.relative_to(path)}")
        print('='*60)
        final_size = optimize_png(str(png_file), target_kb)
        results.append((png_file.name, final_size))
        print()

    print(f"{'='*60}")
    print("OPTIMIZATION SUMMARY")
    print('='*60)
    for filename, size in results:
        status = "✅" if size <= target_kb else "⚠️"
        print(f"{status} {filename}: {size:.1f} KB")


def main():
    if len(sys.argv) < 2:
        print("Usage: python optimize_png.py <image_or_folder> [target_kb]")
        print()
        print("Examples:")
        print("  python optimize_png.py hearts_6.png")
        print("  python optimize_png.py frontend/public/assets/cards/ 100")
        sys.exit(1)

    path = Path(sys.argv[1])
    target_kb = int(sys.argv[2]) if len(sys.argv) > 2 else 100

    if not path.exists():
        print(f"Error: {path} not found")
        sys.exit(1)

    if path.is_file():
        optimize_png(str(path), target_kb)
    elif path.is_dir():
        batch_optimize(str(path), target_kb)
    else:
        print(f"Error: {path} is not a file or directory")
        sys.exit(1)


if __name__ == "__main__":
    main()

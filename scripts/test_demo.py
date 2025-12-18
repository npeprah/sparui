#!/usr/bin/env python3
"""
Quick demo script to test the card processing pipeline.
Creates a simple test image and processes it.
"""

from PIL import Image, ImageDraw
from process_card import process_card
import tempfile
import os

def create_test_image():
    """
    Create a simple test image that simulates an AI-generated card.
    """
    # Create a 1024x1536 image (typical Midjourney output size)
    img = Image.new('RGB', (1024, 1536), '#FFF5E6')
    draw = ImageDraw.Draw(img)

    # Draw a large heart shape in center
    heart_color = '#FF4500'
    center_x = 512
    center_y = 768

    # Simple heart shape (two circles and a triangle)
    # Left circle
    draw.ellipse([center_x - 200, center_y - 150, center_x - 50, center_y], fill=heart_color)
    # Right circle
    draw.ellipse([center_x + 50, center_y - 150, center_x + 200, center_y], fill=heart_color)
    # Triangle bottom
    draw.polygon([
        (center_x - 200, center_y - 75),
        (center_x + 200, center_y - 75),
        (center_x, center_y + 200)
    ], fill=heart_color)

    # Add some texture
    for i in range(20):
        x = i * 50
        draw.line([(x, 0), (x, 1536)], fill='#FFE8D6', width=2)

    for i in range(30):
        y = i * 50
        draw.line([(0, y), (1024, y)], fill='#FFF9F0', width=2)

    return img


def main():
    """
    Run a quick test of the card processing pipeline.
    """
    print("="*60)
    print("CARD PROCESSING TEST DEMO")
    print("="*60)
    print()

    # Create test image
    print("1. Creating test image (simulating AI-generated card)...")
    test_img = create_test_image()

    # Save to temp file
    temp_dir = tempfile.gettempdir()
    test_input = os.path.join(temp_dir, "test_card_raw.png")
    test_img.save(test_input)
    print(f"   Saved test image to: {test_input}")
    print()

    # Process it
    print("2. Processing with automated pipeline...")
    print()

    try:
        output_path = process_card(
            test_input,
            card_name="hearts_6.png",
            enhance_colors=True,
            add_pattern=True,
            add_corners=False  # AI should already have corner indicators
        )

        print()
        print("="*60)
        print("✅ TEST SUCCESSFUL!")
        print("="*60)
        print()
        print("The card processing pipeline is working correctly.")
        print()
        print(f"Test output saved to:")
        print(f"  {output_path}")
        print()
        print("Next steps:")
        print("  1. Generate your first card in Midjourney/DALL-E")
        print("  2. Download the image")
        print("  3. Run: python scripts/process_card.py <image> <card_name>")
        print()
        print("See AUTOMATED-CARD-PROCESSING-GUIDE.md for full instructions.")

    except Exception as e:
        print()
        print("="*60)
        print("❌ TEST FAILED")
        print("="*60)
        print(f"Error: {e}")
        print()
        print("Please check that:")
        print("  1. Pillow is installed: pip install Pillow")
        print("  2. You have write permissions to frontend/public/assets/cards/")
        print("  3. The directory structure exists")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())

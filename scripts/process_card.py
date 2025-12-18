#!/usr/bin/env python3
"""
Card Post-Processing Script
Automatically processes AI-generated card images with:
- Exact sizing (512x768px)
- Corner indicators (value + suit symbol)
- Gold borders
- Kente pattern overlay
- Color adjustments
- Compression
"""

from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
import os
import sys
from pathlib import Path

# Card specifications
CARD_WIDTH = 512
CARD_HEIGHT = 768
BORDER_WIDTH = 4
CORNER_RADIUS = 24
GOLD_COLOR = "#FFD700"
BACKGROUND_CREAM = "#FFF5E6"

# Suit colors and symbols
SUIT_COLORS = {
    "hearts": "#FF4500",      # Fire red
    "diamonds": "#FF4500",    # Fire red
    "clubs": "#2F4F2F",       # Dark green
    "spades": "#1C1C1C"       # Near black
}

SUIT_SYMBOLS = {
    "hearts": "♥",
    "diamonds": "♦",
    "clubs": "♣",
    "spades": "♠"
}

# Card values for face cards
FACE_CARDS = {
    "jack": "J",
    "queen": "Q",
    "king": "K",
    "ace": "A"
}


def parse_card_name(filename):
    """
    Parse card filename to extract suit and value.
    Examples: hearts_6.png, spades_ace.png, diamonds_king.png
    """
    name = Path(filename).stem  # Remove extension
    parts = name.split('_')

    if len(parts) != 2:
        raise ValueError(f"Invalid card filename format: {filename}. Expected format: suit_value.png")

    suit = parts[0].lower()
    value = parts[1].lower()

    if suit not in SUIT_COLORS:
        raise ValueError(f"Unknown suit: {suit}. Must be one of {list(SUIT_COLORS.keys())}")

    # Convert face card names to letters
    if value in FACE_CARDS:
        display_value = FACE_CARDS[value]
    elif value.isdigit():
        display_value = value
    else:
        display_value = value.upper()

    return suit, display_value


def create_kente_pattern(width, height, suit):
    """
    Create a subtle Kente cloth pattern overlay.
    """
    pattern = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(pattern)

    # Kente colors based on suit
    if suit in ["hearts", "diamonds"]:
        colors = [
            (255, 215, 0, 25),    # Gold
            (139, 69, 19, 25),    # Brown
            (210, 180, 140, 25)   # Tan
        ]
    else:  # clubs, spades
        colors = [
            (255, 215, 0, 25),    # Gold
            (47, 79, 47, 25),     # Dark green/gray
            (169, 169, 169, 25)   # Gray
        ]

    # Draw vertical stripes
    stripe_width = 8
    for x in range(0, width, stripe_width * 3):
        for i, color in enumerate(colors):
            draw.rectangle([x + i * stripe_width, 0, x + (i + 1) * stripe_width, height], fill=color)

    # Draw horizontal stripes (thinner)
    stripe_height = 6
    for y in range(0, height, stripe_height * 4):
        color = colors[0]  # Use gold for horizontal
        draw.rectangle([0, y, width, y + stripe_height], fill=color)

    # Add diagonal elements
    for y in range(0, height, 40):
        for x in range(0, width, 40):
            draw.line([(x, y), (x + 20, y + 20)], fill=colors[1], width=2)

    return pattern


def add_corner_indicators(draw, card_value, suit, width, height, font_value, font_suit):
    """
    Add corner indicators (value + suit symbol) to top-left and bottom-right.
    """
    suit_symbol = SUIT_SYMBOLS[suit]
    suit_color = SUIT_COLORS[suit]

    # Parse colors
    from PIL import ImageColor
    suit_rgb = ImageColor.getrgb(suit_color)

    # Top-left corner
    margin = 16
    value_y = margin

    # Draw value
    draw.text((margin, value_y), card_value, fill=suit_rgb, font=font_value)

    # Get value text size for positioning suit below
    value_bbox = draw.textbbox((margin, value_y), card_value, font=font_value)
    value_height = value_bbox[3] - value_bbox[1]

    # Draw suit symbol below value
    suit_y = value_y + value_height + 4
    draw.text((margin, suit_y), suit_symbol, fill=suit_rgb, font=font_suit)

    # Bottom-right corner (rotated 180 degrees)
    # For simplicity, we'll draw text normally but position it at bottom-right
    # Get text sizes
    value_bbox = draw.textbbox((0, 0), card_value, font=font_value)
    value_width = value_bbox[2] - value_bbox[0]
    value_height = value_bbox[3] - value_bbox[1]

    suit_bbox = draw.textbbox((0, 0), suit_symbol, font=font_suit)
    suit_width = suit_bbox[2] - suit_bbox[0]
    suit_height = suit_bbox[3] - suit_bbox[1]

    # Position at bottom-right
    br_value_x = width - margin - value_width
    br_suit_y = height - margin - suit_height
    br_value_y = br_suit_y - value_height - 4

    draw.text((br_value_x, br_value_y), card_value, fill=suit_rgb, font=font_value)
    draw.text((width - margin - suit_width, br_suit_y), suit_symbol, fill=suit_rgb, font=font_suit)


def add_gold_border(image, border_width=4):
    """
    Add gold border with subtle outer glow.
    """
    from PIL import ImageColor

    # Create border layer
    bordered = Image.new('RGB', image.size, ImageColor.getrgb(GOLD_COLOR))

    # Paste original image with margin
    paste_box = (border_width, border_width,
                 image.width - border_width, image.height - border_width)
    bordered.paste(image.crop((border_width, border_width,
                               image.width - border_width,
                               image.height - border_width)),
                   (border_width, border_width))

    # Add subtle outer glow (soft gold shadow)
    bordered = bordered.filter(ImageFilter.SMOOTH_MORE)

    return bordered


def process_card(input_path, output_path=None, card_name=None, enhance_colors=True, add_pattern=True, add_corners=False):
    """
    Main processing function for a card image.

    Args:
        input_path: Path to raw AI-generated image
        output_path: Path to save processed image (optional)
        card_name: Card name in format 'suit_value.png' (e.g., 'hearts_6.png')
                   If not provided, will use input filename
        enhance_colors: Whether to boost saturation/contrast
        add_pattern: Whether to add Kente pattern overlay
        add_corners: Whether to add corner indicators (only if AI missed them)
    """
    # Parse card information
    if card_name is None:
        card_name = Path(input_path).name

    suit, card_value = parse_card_name(card_name)

    print(f"Processing {suit} {card_value}...")

    # Load image
    img = Image.open(input_path)

    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')

    # 1. Resize to exact dimensions (512x768)
    print(f"  - Resizing from {img.size} to {CARD_WIDTH}x{CARD_HEIGHT}")
    img = img.resize((CARD_WIDTH, CARD_HEIGHT), Image.Resampling.LANCZOS)

    # 2. Enhance colors if requested
    if enhance_colors:
        print("  - Enhancing colors")
        # Boost saturation slightly
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.15)  # 15% more saturation

        # Boost contrast slightly
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.1)  # 10% more contrast

    # 3. Add Kente pattern overlay if requested
    if add_pattern:
        print("  - Adding Kente pattern overlay")
        pattern = create_kente_pattern(CARD_WIDTH, CARD_HEIGHT, suit)
        img_rgba = img.convert('RGBA')
        img_rgba = Image.alpha_composite(img_rgba, pattern)
        img = img_rgba.convert('RGB')

    # 4. Add corner indicators (only if requested - AI should already have them)
    if add_corners:
        print("  - Adding corner indicators")
        draw = ImageDraw.Draw(img)

        # Try to use Orbitron font, fall back to default
        try:
            # Try to load Orbitron or similar bold font
            font_value = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 40)
            font_suit = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 32)
        except:
            # Fall back to default font
            print("    (Using default font - install Orbitron for best results)")
            font_value = ImageFont.load_default()
            font_suit = ImageFont.load_default()

        add_corner_indicators(draw, card_value, suit, CARD_WIDTH, CARD_HEIGHT, font_value, font_suit)

    # 5. Add gold border
    print("  - Adding gold border")
    img = add_gold_border(img, BORDER_WIDTH)

    # 6. Determine output path
    if output_path is None:
        # Use the appropriate folder structure
        project_root = Path(__file__).parent.parent
        suit_folder = project_root / "frontend" / "public" / "assets" / "cards" / suit
        suit_folder.mkdir(parents=True, exist_ok=True)
        output_path = suit_folder / f"{suit}_{card_value.lower()}.png"

    # 7. Save with optimization
    print(f"  - Saving to {output_path}")
    img.save(output_path, "PNG", optimize=True, quality=95)

    # 8. Check file size
    file_size = os.path.getsize(output_path)
    file_size_kb = file_size / 1024
    print(f"  - File size: {file_size_kb:.1f} KB")

    if file_size_kb > 100:
        print(f"    ⚠️  Warning: File size exceeds 100KB. Consider additional compression.")
    else:
        print(f"    ✅ File size OK")

    print(f"✅ Completed: {output_path}")
    return output_path


def main():
    """
    Command-line interface for the card processor.
    """
    if len(sys.argv) < 2:
        print("Usage: python process_card.py <input_image> [output_name]")
        print()
        print("Examples:")
        print("  python process_card.py raw_card.png hearts_6.png")
        print("  python process_card.py /tmp/midjourney_output.png spades_ace.png")
        print()
        print("Output will be saved to: frontend/public/assets/cards/{suit}/{filename}")
        sys.exit(1)

    input_path = sys.argv[1]

    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    # Get card name from argument or filename
    if len(sys.argv) >= 3:
        card_name = sys.argv[2]
    else:
        card_name = Path(input_path).name

    try:
        process_card(input_path, card_name=card_name)
    except Exception as e:
        print(f"Error processing card: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

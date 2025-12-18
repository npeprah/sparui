#!/usr/bin/env python3
"""
Batch Card Processing Script
Process multiple AI-generated card images at once.
"""

import os
import sys
from pathlib import Path
from process_card import process_card

def batch_process(input_folder, card_mappings=None):
    """
    Process all images in a folder.

    Args:
        input_folder: Folder containing raw card images
        card_mappings: Dict mapping filenames to card names
                      e.g., {"image1.png": "hearts_6.png", "image2.png": "clubs_10.png"}
                      If None, assumes filenames are already in correct format
    """
    input_path = Path(input_folder)

    if not input_path.exists():
        print(f"Error: Input folder not found: {input_folder}")
        sys.exit(1)

    # Find all image files
    image_extensions = ['.png', '.jpg', '.jpeg', '.webp']
    image_files = []

    for ext in image_extensions:
        image_files.extend(input_path.glob(f"*{ext}"))
        image_files.extend(input_path.glob(f"*{ext.upper()}"))

    if not image_files:
        print(f"No image files found in {input_folder}")
        sys.exit(1)

    print(f"Found {len(image_files)} image(s) to process\n")

    # Process each image
    success_count = 0
    failed_files = []

    for img_file in sorted(image_files):
        try:
            # Determine card name
            if card_mappings and img_file.name in card_mappings:
                card_name = card_mappings[img_file.name]
            else:
                card_name = img_file.name

            print(f"\n{'='*60}")
            print(f"Processing: {img_file.name}")
            print(f"Card name: {card_name}")
            print('='*60)

            process_card(str(img_file), card_name=card_name)
            success_count += 1

        except Exception as e:
            print(f"❌ Failed to process {img_file.name}: {e}")
            failed_files.append((img_file.name, str(e)))

    # Summary
    print(f"\n{'='*60}")
    print("BATCH PROCESSING SUMMARY")
    print('='*60)
    print(f"Total files: {len(image_files)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {len(failed_files)}")

    if failed_files:
        print("\nFailed files:")
        for filename, error in failed_files:
            print(f"  - {filename}: {error}")

    print()


def interactive_batch_process():
    """
    Interactive mode: prompt user for input folder and card mappings.
    """
    print("="*60)
    print("BATCH CARD PROCESSOR - Interactive Mode")
    print("="*60)
    print()

    # Get input folder
    input_folder = input("Enter path to folder with raw card images: ").strip()

    if not os.path.exists(input_folder):
        print(f"Error: Folder not found: {input_folder}")
        sys.exit(1)

    # Check if we need mappings
    print("\nDo your image files need to be renamed?")
    print("  - If filenames are already like 'hearts_6.png', type 'no'")
    print("  - If filenames are random like 'midjourney_12345.png', type 'yes'")
    needs_mapping = input("Need mapping? (yes/no): ").strip().lower()

    card_mappings = None

    if needs_mapping in ['yes', 'y']:
        print("\nYou'll need to create a mapping file.")
        print("Create a text file with lines like:")
        print("  midjourney_12345.png = hearts_6.png")
        print("  dalle_output.png = spades_ace.png")
        print()
        mapping_file = input("Enter path to mapping file (or press Enter to skip): ").strip()

        if mapping_file and os.path.exists(mapping_file):
            card_mappings = {}
            with open(mapping_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line:
                        original, card_name = line.split('=')
                        card_mappings[original.strip()] = card_name.strip()

            print(f"Loaded {len(card_mappings)} mappings")

    # Process
    print()
    batch_process(input_folder, card_mappings)


def main():
    """
    Command-line interface for batch processing.
    """
    if len(sys.argv) < 2:
        print("Usage: python batch_process_cards.py <input_folder> [mapping_file]")
        print()
        print("Examples:")
        print("  python batch_process_cards.py /tmp/raw-cards/")
        print("  python batch_process_cards.py /tmp/raw-cards/ mappings.txt")
        print()
        print("Or run without arguments for interactive mode:")
        print("  python batch_process_cards.py")
        print()

        # Offer interactive mode
        use_interactive = input("Start interactive mode? (yes/no): ").strip().lower()
        if use_interactive in ['yes', 'y']:
            interactive_batch_process()
        else:
            sys.exit(1)
        return

    input_folder = sys.argv[1]

    # Load mapping file if provided
    card_mappings = None
    if len(sys.argv) >= 3:
        mapping_file = sys.argv[2]
        if os.path.exists(mapping_file):
            card_mappings = {}
            with open(mapping_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line:
                        original, card_name = line.split('=')
                        card_mappings[original.strip()] = card_name.strip()

            print(f"Loaded {len(card_mappings)} card name mappings")

    batch_process(input_folder, card_mappings)


if __name__ == "__main__":
    main()

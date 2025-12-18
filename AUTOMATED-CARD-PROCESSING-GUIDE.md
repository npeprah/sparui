# Automated Card Processing Guide

**You don't need Figma/Photoshop!** Use these Python scripts to automatically post-process your AI-generated card images.

---

## What The Scripts Do

The automated scripts handle **ALL** post-processing steps:

✅ **Resize** images to exactly 512x768px
✅ **Add gold borders** with proper styling
✅ **Add Kente pattern overlay** (subtle geometric patterns)
✅ **Enhance colors** (boost saturation and contrast)
✅ **Optimize file size** (PNG compression)
✅ **Save to correct folder** with correct filename

**Note:** Corner indicators are NOT added by default - the AI prompts already include them. If the AI missed them, you can enable with `add_corners=True`.

**Time saved:** ~15 minutes manual work per card → **5 seconds** automated! 🚀

---

## Quick Start (Process One Card)

### Step 1: Generate Card in Midjourney/DALL-E
Use the prompts from `AI-PROMPTS-READY-TO-USE.md` to generate your card image.

### Step 2: Download the Image
Save it anywhere temporary, like `/tmp/raw_card.png` or your Downloads folder.

### Step 3: Run The Script

```bash
# Activate the Python environment
source .venv-card-processing/bin/activate

# Process the card
python scripts/process_card.py /path/to/downloaded/image.png hearts_6.png
```

**That's it!** The script will:
- Process the image
- Add all the required elements
- Save it to `frontend/public/assets/cards/hearts/hearts_6.png`
- Show you the file size

### Example:

```bash
# You generated "6 of Hearts" in Midjourney and downloaded it
source .venv-card-processing/bin/activate
python scripts/process_card.py ~/Downloads/midjourney_image_123.png hearts_6.png

# Output:
# Processing hearts 6...
#   - Resizing from (1024, 1536) to 512x768
#   - Enhancing colors
#   - Adding Kente pattern overlay
#   - Adding corner indicators
#   - Adding gold border
#   - Saving to frontend/public/assets/cards/hearts/hearts_6.png
#   - File size: 87.3 KB
#   ✅ File size OK
# ✅ Completed: frontend/public/assets/cards/hearts/hearts_6.png
```

---

## Batch Processing (Multiple Cards)

If you generate multiple cards at once, use the batch processor:

### Step 1: Create a Folder for Raw Images

```bash
mkdir -p /tmp/raw-cards
```

### Step 2: Download All Your Generated Cards

Save all Midjourney/DALL-E outputs to `/tmp/raw-cards/`

### Step 3: Create a Mapping File (if needed)

If your image filenames aren't already in the correct format (e.g., `hearts_6.png`), create a mapping file:

```bash
nano /tmp/card-mappings.txt
```

Add lines like this:

```
midjourney_12345.png = hearts_6.png
midjourney_67890.png = clubs_10.png
dalle_output_1.png = diamonds_jack.png
leonardo_gen_4.png = spades_king.png
img_0042.png = hearts_ace.png
```

Save and exit (Ctrl+O, Enter, Ctrl+X).

### Step 4: Run Batch Processor

```bash
source .venv-card-processing/bin/activate
python scripts/batch_process_cards.py /tmp/raw-cards /tmp/card-mappings.txt
```

The script will process all cards and show you a summary:

```
Found 5 image(s) to process

============================================================
Processing: midjourney_12345.png
Card name: hearts_6.png
============================================================
Processing hearts 6...
  - Resizing from (1024, 1536) to 512x768
  ... [processing steps] ...
✅ Completed: frontend/public/assets/cards/hearts/hearts_6.png

[... processes other cards ...]

============================================================
BATCH PROCESSING SUMMARY
============================================================
Total files: 5
Successful: 5
Failed: 0
```

---

## Card Name Format

Card names must follow this format: `{suit}_{value}.png`

### Valid Suit Names:
- `hearts`
- `diamonds`
- `clubs`
- `spades`

### Valid Value Names:

**Number cards:** `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`

**Face cards:** `jack`, `queen`, `king`, `ace`

### Examples:

✅ **Correct:**
- `hearts_6.png`
- `clubs_10.png`
- `diamonds_jack.png`
- `spades_ace.png`
- `hearts_king.png`

❌ **Incorrect:**
- `heart_6.png` (missing 's')
- `6_hearts.png` (wrong order)
- `Hearts_6.png` (capital letters)
- `hearts-6.png` (hyphen instead of underscore)
- `hearts_J.png` (use 'jack' not 'J')

---

## Advanced Options

### Add Corner Indicators (if AI missed them)

By default, corner indicators are NOT added (AI prompts already include them). If the AI missed them:

```python
from process_card import process_card
process_card("input.png", card_name="hearts_6.png", add_corners=True)
```

### Disable Kente Pattern

If the AI already added a good pattern and you don't want to overlay another:

```python
from process_card import process_card
process_card("input.png", card_name="hearts_6.png", add_pattern=False)
```

### Disable Color Enhancement

If colors are already perfect:

```python
from process_card import process_card
process_card("input.png", card_name="hearts_6.png", enhance_colors=False)
```

### Custom Output Path

Save to a specific location:

```python
from process_card import process_card
process_card("input.png", output_path="/custom/path/card.png", card_name="hearts_6.png")
```

---

## Troubleshooting

### Problem: "ModuleNotFoundError: No module named 'PIL'"

**Solution:** Make sure you activated the virtual environment:

```bash
source .venv-card-processing/bin/activate
```

### Problem: "Invalid card filename format"

**Solution:** Check your card name format. Must be `suit_value.png`:
- `hearts_6.png` ✅
- `heart_six.png` ❌

### Problem: File size still > 100KB

**Solution:** The image might be too detailed. Options:
1. Regenerate with simpler prompt
2. Use external compression: https://tinypng.com
3. The script already optimizes - if it's 101-110KB, it's probably fine

### Problem: Corner indicators look wrong

**Solution:** The script uses Arial Bold as fallback. For best results:
1. Install Orbitron font (free from Google Fonts)
2. Or edit `process_card.py` to use a different font path

### Problem: Colors are too saturated

**Solution:** Disable color enhancement:

```bash
# Edit process_card.py, line with enhance_colors parameter
# Or use Python directly:
python -c "from process_card import process_card; process_card('input.png', 'hearts_6.png', enhance_colors=False)"
```

---

## Workflow Integration

### New Workflow (with automation):

1. **Generate in Midjourney/DALL-E** (2-3 minutes)
2. **Download image** (10 seconds)
3. **Run script** (5 seconds)
4. **Update progress tracker** (30 seconds)

**Total: ~3-4 minutes per card** (vs 15-20 minutes manual!)

### Recommended Daily Batch Process:

1. Morning: Generate 5-7 cards in Midjourney
2. Download all throughout the day as they complete
3. End of day: Run batch processor on all cards at once
4. Review results and update progress tracker

---

## Script Locations

- **Single card processor:** `scripts/process_card.py`
- **Batch processor:** `scripts/batch_process_cards.py`
- **Virtual environment:** `.venv-card-processing/`

---

## Complete Example Workflow

```bash
# 1. Activate environment
source .venv-card-processing/bin/activate

# 2. Process test batch (5 cards)
# Assume you downloaded 5 Midjourney images to Downloads folder

cd /Users/nana/go/src/github.com/npeprah/sparui

python scripts/process_card.py ~/Downloads/mj_001.png hearts_6.png
python scripts/process_card.py ~/Downloads/mj_002.png clubs_10.png
python scripts/process_card.py ~/Downloads/mj_003.png diamonds_jack.png
python scripts/process_card.py ~/Downloads/mj_004.png spades_king.png
python scripts/process_card.py ~/Downloads/mj_005.png hearts_ace.png

# 3. Check results
ls -lh frontend/public/assets/cards/*/

# 4. View in browser
# Open test-batch-showcase.html in your browser

# 5. Update progress tracker
nano TASK-022-PROGRESS-TRACKER.md
```

---

## Next Steps

1. **Generate your first test card** (6 of Hearts)
2. **Download it** to your computer
3. **Run the script** with the command above
4. **Check the output** in `frontend/public/assets/cards/hearts/`
5. **View in browser** using `test-batch-showcase.html`

**Ready to process your first card?** 🚀

Run this command when you have your first downloaded image:

```bash
source .venv-card-processing/bin/activate
python scripts/process_card.py /path/to/your/downloaded/image.png hearts_6.png
```

---

**Questions?** Check the source code:
- `scripts/process_card.py` - Well-commented, easy to understand
- Modify any settings you want (colors, borders, pattern intensity, etc.)

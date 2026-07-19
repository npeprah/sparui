// Quick test to verify depth fix
// Run this in the browser console after cards are dealt

// Function to check card depths
function checkCardDepths() {
  const gameScene = window.game?.scene?.scenes?.[0];
  if (!gameScene) {
    console.log('Game scene not found');
    return;
  }

  // Get all sprites in the scene
  const allObjects = gameScene.children.list;

  // Filter for cards (they have suit and rank properties)
  const cards = allObjects.filter(obj => obj.suit && obj.rank);

  console.log(`Found ${cards.length} cards in scene`);

  // Check each card's depth
  cards.forEach((card, index) => {
    console.log(`Card ${index}: ${card.suit} ${card.rank}, depth: ${card.depth}, visible: ${card.visible}`);
  });

  // Check background depth
  const background = allObjects.find(obj => obj.texture?.key?.includes('surface') || (obj.type === 'Rectangle' && obj.fillColor === 0x0a5f38));
  if (background) {
    console.log(`Background depth: ${background.depth}`);
  }

  // Verify cards are above background
  const minCardDepth = Math.min(...cards.map(c => c.depth));
  const backgroundDepth = background?.depth || -10;

  if (minCardDepth > backgroundDepth) {
    console.log('✅ SUCCESS: All cards are above the background');
    console.log(`  Minimum card depth: ${minCardDepth}`);
    console.log(`  Background depth: ${backgroundDepth}`);
  } else {
    console.log('❌ ISSUE: Some cards may be behind the background');
    console.log(`  Minimum card depth: ${minCardDepth}`);
    console.log(`  Background depth: ${backgroundDepth}`);
  }
}

// Instructions
console.log('Depth fix verification script loaded.');
console.log('After cards are dealt, run: checkCardDepths()');
console.log('This will verify that all cards have correct depth values.');
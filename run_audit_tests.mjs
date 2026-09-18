import puppeteer from 'puppeteer';

console.log("=== STARTING LUMINA READER AUTOMATED E2E SUITE ===");

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
const consoleLogs = [];
const pageErrors = [];

page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => {
  console.error("PAGE ERROR CAUGHT:", err.message);
  pageErrors.push(err.message);
});

try {
  // Set standard desktop viewport first
  await page.setViewport({ width: 1280, height: 800 });
  console.log("1. Navigating to http://localhost:3000 ...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  // Check title
  const title = await page.title();
  console.log(`- Page title: "${title}"`);

  // Verify seed books loaded
  const bookCards = await page.$$('[title*="Click to read"], .group');
  console.log(`- Detected book cards / items in library: ${bookCards.length}`);

  // Test Phase 2: Modals from Desktop Titlebar
  console.log("\n2. Testing DesktopTitleBar Modals...");
  
  // Test Search Index (Cmd+K)
  console.log("  - Opening Search Index Modal (Cmd+K)...");
  await page.keyboard.down('Control');
  await page.keyboard.press('k');
  await page.keyboard.up('Control');
  await new Promise(r => setTimeout(r, 500));
  let modal = await page.$('.fixed.inset-0');
  console.log(`    Search modal open: ${!!modal}`);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // Test Habits Dashboard
  console.log("  - Clicking Reading Habits icon...");
  const habitsBtn = await page.$('button[title*="Habits"], button[title*="Stats"], button[title*="Analytics"]');
  if (habitsBtn) {
    await habitsBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const habitsHeader = await page.evaluate(() => document.body.innerText.includes('Reading Velocity') || document.body.innerText.includes('Reading Habits') || document.body.innerText.includes('Streak'));
    console.log(`    Habits modal open: ${habitsHeader}`);
    // Close it with Escape or close button
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  } else {
    console.log("    Habits button not found by title attribute");
  }

  // Test Soundscapes Modal
  console.log("  - Testing Soundscapes Modal...");
  const soundscapeBtn = await page.$('button[title*="Soundscape"], button[title*="Atmospheric"]');
  if (soundscapeBtn) {
    await soundscapeBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const soundscapeHeader = await page.evaluate(() => document.body.innerText.includes('Atmospheric Environment') || document.body.innerText.includes('soundscapes'));
    console.log(`    Soundscape modal open: ${soundscapeHeader}`);
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // Test Shortcuts Modal
  console.log("  - Testing Shortcuts Modal...");
  const shortcutsBtn = await page.$('button[title*="Shortcuts"]');
  if (shortcutsBtn) {
    await shortcutsBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const shortcutsHeader = await page.evaluate(() => document.body.innerText.includes('Keyboard Shortcuts'));
    console.log(`    Shortcuts modal open: ${shortcutsHeader}`);
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // Test Phase 3: Library View Tabs & Controls
  console.log("\n3. Testing Library View Tabs & Controls...");
  const tabs = await page.$$eval('button', btns => btns.map(b => b.innerText.trim()).filter(t => t.includes('All') || t.includes('Reading') || t.includes('Favorites') || t.includes('Finished')));
  console.log("  - Found library filter tabs:", tabs);

  // Switch to Favorites tab
  console.log("  - Clicking 'Favorites' tab...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Favorites'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Switch back to All tab
  console.log("  - Clicking 'All' tab...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('All'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Test Sort Selector
  console.log("  - Testing Sort Selector...");
  const sortSelect = await page.$('select');
  if (sortSelect) {
    await sortSelect.select('title');
    await new Promise(r => setTimeout(r, 300));
    await sortSelect.select('recent');
    console.log("    Sort selector works smoothly");
  }

  // Test Grid vs List view toggle
  console.log("  - Testing Grid vs List View toggle...");
  const viewToggleBtn = await page.$('button[title*="List View"], button[title*="Grid View"], button[title*="View Mode"]');
  if (viewToggleBtn) {
    await viewToggleBtn.click();
    await new Promise(r => setTimeout(r, 500));
    console.log("    Switched view mode successfully");
    await viewToggleBtn.click(); // switch back
    await new Promise(r => setTimeout(r, 500));
  }

  // Test Phase 4: Opening a Book in ReaderView
  console.log("\n4. Testing Opening a Book in ReaderView...");
  // Click the first book
  const opened = await page.evaluate(() => {
    const book = document.querySelector('[title*="Click to read"]') || document.querySelector('.cursor-pointer.group');
    if (book) {
      book.click();
      return true;
    }
    return false;
  });
  console.log(`  - Clicked book: ${opened}`);
  await new Promise(r => setTimeout(r, 1500));

  // Check if ReaderView is rendered
  const readerActive = await page.evaluate(() => {
    return !!document.querySelector('[data-reader-view], [title*="Table of Contents"], [title*="Typography"], [title*="Back to library"]');
  });
  console.log(`  - Reader active: ${readerActive}`);

  if (readerActive) {
    // Test TOC Drawer
    console.log("  - Testing Table of Contents Drawer...");
    const tocBtn = await page.$('button[title*="Table of Contents"], button[title*="Contents"], button[title*="Chapters"]');
    if (tocBtn) {
      await tocBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const hasToc = await page.evaluate(() => document.body.innerText.includes('Table of Contents'));
      console.log(`    TOC Drawer open: ${hasToc}`);
      // Click again or close
      await tocBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Test Typography Toolbar
    console.log("  - Testing Typography & Layout Toolbar...");
    const typoBtn = await page.$('button[title*="Typography"], button[title*="Appearance"], button[title*="Font"]');
    if (typoBtn) {
      await typoBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const hasTypo = await page.evaluate(() => document.body.innerText.includes('Font Family') || document.body.innerText.includes('Typography') || document.body.innerText.includes('Font Size'));
      console.log(`    Typography Toolbar open: ${hasTypo}`);
      // Test changing theme or font
      const sepiaBtn = await page.$('button[title*="Sepia"]');
      if (sepiaBtn) {
        await sepiaBtn.click();
        console.log("    Switched to Sepia theme");
      }
      // Close typography
      await typoBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Test RSVP Speed Reader Modal
    console.log("  - Testing RSVP Speed Reader Modal...");
    const rsvpBtn = await page.$('button[title*="Speed"], button[title*="RSVP"]');
    if (rsvpBtn) {
      await rsvpBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const hasRsvp = await page.evaluate(() => document.body.innerText.includes('RSVP') || document.body.innerText.includes('WPM') || document.body.innerText.includes('Speed Reader'));
      console.log(`    RSVP Modal open: ${hasRsvp}`);
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 400));
    }

    // Test TTS Audio Player
    console.log("  - Testing TTS Player...");
    const ttsBtn = await page.$('button[title*="Speech"], button[title*="Read aloud"], button[title*="TTS"], button[title*="Listen"]');
    if (ttsBtn) {
      await ttsBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const hasTTS = await page.evaluate(() => !!document.querySelector('[title*="Play"], [title*="Pause"], [title*="Speed"]'));
      console.log(`    TTS Bar open: ${hasTTS}`);
      // Close TTS
      await ttsBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Test AI Assistant Drawer
    console.log("  - Testing AI Assistant Drawer...");
    const aiBtn = await page.$('button[title*="AI"], button[title*="Assistant"], button[title*="Companion"]');
    if (aiBtn) {
      await aiBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const hasAI = await page.evaluate(() => document.body.innerText.includes('AI') || document.body.innerText.includes('Ask') || document.body.innerText.includes('Summary'));
      console.log(`    AI Drawer open: ${hasAI}`);
      await aiBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Test Progress Bar at bottom
    console.log("  - Testing Bottom Reading Progress Bar...");
    const hasProgressBar = await page.evaluate(() => !!document.querySelector('input[type="range"]') || !!document.querySelector('.h-12'));
    console.log(`    Progress bar present: ${hasProgressBar}`);

    // Return back to library
    console.log("  - Navigating back to Library...");
    const backBtn = await page.$('button[title*="Back to library"], button[title*="Library"], button[title*="Home"]');
    if (backBtn) {
      await backBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }
  }

  // Test Phase 5: Mobile Viewport Responsiveness
  console.log("\n5. Testing Mobile Viewport (375x667 - iPhone SE)...");
  await page.setViewport({ width: 375, height: 667 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Check for horizontal overflow on body/html
  const mobileOverflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    return { docWidth, winWidth, hasHorizontalScroll: docWidth > winWidth };
  });
  console.log("  - Mobile layout width check:", mobileOverflow);

  // Check Library View controls on mobile
  const mobileTabsWrapped = await page.evaluate(() => {
    const tabsContainer = document.querySelector('.flex.items-center.flex-wrap');
    return !!tabsContainer;
  });
  console.log(`  - Mobile tabs wrap applied: ${mobileTabsWrapped}`);

  // Test Phase 6: Mobile Reader View Responsiveness
  console.log("\n6. Testing Mobile Reader View...");
  await page.evaluate(() => {
    const book = document.querySelector('[title*="Click to read"]') || document.querySelector('.cursor-pointer.group');
    if (book) book.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const mobileReaderOverflow = await page.evaluate(() => {
    return {
      docWidth: document.documentElement.scrollWidth,
      winWidth: window.innerWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    };
  });
  console.log("  - Mobile reader horizontal overflow check:", mobileReaderOverflow);

  // Check if navigation buttons on mobile are clipped or hidden
  const navButtonsStatus = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('header button, nav button'));
    const clipped = buttons.filter(b => {
      const rect = b.getBoundingClientRect();
      return rect.right > window.innerWidth || rect.left < 0;
    });
    return {
      totalButtons: buttons.length,
      clippedButtons: clipped.map(b => b.getAttribute('title') || b.innerText)
    };
  });
  console.log("  - Mobile nav buttons clipping check:", navButtonsStatus);

} catch (err) {
  console.error("TEST EXECUTION FAILED:", err);
} finally {
  console.log("\n=== CONSOLE SUMMARY ===");
  console.log(`Page Errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    pageErrors.forEach((e, i) => console.log(`  [${i+1}] ${e}`));
  }
  await browser.close();
  console.log("=== COMPLETED TEST RUN ===");
}

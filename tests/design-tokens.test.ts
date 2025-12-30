/**
 * Design Tokens Tests
 * 
 * Tests for Phase 07 UI Branding - Design tokens extracted from Figma
 */

// Simple test assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function testAsync(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

console.log("=== Tests: Design Tokens (Phase 07) ===\n");

import { readFileSync } from "fs";
import { join } from "path";

// Read globals.css to verify CSS variables
const globalsCssPath = join(process.cwd(), "app", "globals.css");
const globalsCss = readFileSync(globalsCssPath, "utf-8");

// Read tailwind.config.ts to verify Tailwind configuration
const tailwindConfigPath = join(process.cwd(), "tailwind.config.ts");
const tailwindConfig = readFileSync(tailwindConfigPath, "utf-8");

// Read layout.tsx to verify font configuration
const layoutPath = join(process.cwd(), "app", "layout.tsx");
const layout = readFileSync(layoutPath, "utf-8");

test("globals.css should contain TTTR design token CSS variables", () => {
  // Brand Primary colors
  assert(globalsCss.includes("--tttr-purple-primary"), "Should have purple-primary variable");
  assert(globalsCss.includes("--tttr-purple-hover"), "Should have purple-hover variable");
  assert(globalsCss.includes("--tttr-purple-dark"), "Should have purple-dark variable");
  assert(globalsCss.includes("--tttr-purple-light"), "Should have purple-light variable");
  
  // Brand Neutral colors
  assert(globalsCss.includes("--tttr-beige"), "Should have beige variable");
  assert(globalsCss.includes("--tttr-cloud-white"), "Should have cloud-white variable");
  
  // Brand Extended colors
  assert(globalsCss.includes("--tttr-blue-primary"), "Should have blue-primary variable");
  assert(globalsCss.includes("--tttr-green-dark"), "Should have green-dark variable");
  
  // Text colors
  assert(globalsCss.includes("--tttr-text-heading"), "Should have text-heading variable");
  assert(globalsCss.includes("--tttr-text-paragraph"), "Should have text-paragraph variable");
  
  // Spacing
  assert(globalsCss.includes("--tttr-spacing-4"), "Should have spacing-4 variable");
  assert(globalsCss.includes("--tttr-spacing-16"), "Should have spacing-16 variable");
  assert(globalsCss.includes("--tttr-spacing-64"), "Should have spacing-64 variable");
  
  // Radius
  assert(globalsCss.includes("--tttr-radius-4"), "Should have radius-4 variable");
  assert(globalsCss.includes("--tttr-radius-12"), "Should have radius-12 variable");
  assert(globalsCss.includes("--tttr-radius-24"), "Should have radius-24 variable");
  
  // Fonts
  assert(globalsCss.includes("--tttr-font-primary"), "Should have font-primary variable");
  assert(globalsCss.includes("--tttr-font-secondary"), "Should have font-secondary variable");
});

test("globals.css should contain correct color values from Figma", () => {
  // Primary purple: #6c00f0
  assert(globalsCss.includes("#6c00f0"), "Should have primary purple color #6c00f0");
  
  // Purple hover: #4900a8
  assert(globalsCss.includes("#4900a8"), "Should have purple hover color #4900a8");
  
  // Deep dark: #050024
  assert(globalsCss.includes("#050024"), "Should have deep dark color #050024");
  
  // Cloud white: #f5f4f7
  assert(globalsCss.includes("#f5f4f7"), "Should have cloud white color #f5f4f7");
});

test("tailwind.config.ts should include TTTR color palette", () => {
  assert(tailwindConfig.includes("tttr:"), "Should have tttr color palette");
  assert(tailwindConfig.includes("purple:"), "Should have purple color variants");
  assert(tailwindConfig.includes("beige:"), "Should have beige color variants");
  assert(tailwindConfig.includes("blue:"), "Should have blue color variants");
  assert(tailwindConfig.includes("text:"), "Should have text color variants");
  assert(tailwindConfig.includes("surface:"), "Should have surface color variants");
});

test("tailwind.config.ts should include TTTR spacing scale", () => {
  assert(tailwindConfig.includes("tttr-4"), "Should have tttr-4 spacing");
  assert(tailwindConfig.includes("tttr-8"), "Should have tttr-8 spacing");
  assert(tailwindConfig.includes("tttr-16"), "Should have tttr-16 spacing");
  assert(tailwindConfig.includes("tttr-32"), "Should have tttr-32 spacing");
  assert(tailwindConfig.includes("tttr-64"), "Should have tttr-64 spacing");
});

test("tailwind.config.ts should include TTTR radius scale", () => {
  assert(tailwindConfig.includes("tttr-4"), "Should have tttr-4 radius");
  assert(tailwindConfig.includes("tttr-8"), "Should have tttr-8 radius");
  assert(tailwindConfig.includes("tttr-12"), "Should have tttr-12 radius");
  assert(tailwindConfig.includes("tttr-24"), "Should have tttr-24 radius");
});

test("tailwind.config.ts should configure TTTR fonts", () => {
  assert(tailwindConfig.includes("fontFamily"), "Should have fontFamily configuration");
  assert(tailwindConfig.includes("var(--tttr-font-primary)"), "Should reference font-primary variable");
  assert(tailwindConfig.includes("primary:"), "Should have primary font configuration");
  assert(tailwindConfig.includes("secondary:"), "Should have secondary font configuration");
});

test("layout.tsx should import Space Grotesk and DM Sans fonts", () => {
  assert(layout.includes("Space_Grotesk"), "Should import Space Grotesk font");
  assert(layout.includes("DM_Sans"), "Should import DM Sans font");
  assert(layout.includes("next/font/google"), "Should use next/font/google");
});

test("layout.tsx should configure font variables", () => {
  assert(layout.includes("--tttr-font-primary"), "Should set font-primary variable");
  assert(layout.includes("--tttr-font-secondary"), "Should set font-secondary variable");
  assert(layout.includes("variable:"), "Should configure font variables");
});

test("layout.tsx should apply font classes to HTML element", () => {
  assert(layout.includes("spaceGrotesk.variable"), "Should apply Space Grotesk variable");
  assert(layout.includes("dmSans.variable"), "Should apply DM Sans variable");
  assert(layout.includes("font-primary"), "Should apply font-primary class");
});

console.log("\n✅ All design token tests passed!");


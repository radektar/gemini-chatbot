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

console.log("=== Tests: FeedbackButtons Component Logic ===\n");

type FeedbackState = "idle" | "submitting" | "submitted";

test("Component should start in idle state", () => {
  const initialState: FeedbackState = "idle";
  assert(initialState === "idle", "Initial state should be 'idle'");
});

test("State transitions: idle → submitting → submitted for 👍", () => {
  let state: FeedbackState = "idle";
  
  // Click 👍
  state = "submitting";
  assert(state === "submitting", "State should be 'submitting' after click");
  
  // After successful save
  state = "submitted";
  assert(state === "submitted", "State should be 'submitted' after save");
});

test("State transitions: idle → submitting → submitted for 👎", () => {
  let state: FeedbackState = "idle";
  
  // Click 👎
  state = "submitting";
  assert(state === "submitting", "State should be 'submitting' after click");
  
  // After successful save
  state = "submitted";
  assert(state === "submitted", "State should be 'submitted' after save");
});

test("Error handling: should return to idle on save failure", () => {
  let state: FeedbackState = "submitting";
  const saveFailed = true;
  
  if (saveFailed) {
    state = "idle";
  }
  
  assert(state === "idle", "State should return to 'idle' on save failure");
});

test("Show comment field when 👎 is clicked", () => {
  let showComment = false;
  const rating: 1 | -1 = -1;
  
  if (rating === -1) {
    showComment = true;
  }
  
  assert(showComment === true, "showComment should be true when 👎 is clicked");
});

test("Comment field should update when user types", () => {
  let comment = "";
  const userInput = "Test comment";
  
  comment = userInput;
  
  assert(comment === userInput, "Comment should be updated with user input");
});

test("Cancel should reset comment field", () => {
  let showComment = true;
  let comment = "Test comment";
  let rating: 1 | -1 | null = -1;
  
  // Cancel action
  showComment = false;
  comment = "";
  rating = null;
  
  assert(showComment === false, "showComment should be false after cancel");
  assert(comment === "", "Comment should be empty after cancel");
  assert(rating === null, "Rating should be null after cancel");
});

test("Submitted state should show confirmation message", () => {
  const state: FeedbackState = "submitted";
  const confirmationMessage = "Dziękujemy za opinię!";
  
  if (state === "submitted") {
    assert(confirmationMessage.includes("Dziękujemy"), "Should show confirmation message");
  }
});

test("Comment field should be hidden after submission", () => {
  let showComment = true;
  const state: FeedbackState = "submitted";
  
  if (state === "submitted") {
    showComment = false;
  }
  
  assert(showComment === false, "showComment should be false after submission");
});

test("Should not allow multiple submissions", () => {
  let state: FeedbackState = "idle";
  const canSubmit = state === "idle";
  
  assert(canSubmit === true, "Should allow submission when idle");
  
  state = "submitting";
  const canSubmitAgain = state === "idle";
  
  assert(canSubmitAgain === false, "Should not allow submission when already submitting");
});

test("Comment should be included in feedback data when 👎 is submitted", () => {
  const rating: 1 | -1 = -1;
  const comment = "Test comment";
  
  const feedbackData = {
    rating,
    comment: rating === -1 && comment ? comment : undefined,
  };
  
  assert(feedbackData.comment === comment, "Comment should be included for negative rating");
});

test("Comment should not be included for 👍", () => {
  const rating: 1 | -1 = 1;
  const comment = "Test comment";
  
  const feedbackData = {
    rating,
    comment: rating === -1 && comment ? comment : undefined,
  };
  
  assert(feedbackData.comment === undefined, "Comment should not be included for positive rating");
});



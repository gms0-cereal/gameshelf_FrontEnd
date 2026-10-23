import { getGameReviews } from "./reviews";

async function main() {
  const reviews = await getGameReviews(
    "https://www.metacritic.com/game/baldurs-gate-3/",
    "user"
  );

  console.log("Total reviews found:", reviews.length);

  for (const [index, review] of reviews.entries()) {
    console.log(`\n--- Review ${index + 1} ---`);
    console.log("Author:", review.author);
    console.log("Score:", review.score);
    console.log("Date:", review.date);
    console.log("Review:", review.review);
    console.log("Platform:", review.platform);
  }
}

main().catch(console.error);
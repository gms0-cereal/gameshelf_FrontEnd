
import { load } from "cheerio";
import request from "./lib/request";

export interface GameReview {
  author: string | null;
  publication: string | null;
  score: number | null;
  date: string | null;
  review: string | null;
  platform: string | null;
  url: string | null;
}

export type ReviewType = "user" | "critic";

const BASE_URL = "https://www.metacritic.com";

export async function getGameReviews(
  gameUrl: string,
  reviewType: ReviewType = "user"
): Promise<GameReview[]> {
  const url = new URL(gameUrl, BASE_URL);

  const gamePath = url.pathname
    .replace(/\/+$/, "")
    .replace(/\/(user|critic)-reviews$/, "");

  const platform = url.searchParams.get("platform") || "pc";

  const reviewUrl =
    `${BASE_URL}${gamePath}/${reviewType}-reviews/` +
    `?platform=${encodeURIComponent(platform)}`;

  const res = await request({
    url: reviewUrl,
    method: "get",
  });

  const $ = load(res);
  const reviews: GameReview[] = [];

  $("[data-testid='review-card']").each((_index, element) => {
    const card = $(element);

    const header = card
      .find("[data-testid='review-card-header']")
      .first();

    const scoreLabel =
      card.find("[aria-label*='score']").first().attr("aria-label") ||
      header.attr("aria-label") ||
      "";

    const scoreMatch = scoreLabel.match(/(\d+(?:\.\d+)?)/);

    const reviewLink =
      card.find("[data-testid='review-full-review-link']").attr("href") ||
      card.find("a[href*='/review/']").attr("href") ||
      null;

    const headerText = header.text().trim();

    reviews.push({
      author:
        card.find("[data-testid='review-author']").text().trim() ||
        (reviewType === "user" ? headerText : null) ||
        null,

      publication:
        card.find("[data-testid='review-publication']").text().trim() ||
        (reviewType === "critic" ? headerText : null) ||
        null,

      score: scoreMatch ? Number(scoreMatch[1]) : null,

      date:
        card.find("[data-testid='review-card-date']").text().trim() ||
        null,

      review:
        card.find("[data-testid='review-quote-text']").text().trim() ||
        null,

      platform:
        card.find("[data-testid='review-platform']").text().trim() ||
        platform,

      url: reviewLink
        ? new URL(reviewLink, BASE_URL).toString()
        : null,
    });
  });

  return reviews;
}

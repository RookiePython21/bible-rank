import { redirect } from "next/navigation";

export default async function LeaderboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; todayPage?: string; todayCategory?: string }>;
}) {
  const { page, category, todayPage, todayCategory } = await searchParams;
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (category) params.set("category", category);
  if (todayPage) params.set("todayPage", todayPage);
  if (todayCategory) params.set("todayCategory", todayCategory);
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}

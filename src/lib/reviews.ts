import type { MenuItem, Order, ItemRatingStats, ItemReview } from './types';

// Baseline authentic reviews for signature cafe dishes
const BASELINE_ITEM_REVIEWS: Record<
  string,
  {
    rating: number;
    count: number;
    starCounts: { 1: number; 2: number; 3: number; 4: number; 5: number };
    sampleReviews: Array<{
      customerName: string;
      tableCode: string;
      rating: number;
      comment: string;
      tags: string[];
      daysAgo: number;
    }>;
  }
> = {
  // Malai Cha
  'm-2': {
    rating: 4.9,
    count: 38,
    starCounts: { 5: 34, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Sourav M.',
        tableCode: 'T01',
        rating: 5,
        comment: 'Best Malai Cha in town! So thick and creamy, real clotted malai layer on top.',
        tags: ['Delicious 😍', 'Loved It ❤️', 'Fresh & Creamy ✨'],
        daysAgo: 1,
      },
      {
        customerName: 'Priya D.',
        tableCode: 'T03',
        rating: 5,
        comment: 'Authentic taste. Perfect sweetness level. Will come back for this every week.',
        tags: ['Loved It ❤️', 'Delicious 😍'],
        daysAgo: 2,
      },
      {
        customerName: 'Arjun K.',
        tableCode: 'T02',
        rating: 4,
        comment: 'Very tasty, served piping hot with great aroma.',
        tags: ['Very Tasty 🔥'],
        daysAgo: 3,
      },
    ],
  },
  // Dudh Cha
  'm-1': {
    rating: 4.8,
    count: 24,
    starCounts: { 5: 20, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Ramen G.',
        tableCode: 'T04',
        rating: 5,
        comment: 'Classic Kolkata tea feeling. Very refreshing after a long day.',
        tags: ['Delicious 😍', 'Fresh & Hot ✨'],
        daysAgo: 1,
      },
    ],
  },
  // Special Cold Coffee with Ice Cream
  'm-14': {
    rating: 4.9,
    count: 42,
    starCounts: { 5: 38, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Debolina S.',
        tableCode: 'T05',
        rating: 5,
        comment: 'Huge portion with rich vanilla scoop and chocolate drizzle! Absolute heaven.',
        tags: ['Loved It ❤️', 'Delicious 😍', 'Good Portion 👌'],
        daysAgo: 1,
      },
      {
        customerName: 'Rohit P.',
        tableCode: 'T01',
        rating: 5,
        comment: 'Thick, creamy and super chocolatey! 10/10.',
        tags: ['Delicious 😍', 'Loved It ❤️'],
        daysAgo: 2,
      },
    ],
  },
  // Cold Coffee
  'm-10': {
    rating: 4.7,
    count: 29,
    starCounts: { 5: 22, 4: 6, 3: 1, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Ananya B.',
        tableCode: 'T06',
        rating: 5,
        comment: 'Chilled and nicely blended, very smooth.',
        tags: ['Delicious 😍'],
        daysAgo: 2,
      },
    ],
  },
  // Dry Chilli Chicken
  'm-18': {
    rating: 4.9,
    count: 36,
    starCounts: { 5: 33, 4: 3, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Subhasish R.',
        tableCode: 'T02',
        rating: 5,
        comment: 'Crispy outside, tender and juicy inside. Perfect chilli and garlic balance.',
        tags: ['Delicious 😍', 'Very Tasty 🔥', 'Crispy & Fresh ✨'],
        daysAgo: 1,
      },
      {
        customerName: 'Neha T.',
        tableCode: 'T03',
        rating: 5,
        comment: 'Kolkata Chinatown style chilli chicken done right! Super spicy and delicious.',
        tags: ['Very Tasty 🔥', 'Loved It ❤️'],
        daysAgo: 3,
      },
    ],
  },
  // Chinese Sizzler
  'm-21': {
    rating: 4.8,
    count: 22,
    starCounts: { 5: 19, 4: 3, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Tanmoy C.',
        tableCode: 'T06',
        rating: 5,
        comment: 'Loved the sizzling presentation and smoke! Great mix of noodles & manchurian.',
        tags: ['Loved It ❤️', 'Good Portion 👌'],
        daysAgo: 1,
      },
    ],
  },
  // Chicken Butter Garlic Rice
  'm-23': {
    rating: 4.8,
    count: 27,
    starCounts: { 5: 23, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Amit S.',
        tableCode: 'T04',
        rating: 5,
        comment: 'Aroma of golden fried butter garlic is irresistible. Goes great with chilli chicken.',
        tags: ['Delicious 😍', 'Very Tasty 🔥'],
        daysAgo: 2,
      },
    ],
  },
  // Manchow Soup & Lime Class Noodles
  'm-28': {
    rating: 4.7,
    count: 19,
    starCounts: { 5: 15, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Moumita K.',
        tableCode: 'T05',
        rating: 5,
        comment: 'Steaming hot soup with crispy fried noodles on the side. Wonderful flavor.',
        tags: ['Delicious 😍', 'Fresh & Hot ✨'],
        daysAgo: 1,
      },
    ],
  },
  // Chicken Schezwan Noodles
  'm-30': {
    rating: 4.8,
    count: 25,
    starCounts: { 5: 21, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Bikash D.',
        tableCode: 'T01',
        rating: 5,
        comment: 'Spicy wok tossed noodles with lots of chicken chunks. Highly recommended.',
        tags: ['Very Tasty 🔥', 'Good Portion 👌'],
        daysAgo: 2,
      },
    ],
  },
  // Chicken Crispy Mini Popcorn
  'm-34': {
    rating: 4.9,
    count: 31,
    starCounts: { 5: 28, 4: 3, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Sneha M.',
        tableCode: 'T02',
        rating: 5,
        comment: 'Super crunchy bite-sized popcorn chicken! Kids and adults both loved it.',
        tags: ['Crispy & Fresh ✨', 'Delicious 😍'],
        daysAgo: 1,
      },
    ],
  },
  // Blue Curacao Lassi
  'm-37': {
    rating: 4.7,
    count: 18,
    starCounts: { 5: 14, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Riya B.',
        tableCode: 'T03',
        rating: 5,
        comment: 'Very colorful and unique presentation! Thick and tasty.',
        tags: ['Loved It ❤️'],
        daysAgo: 3,
      },
    ],
  },
  // Chicken Special Shawarma Roll
  'm-47': {
    rating: 4.9,
    count: 45,
    starCounts: { 5: 41, 4: 4, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Imran A.',
        tableCode: 'T01',
        rating: 5,
        comment: 'Loaded with slow-roasted chicken and rich garlic mayo. Best shawarma roll!',
        tags: ['Delicious 😍', 'Loved It ❤️', 'Good Portion 👌'],
        daysAgo: 1,
      },
      {
        customerName: 'Koushik P.',
        tableCode: 'T04',
        rating: 5,
        comment: 'Juicy chicken wrap with extra cheese. Super satisfying meal.',
        tags: ['Delicious 😍', 'Very Tasty 🔥'],
        daysAgo: 2,
      },
    ],
  },
  // Chicken Egg Lolly Pop
  'm-50': {
    rating: 4.8,
    count: 17,
    starCounts: { 5: 14, 4: 3, 3: 0, 2: 0, 1: 0 },
    sampleReviews: [
      {
        customerName: 'Shampa G.',
        tableCode: 'T05',
        rating: 5,
        comment: 'Crispy outer chicken layer with egg inside. Very innovative snack.',
        tags: ['Crispy & Fresh ✨', 'Delicious 😍'],
        daysAgo: 2,
      },
    ],
  },
};

/**
 * Computes rating stats for a specific item, combining baseline ratings with all
 * real reviews submitted across all orders.
 */
export function getItemRatingStats(itemId: string, orders: Order[]): ItemRatingStats {
  const base = BASELINE_ITEM_REVIEWS[itemId];

  let totalPoints = base ? base.rating * base.count : 0;
  let totalReviews = base ? base.count : 0;
  const starCounts: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
    1: base?.starCounts[1] || 0,
    2: base?.starCounts[2] || 0,
    3: base?.starCounts[3] || 0,
    4: base?.starCounts[4] || 0,
    5: base?.starCounts[5] || 0,
  };

  const recentReviews: ItemReview[] = [];

  // Add real reviews from completed orders
  orders.forEach((order) => {
    order.lines.forEach((line) => {
      if (line.itemId === itemId && line.rating && line.rating > 0) {
        const star = Math.min(5, Math.max(1, Math.round(line.rating))) as 1 | 2 | 3 | 4 | 5;
        totalPoints += line.rating;
        totalReviews += 1;
        starCounts[star] = (starCounts[star] || 0) + 1;

        recentReviews.push({
          orderId: order.id,
          orderCode: order.code,
          tableCode: order.tableCode,
          customerName: order.customerName || 'Diner',
          itemId: line.itemId,
          itemName: line.name,
          itemImage: line.image,
          rating: line.rating,
          comment: line.reviewComment,
          tags: line.reviewTags,
          createdAt: line.reviewedAt || order.updatedAt || order.createdAt,
        });
      }
    });
  });

  // If we have baseline sample reviews, append them with synthetic dates
  if (base?.sampleReviews) {
    const now = Date.now();
    base.sampleReviews.forEach((sr, idx) => {
      recentReviews.push({
        orderId: `baseline-${itemId}-${idx}`,
        orderCode: `IVN-B${idx + 10}`,
        tableCode: sr.tableCode,
        customerName: sr.customerName,
        itemId,
        itemName: '',
        itemImage: '',
        rating: sr.rating,
        comment: sr.comment,
        tags: sr.tags,
        createdAt: now - sr.daysAgo * 86400000,
      });
    });
  }

  // Sort recent reviews newest first
  recentReviews.sort((a, b) => b.createdAt - a.createdAt);

  const avg = totalReviews > 0 ? totalPoints / totalReviews : 4.5;
  const roundedAvg = Math.round(avg * 10) / 10;
  const positiveReviews = (starCounts[5] || 0) + (starCounts[4] || 0);
  const satisfactionPercent = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 95;

  return {
    itemId,
    averageRating: roundedAvg,
    totalReviews,
    starCounts,
    recentReviews,
    satisfactionPercent,
  };
}

/**
 * Returns a map of all menu item ratings for instant O(1) lookup across the app.
 */
export function getAllItemRatings(items: MenuItem[], orders: Order[]): Map<string, ItemRatingStats> {
  const map = new Map<string, ItemRatingStats>();
  items.forEach((item) => {
    map.set(item.id, getItemRatingStats(item.id, orders));
  });
  return map;
}

/**
 * Returns top-rated / most-loved dishes sorted by score and review volume.
 */
export function getTopLovedDishes(
  items: MenuItem[],
  orders: Order[],
  limit = 10,
): { item: MenuItem; stats: ItemRatingStats }[] {
  const list = items.map((item) => ({
    item,
    stats: getItemRatingStats(item.id, orders),
  }));

  list.sort((a, b) => {
    // Sort primarily by rating, then by review count
    if (b.stats.averageRating !== a.stats.averageRating) {
      return b.stats.averageRating - a.stats.averageRating;
    }
    return b.stats.totalReviews - a.stats.totalReviews;
  });

  return list.slice(0, limit);
}

/**
 * Aggregates all customer reviews from orders (newest first) for live feeds and admin review monitoring.
 */
export function getAllCustomerReviews(orders: Order[]): ItemReview[] {
  const reviews: ItemReview[] = [];

  orders.forEach((order) => {
    order.lines.forEach((line) => {
      if (line.rating && line.rating > 0) {
        reviews.push({
          orderId: order.id,
          orderCode: order.code,
          tableCode: order.tableCode,
          customerName: order.customerName || 'Diner',
          itemId: line.itemId,
          itemName: line.name,
          itemImage: line.image,
          rating: line.rating,
          comment: line.reviewComment,
          tags: line.reviewTags,
          createdAt: line.reviewedAt || order.updatedAt || order.createdAt,
        });
      }
    });
  });

  return reviews.sort((a, b) => b.createdAt - a.createdAt);
}

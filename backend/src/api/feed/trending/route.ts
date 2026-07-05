import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Post } from '@/app/api/models/Post';
import { Comment } from '@/app/api/models/Comment';

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // Fetch the 10 most recent posts
    const allPosts = await Post.find().limit(10);
    
    // Sort posts dynamically by popularity score: (number of reactions * 2) + (number of comments * 3)
    const postsWithEngagement = await Promise.all(
      allPosts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id.toString() });
        const reactionCount = post.reactions?.reduce((acc: number, r: any) => acc + r.users.length, 0) || 0;
        const score = (reactionCount * 2) + (commentCount * 3);
        return {
          _id: post._id,
          title: post.title || post.content.substring(0, 30) + '...',
          content: post.content,
          score,
          commentCount,
          reactionCount
        };
      })
    );

    const trendingPosts = postsWithEngagement
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Hardcode some popular trending tags in the system
    const trendingTags = [
      { tag: '#announcement', count: 12 },
      { tag: '#project', count: 8 },
      { tag: '#hr', count: 6 },
      { tag: '#fun', count: 5 },
      { tag: '#development', count: 4 }
    ];

    return NextResponse.json({ success: true, trendingPosts, trendingTags }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch trending info', details: error.message }, { status: 500 });
  }
}


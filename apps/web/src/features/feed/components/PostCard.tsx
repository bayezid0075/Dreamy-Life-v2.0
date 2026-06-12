interface PostCardProps {
  id: string;
  author: { name: string; avatar?: string };
  content: string;
  createdAt: string;
  likesCount: number;
}

export default function PostCard({ author, content, createdAt, likesCount }: PostCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-primary">
          {author.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-on-surface text-sm">{author.name}</p>
          <p className="text-xs text-on-surface-variant">{createdAt}</p>
        </div>
      </div>
      <p className="text-on-surface leading-relaxed">{content}</p>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-outline/10">
        <button className="text-sm text-on-surface-variant hover:text-primary transition-colors">
          ♥ {likesCount}
        </button>
      </div>
    </div>
  );
}

interface Props {
  joined?: boolean;
  onJoin: () => void;
}

export function ProjectActionCell({ joined, onJoin }: Props) {
  if (joined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/20">
        Joined
      </span>
    );
  }
  return (
    <button
      onClick={onJoin}
      className="text-[13px] font-semibold text-warning hover:text-warning/80 hover:underline transition-colors"
      style={{ color: '#F97316' }}
    >
      Join Project
    </button>
  );
}

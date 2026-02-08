const ParticipantSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );
};

export default ParticipantSkeleton;

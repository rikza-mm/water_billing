'use client';

const HistoryCardSkeleton = () => {
  return (
    <div className="bg-[#e0e5ec] rounded-2xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] p-4 sm:p-5 animate-pulse">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Customer Info Skeleton */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
            <div>
              <div className="h-4 bg-slate-300 rounded-md w-32 mb-2"></div>
              <div className="h-3 bg-slate-300 rounded-md w-24"></div>
            </div>
          </div>
        </div>

        {/* Financial Info Skeleton */}
        <div className="flex-1 w-full sm:w-auto grid grid-cols-3 gap-2 text-center mt-4 sm:mt-0">
          <div>
            <div className="h-3 bg-slate-300 rounded-md w-16 mx-auto mb-2"></div>
            <div className="h-5 bg-slate-300 rounded-md w-20 mx-auto"></div>
          </div>
          <div>
            <div className="h-3 bg-slate-300 rounded-md w-16 mx-auto mb-2"></div>
            <div className="h-5 bg-slate-300 rounded-md w-20 mx-auto"></div>
          </div>
          <div>
            <div className="h-3 bg-slate-300 rounded-md w-16 mx-auto mb-2"></div>
            <div className="h-5 bg-slate-300 rounded-md w-20 mx-auto"></div>
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="w-full sm:w-auto flex justify-end">
          <div className="h-10 bg-slate-300 rounded-lg w-28"></div>
        </div>
      </div>
    </div>
  );
};

export default HistoryCardSkeleton;
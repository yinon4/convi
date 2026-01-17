import React from "react";

interface SkeletonLoaderProps {
  type: "result" | "config";
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type }) => {
  if (type === "result") {
    return (
      <div className="w-full animate-in duration-500 zoom-in-50">
        <div className="relative bg-base-100 shadow-xl overflow-hidden text-base-content animate-pulse card">
          {/* Background Pattern */}
          <div className="top-0 right-0 absolute bg-base-300 blur-3xl -mt-10 -mr-10 rounded-full w-40 h-40"></div>
          <div className="bottom-0 left-0 absolute bg-base-200 blur-3xl -mb-10 -ml-10 rounded-full w-40 h-40"></div>

          <div className="items-center py-12 text-center card-body">
            <div className="bg-base-300 mb-4 p-4 rounded-full w-16 h-16"></div>

            <div className="bg-base-300 mx-auto mb-2 rounded w-48 h-8"></div>
            <div className="bg-base-300 mx-auto mb-8 rounded w-64 h-6"></div>

            {/* Preview Section Skeleton */}
            <div className="mx-auto mb-6 w-full max-w-md">
              <div className="bg-base-300 mb-4 rounded w-full h-10"></div>
              <div className="bg-base-200 p-4 border border-base-300 rounded-lg">
                <div className="bg-base-300 rounded h-32"></div>
              </div>
            </div>

            <div className="flex sm:flex-row flex-col justify-center gap-3 mx-auto w-full max-w-md">
              <div className="flex-1 bg-base-300 rounded h-12"></div>
              <div className="flex-1 bg-base-300 rounded h-12"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "config") {
    return (
      <div className="slide-in-from-bottom-8 space-y-8 animate-in animate-pulse duration-500 fade-in">
        <div className="flex items-center gap-4 bg-base-200 shadow-sm p-4 border border-base-300 rounded-2xl">
          <div className="bg-base-300 rounded-xl w-12 h-12"></div>
          <div className="flex-1 min-w-0">
            <div className="bg-base-300 mb-1 rounded w-32 h-5"></div>
            <div className="bg-base-300 rounded w-16 h-4"></div>
          </div>
          <div className="bg-base-300 rounded-full w-8 h-8"></div>
        </div>

        <div className="space-y-6 bg-base-100 shadow-xl p-6 md:p-8 rounded-3xl">
          <div>
            <div className="bg-base-300 mb-4 rounded w-48 h-6"></div>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-base-300 rounded-xl w-16 h-10"></div>
              ))}
            </div>
          </div>

          <div className="bg-base-300 h-px"></div>

          <div className="bg-base-300 rounded w-full h-14"></div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;

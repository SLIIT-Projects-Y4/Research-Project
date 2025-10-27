import React from "react";

export default function PollCard({
  poll,                // {_id, question, is_open, options:[{_id,text,votes}], total_votes}
  onVote,              // (option_id) => Promise<void>
  onClose,             // () => Promise<void>
  myVotes = [],        // array of option_id the current user has voted for (if you track it)
}) {
  const disabled = !poll.is_open;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="font-semibold">{poll.question}</h3>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 text-xs rounded-full ${
            poll.is_open ? "bg-emerald-400/20 ring-1 ring-emerald-300" : "bg-gray-400/20 ring-1 ring-gray-300"
          }`}>
            {poll.is_open ? "Open" : "Closed"}
          </span>
          {poll.is_open && (
            <button
              onClick={onClose}
              className="w-12 h-5 flex items-center justify-center rounded-full 
                 bg-red-500/20 hover:bg-red-500/30 text-[8px] font-medium
                 text-white border border-red-300/40 transition"
              title="Close poll"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="p-4 space-y-3">
        {poll.options.map((opt) => {
          const pct = poll.total_votes ? Math.round((opt.votes / poll.total_votes) * 100) : 0;
          const voted = myVotes.includes(opt._id);
          return (
            <button
              key={opt._id}
              disabled={disabled}
              onClick={() => onVote(opt._id)}
              className={`w-full text-left relative group rounded-xl border px-4 py-3
                         ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-indigo-300 hover:shadow"}
                         ${voted ? "border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50" : "border-gray-200 bg-white"}`}
            >
              {/* progress bar */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, rgba(79,70,229,0.10) ${pct}%, transparent ${pct}%)`
                }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="font-medium">{opt.text}</div>
                <div className="flex items-center gap-2">
                  {voted && <span className="text-xs text-indigo-600">You</span>}
                  <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5">{opt.votes}</span>
                </div>
              </div>
              <div className="relative mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}

        <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
          <span>Total votes: {poll.total_votes}</span>
          {/* add closes_at if you have it */}
        </div>
      </div>
    </div>
  );
}

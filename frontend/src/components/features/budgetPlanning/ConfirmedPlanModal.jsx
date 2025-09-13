export default function ConfirmedPlanModal({ plan, onClose }) {
    const fullPlan = plan.full_plan;

    return (
        <div className="fixed inset-0 bg-white-300 bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
            <div
                className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Icon */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-3xl font-extrabold"
                    aria-label="Close"
                    title="Close"
                >
                    &times;
                </button>

                {/* Header */}
                <h3 className="text-2xl font-bold text-center mb-2">
                    Trip Plan #{plan.plan_number + 1}
                </h3>
                <p className="text-center text-sm text-gray-600 mb-4">
                    Confirmed At: {new Date(plan.confirmed_at).toLocaleString()}
                </p>

                {/* Summary */}
                <div className="mb-6">
                    <h4 className="font-semibold text-lg mb-2">Package Summary</h4>
                    <p className="text-gray-700">
                        <strong>Package IDs:</strong> {plan.package_ids.join(", ")}
                    </p>
                </div>

                {/* Full Plan */}
                <div>
                    <h4 className="font-semibold text-lg mb-3">Full Plan Details</h4>

                    {fullPlan && fullPlan.plan && fullPlan.plan.length > 0 ? (
                        <div className="space-y-4">
                            {fullPlan.plan.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="border border-gray-200 rounded-lg p-4 shadow-sm"
                                >
                                    <h5 className="font-semibold text-md mb-1">
                                        Sub Plan {String(idx + 1).padStart(2, "0")} | {item.Package_ID} ({item.Package_Type})
                                    </h5>
                                    <p><strong>Days:</strong> {item.Days}</p>
                                    <p><strong>Accommodation:</strong> {item.Accommodation}</p>
                                    <p><strong>Food & Transport:</strong> {item["Food & Transport"]}</p>
                                    <p><strong>Average Rating:</strong> {item.Avg_Rating}</p>
                                    <p><strong>Predicted Budget:</strong> {item.Predicted_Budget}</p>

                                    <div>
                                        <p className="font-medium mt-2">Activities:</p>
                                        <ul className="list-disc list-inside ml-4 text-gray-700">
                                            {item.Activities.map((act, i) => (
                                                <li key={i}>{act}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}

                            {/* Totals */}
                            <div className="pt-2 border-t mt-4 text-gray-800">
                                <p><strong>Total Days:</strong> {fullPlan.total_days}</p>
                                <p><strong>Total Budget:</strong> {fullPlan.total_budget}</p>
                                <p><strong>Travel Companion:</strong> {fullPlan.travel_companion}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No detailed plan available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}



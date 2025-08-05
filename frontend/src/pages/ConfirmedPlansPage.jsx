import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmedPlanModal from "../components/ConfirmedPlanModal";
import jsPDF from "jspdf";
import { FaArrowLeft } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";

export default function ConfirmedPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/confirmed-plans");
      const data = await res.json();
      setPlans(data.confirmed_plans || []);
    } catch (err) {
      console.error("Failed to fetch confirmed plans", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPDF = (plan) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 25;
    let pageNumber = 1;

    const formatLKR = (amount) =>
      new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
      }).format(amount);

    function addPageNumber() {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      const pageNumText = `Page ${pageNumber}`;
      const textWidth = doc.getTextWidth(pageNumText);
      doc.text(pageNumText, (pageWidth - textWidth) / 2, pageHeight - 10);
    }

    function addNewPage() {
      doc.addPage();
      pageNumber++;
      y = 25;
      addPageNumber();
    }

    function drawHeaderLabel(labelText, y) {
      const rectX = margin;
      const rectY = y - 8;
      const rectWidth = 60;
      const rectHeight = 14;

      doc.setFillColor(230);
      doc.roundedRect(rectX, rectY, rectWidth, rectHeight, 3, 3, 'F');

      doc.setFont("helvetica", "bold");
      doc.setTextColor(50);
      doc.text(labelText, rectX + 3, y + 3);
      return rectWidth;
    }

    function drawSeparator() {
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }

    addPageNumber();
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    const title = `Trip Plan #${plan.plan_number + 1}`;
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, y);
    y += 14;

    drawSeparator();

    doc.setFontSize(12);
    const confirmedLabelWidth = drawHeaderLabel("Confirmed At:", y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(new Date(plan.confirmed_at).toLocaleString(), margin + confirmedLabelWidth + 10, y + 3);
    y += 20;

    const packageLabelWidth = drawHeaderLabel("Package IDs:", y);
    doc.text(plan.package_ids.join(", "), margin + packageLabelWidth + 10, y + 3);
    y += 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text("Full Plan Details:", margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    plan.full_plan.plan.forEach((item, idx) => {
      if (y + 80 > pageHeight - 30) addNewPage();

      const boxHeight = 65 + item.Activities.length * 6;
      doc.setFillColor(245);
      doc.roundedRect(margin - 5, y - 10, pageWidth - 2 * margin + 10, boxHeight, 4, 4, 'F');
      doc.setDrawColor(220);
      doc.roundedRect(margin - 5, y - 10, pageWidth - 2 * margin + 10, boxHeight, 4, 4, 'S');

      const locationLabel = `Sub Plan ${String(idx + 1).padStart(2, "0")}`;

      doc.setFont("helvetica", "bold");
      doc.text("Plan:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(locationLabel, margin + 25, y);

      doc.setFont("helvetica", "bold");
      doc.text("Package:", pageWidth - margin - 100, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${item.Package_ID} (${item.Package_Type})`, pageWidth - margin - 65, y);

      y += 10;

      const details = [
        ["Days:", item.Days],
        ["Accommodation:", item.Accommodation],
        ["Food & Transport:", item["Food & Transport"]],
        ["Average Rating:", item.Avg_Rating],
        ["Predicted Budget:", formatLKR(item.Predicted_Budget)],
      ];

      details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin + 10, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), margin + 60, y);
        y += 8;
      });

      doc.setFont("helvetica", "bold");
      doc.text("Activities:", margin + 10, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      item.Activities.forEach((act) => {
        doc.text(`• ${act}`, margin + 20, y);
        y += 6;
      });

      y += 15;
    });

    if (y + 60 > pageHeight - 30) addNewPage();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", margin, y);
    y += 12;

    const summaryBoxHeight = 50;
    doc.setDrawColor(180);
    doc.roundedRect(margin - 5, y - 10, pageWidth - 2 * margin + 10, summaryBoxHeight, 5, 5, 'S');
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const summaryLabels = [
      ["Total Days:", plan.full_plan.total_days],
      ["Total Budget:", formatLKR(plan.full_plan.total_budget)],
      ["Travel Companion:", plan.full_plan.travel_companion],
    ];

    summaryLabels.forEach(([label, value], idx) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin + 10, y + (idx * 15));
      doc.setFont("helvetica", "normal");
      doc.text(String(value), margin + 60, y + (idx * 15));
    });

    addPageNumber();

    doc.save(`TripPlan_${plan.plan_number + 1}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      const res = await fetch(`http://localhost:8000/confirmed-plans/${planToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPlans(plans.filter((p) => p._id !== planToDelete._id));
      } else {
        alert("Failed to delete the plan.");
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
      alert("Error deleting the plan.");
    } finally {
      setPlanToDelete(null);
    }
  };

  return (
    <div className="max-w-full mx-auto p-6 relative min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-gray-600 hover:text-indigo-600 text-2xl"
        title="Go Back"
      >
        <FaArrowLeft />
      </button>

      <h2 className="text-3xl font-bold mb-6 text-center">Confirmed Trip Plans</h2>

      {loading && <p className="text-center mt-10">Loading confirmed plans...</p>}

      {!loading && plans.length === 0 && (
        <p className="text-center mt-10">No confirmed plans found.</p>
      )}

      {!loading && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {plans.map((plan) => (
            <div key={plan._id} className="border rounded-lg p-4 shadow hover:shadow-lg transition relative bg-white">
              <button
                onClick={() => setPlanToDelete(plan)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-xl"
                title="Delete Plan"
                aria-label="Delete Plan"
              >
                <FiTrash2 />
              </button>
              <h3 className="font-semibold text-xl mb-2">Trip Plan #{plan.plan_number + 1}</h3>
              <p><strong>Confirmed At:</strong> {new Date(plan.confirmed_at).toLocaleString()}</p>
              <p><strong>Packages Included:</strong> {plan.package_ids.join(", ")}</p>

              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => handleDownloadPDF(plan)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => handleViewDetails(plan)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPlan && (
        <ConfirmedPlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}

      {planToDelete && (
        <div
          className="fixed inset-0 bg-white-300 bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setPlanToDelete(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete <strong>Trip Plan #{planToDelete.plan_number + 1}</strong>?</p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePlan}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


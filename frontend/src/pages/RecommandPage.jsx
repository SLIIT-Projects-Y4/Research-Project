import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDialog from "../models/ConfirmDialog.jsx";
import React from "react";
import { useAuth } from "../store/auth.jsx";

export default function RecommendPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = user?.userId || location.state?.userId || null;
  console.log("userId from location.state:", userId);

  const [groups, setGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [groupCreated, setGroupCreated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [preferredDestinations, setPreferredDestinations] = useState([]);
  const [prefs, setPrefs] = useState(null);
  const [destinationsReady, setDestinationsReady] = useState(false);

  const serverUrl = "https://trip-collab-be.livelydesert-2195a427.southeastasia.azurecontainerapps.io";

  // Confirm modal state
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    _resolver: null, // internal
  });

  // Ask function that returns a Promise<boolean>
  const askConfirm = ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) =>
    new Promise((resolve) => {
      setConfirmState({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        _resolver: (answer) => {
          resolve(answer);
          setConfirmState((s) => ({ ...s, open: false, _resolver: null }));
        },
      });
    });

  // Handlers passed to the dialog
  const handleConfirmClose = () => confirmState._resolver?.(false);
  const handleConfirmOk = () => confirmState._resolver?.(true);

  const getNumericAge = (ageGroup) => {
    if (!ageGroup || typeof ageGroup !== "string") return 18;

    if (ageGroup === "50+") return 50;

    const [min] = ageGroup.split("-");
    const age = parseInt(min);

    return isNaN(age) ? 18 : age;
  };

  // put this inside RecommendPage component, above useEffect
  const mergeById = (prev, incoming) => {
    const map = new Map(prev.map((g) => [g.Group_ID, g]));
    for (const g of incoming || []) map.set(g.Group_ID, g);
    return Array.from(map.values());
  };

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/auth/preferences/${userId}`
        );
        if (res.status === 304) return; // defensive: 304 has no body
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json(); // your backend is sending user directly
        setPrefs(data);
      } catch (e) {
        console.error("Failed to load preferences", e);
        toast.error("Could not load your preferences.");
      }
    };
    loadPrefs();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadPlanPoolNames = async () => {
      try {
        const url = `http://localhost:3000/api/auth/users/${userId}/plan-pool-names`;
        const res = await fetch(url, { cache: "no-store" }); // ⬅️ bypass cache

        if (res.status === 304) return; // nothing new; keep previous state
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json().catch(() => ({ names: [] }));
        setPreferredDestinations(Array.isArray(data.names) ? data.names : []);
      } catch (e) {
        console.warn("plan-pool-names fetch failed:", e);
        setPreferredDestinations([]);
      } finally {
      setDestinationsReady(true); // ✅ mark as ready
    }
    };

    loadPlanPoolNames();
  }, [userId]);

  useEffect(() => {
    if (waiting) {
      const t = setTimeout(() => setWaiting(false), 5000); // hide after 5s
      return () => clearTimeout(t);
    }
  }, [waiting]);

  useEffect(() => {
   if (!userId || !prefs || !destinationsReady) return;
   const ac = new AbortController();

    const fetchGroups = async () => {
      try {
        setLoading(true);
        const [joinedRes, recRes] = await Promise.all([
          fetch(`${serverUrl}/groups/joined/${userId}`, { signal: ac.signal }),
          fetch(`${serverUrl}/recommend/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              Age: getNumericAge(prefs?.age_group),
              Budget: prefs?.budget,
              Travel_Style: prefs?.travel_style,
              User_Interest: prefs?.preferred_activities,
              user_id: userId,
              Preferred_Destination: preferredDestinations,
            }),
            signal: ac.signal,
          }),
        ]);

        const joinedData = await joinedRes.json();
        const recommendedData = await recRes.json();

        setJoinedGroups(joinedData);
        const hasCreatedGroup = joinedData.some((g) => g.Status === "Inactive");
        setGroupCreated(hasCreatedGroup);

        const joinedIds = joinedData.map((g) => g.Group_ID);
        const filtered = recommendedData.recommendations.filter(
          (g) => !joinedIds.includes(g.Group_ID)
        );
        setGroups((prev) => mergeById(prev, filtered));
      } catch (err) {
        console.error("❌ Failed to load group data:", err);
        toast.error("Could not load your groups. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [userId, prefs, destinationsReady, preferredDestinations]);

  const handleJoin = async (groupId) => {
    try {
      const groupRes = await fetch(`${serverUrl}/groups/details/${groupId}`);
      const group = await groupRes.json();

      if (group.Status === "Inactive") {
        const ok = await askConfirm({
          title: "Join inactive group?",
          message:
            "This group is currently inactive. You’ll be added and must wait until another member joins. Do you want to continue?",
          confirmText: "Continue",
          cancelText: "Cancel",
        });
        if (!ok) return;
      }

      const res = await fetch(`${serverUrl}/groups/join/${groupId}/${userId}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to join group");

      const result = await res.json();
      setJoinedGroups((prev) => [...prev, group]);
      setGroups((prev) => prev.filter((g) => g.Group_ID !== groupId));

      if (result.Status === "Active") {
        toast.success("Joined! Taking you to chat…");
        navigate("/chat", {
          state: {
            group_id: groupId,
            user_id: userId,
          },
        });
      } else {
        setWaiting(true);
        setStatusMessage(
          "✅ You’ve joined the group. Waiting for another member."
        );
        toast.success(
          "You’ve joined the group. We’ll notify you when it activates."
        );
      }
    } catch (err) {
      console.error("❌ Error joining group:", err);
      toast.error("Could not join group. Please try again.");
    }
  };

  const handleCreateGroup = async () => {
    try {
      const res = await fetch(`${serverUrl}/groups/createByML`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_data: {
            Age: getNumericAge(prefs?.age_group),
            Budget: prefs?.budget,
            Travel_Style: prefs?.travel_style,
            User_Interest: prefs?.preferred_activities,
            user_id: userId,
          },
        }),
      });

      const data = await res.json();

      if (data.error) {
        setGroupCreated(true);
        toast.warn(String(data.error));
        return;
      }

      const groupId = data.Group_ID;

      const joinRes = await fetch(
        `${serverUrl}/groups/join/${groupId}/${userId}`,
        {
          method: "POST",
        }
      );

      if (!joinRes.ok) throw new Error("Failed to join group");

      const joinedGroupRes = await fetch(
        `${serverUrl}/groups/details/${groupId}`
      );
      const joinedGroup = await joinedGroupRes.json();

      setGroupCreated(true);
      setJoinedGroups((prev) => [...prev, joinedGroup]);

      toast.success("Group created and joined!");
      if (joinedGroup.Status === "Inactive") {
        setWaiting(true);
        setStatusMessage(
          "✅ You've created and joined the group. Waiting for another member."
        );
        toast.info("Waiting for another member to join.");
      }
    } catch (err) {
      console.error("❌ Failed to create/join group:", err);
      toast.error("Something went wrong while creating or joining your group.");
    }
  };

  const [loadingMore, setLoadingMore] = useState(false);

  const handleRecommendMore = async () => {
    if (loadingMore) return; // prevent double-click spamming
    setLoadingMore(true);

    try {
      const rejectedIds = [
        ...joinedGroups.map((g) => g.Group_ID),
        ...groups.map((g) => g.Group_ID),
      ];

      const res = await fetch(`${serverUrl}/groups/recommandNewGroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_data: {
            Age: getNumericAge(prefs?.age_group),
            Budget: prefs?.budget,
            Travel_Style: prefs?.travel_style,
            User_Interest: prefs?.preferred_activities,
            user_id: userId,
            Preferred_Destination: preferredDestinations,
          },
          rejected_ids: rejectedIds,
        }),
      });

      const data = await res.json();
      if (data.recommendations?.length > 0) {
        // ✅ append + dedupe so items persist
        setGroups((prev) => mergeById(prev, data.recommendations));
      } else {
        // optionally show a toast/snackbar here
        console.log("No more similar groups found.");
        toast.info("No more similar groups right now.");
      }
    } catch (err) {
      console.error("❌ Failed to fetch more recommendations:", err);
      toast.error("Unable to load more recommendations.");
    } finally {
      setLoadingMore(false);
    }
  };

  // if (!prefs) {
  //   return (
  //     <div className="mx-auto max-w-6xl px-6 py-16">
  //       <p className="rounded-xl bg-rose-50 px-4 py-3 text-rose-700">
  //         No user data found.
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <div className="relative isolate bg-white">
      {/* soft background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-12 -z-10 mx-auto h-64 max-w-6xl blur-2xl"
        style={{
          background:
            "radial-gradient(40% 60% at 20% 40%, rgba(255,214,102,.35) 0, transparent 60%), radial-gradient(40% 60% at 80% 20%, rgba(255,113,113,.25) 0, transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-16">
        {/* Header */}
        <header className="mb-10 text-center">
          <br></br>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="text-slate-900">Find your perfect</span>{" "}
            <span className="text-orange-400">travel group</span>
          </h1>
          <p className="mx-auto mt-4 max-w-prose text-slate-600 text-center">
            Based on your preferences. Join an active group or create a new one
            and we’ll match additional members automatically.
          </p>

          {/* hero CTAs */}
        </header>

        {/* Joined Groups */}
        {joinedGroups.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 text-center text-4xl lg:text-5xl font-bold text-gray-900">
              Your Joined Groups
            </h2>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {joinedGroups.map((g) => (
                <div
                  key={g.Group_ID}
                  className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm transition hover:shadow-lg"
                >
                  {/* top badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      Joined
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700">
                      {g.Status}
                    </span>
                  </div>

                  <h3 className="line-clamp-1 text-xl font-bold text-slate-900">
                    {g.Group_Name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      Interests:
                    </span>{" "}
                    {g.Group_Interest.join(", ")}
                  </p>

                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Style:</span>{" "}
                    {g.Travel_Style}
                  </p>

                  <button
                    disabled={g.Status !== "Active"}
                    onClick={() =>
                      navigate("/chat", {
                        state: { group_id: g.Group_ID, user_id: userId },
                      })
                    }
                    className={[
                      "mt-5 w-full rounded-full px-5 py-2.5 text-sm font-semibold transition",
                      g.Status === "Active"
                        ? "bg-amber-400 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-md"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed",
                    ].join(" ")}
                  >
                    {g.Status === "Active"
                      ? "Go to Chat"
                      : "Waiting for Members"}
                  </button>

                  {/* corner plane */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-6 -top-6 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <span className="text-3xl">🛫</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Groups */}
        <section>
          <h2 className="mb-6 text-center text-4xl lg:text-5xl font-bold text-gray-900">
            Recommended Groups
          </h2>

          {loading ? (
            /* skeletons */
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-3xl border border-slate-200 p-6"
                >
                  <div className="mb-3 h-5 w-28 rounded bg-slate-200" />
                  <div className="h-6 w-3/4 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-full rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
                  <div className="mt-6 h-10 w-full rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          ) : groups.length > 0 ? (
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <article
                  key={g.Group_ID}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* header row */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-xl font-bold text-slate-900">
                      {g.Group_Name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {g.Budget} Budget
                    </span>
                  </div>

                  {/* chips */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {g.Group_Interest.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {g.Group_Interest.length > 4 && (
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                        +{g.Group_Interest.length - 4} more
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      Related Destinations:
                    </span>{" "}
                    {Array.isArray(g.Destinations_Planned) &&
                    g.Destinations_Planned.length > 0
                      ? g.Destinations_Planned.join(", ")
                      : "No related destinations available"}
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Style:</span>{" "}
                    {g.Travel_Style}
                  </p>

                  <button
                    className="mt-5 w-full rounded-full bg-amber-100 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-md"
                    onClick={() => handleJoin(g.Group_ID)}
                  >
                    Join Group
                  </button>

                  {/* decorative plane */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-6 -right-4 rotate-12 opacity-0 transition group-hover:opacity-100"
                  >
                    <span className="text-4xl">🛩️</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* empty state */
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 p-10 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-amber-100 text-2xl leading-[48px]">
                <span role="img" aria-label="search">
                  🔎
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No recommendations yet
              </h3>
              <p className="mt-2 text-slate-600">
                Tell us a bit more (budget, interests) and we’ll curate groups
                that fit.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={handleRecommendMore}
                  className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-500"
                >
                  Refresh Recommendations
                </button>
                {!groupCreated && (
                  <button
                    onClick={handleCreateGroup}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    Create Your Own
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* sticky bottom CTA bar */}
      {!loading && (
        <div className="mt-3 z-10 mx-auto flex w-full max-w-3xl items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/90 px-3 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleCreateGroup}
              className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-md"
            >
              <span>Create New Group</span>
              <span aria-hidden>✈️</span>
            </button>

            <button
              onClick={handleRecommendMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {loadingMore ? "…" : "▶"}
              </span>
              {loadingMore ? "Loading…" : "Recommend More"}
            </button>
          </div>
        </div>
      )}

      {waiting && statusMessage && (
        <div className="mx-auto mb-6 mt-6 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-amber-900">
          {statusMessage}
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmOk}
      />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { getMyPreferences, updateMyPreferences } from "@/api/preferences.js";
import { getMe, refreshAuth } from "@/api/auth";
import { useAuth } from "@/store/auth.jsx";
import { useNavigate } from "react-router-dom";
import { Button, Select, Stack, Container, Group, Text } from "@mantine/core";
import { toast } from "react-toastify";
import { ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import loginImage from "../../../public/assets/loginImage.jpg"; // fallback

/* -------------------- Data (unchanged) -------------------- */
const AGE_GROUPS = ["18-25", "26-35", "36-50", "51+"];
const GENDERS = ["Female", "Male", "Other"];
const TRAVEL_COMPANIONS = ["Couple", "Family", "Friends", "Solo"];
const STEPS = ["Demographics", "Companion", "Activities", "Preferences"];
const BUDGET_OPTIONS = ["Low", "Medium", "High"];
const TRAVEL_STYLE = ["Backpacker", "Luxury", "Balanced", "Adventurous", "Relaxed"];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const ACTIVITIES = [
  "Agricultural Workshops","Animal Watching","Architectural Marvel","Beach Hopping","Bird Watching",
  "Boat Tours","Boating","Cultural Activities","Cultural Exploration","Cultural Tours","Educational Tours",
  "Exploring Exhibits","Factory Tours","Guided Tours","Hiking","Historical Exploration","Jet Skiing",
  "Kayaking","Kit Surfing","Kite Surfing","Learning History","Meditation","Nature Photography",
  "Nature Walks","Photography","Rafting","Relaxation","Sightseeing","Snorkeling","Sunbathing",
  "Surfing","Swimming","Trekking","Walking Trails","Wildlife Safaris","Wildlife Spotting","Worship","Yoga",
];

/* ---------- Step-specific hero images (replace with your assets if you want) ---------- */
const STEP_IMAGES = [
  // Demographics → iconic city/people
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop",
  // Companion → friends/couple
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  // Activities → adventure / hiking
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop",
  // Preferences → lifestyle/luxury
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1600&auto=format&fit=crop",
].map((u) => u || loginImage);

/* -------------------- Component -------------------- */
export default function PreferencesWizard() {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activitiesShown, setActivitiesShown] = useState(10);

  const [form, setForm] = useState({
    age_group: "",
    gender: "",
    country: "",
    travel_companion: "",
    preferred_activities: [],
    travel_style: "",
    budget: "",
  });

  /* -------- Init (logic unchanged) -------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyPreferences();
        const data = res?.data ?? res;
        if (data) setForm((prev) => ({ ...prev, ...data }));
      } catch { /* ignore */ }
    })();
  }, []);

  const canNext = useMemo(() => {
    if (step === 0) return !!form.age_group && !!form.gender && !!form.country;
    if (step === 1) return !!form.travel_companion;
    if (step === 2) return Array.isArray(form.preferred_activities) && form.preferred_activities.length >= 2;
    if (step === 3) return !!form.travel_style && !!form.budget;
    return false;
  }, [step, form]);

  const shadowRefreshUser = async () => {
    try {
      const refreshed = await refreshAuth();
      if (refreshed?.token && refreshed?.user) {
        login(refreshed.token, refreshed.user);
        return;
      }
    } catch { /* fall through */ }

    try {
      const me = await getMe();
      const updatedUser = me?.user ?? me?.data ?? me;
      if (updatedUser) updateUser(updatedUser);
    } catch { /* ignore */ }
  };

  const saveAndNext = async () => {
    if (!canNext) return toast.error("Please complete this step");
    try {
      setLoading(true);
      const res = await updateMyPreferences({ ...form });
      const statusOk = res?.status === "ok" || res?.success === true || !!res;
      if (statusOk) {
        toast.success("Saved!");
        await shadowRefreshUser();
      }
      if (step < STEPS.length - 1) setStep((s) => s + 1);
      else {
        toast.success("All set!");
        navigate("/home");
      }
    } catch {
      toast.error("Save failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));
  const progress = ((step + 1) / STEPS.length) * 100;

  const titles = ["About You", "Travel Partner", "Activities", "Final Touches"];
  const subtitles = [
    "Let’s get to know you better.",
    "Who are you traveling with?",
    "Pick a few things you enjoy.",
    "Choose your style and budget."
  ];

  const displayedActivities = ACTIVITIES.slice(0, activitiesShown);

  /* -------- Motion (UI only) -------- */
  const stepVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
  };

  const optionBase =
    "h-12 sm:h-14 w-full rounded-xl border text-sm sm:text-[15px] font-semibold " +
    "flex items-center justify-center transition bg-white/80 text-[#0b1622] border-white/60 hover:bg-white";
  const optionActive = "ring-2 ring-[var(--color-brave-orange)] text-[var(--color-brave-orange)]";

  return (
    <div className="min-h-screen relative bg-[#0b1622] text-white">

      {/* Desktop Left Hero (changes per step) */}
      <motion.aside
        key={step}
        className="hidden xl:block fixed left-0 top-0 h-full w-[40vw] bg-cover bg-center"
        style={{ backgroundImage: `url(${STEP_IMAGES[step] || loginImage})` }}
        initial={{ opacity: 0.6, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/35 to-transparent" />
        {/* Caption */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold">
            <span>{step + 1} / {STEPS.length}</span>
            <span className="text-[var(--color-brave-orange)]">•</span>
            <span>{STEPS[step]}</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold drop-shadow-sm">{titles[step]}</h2>
          <p className="text-white/80">{subtitles[step]}</p>
        </div>
      </motion.aside>

      {/* Content column */}
      <div className="relative xl:ml-[40vw]">
        {/* Mobile hero with step image */}
        <motion.div
          key={`m-${step}`}
          className="xl:hidden h-44 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${STEP_IMAGES[step] || loginImage})` }}
          initial={{ opacity: 0.6, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="h-full w-full bg-gradient-to-b from-black/50 via-black/40 to-[#0b1622]" />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center justify-between">
              <button
                onClick={back}
                disabled={step === 0}
                className={`p-2 rounded-md ${step === 0 ? "opacity-40" : "hover:bg-white/10"} border border-white/30`}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="text-xs font-semibold opacity-90">{step + 1} / {STEPS.length}</div>
            </div>
            <h3 className="mt-2 font-display text-2xl font-extrabold">{titles[step]}</h3>
            <p className="text-[13px] text-white/85">{subtitles[step]}</p>
          </div>
        </motion.div>

        {/* Top bar (desktop) */}
        <div className="hidden xl:block sticky top-0 z-20 bg-[#0b1622]/85 backdrop-blur-md border-b border-white/10">
          <Container size="lg" className="py-3">
            <Group position="apart" align="center">
              <Group spacing={8}>
                <button
                  onClick={back}
                  disabled={step === 0}
                  className={`p-2 rounded-md ${step === 0 ? "opacity-40" : "hover:bg-white/10"} border border-white/20`}
                >
                  <ArrowLeft size={18} />
                </button>
                <Text className="font-semibold">Travel Preferences</Text>
              </Group>
              <div className="w-72 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--color-brave-orange)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </div>
            </Group>
          </Container>
        </div>

        {/* Main card */}
        <div className="py-6 sm:py-10">
          <Container size="lg">
            <div
              className="mx-auto max-w-3xl rounded-2xl border shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
              style={{
                background: "rgba(255,255,255,0.92)",        // lighter for contrast
                borderColor: "rgba(0,0,0,0.08)",
                color: "#0b1622",
              }}
            >
              {/* Heading (desktop – we already show in hero on mobile) */}
              <div className="hidden xl:block px-8 pt-8 pb-2 text-center">
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0b1622] mb-1">
                  {titles[step]}
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#0b1622]/70">{subtitles[step]}</p>
              </div>

              <div className="px-6 sm:px-8 pb-8">
                <AnimatePresence mode="wait">
                  {/* Step 0 */}
                  {step === 0 && (
                    <motion.div key="demographics" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                      <Stack spacing={24}>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#0b1622] mb-2">
                            Age Group
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {AGE_GROUPS.map((age) => {
                              const active = form.age_group === age;
                              return (
                                <motion.button
                                  key={age}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setForm((f) => ({ ...f, age_group: age }))}
                                  className={`${optionBase} ${active ? optionActive : ""}`}
                                >
                                  {age}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#0b1622] mb-2">
                            Gender
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {GENDERS.map((g) => {
                              const active = form.gender === g;
                              return (
                                <motion.button
                                  key={g}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setForm((f) => ({ ...f, gender: g }))}
                                  className={`${optionBase} ${active ? optionActive : ""}`}
                                >
                                  {g}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <Select
                          label="Country"
                          placeholder="Select your country"
                          data={COUNTRIES}
                          value={form.country}
                          onChange={(v) => setForm((f) => ({ ...f, country: v || "" }))}
                          searchable
                          clearable={false}
                          maxDropdownHeight={220}
                          styles={{
                            label: { color: "#0b1622", fontSize: 13, fontWeight: 700, marginBottom: 8 },
                            input: {
                              background: "white",
                              borderColor: "#d1d5db",
                              color: "#0b1622",
                              borderRadius: 10,
                              height: 44,
                              fontSize: 14,
                            },
                            placeholder: { color: "#6b7280" },
                            dropdown: { background: "white", borderColor: "#e5e7eb" },
                            option: {
                              color: "#0b1622",
                              "&[data-hovered]": { background: "#f3f4f6" },
                              fontSize: 14,
                              padding: "8px 10px",
                            },
                          }}
                        />
                      </Stack>
                    </motion.div>
                  )}

                  {/* Step 1 */}
                  {step === 1 && (
                    <motion.div key="companion" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                      <label className="block text-[13px] font-semibold text-[#0b1622] mb-3">
                        Who are you traveling with?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {TRAVEL_COMPANIONS.map((c) => {
                          const active = form.travel_companion === c;
                          return (
                            <motion.button
                              key={c}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setForm((f) => ({ ...f, travel_companion: c }))}
                              className={`${optionBase} ${active ? optionActive : ""}`}
                            >
                              {c}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <motion.div key="activities" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                      <label className="block text-[13px] font-semibold text-[#0b1622] mb-3">
                        What interests you? (Select at least 2)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                        {displayedActivities.map((a) => {
                          const active = form.preferred_activities.includes(a);
                          return (
                            <motion.button
                              key={a}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  preferred_activities: active
                                    ? f.preferred_activities.filter((x) => x !== a)
                                    : [...f.preferred_activities, a],
                                }))
                              }
                              className={`h-11 sm:h-12 w-full rounded-xl border text-xs sm:text-[13px] font-semibold
                                flex items-center justify-center transition
                                bg-white/80 text-[#0b1622] border-white/60 hover:bg-white
                                ${active ? optionActive : ""}`}
                            >
                              {a}
                            </motion.button>
                          );
                        })}
                      </div>
                      {activitiesShown < ACTIVITIES.length && (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="mt-3 w-full py-2 text-sm font-bold rounded-xl border border-[var(--color-brave-orange)] text-[var(--color-brave-orange)] bg-white hover:bg-[#FFF5F0]"
                          onClick={() => setActivitiesShown((s) => s + 10)}
                        >
                          Show More
                        </motion.button>
                      )}
                    </motion.div>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <motion.div key="preferences" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                      <Stack spacing={28}>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#0b1622] mb-3">Travel Style</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {TRAVEL_STYLE.map((s) => {
                              const active = form.travel_style === s;
                              return (
                                <motion.button
                                  key={s}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setForm((f) => ({ ...f, travel_style: s }))}
                                  className={`${optionBase} ${active ? optionActive : ""}`}
                                >
                                  {s}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#0b1622] mb-3">Budget</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {BUDGET_OPTIONS.map((b) => {
                              const active = form.budget === b;
                              return (
                                <motion.button
                                  key={b}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setForm((f) => ({ ...f, budget: b }))}
                                  className={`${optionBase} ${active ? optionActive : ""}`}
                                >
                                  {b}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </Stack>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Container>
        </div>

        {/* Footer (aligned) */}
        <motion.div
          className="bg-[#0b1622]/85 backdrop-blur-md border-t border-white/10 py-4 sticky bottom-0 z-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Container size="lg">
            <div className="mx-auto max-w-3xl">
              <Group spacing={10}>
                <Button
                  onClick={back}
                  disabled={step === 0 || loading}
                  variant="default"
                  className="flex-1 rounded-md text-sm font-semibold"
                  styles={{
                    root: {
                      background: "white",
                      borderColor: "#e5e7eb",
                      color: "#0b1622",
                      height: 44,
                    },
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={saveAndNext}
                  loading={loading}
                  disabled={!canNext}
                  rightIcon={!loading && canNext && <ChevronRight size={18} />}
                  className="flex-1 rounded-md text-sm font-bold"
                  styles={{
                    root: {
                      background: canNext ? "var(--color-brave-orange)" : "#f1f5f9",
                      color: canNext ? "white" : "#64748b",
                      height: 44,
                      transition: "all 0.25s ease",
                      boxShadow: canNext ? "0 6px 20px rgba(253,102,30,0.35)" : "none",
                    },
                  }}
                >
                  {step === STEPS.length - 1 ? "Complete" : "Next"}
                </Button>
              </Group>
            </div>
          </Container>
        </motion.div>
      </div>
    </div>
  );
}

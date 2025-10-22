// src/pages/Onboarding/PreferencesWizard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getMyPreferences, updateMyPreferences } from "@/api/preferences.js";
import { getMe, refreshAuth } from "@/api/auth";
import { useAuth } from "@/store/auth.jsx";
import { useNavigate } from "react-router-dom";
import { Button, Select, Stack, Progress, Text, Container, Group } from "@mantine/core";
import { toast } from "react-toastify";
import { ChevronRight, ArrowLeft } from "lucide-react";
import loginImage from '../../../public/assets/loginImage.jpg'

const AGE_GROUPS = ["18-25", "26-35", "36-50", "51+"];
const GENDERS = ["Female", "Male", "Other"];
const TRAVEL_COMPANIONS = ["Couple", "Family", "Friends", "Solo"];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
  "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
  "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil",
  "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
  "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China",
  "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

const ACTIVITIES = [
  "Agricultural Workshops", "Animal Watching", "Architectural Marvel",
  "Beach Hopping", "Bird Watching", "Boat Tours", "Boating",
  "Cultural Activities", "Cultural Exploration", "Cultural Tours",
  "Educational Tours", "Exploring Exhibits", "Factory Tours", "Guided Tours",
  "Hiking", "Historical Exploration", "Jet Skiing", "Kayaking",
  "Kit Surfing", "Kite Surfing", "Learning History", "Meditation",
  "Nature Photography", "Nature Walks", "Photography", "Rafting",
  "Relaxation", "Sightseeing", "Snorkeling", "Sunbathing",
  "Surfing", "Swimming", "Trekking", "Walking Trails",
  "Wildlife Safaris", "Wildlife Spotting", "Worship", "Yoga",
];

const STEPS = ["Demographics", "Companion", "Activities", "Preferences"];
const BUDGET_OPTIONS = ["Low", "Medium", "High"];
const TRAVEL_STYLE = ["Backpacker", "Luxury", "Balanced", "Adventurous", "Relaxed"];

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

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyPreferences();
        const data = res?.data ?? res;
        if (data) setForm((prev) => ({ ...prev, ...data }));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const canNext = useMemo(() => {
    if (step === 0) return !!form.age_group && !!form.gender && !!form.country;
    if (step === 1) return !!form.travel_companion;
    if (step === 2)
      return Array.isArray(form.preferred_activities) && form.preferred_activities.length >= 2;
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
    } catch {
      /* fall through */
    }

    try {
      const me = await getMe();
      const updatedUser = me?.user ?? me?.data ?? me;
      if (updatedUser) updateUser(updatedUser);
    } catch {
      /* ignore */
    }
  };

  const saveAndNext = async () => {
    if (!canNext) {
      toast.error("Please complete this step");
      return;
    }
    try {
      setLoading(true);
      const res = await updateMyPreferences({ ...form });

      const statusOk = res?.status === "ok" || res?.success === true || !!res;
      if (statusOk) {
        toast.success("Saved!");
        await shadowRefreshUser();
      }

      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
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
    "Let's get to know you",
    "Who are you traveling with?",
    "What interests you?",
    "Budget and travel styles"
  ];

  const displayedActivities = ACTIVITIES.slice(0, activitiesShown);

  return (
    <div className="min-h-screen flex" style={{ background: '#ffffff' }}>
      {/* Left - Image */}
      <div
        className="hidden lg:block lg:w-2/3 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${loginImage})` }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-2/3 flex flex-col h-screen" style={{ background: '#f9fafb' }}>
        {/* Top Navigation */}
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 0', background: '#ffffff', flexShrink: 0 }}>
          <Container size="xl">
            <Group position="apart" align="center">
              <Group spacing={8}>
                <button
                  onClick={back}
                  disabled={step === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: step === 0 ? 'default' : 'pointer',
                    opacity: step === 0 ? 0.3 : 1,
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <ArrowLeft size={20} color="#1f2937" />
                </button>
                <Text style={{ color: '#111827', fontSize: '16px', fontWeight: '700' }} className="font-display">
                  Travel Preferences
                </Text>
              </Group>
              <Text style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600' }}>
                {step + 1} of {STEPS.length}
              </Text>
            </Group>

            {/* Progress Bar */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ width: '100%', background: '#e5e7eb', height: '3px', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#FD661E',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </Container>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '32px 0' }}>
          <Container size="md">
            <div style={{ maxWidth: '550px', margin: '0 auto', paddingX: '20px' }}>
              {/* Step Indicator */}
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                  color: '#111827',
                  fontSize: '32px',
                  fontWeight: '900',
                  lineHeight: '1.2',
                  marginBottom: '8px'
                }} className="font-display">
                  {titles[step]}
                </h1>
                <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.5' }} className="font-body">
                  {subtitles[step]}
                </p>
              </div>

              {/* Form Content */}
              <Stack spacing={24}>
                {step === 0 && (
                  <>
                    <div>
                      <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                        Age Group
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {AGE_GROUPS.map(age => (
                          <button
                            key={age}
                            onClick={() => setForm(f => ({ ...f, age_group: age }))}
                            style={{
                              padding: '12px 10px',
                              borderRadius: '6px',
                              border: form.age_group === age ? '2px solid #FD661E' : '1px solid #d1d5db',
                              background: form.age_group === age ? '#FFF5F0' : '#ffffff',
                              color: form.age_group === age ? '#FD661E' : '#374151',
                              fontWeight: form.age_group === age ? '700' : '500',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s',
                              textAlign: 'center'
                            }}
                          >
                            {age}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                        Gender
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {GENDERS.map(gender => (
                          <button
                            key={gender}
                            onClick={() => setForm(f => ({ ...f, gender }))}
                            style={{
                              padding: '12px 10px',
                              borderRadius: '6px',
                              border: form.gender === gender ? '2px solid #FD661E' : '1px solid #d1d5db',
                              background: form.gender === gender ? '#FFF5F0' : '#ffffff',
                              color: form.gender === gender ? '#FD661E' : '#374151',
                              fontWeight: form.gender === gender ? '700' : '500',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s',
                              textAlign: 'center'
                            }}
                          >
                            {gender}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Select
                      label="Country"
                      placeholder="Select"
                      data={COUNTRIES}
                      value={form.country}
                      onChange={(v) => setForm(f => ({ ...f, country: v || "" }))}
                      searchable
                      clearable={false}
                      maxDropdownHeight={200}
                      styles={{
                        label: { color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '10px' },
                        input: {
                          background: '#ffffff',
                          borderColor: '#d1d5db',
                          color: '#111827',
                          borderRadius: '6px',
                          height: '40px',
                          fontSize: '14px',
                        },
                        placeholder: { color: '#9ca3af' },
                        dropdown: { background: '#ffffff', borderColor: '#d1d5db' },
                        option: { color: '#111827', '&:hover': { background: '#f3f4f6' }, padding: '8px 10px', fontSize: '14px' },
                      }}
                    />
                  </>
                )}

                {step === 1 && (
                  <div>
                    <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '14px', display: 'block' }}>
                      Who are you traveling with?
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {TRAVEL_COMPANIONS.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm(f => ({ ...f, travel_companion: c }))}
                          style={{
                            padding: '14px 12px',
                            borderRadius: '6px',
                            border: form.travel_companion === c ? '2px solid #FD661E' : '1px solid #d1d5db',
                            background: form.travel_companion === c ? '#FFF5F0' : '#ffffff',
                            color: form.travel_companion === c ? '#FD661E' : '#374151',
                            fontWeight: form.travel_companion === c ? '700' : '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '14px', display: 'block' }}>
                      What interests you? (Select at least 2)
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      paddingRight: '4px',
                      marginBottom: '14px'
                    }}>
                      {displayedActivities.map((activity) => (
                        <button
                          key={activity}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              preferred_activities: f.preferred_activities.includes(activity)
                                ? f.preferred_activities.filter((a) => a !== activity)
                                : [...f.preferred_activities, activity],
                            }))
                          }
                          style={{
                            padding: '10px 8px',
                            borderRadius: '6px',
                            border: form.preferred_activities.includes(activity) ? '2px solid #FD661E' : '1px solid #d1d5db',
                            background: form.preferred_activities.includes(activity) ? '#FFF5F0' : '#ffffff',
                            color: form.preferred_activities.includes(activity) ? '#FD661E' : '#374151',
                            fontWeight: form.preferred_activities.includes(activity) ? '700' : '500',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                          }}
                        >
                          {activity}
                        </button>
                      ))}
                    </div>
                    {activitiesShown < ACTIVITIES.length && (
                      <button
                        onClick={() => setActivitiesShown((s) => s + 10)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#ffffff',
                          border: '1px solid #FD661E',
                          color: '#FD661E',
                          fontWeight: '600',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#FFF5F0'}
                        onMouseLeave={(e) => e.target.style.background = '#ffffff'}
                      >
                        Show More
                      </button>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '14px', display: 'block' }}>
                        Travel Style
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {TRAVEL_STYLE.map(s => (
                          <button
                            key={s}
                            onClick={() => setForm(f => ({ ...f, travel_style: s }))}
                            style={{
                              padding: '12px 10px',
                              borderRadius: '6px',
                              border: form.travel_style === s ? '2px solid #FD661E' : '1px solid #d1d5db',
                              background: form.travel_style === s ? '#FFF5F0' : '#ffffff',
                              color: form.travel_style === s ? '#FD661E' : '#374151',
                              fontWeight: form.travel_style === s ? '700' : '600',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s',
                              textAlign: 'center'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '14px', display: 'block' }}>
                        Budget
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {BUDGET_OPTIONS.map(b => (
                          <button
                            key={b}
                            onClick={() => setForm(f => ({ ...f, budget: b }))}
                            style={{
                              padding: '14px 10px',
                              borderRadius: '6px',
                              border: form.budget === b ? '2px solid #FD661E' : '1px solid #d1d5db',
                              background: form.budget === b ? '#FFF5F0' : '#ffffff',
                              color: form.budget === b ? '#FD661E' : '#374151',
                              fontWeight: form.budget === b ? '700' : '600',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s',
                              textAlign: 'center'
                            }}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Stack>
            </div>
          </Container>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 0', background: '#ffffff', flexShrink: 0 }}>
          <Container size="md">
            <div style={{ maxWidth: '550px', margin: '0 auto', paddingX: '20px' }}>
              <Group spacing={10}>
                <Button
                  onClick={back}
                  disabled={step === 0 || loading}
                  variant="default"
                  style={{ flex: 1, height: '40px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                  styles={{
                    root: {
                      background: '#f3f4f6',
                      borderColor: '#d1d5db',
                      color: '#374151',
                    }
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={saveAndNext}
                  loading={loading}
                  disabled={!canNext}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '6px',
                    background: canNext ? '#FD661E' : '#d1d5db',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '700',
                    opacity: canNext ? 1 : 0.6,
                  }}
                  rightIcon={!loading && canNext && <ChevronRight size={18} />}
                >
                  {step === STEPS.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </Group>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
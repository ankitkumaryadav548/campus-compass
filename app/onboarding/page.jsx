"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ArrowLeft, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import StepProgress from "@/components/modules/onboarding/StepProgress";
import StepOrigin from "@/components/modules/onboarding/StepOrigin";
import StepDiet from "@/components/modules/onboarding/StepDiet";
import StepStay from "@/components/modules/onboarding/StepStay";
import StepReview from "@/components/modules/onboarding/StepReview";

const ONBOARDING_STEPS = [
  { step: 1, title: "Origin" },
  { step: 2, title: "Diet" },
  { step: 3, title: "Stay" },
  { step: 4, title: "Review" }
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: (direction) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" }
  })
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    country: "",
    languages: ["English"],
    diet: "no preference",
    university: "",
    visaType: "student",
    arrivalDate: "",
    bio: ""
  });

  const [errors, setErrors] = useState({});
  const stepContainerRef = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/onboarding");
      return;
    }

    if (status === "authenticated") {
      async function loadProfile() {
        try {
          const res = await fetch("/api/users");
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              const u = data.user;
              if (u.onboardingDone) {
                setIsEditMode(true);
              }
              setFormData({
                country: u.country || "",
                languages: u.languages?.length ? u.languages : ["English"],
                diet: u.diet || "no preference",
                university: u.university || "",
                visaType: u.visaType || "student",
                arrivalDate: u.arrivalDate || "",
                bio: u.bio || ""
              });
            }
          }
        } catch (err) {
          console.error("Could not load initial user data:", err);
        } finally {
          setIsLoadingProfile(false);
        }
      }
      loadProfile();
    }
  }, [status, router]);

  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "Student";

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return Boolean(formData.country && formData.languages?.length >= 1);
    }
    if (currentStep === 2) {
      return Boolean(formData.diet);
    }
    if (currentStep === 3) {
      if (!formData.university?.trim()) return false;
      if (!formData.visaType) return false;
      if (!formData.arrivalDate) return false;
      return true;
    }
    return true;
  };

  const validateStep = (step) => {
    const stepErrors = {};
    if (step === 1) {
      if (!formData.country?.trim()) {
        stepErrors.country = "Please select your country of origin.";
      }
      if (!formData.languages?.length) {
        stepErrors.languages = "Please select at least one language you speak.";
      }
    } else if (step === 2) {
      if (!formData.diet) {
        stepErrors.diet = "Please select your dietary preference.";
      }
    } else if (step === 3) {
      if (!formData.university?.trim() || formData.university.trim().length < 2) {
        stepErrors.university = "Please enter your university name.";
      }
      if (!formData.visaType) {
        stepErrors.visaType = "Please choose a visa type.";
      }
      if (!formData.arrivalDate) {
        stepErrors.arrivalDate = "Please provide your arrival date.";
      } else {
        const parsed = new Date(formData.arrivalDate);
        if (Number.isNaN(parsed.getTime())) {
          stepErrors.arrivalDate = "Please enter a valid arrival date.";
        }
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    stepContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    stepContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const jumpToStep = (targetStep) => {
    setDirection(targetStep > currentStep ? 1 : -1);
    setCurrentStep(targetStep);
  };

  const handleSubmitProfile = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save onboarding details.");
      }

      toast({
        message: isEditMode
          ? "Profile updated successfully!"
          : "Welcome aboard! Your personalized plan is ready.",
        type: "success"
      });

      // Refresh the client session to populate updated country and onboardingDone
      await update({ onboardingDone: true, country: formData.country });
      // Direct navigation ensures the updated JWT cookie is evaluated by middleware
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        message: error.message || "Failed to save profile. Please check your answers.",
        type: "error"
      });
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoadingProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your profile setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 bg-gradient-hero dark:bg-slate-950 relative overflow-hidden flex flex-col justify-between">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="blob w-96 h-96 bg-indigo-200/50 dark:bg-indigo-900/30 -top-20 -left-20" />
        <div className="blob w-80 h-80 bg-violet-200/50 dark:bg-violet-900/30 bottom-10 -right-20" />
      </div>

      <div className="max-w-2xl mx-auto w-full relative z-10 flex-1 flex flex-col justify-center" ref={stepContainerRef}>
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xl hover:opacity-85 transition-opacity"
          >
            <Compass size={26} />
            <span>Campus Compass</span>
          </Link>

          <div className="mt-3">
            <Badge variant={isEditMode ? "neutral" : "info"} dot className="mb-2">
              {isEditMode ? "Profile Preferences" : "Welcome Onboarding"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {isEditMode ? `Welcome back, ${firstName}` : `Let's get you set up, ${firstName}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {isEditMode
                ? "Update your details below to refresh your personalized campus guides and buddy matches."
                : "Just 4 quick steps so we can show you the right SIM card, food, and community."}
            </p>
          </div>
        </div>

        <StepProgress
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          onStepClick={jumpToStep}
        />

        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {currentStep === 1 && (
                <StepOrigin
                  formData={formData}
                  onChange={handleFieldChange}
                  errors={errors}
                />
              )}

              {currentStep === 2 && (
                <StepDiet
                  formData={formData}
                  onChange={handleFieldChange}
                  errors={errors}
                />
              )}

              {currentStep === 3 && (
                <StepStay
                  formData={formData}
                  onChange={handleFieldChange}
                  errors={errors}
                />
              )}

              {currentStep === 4 && (
                <StepReview
                  formData={formData}
                  onEditStep={jumpToStep}
                  onBioChange={(val) => handleFieldChange("bio", val)}
                  isEditMode={isEditMode}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmitProfile}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {currentStep < 4 && (
            <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-100 dark:border-slate-800">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="ghost"
                  size="md"
                  leftIcon={ArrowLeft}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                size="md"
                disabled={!isCurrentStepValid()}
                rightIcon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="text-center text-xs text-slate-400 py-4 relative z-10">
        Need assistance? Check in with your university&apos;s international student office.
      </div>
    </div>
  );
}

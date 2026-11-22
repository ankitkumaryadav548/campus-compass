import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ChecklistItem from "@/models/ChecklistItem";
import UserChecklist from "@/models/UserChecklist";
import Guide from "@/models/Guide";
import GuideProgress from "@/models/GuideProgress";
import Event from "@/models/Event";

import {
  regionQuery,
  sortBySpecificity,
  sortBuddiesByMatch,
  noContentNote,
  getSpecificityLabel
} from "@/lib/personalization";
import { getArrivalDayInfo, getDeadlineInfo } from "@/lib/dashboard";

import AppShell from "@/components/layout/AppShell";
import DashboardFadeIn from "@/components/modules/dashboard/DashboardFadeIn";
import DashboardHeader from "@/components/modules/dashboard/DashboardHeader";
import DashboardStats from "@/components/modules/dashboard/DashboardStats";
import PendingTasks from "@/components/modules/dashboard/PendingTasks";
import GuideCards from "@/components/modules/dashboard/GuideCards";
import BuddyList from "@/components/modules/dashboard/BuddyList";
import FoodCards from "@/components/modules/dashboard/FoodCards";
import EventList from "@/components/modules/dashboard/EventList";
import ProfileCard from "@/components/modules/dashboard/ProfileCard";

export default async function DashboardPage() {
  const sessionUser = await requireUser("/dashboard");

  await connectDB();
  const dbUser = await User.findById(sessionUser.id).select("-password").lean();
  const user = dbUser || sessionUser;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel server-side data fetching
  const [
    rawChecklistItems,
    userChecklistRows,
    rawGuides,
    userGuideProgress,
    upcomingEvents,
    candidateBuddies
  ] = await Promise.all([
    ChecklistItem.find(regionQuery(user)).sort({ order: 1 }).lean(),
    UserChecklist.find({ userId: user._id }).lean(),
    Guide.find({
      ...regionQuery(user),
      category: { $in: ["sim", "bank"] }
    }).lean(),
    GuideProgress.find({ userId: user._id }).lean(),
    Event.find({
      ...regionQuery(user),
      date: { $gte: today }
    })
      .sort({ date: 1 })
      .limit(3)
      .lean(),
    User.find({
      isSenior: true,
      _id: { $ne: user._id }
    })
      .select("name country regionGroup languages bio")
      .lean()
  ]);

  // 1. Checklist processing
  const checklistStatusMap = new Map(
    userChecklistRows.map((row) => [row.itemId.toString(), row.status])
  );

  const checklistItems = rawChecklistItems.map((item) => {
    const status = checklistStatusMap.get(item._id.toString()) || "pending";
    const deadlineInfo = getDeadlineInfo(user.arrivalDate, item.deadlineOffsetDays);
    return { ...item, status, deadlineInfo };
  });

  const checklistDoneCount = checklistItems.filter((item) => item.status === "done").length;
  const pendingTasks = checklistItems
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.deadlineInfo.daysLeft - b.deadlineInfo.daysLeft)
    .slice(0, 4);

  // 2. Guides processing
  const progressMap = new Map(
    userGuideProgress.map((row) => [row.guideId.toString(), row.completedSteps || []])
  );

  const enrichedGuides = rawGuides.map((guide) => ({
    ...guide,
    completedSteps: progressMap.get(guide._id.toString()) || []
  }));

  const sortedGuides = sortBySpecificity(enrichedGuides, user);
  const simGuide = sortedGuides.find((g) => g.category === "sim");
  const bankGuide = sortedGuides.find((g) => g.category === "bank");

  const totalGuideSteps = (simGuide?.steps?.length || 0) + (bankGuide?.steps?.length || 0);
  const doneGuideSteps = (simGuide?.completedSteps?.length || 0) + (bankGuide?.completedSteps?.length || 0);

  const hasCountryGuide =
    (simGuide && getSpecificityLabel(simGuide, user) === "country") ||
    (bankGuide && getSpecificityLabel(bankGuide, user) === "country");

  const showGenericBanner = !hasCountryGuide;
  const bannerText = noContentNote(user);

  // 3. Buddy scoring and top 3
  const topBuddies = sortBuddiesByMatch(candidateBuddies, user).slice(0, 3);

  // 4. Timeline calculations
  const arrivalInfo = getArrivalDayInfo(user.arrivalDate);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <DashboardFadeIn delay={0.05}>
          <DashboardHeader
            name={user.name}
            country={user.country}
            regionGroup={user.regionGroup}
            arrivalInfo={arrivalInfo}
          />
        </DashboardFadeIn>

        {/* 3 Metric Progress Cards */}
        <DashboardFadeIn delay={0.1}>
          <DashboardStats
            checklistDone={checklistDoneCount}
            checklistTotal={checklistItems.length}
            guideStepsDone={doneGuideSteps}
            guideStepsTotal={totalGuideSteps}
            arrivalInfo={arrivalInfo}
          />
        </DashboardFadeIn>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (Primary Tasks & Guides) */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardFadeIn delay={0.15}>
              <PendingTasks items={pendingTasks} />
            </DashboardFadeIn>

            <DashboardFadeIn delay={0.2}>
              <GuideCards
                simGuide={simGuide}
                bankGuide={bankGuide}
                country={user.country}
                showGenericBanner={showGenericBanner}
                bannerText={bannerText}
              />
            </DashboardFadeIn>

            <DashboardFadeIn delay={0.25}>
              <FoodCards userDiet={user.diet} />
            </DashboardFadeIn>
          </div>

          {/* Right Column (Community, Events & Profile) */}
          <div className="space-y-6">
            <DashboardFadeIn delay={0.15}>
              <BuddyList
                buddies={topBuddies}
                userLanguages={user.languages}
                userCountry={user.country}
              />
            </DashboardFadeIn>

            <DashboardFadeIn delay={0.2}>
              <EventList events={upcomingEvents} />
            </DashboardFadeIn>

            <DashboardFadeIn delay={0.25}>
              <ProfileCard user={user} />
            </DashboardFadeIn>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

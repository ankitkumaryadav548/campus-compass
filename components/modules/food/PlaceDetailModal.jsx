// components/modules/food/PlaceDetailModal.jsx
// Detailed place dialog with dietary classifications, opening hours,
// external OSM directions/element links, student reviews list, and review form.

import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  ExternalLink,
  Navigation,
  Clock,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import DietBadge from "./DietBadge";
import { directionsUrl, osmElementUrl } from "@/lib/geo";

export default function PlaceDetailModal({
  isOpen,
  onClose,
  place,
  origin,
  currentUserId,
  onReviewSubmitted,
}) {
  const toast = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Reviews state (fetched or passed with place)
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [ratingAverage, setRatingAverage] = useState(0);

  // Load reviews when modal opens
  useEffect(() => {
    if (!isOpen || !place?.placeKey) return;

    setRating(5);
    setComment("");
    setLoadingReviews(true);

    fetch(`/api/places/${place.placeKey}/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setReviews(data.reviews || []);
          setReviewCount(data.reviewCount || 0);
          setRatingAverage(data.ratingAverage || 0);

          // Check if current user already submitted a review
          const existing = (data.reviews || []).find(
            (r) => r.userId && r.userId === currentUserId
          );
          if (existing) {
            setRating(existing.rating || 5);
            setComment(existing.comment || "");
          }
        }
      })
      .catch((err) => console.error("Could not load place reviews:", err))
      .finally(() => setLoadingReviews(false));
  }, [isOpen, place?.placeKey, currentUserId]);

  if (!place) return null;

  const existingReview = reviews.find(
    (r) => r.userId && r.userId === currentUserId
  );

  const dirUrl = directionsUrl(origin, place);
  const editOsmUrl = osmElementUrl(place.osmType, place.osmId);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (trimmed.length < 5 || trimmed.length > 300) {
      toast({
        message: "Please write a comment between 5 and 300 characters.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/places/${place.placeKey}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save your review.");
      }

      setReviews(data.reviews || []);
      setRatingAverage(data.ratingAverage || rating);
      setReviewCount(data.reviewCount || 1);

      toast({
        message: existingReview ? "Review updated!" : "Thank you! Your review has been posted.",
        type: "success",
      });

      onReviewSubmitted?.(place.placeKey, data.ratingAverage, data.reviewCount);
    } catch (err) {
      toast({ message: err.message || "Failed to submit review.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={place.name}
      size="lg"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Meta badges: Kind, Diet, Cuisines */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={place.kind === "grocery" ? "neutral" : "primary"}
            className="text-xs font-semibold capitalize"
          >
            {place.kind}
          </Badge>
          <DietBadge diet={place.diet} kind={place.kind} />
          {place.cuisines?.map((c) => (
            <Badge key={c} variant="neutral" className="text-xs">
              {c}
            </Badge>
          ))}
        </div>

        {/* Distance & Walking info */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-semibold text-primary-700 dark:text-primary-300">
              about {place.distanceKm} km away
            </span>
            <span className="text-slate-300 dark:text-slate-600 mx-2">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              about {place.walkingMinutes} min walk (estimate)
            </span>
          </div>

          <a
            href={dirUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-semibold"
          >
            <Navigation size={12} aria-hidden="true" />
            Get directions
          </a>
        </div>

        {/* Details: Address, Hours, OSM Link */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="shrink-0 text-slate-400 mt-0.5" aria-hidden="true" />
            <span>{place.address || "Address not listed on OpenStreetMap"}</span>
          </div>

          {place.openingHours && (
            <div className="flex items-start gap-2">
              <Clock size={14} className="shrink-0 text-slate-400 mt-0.5" aria-hidden="true" />
              <span>{place.openingHours}</span>
            </div>
          )}

          <div className="pt-2">
            <a
              href={editOsmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
            >
              <ExternalLink size={12} aria-hidden="true" />
              Fix or add details on OpenStreetMap
            </a>
          </div>
        </div>

        {/* Student Reviews Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MessageSquare size={14} aria-hidden="true" />
              Student Reviews
            </h4>
            {reviewCount > 0 ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                {ratingAverage.toFixed(1)} ({reviewCount})
              </span>
            ) : (
              <span className="text-xs text-slate-400">No reviews yet</span>
            )}
          </div>

          {/* Review submission form */}
          <form onSubmit={handleSubmitReview} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {existingReview ? "Update your review" : "Rate this place"}
            </span>

            {/* Star selector */}
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-label="Star rating from 1 to 5"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                  >
                    <Star
                      size={20}
                      className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>

            {/* Comment */}
            <div>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                placeholder="Share your experience (food quality, prices, friendliness to international students)…"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Min 5 characters</span>
                <span>{comment.length} / 300</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                loading={submitting}
                disabled={submitting || comment.trim().length < 5}
                leftIcon={<Send size={12} />}
                className="text-xs min-h-[38px] px-4"
              >
                {existingReview ? "Update review" : "Submit review"}
              </Button>
            </div>
          </form>

          {/* Existing reviews list */}
          {loadingReviews ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-primary-500" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {reviews.map((r, i) => (
                <div
                  key={`${r.userId}-${i}`}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {r.userName}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star size={11} className="fill-amber-400" aria-hidden="true" />
                      {r.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {r.comment}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">
              Be the first international student to review this spot!
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

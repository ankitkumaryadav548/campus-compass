"use client";
// components/modules/food/PlaceDetailModal.jsx
// Place details dialog with address, dietary & cuisine tags, Google Maps link,
// list of student reviews, and an interactive rating & review form.

import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function PlaceDetailModal({
  isOpen,
  onClose,
  place,
  currentUserId,
  onReviewSubmitted,
}) {
  const toast = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Check if current user has already reviewed this place
  const existingReview = place?.reviews?.find(
    (r) => r.userId && r.userId === currentUserId
  );

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setComment(existingReview.comment || "");
    } else {
      setRating(5);
      setComment("");
    }
  }, [existingReview, place?._id]);

  if (!place) return null;

  const displayTitle = place.name.replace(/^\[SAMPLE\]\s*/i, "");
  const googleMapsUrl =
    place.location?.lat != null && place.location?.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`
      : null;

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const trimmed = comment.trim();
    if (trimmed.length < 5 || trimmed.length > 300) {
      toast({
        message: "Please write a review comment between 5 and 300 characters.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/places/${place._id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not save your review.");
      }

      const data = await res.json();
      toast({
        message: existingReview ? "Review updated!" : "Review submitted!",
        type: "success",
      });

      onReviewSubmitted?.(place._id, data.reviews, data.rating, data.reviewCount);
    } catch (err) {
      toast({
        message: err.message || "Failed to submit review.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={displayTitle}
      size="xl"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Top Badges & Meta */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="neutral" className="capitalize font-semibold">
              {place.type}
            </Badge>

            {place.matchesCountry && (
              <Badge variant="info">
                Familiar home food
              </Badge>
            )}

            {place.isSample && (
              <Badge variant="neutral" className="text-[10px]">
                Sample spot
              </Badge>
            )}

            {place.rating > 0 && (
              <div className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                <span>{place.rating}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({place.reviewCount} {place.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </div>

          {place.address && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span>{place.address}</span>
              {place.distanceKm != null && (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  • {place.distanceKm} km from campus
                </span>
              )}
            </p>
          )}

          {googleMapsUrl && (
            <div className="mt-2.5">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline min-h-[36px]"
              >
                Open location in Google Maps <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>

        {/* Cuisine & Dietary Tags */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
          {place.cuisine?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Cuisine:
              </span>
              {place.cuisine.map((c) => (
                <Badge key={c} variant="neutral" className="text-xs">
                  {c}
                </Badge>
              ))}
            </div>
          )}

          {place.dietTags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Dietary options:
              </span>
              {place.dietTags.map((d) => (
                <Badge key={d} variant="success" className="text-xs capitalize">
                  {d}
                </Badge>
              ))}
            </div>
          )}

          {place.countryTags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Regional ties:
              </span>
              {place.countryTags.map((tag) => (
                <span key={tag} className="text-xs text-slate-600 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Student Reviews Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Student Reviews ({place.reviews?.length || 0})
            </h3>
          </div>

          {place.reviews && place.reviews.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {place.reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {rev.userName.replace(/^\[SAMPLE\]\s*/i, "")}
                    </span>
                    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rev.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={cn(
                            star <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 dark:text-slate-700"
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rev.comment.replace(/^\[SAMPLE\]\s*/i, "")}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(rev.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              No reviews yet. Be the first international student to share your experience!
            </p>
          )}
        </div>

        {/* Add / Update Review Form */}
        <form onSubmit={handleSubmitReview} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary-500" aria-hidden="true" />
              {existingReview ? "Update your review" : "Leave a review"}
            </h4>

            {/* Star Selector */}
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-label="Select star rating"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                  >
                    <Star
                      size={20}
                      className={cn(
                        "transition-colors",
                        isFilled
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you order? How was the spice level, price, and halal/vegetarian preparation?"
              maxLength={300}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Plain text only (min 5 characters)</span>
              <span>{comment.trim().length} / 300</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              leftIcon={submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
            >
              {existingReview ? "Update review" : "Post review"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

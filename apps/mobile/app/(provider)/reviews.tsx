import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { providerApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { ProviderReview } from '@/types'

const { width } = Dimensions.get('window')

export default function ProviderReviewsScreen() {
  const [data, setData] = useState<{ reviews: ProviderReview[]; stats: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async () => {
    try {
      const res = await providerApi.getReviews()
      if (res.data.success) setData(res.data.data)
    } catch (err) {
      console.error('Reviews error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchReviews() }, [])

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error('Please write a reply')
      return
    }
    setSubmitting(true)
    try {
      const res = await providerApi.replyToReview(reviewId, replyText)
      if (res.data.success) {
        toast.success('Reply posted!')
        setReplyingTo(null)
        setReplyText('')
        fetchReviews()
      } else toast.error(res.data.error || 'Failed')
    } catch { toast.error('Failed to post reply') }
    finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const stats = data?.stats
  const reviews = data?.reviews || []

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reviews</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews() }} />}
      >
        {/* Stats */}
        {stats && (
          <View style={styles.statsSection}>
            <View style={styles.ratingCard}>
              <Text style={styles.bigRating}>{stats.avgRating}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={16}
                    color={star <= Math.round(stats.avgRating) ? '#FBBF24' : '#E5E7EB'}
                  />
                ))}
              </View>
              <Text style={styles.totalReviews}>{stats.totalReviews} reviews</Text>
            </View>

            <View style={styles.breakdownCard}>
              {[5, 4, 3, 2, 1].map((star) => {
                const item = stats.ratingBreakdown.find((r: any) => r.star === star)
                const percentage = item?.percentage || 0
                return (
                  <View key={star} style={styles.breakdownRow}>
                    <Text style={styles.breakdownStar}>{star}★</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.breakdownCount}>{item?.count || 0}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>All Reviews</Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="star-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(review.user.name || 'C').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewerName}>{review.user.name || 'Customer'}</Text>
                      <Text style={styles.reviewMeta}>
                        {review.service.name} • {new Date(review.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.ratingText}>{review.overallRating}</Text>
                  </View>
                </View>

                {review.comment && (
                  <Text style={styles.reviewComment}>&quot;{review.comment}&quot;</Text>
                )}

                {/* Sub ratings */}
                {(review.punctualityRating || review.qualityRating || review.behaviourRating) && (
                  <View style={styles.subRatings}>
                    {review.punctualityRating && (
                      <View style={styles.subRatingChip}>
                        <Text style={styles.subRatingText}>Punctuality: {review.punctualityRating}</Text>
                      </View>
                    )}
                    {review.qualityRating && (
                      <View style={styles.subRatingChip}>
                        <Text style={styles.subRatingText}>Quality: {review.qualityRating}</Text>
                      </View>
                    )}
                    {review.behaviourRating && (
                      <View style={styles.subRatingChip}>
                        <Text style={styles.subRatingText}>Behaviour: {review.behaviourRating}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Existing Reply */}
                {review.providerReply && replyingTo !== review.id && (
                  <View style={styles.replyBox}>
                    <View style={styles.replyHeader}>
                      <Ionicons name="chatbubble" size={12} color={COLORS.primary} />
                      <Text style={styles.replyLabel}>Your Reply</Text>
                    </View>
                    <Text style={styles.replyText}>{review.providerReply}</Text>
                  </View>
                )}

                {/* Reply Form */}
                {replyingTo === review.id ? (
                  <View style={styles.replyForm}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Write your reply..."
                      placeholderTextColor={COLORS.textMuted}
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.replyActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => { setReplyingTo(null); setReplyText('') }}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={() => handleReply(review.id)}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.submitBtnText}>Post Reply</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.replyBtn}
                    onPress={() => {
                      setReplyingTo(review.id)
                      setReplyText(review.providerReply || '')
                    }}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.replyBtnText}>
                      {review.providerReply ? 'Edit Reply' : 'Reply'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  statsSection: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  ratingCard: { width: (width - 48) * 0.35, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  bigRating: { fontSize: 40, fontWeight: 'bold', color: COLORS.text },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  totalReviews: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  breakdownCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  breakdownStar: { fontSize: 12, fontWeight: '600', color: COLORS.text, width: 20 },
  breakdownBar: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', backgroundColor: '#FBBF24', borderRadius: 3 },
  breakdownCount: { fontSize: 11, color: COLORS.textMuted, width: 20, textAlign: 'right' },
  reviewsSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  reviewCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  reviewerName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  reviewMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FBBF2420', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  reviewComment: { fontSize: 14, color: COLORS.text, fontStyle: 'italic', marginBottom: 10, lineHeight: 20 },
  subRatings: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subRatingChip: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  subRatingText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  replyBox: { backgroundColor: COLORS.primary + '10', borderRadius: 10, padding: 10, marginTop: 4, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  replyLabel: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  replyText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  replyForm: { marginTop: 10 },
  replyInput: { backgroundColor: COLORS.background, borderRadius: 10, padding: 10, fontSize: 13, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, minHeight: 70, textAlignVertical: 'top' },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  submitBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.primary },
  submitBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, alignSelf: 'flex-start' },
  replyBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
})
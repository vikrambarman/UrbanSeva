import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AssignProviderModal } from '@/components/admin/AssignProviderModal'
import { ArrowLeft, Plus, Star, Briefcase, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RemoveProviderButton } from '@/components/admin/RemoveProviderButton'

interface Props {
  params: Promise<{ serviceId: string }>
}

export const metadata: Metadata = {
  title: 'Manage Providers | Admin | ServiceApp',
}

export default async function ServiceProvidersPage({ params }: Props) {
  const { serviceId } = await params

  const service = await db.service.findUnique({
    where: { id: serviceId },
    include: {
      subCategory: {
        include: { category: true },
      },
      providerServices: {
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  })

  if (!service) notFound()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/services/${service.subCategory.category.slug}/${service.subCategory.slug}/${service.slug}`}
          >
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Manage Providers</h1>
            <p className="text-muted-foreground mt-1">{service.name}</p>
          </div>
        </div>

        {/* Service Info Card */}
        <div className="rounded-2xl border bg-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-2">Service Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Category</div>
                  <div className="font-medium">{service.subCategory.category.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sub-Category</div>
                  <div className="font-medium">{service.subCategory.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Base Price</div>
                  <div className="font-medium text-primary">₹{service.basePrice}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rating</div>
                  <div className="font-medium flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {service.avgRating} ({service.totalReviews})
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={service.isActive ? 'default' : 'secondary'}>
                {service.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Assigned Providers */}
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Assigned Providers</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {service.providerServices.length} providers assigned
              </p>
            </div>
            <AssignProviderModal serviceId={serviceId} serviceName={service.name} />
          </div>

          {service.providerServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👷</div>
              <h3 className="text-lg font-semibold mb-2">No providers assigned yet</h3>
              <p className="text-muted-foreground mb-4">
                Click "Add Provider" to assign providers to this service
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {service.providerServices.map((ps) => {
                const provider = ps.provider
                const initials = provider.user.name
                  ? provider.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'SP'

                return (
                  <div
                    key={ps.id}
                    className="flex items-center gap-4 rounded-xl border p-4 hover:shadow-md transition-shadow"
                  >
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {provider.user.name || 'Service Provider'}
                        </h3>
                        <Badge
                          variant={ps.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {ps.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">
                            {provider.avgRating || 'N/A'}
                          </span>
                        </div>
                        {provider.totalJobs > 0 && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{provider.totalJobs} jobs</span>
                          </div>
                        )}
                        {provider.experience > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{provider.experience} yrs exp</span>
                          </div>
                        )}
                        <div>
                          📞 {provider.user.phone}
                        </div>
                      </div>

                      {ps.customPrice && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Custom Price: </span>
                          <span className="font-semibold text-primary">₹{ps.customPrice}</span>
                        </div>
                      )}

                      {ps.notes && (
                        <div className="mt-1 text-sm text-muted-foreground italic">
                          "{ps.notes}"
                        </div>
                      )}
                    </div>

                    <RemoveProviderButton
                      providerId={provider.id}
                      serviceId={serviceId}
                      providerName={provider.user.name || 'Provider'}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
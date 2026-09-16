import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Image as ImageIcon, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { GoogleLocationMap } from '@/components/shared/GoogleLocationMap'
import { imageUrl } from '@/components/shared/getImageUrl'
import { toast } from '@/components/ui/Toast'
import { useListParams } from '@/hooks/useListParams'
import { PAGE_SIZE } from '@/lib/constants'
import {
  findCity,
  findCountry,
  getCitiesByCountry,
  getCitySelectOptions,
  getCountries,
  makeCustomCity,
} from '@/lib/locations'
import { formatCurrency } from '@/lib/utils'
import {
  useGetCityAdConfigsQuery,
  useCreateCityAdConfigMutation,
  useUpdateCityAdConfigMutation,
  useDeleteCityAdConfigMutation,
  type CityAdConfigInput,
} from '@/services/endpoints/cityAdConfigApi'
import type { CityAdConfiguration, FeaturedPositionPrice } from '@/types/models'
import type { EntityStatus, Option } from '@/types/common.types'

const STATUS_OPTIONS: Option[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const COUNTRY_OPTIONS: Option[] = getCountries().map((country) => ({
  label: country.name,
  value: country.isoCode,
}))

function syncPricing(capacity: number, existing: FeaturedPositionPrice[] = []): FeaturedPositionPrice[] {
  const n = Math.max(0, Math.floor(Number(capacity) || 0))
  return Array.from({ length: n }, (_, i) => ({
    position: i + 1,
    price: Number(existing[i]?.price) || 0,
  }))
}

export default function AdsConfigurationPage() {
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const { data, isFetching } = useGetCityAdConfigsQuery({ ...params, pageSize: PAGE_SIZE })
  const [deleteConfig, { isLoading: deleting }] = useDeleteCityAdConfigMutation()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<CityAdConfiguration | null>(null)
  const [toDelete, setToDelete] = useState<CityAdConfiguration | null>(null)

  const columns: Column<CityAdConfiguration>[] = [
    {
      key: 'city',
      header: 'City',
      render: (row) => (
        <div className="flex items-center gap-3">
          <CityImageThumb src={row.defaultFeaturedImage} alt={row.city} />
          <div>
            <p className="font-medium text-ink-900">{row.city}</p>
            <p className="text-xs text-ink-500">{row.country}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'featured',
      header: 'Featured channel',
      render: (row) => (
        <ChannelSummary
          enabled={row.featuredEnabled}
          capacity={row.featuredCapacity}
          extra={
            row.featuredPositionPricing.length
              ? `${row.featuredPositionPricing.length} prices`
              : 'No pricing'
          }
        />
      ),
    },
    {
      key: 'pricing',
      header: 'Top slot',
      render: (row) => {
        const first = row.featuredPositionPricing[0]
        return first ? (
          <span className="text-ink-800">{formatCurrency(first.price)}</span>
        ) : (
          <span className="text-ink-300">—</span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={(row.status as EntityStatus) || 'active'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setToDelete(row)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const handleConfirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteConfig(toDelete.id).unwrap()
      toast.success(`Ads configuration for “${toDelete.city}” deleted successfully.`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete configuration.')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Ads Configuration"
        description="Manage city-wise featured ad channels, slot capacity, and position pricing."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New city config
          </Button>
        }
      />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by city or country…"
            className="w-full sm:max-w-xs"
          />
          <div className="w-full sm:w-44">
            <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isFetching}
          emptyTitle="No city ad configurations"
          emptyDescription="Create a configuration to set featured ad slots for a city."
        />

        {data && (
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>

      <CityAdConfigFormModal
        open={creating || Boolean(editing)}
        config={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.city}” ads configuration?`}
        description="This removes the city’s featured ad channel settings."
        confirmLabel="Delete configuration"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function CityImageThumb({ src, alt }: { src?: string; alt: string }) {
  const url = imageUrl(src)
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100">
      {url ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-4 w-4 text-ink-400" />
      )}
    </div>
  )
}

function ChannelSummary({
  enabled,
  capacity,
  extra,
}: {
  enabled: boolean
  capacity: number
  extra?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Badge tone={enabled ? 'green' : 'gray'}>{enabled ? 'On' : 'Off'}</Badge>
        <span className="text-sm text-ink-800">{capacity} slots</span>
      </div>
      {extra && <p className="mt-0.5 text-xs text-ink-500">{extra}</p>}
    </div>
  )
}

const emptyForm = {
  country: 'Bangladesh',
  countryCode: 'BD',
  city: '',
  cityKey: '',
  latitude: '',
  longitude: '',
  featuredCapacity: '5',
  featuredEnabled: true,
  status: 'active',
  featuredPositionPricing: syncPricing(5),
}

function CityAdConfigFormModal({
  open,
  config,
  onClose,
}: {
  open: boolean
  config: CityAdConfiguration | null
  onClose: () => void
}) {
  const [createConfig, { isLoading: creating }] = useCreateCityAdConfigMutation()
  const [updateConfig, { isLoading: updating }] = useUpdateCityAdConfigMutation()

  const [country, setCountry] = useState(emptyForm.country)
  const [countryCode, setCountryCode] = useState(emptyForm.countryCode)
  const [city, setCity] = useState(emptyForm.city)
  const [cityKey, setCityKey] = useState(emptyForm.cityKey)
  const [latitude, setLatitude] = useState(emptyForm.latitude)
  const [longitude, setLongitude] = useState(emptyForm.longitude)
  const [featuredCapacity, setFeaturedCapacity] = useState(emptyForm.featuredCapacity)
  const [featuredEnabled, setFeaturedEnabled] = useState(emptyForm.featuredEnabled)
  const [status, setStatus] = useState(emptyForm.status)
  const [pricing, setPricing] = useState<FeaturedPositionPrice[]>(emptyForm.featuredPositionPricing)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [locationReady, setLocationReady] = useState(false)

  const cities = useMemo(() => {
    const list = getCitiesByCountry(countryCode)
    const hasSelected =
      Boolean(cityKey) &&
      list.some((item) => item.key === cityKey || item.name.toLowerCase() === city.toLowerCase())
    if (city && !hasSelected) {
      return [makeCustomCity(city, latitude || 0, longitude || 0), ...list]
    }
    return list
  }, [countryCode, city, cityKey, latitude, longitude])

  const cityOptions = useMemo(() => getCitySelectOptions(cities), [cities])

  useEffect(() => {
    if (!open) {
      setLocationReady(false)
      return
    }
    if (config) {
      const matchedCountry = findCountry(config.countryCode || config.country)
      const nextCountryCode = matchedCountry?.isoCode || config.countryCode || ''
      const nextCountry = matchedCountry?.name || config.country || ''
      const matchedCity = nextCountryCode ? findCity(nextCountryCode, config.city) : undefined
      const capacity = config.featuredCapacity || config.featuredPositionPricing.length || 0

      setCountry(nextCountry)
      setCountryCode(nextCountryCode)
      if (matchedCity) {
        setCity(matchedCity.name)
        setCityKey(matchedCity.key)
      } else {
        const custom = makeCustomCity(config.city, config.latitude ?? 0, config.longitude ?? 0)
        setCity(config.city || '')
        setCityKey(custom.key)
      }
      setLatitude(config.latitude != null ? String(config.latitude) : '')
      setLongitude(config.longitude != null ? String(config.longitude) : '')
      setFeaturedCapacity(String(capacity))
      setFeaturedEnabled(Boolean(config.featuredEnabled))
      setStatus(config.status || 'active')
      setPricing(syncPricing(capacity, config.featuredPositionPricing))
      setImageFile(null)
      setPreviewUrl(imageUrl(config.defaultFeaturedImage) || '')
    } else {
      setCountry(emptyForm.country)
      setCountryCode(emptyForm.countryCode)
      setCity(emptyForm.city)
      setCityKey(emptyForm.cityKey)
      setLatitude(emptyForm.latitude)
      setLongitude(emptyForm.longitude)
      setFeaturedCapacity(emptyForm.featuredCapacity)
      setFeaturedEnabled(emptyForm.featuredEnabled)
      setStatus(emptyForm.status)
      setPricing(syncPricing(5))
      setImageFile(null)
      setPreviewUrl('')
    }
    setLocationReady(true)
  }, [open, config])

  const handleCountryChange = (isoCode: string) => {
    const selected = findCountry(isoCode)
    setCountryCode(isoCode)
    setCountry(selected?.name || '')
    setCity('')
    setCityKey('')
    setLatitude('')
    setLongitude('')
  }

  const handleCityChange = (key: string) => {
    const selected = cities.find((item) => item.key === key)
    if (!selected) {
      setCity('')
      setCityKey('')
      setLatitude('')
      setLongitude('')
      return
    }
    setCityKey(selected.key)
    setCity(selected.name)
    setLatitude(selected.latitude)
    setLongitude(selected.longitude)
  }

  const handleCapacityChange = (value: string) => {
    setFeaturedCapacity(value)
    const n = Number(value)
    if (!Number.isNaN(n) && n >= 0 && n <= 50) {
      setPricing((current) => syncPricing(n, current))
    }
  }

  const handlePriceChange = (index: number, value: string) => {
    setPricing((current) =>
      current.map((item, i) => (i === index ? { ...item, price: Number(value) || 0 } : item)),
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!countryCode || !country) {
      toast.error('Select a country.')
      return
    }
    if (!city) {
      toast.error('Select a city.')
      return
    }
    if (latitude === '' || longitude === '' || Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      toast.error('Select a city to set latitude and longitude.')
      return
    }

    const payload: CityAdConfigInput = {
      country: country.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      city: city.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      featuredCapacity: Number(featuredCapacity) || 0,
      featuredEnabled,
      featuredPositionPricing: syncPricing(Number(featuredCapacity) || 0, pricing),
      status,
      defaultFeaturedImageFile: imageFile,
    }

    try {
      if (config) {
        await updateConfig({ id: config.id, ...payload }).unwrap()
        toast.success(`Ads configuration for “${payload.city}” updated successfully.`)
      } else {
        await createConfig(payload).unwrap()
        toast.success(`Ads configuration for “${payload.city}” created successfully.`)
      }
      onClose()
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to save configuration. Please check details and try again.',
      )
    }
  }

  const saving = creating || updating

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config ? `Edit · ${config.city}` : 'New city ads configuration'}
      description="Choose a country and city. Coordinates are set from the city and shown on the map."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="city-ad-config-form" loading={saving}>
            {config ? 'Save changes' : 'Create configuration'}
          </Button>
        </>
      }
    >
      <form id="city-ad-config-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Country"
            options={COUNTRY_OPTIONS}
            placeholder="Select country"
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            required
          />
          <Select
            label="City"
            options={cityOptions}
            placeholder={countryCode ? 'Select city' : 'Select a country first'}
            value={cityKey}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={!countryCode}
            required
          />
        </div>

        {locationReady && <GoogleLocationMap active={open} latitude={latitude} longitude={longitude} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-ink-100 p-4">
            <p className="mb-3 text-sm font-medium text-ink-800">Featured channel</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-700">Enabled</p>
                <label className="flex h-10 items-center gap-2 text-sm text-ink-700">
                  <Switch
                    checked={featuredEnabled}
                    onChange={setFeaturedEnabled}
                    label="Featured enabled"
                  />
                  {featuredEnabled ? 'On' : 'Off'}
                </label>
              </div>
              <Input
                label="Featured capacity"
                type="number"
                min={0}
                max={50}
                value={featuredCapacity}
                onChange={(e) => handleCapacityChange(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-ink-100 p-4">
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Default featured image</label>
            <div className="flex h-[calc(100%-1.5rem)] min-h-[8.5rem] flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-200 bg-ink-50/50 p-3 text-center transition-colors hover:border-brand-500">
              {previewUrl ? (
                <div className="relative mb-2 h-24 w-full overflow-hidden rounded-md border border-ink-200">
                  <img src={previewUrl} alt="Featured preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-1 text-ink-500">
                  <Upload className="mb-1 h-6 w-6 text-ink-400" />
                  <span className="text-xs font-medium">Upload image</span>
                  <span className="text-[11px] text-ink-400">PNG, JPG, WEBP</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full cursor-pointer text-xs text-ink-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <Switch
            checked={status === 'active'}
            onChange={(active) => setStatus(active ? 'active' : 'inactive')}
            label="Active"
          />
          Active
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-800">Featured position pricing</p>
            <span className="text-xs text-ink-500">{pricing.length} positions</span>
          </div>
          {pricing.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink-200 px-3 py-4 text-center text-sm text-ink-500">
              Set featured capacity to add position prices.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pricing.map((item, index) => (
                <Input
                  key={item.position}
                  label={`Position ${item.position}`}
                  type="number"
                  min={0}
                  step="any"
                  value={String(item.price)}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  required
                />
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}

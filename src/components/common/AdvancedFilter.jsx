import { Search, SlidersHorizontal, Monitor } from 'lucide-react'
import { GAME_STATUSES } from '../../utils/helpers'

const STATUS_OPTIONS = ['All', ...GAME_STATUSES]

/**
 * Search bar, status filter pills, platform filter, and sort selector.
 */
export default function AdvancedFilter({
  search,
  onSearch,
  activeStatus,
  onStatus,
  platforms,
  activePlatform,
  onPlatform,
  sortKey,
  sortOrder,
  onSort,
}) {
  return (
    <div className="adv-filter">
      <div className="adv-filter__search">
        <Search size={16} className="adv-filter__icon" />
        <input
          type="search"
          placeholder="Search title, genre, platform, or notes…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="adv-filter__input"
          aria-label="Search games"
        />
      </div>

      <div className="adv-filter__pills" role="group" aria-label="Filter by play status">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            className={`pill${activeStatus === status ? ' pill--active' : ''}`}
            onClick={() => onStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="adv-filter__controls">
        <div className="adv-filter__sort">
          <Monitor size={14} />
          <select
            value={activePlatform}
            onChange={(e) => onPlatform(e.target.value)}
            aria-label="Filter by platform"
            className="adv-filter__select"
          >
            {platforms.map((plat) => (
              <option key={plat} value={plat}>
                {plat === 'All' ? 'All Platforms' : plat}
              </option>
            ))}
          </select>
        </div>

        <div className="adv-filter__sort">
          <SlidersHorizontal size={14} />
          <select
            value={`${sortKey}_${sortOrder}`}
            onChange={(e) => {
              const lastIdx = e.target.value.lastIndexOf('_')
              const key = e.target.value.slice(0, lastIdx)
              const order = e.target.value.slice(lastIdx + 1)
              onSort({ key, order })
            }}
            aria-label="Sort games"
            className="adv-filter__select"
          >
            <option value="created_at_desc">Recently Logged</option>
            <option value="title_asc">Title A → Z</option>
            <option value="title_desc">Title Z → A</option>
            <option value="hours_played_desc">Hours High → Low</option>
            <option value="hours_played_asc">Hours Low → High</option>
            <option value="rating_desc">Rating High → Low</option>
            <option value="release_year_desc">Newest Release</option>
          </select>
        </div>
      </div>
    </div>
  )
}

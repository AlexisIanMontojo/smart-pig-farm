import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Archive,
} from 'lucide-react';

import BaseTable from '@/components/common/BaseTable';
import BaseButton from '@/components/common/BaseButton';
import BaseSelect from '@/components/common/BaseSelect';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';

import PigForm from './PigForm';
import Pens from './Pens';
import usePagination from '@/hooks/usePagination';

import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore, can } from '@/features/auth/authStore';

import { ageFromBirthDate, formatDate } from '@/utils/dateUtils';
import { kg } from '@/utils/formatters';

import {
  BREEDS,
  HEALTH_STATUSES,
  STAGES,
  archivePig,
} from './pigService';

export default function Pigs() {
  const navigate = useNavigate();

  const {
    pigs,
    pens,
    updateItem,
    logActivity,
    settings,
    loadPigsAndPens,
  } = useDataStore();

  const globalSearch = useAppStore((s) => s.globalSearch);
  const push = useNotificationStore((s) => s.push);
  const role = useAuthStore((s) => s.user?.role);

  const canEdit =
    can(role, 'pigs:edit') ||
    role === 'Administrator' ||
    role === 'Farm Manager';

  const [tab, setTab] = useState('pigs');
  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState({
    breed: '',
    health: '',
    pen: '',
    stage: '',
    archived: 'active',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toArchive, setToArchive] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load actual database records.
  useEffect(() => {
    let active = true;

    async function loadDatabaseRecords() {
      setLoading(true);
      setLoadError('');

      const result = await loadPigsAndPens();

      if (!active) return;

      if (!result.success) {
        setLoadError(result.message);
      }

      setLoading(false);
    }

    loadDatabaseRecords();

    return () => {
      active = false;
    };
  }, [loadPigsAndPens]);

  const term = (search || globalSearch || '').trim().toLowerCase();

  const filtered = useMemo(
    () =>
      pigs.filter((pig) => {
        if (filters.archived === 'active' && pig.archived) return false;
        if (filters.archived === 'archived' && !pig.archived) return false;
        if (filters.breed && pig.breed !== filters.breed) return false;
        if (filters.health && pig.healthStatus !== filters.health) return false;
        if (filters.pen && pig.penId !== filters.pen) return false;
        if (filters.stage && pig.stage !== filters.stage) return false;

        if (term) {
          const haystack =
            `${pig.id} ${pig.tagNo} ${pig.label || ''} ${pig.breed} ${pig.penId || ''}`
              .toLowerCase();

          if (!haystack.includes(term)) return false;
        }

        return true;
      }),
    [pigs, filters, term]
  );

  const pagination = usePagination(
    filtered,
    settings.display.pageSize || 10
  );

  async function confirmArchive() {
    if (!toArchive) return;

    try {
      const archived = !toArchive.archived;

      await archivePig(toArchive.id, archived);

      updateItem('pigs', toArchive.id, { archived });

      logActivity(
        'Pig Record',
        `${archived ? 'Archived' : 'Restored'} pig ${toArchive.id}`,
        'Completed'
      );

      push(`${toArchive.id} ${archived ? 'archived' : 'restored'}.`);
      setToArchive(null);
    } catch (error) {
      push(error.message || 'Unable to update pig record.');
    }
  }

  const columns = [
    { key: 'id', header: 'Pig ID', width: 92 },
    { key: 'tagNo', header: 'Tag no.', width: 92 },
    {
      key: 'label',
      header: 'Label',
      render: (record) => record.label || '—',
      width: 95,
    },
    { key: 'breed', header: 'Breed' },
    { key: 'sex', header: 'Sex', width: 80 },
    {
      key: 'birthDate',
      header: 'Birth date',
      width: 115,
      render: (record) => formatDate(record.birthDate),
    },
    {
      key: 'age',
      header: 'Age',
      width: 95,
      render: (record) => ageFromBirthDate(record.birthDate).label,
    },
    { key: 'penId', header: 'Pen', width: 90 },
    {
      key: 'currentWeightKg',
      header: 'Weight',
      width: 90,
      align: 'right',
      render: (record) => kg(record.currentWeightKg),
    },
    {
      key: 'healthStatus',
      header: 'Health',
      width: 140,
      render: (record) => <StatusBadge status={record.healthStatus} />,
    },
    {
      key: 'reproductiveStatus',
      header: 'Reproductive',
      width: 130,
      render: (record) => (
        <StatusBadge status={record.reproductiveStatus} />
      ),
    },
    {
      key: 'dateAdded',
      header: 'Added',
      width: 115,
      render: (record) => formatDate(record.dateAdded),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 165,
      render: (record) => (
        <div
          className="row"
          style={{ gap: 2, flexWrap: 'nowrap' }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/pigs/${record.id}`)}
            title="View"
          >
            <Eye size={14} />
          </button>

          {canEdit && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditing(record);
                setFormOpen(true);
              }}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}

          {canEdit && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)' }}
              onClick={() => setToArchive(record)}
              title={record.archived ? 'Restore' : 'Archive'}
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="tabs">
        <button
          className={`tab ${tab === 'pigs' ? 'active' : ''}`}
          onClick={() => setTab('pigs')}
        >
          Pigs
        </button>

        <button
          className={`tab ${tab === 'pens' ? 'active' : ''}`}
          onClick={() => setTab('pens')}
        >
          Pens
        </button>
      </div>

      {loading ? (
        <div className="card card-body">
          <p>Loading pigs and pens from the database...</p>
        </div>
      ) : loadError ? (
        <div className="card card-body">
          <p style={{ color: 'var(--danger)' }}>
            Unable to load database records: {loadError}
          </p>

          <BaseButton onClick={() => window.location.reload()}>
            Retry
          </BaseButton>
        </div>
      ) : tab === 'pens' ? (
        <Pens />
      ) : (
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h3>Pigs</h3>

            <span className="badge muted">
              {filtered.length} shown
            </span>

            <div className="spacer" />

            <div className="search-box" style={{ minWidth: 210 }}>
              <Search size={14} color="var(--gray-500)" />

              <input
                placeholder="Search ID, tag, breed..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {canEdit && (
              <BaseButton
                icon={Plus}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Add New Pig
              </BaseButton>
            )}
          </div>

          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div
              className="row"
              style={{ alignItems: 'flex-end', gap: 12 }}
            >
              <Filter
                size={15}
                color="var(--gray-500)"
                style={{ marginBottom: 20 }}
              />

              <div style={{ minWidth: 150 }}>
                <BaseSelect
                  label="Breed"
                  placeholder="All breeds"
                  options={BREEDS}
                  value={filters.breed}
                  onChange={(event) =>
                    setFilters((filter) => ({
                      ...filter,
                      breed: event.target.value,
                    }))
                  }
                />
              </div>

              <div style={{ minWidth: 155 }}>
                <BaseSelect
                  label="Health"
                  placeholder="All statuses"
                  options={HEALTH_STATUSES}
                  value={filters.health}
                  onChange={(event) =>
                    setFilters((filter) => ({
                      ...filter,
                      health: event.target.value,
                    }))
                  }
                />
              </div>

              <div style={{ minWidth: 140 }}>
                <BaseSelect
                  label="Pen"
                  placeholder="All pens"
                  options={pens.map((pen) => ({
                    value: pen.id,
                    label: pen.name,
                  }))}
                  value={filters.pen}
                  onChange={(event) =>
                    setFilters((filter) => ({
                      ...filter,
                      pen: event.target.value,
                    }))
                  }
                />
              </div>

              <div style={{ minWidth: 145 }}>
                <BaseSelect
                  label="Stage"
                  placeholder="All stages"
                  options={STAGES}
                  value={filters.stage}
                  onChange={(event) =>
                    setFilters((filter) => ({
                      ...filter,
                      stage: event.target.value,
                    }))
                  }
                />
              </div>

              <div style={{ minWidth: 140 }}>
                <BaseSelect
                  label="Records"
                  options={[
                    { value: 'active', label: 'Active only' },
                    { value: 'archived', label: 'Archived only' },
                    { value: 'all', label: 'All records' },
                  ]}
                  value={filters.archived}
                  onChange={(event) =>
                    setFilters((filter) => ({
                      ...filter,
                      archived: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <BaseTable
            columns={columns}
            rows={pagination.pageItems}
            pagination={pagination}
            onRowClick={(record) => navigate(`/pigs/${record.id}`)}
            empty={
              <EmptyState
                title="No pigs match these filters"
                message="Adjust the search or filters, or register a new pig."
                action={
                  canEdit ? (
                    <BaseButton
                      icon={Plus}
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      Add New Pig
                    </BaseButton>
                  ) : null
                }
              />
            }
          />
        </div>
      )}

      <PigForm
        open={formOpen}
        pig={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(message) => push(message)}
      />

      <ConfirmDialog
        open={Boolean(toArchive)}
        title={
          toArchive?.archived
            ? 'Restore this pig record?'
            : 'Archive this pig record?'
        }
        message={
          toArchive?.archived
            ? `${toArchive?.id} will return to the active list.`
            : `${toArchive?.id} will be hidden from the active list. Historical records such as weights and treatments are kept.`
        }
        confirmLabel={toArchive?.archived ? 'Restore' : 'Archive'}
        tone={toArchive?.archived ? 'primary' : 'danger'}
        onConfirm={confirmArchive}
        onCancel={() => setToArchive(null)}
      />
    </>
  );
}
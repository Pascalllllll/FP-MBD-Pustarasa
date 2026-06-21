import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from './PageHeader.jsx';
import DataTable from './DataTable.jsx';
import Modal from './Modal.jsx';
import Alert from './Alert.jsx';
import FormField from './FormField.jsx';
import { IconPlus, IconEdit, IconTrash } from './icons.jsx';

/**
 * Config-driven master-data screen (list + create + edit + delete).
 *
 * props:
 *  - title, description, service
 *  - endpoint           e.g. '/buku'
 *  - idField            primary key field name on a row
 *  - columns            DataTable columns
 *  - fields             form field defs (also used to build the payload)
 *  - searchable         bool
 *  - writeRoles         roles allowed to create/edit
 *  - deleteRoles        roles allowed to delete
 *  - defaults           initial values for the create form
 *  - beforeSubmit(form) optional transform -> payload
 *  - canEditRow(row)    optional, gates the edit button per row (default: all rows)
 */
export default function ResourcePage(cfg) {
  const { hasRole } = useAuth();
  const canWrite = !cfg.writeRoles || hasRole(...cfg.writeRoles);
  const canDelete = cfg.deleteRoles ? hasRole(...cfg.deleteRoles) : canWrite;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(cfg.defaults || {});
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (q) => {
      setLoading(true);
      setListError('');
      try {
        const data = await api.get(cfg.endpoint, cfg.searchable ? { search: q } : undefined);
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setListError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [cfg.endpoint, cfg.searchable]
  );

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), cfg.searchable ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, load, cfg.searchable]);

  const openCreate = () => {
    setEditing(null);
    setForm(cfg.defaults || {});
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const initial = {};
    cfg.fields.forEach((f) => {
      initial[f.name] = row[f.name] ?? '';
    });
    setForm(initial);
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const onField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async () => {
    setSaving(true);
    setFormError('');
    setFieldErrors({});
    try {
      const payload = cfg.beforeSubmit ? cfg.beforeSubmit(form, editing) : form;
      if (editing) {
        await api.put(`${cfg.endpoint}/${editing[cfg.idField]}`, payload);
      } else {
        await api.post(cfg.endpoint, payload);
      }
      setModalOpen(false);
      await load(search);
    } catch (e) {
      setFormError(e.message);
      if (e.details) setFieldErrors(e.details);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Hapus data ini secara permanen?`)) return;
    try {
      await api.del(`${cfg.endpoint}/${row[cfg.idField]}`);
      await load(search);
    } catch (e) {
      setListError(e.message);
    }
  };

  const editableFields = useMemo(
    () => cfg.fields.filter((f) => !(editing && f.createOnly)),
    [cfg.fields, editing]
  );

  return (
    <div>
      <PageHeader
        title={cfg.title}
        description={cfg.description}
        service={cfg.service}
        actions={
          canWrite && (
            <button className="btn-primary" onClick={openCreate}>
              <IconPlus className="h-4 w-4" /> Tambah
            </button>
          )
        }
      />

      {listError && (
        <div className="mb-3">
          <Alert type="error">{listError}</Alert>
        </div>
      )}

      <DataTable
        columns={cfg.columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r[cfg.idField]}
        search={cfg.searchable ? search : undefined}
        onSearch={cfg.searchable ? setSearch : undefined}
        searchPlaceholder={cfg.searchPlaceholder}
        empty={cfg.empty}
        actions={
          canWrite || canDelete
            ? (row) => (
                <>
                  {canWrite && (!cfg.canEditRow || cfg.canEditRow(row)) && (
                    <button className="btn-ghost h-8 w-8 !px-0" onClick={() => openEdit(row)} aria-label="Ubah">
                      <IconEdit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn-danger h-8 w-8 !px-0" onClick={() => remove(row)} aria-label="Hapus">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </>
              )
            : undefined
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Ubah ${cfg.singular}` : `Tambah ${cfg.singular}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </button>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="mb-3">
            <Alert type="error">{formError}</Alert>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {editableFields.map((f) => (
            <FormField
              key={f.name}
              field={f}
              value={form[f.name]}
              onChange={onField}
              error={fieldErrors[f.name]}
              disabled={saving || (editing && f.readOnlyOnEdit)}
            />
          ))}
        </div>
      </Modal>
    </div>
  );
}

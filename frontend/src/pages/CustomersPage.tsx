import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Phone, Mail, Search, Plus,
  Download, ExternalLink, X, Check, ArrowRight, Loader2, AlertCircle
} from "lucide-react";

import PageHeader from "../components/shared/PageHeader";
import { formatCurrency } from "../lib/utils";
import { customersApi } from "../services/api";

// ─── Backend Customer Shape ────────────────────────────────────────────────────
interface BackendCustomer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string | null;
  createdAt: string;
  locations: BackendLocation[];
}

interface BackendLocation {
  id: string;
  name: string;
  address: string;
  city: string;
}

// ─── Add Form State ────────────────────────────────────────────────────────────
const emptyForm = { companyName: "", contact: "", email: "", phone: "", industry: "" };

export default function CustomersPage() {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<BackendCustomer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState("");

  // ── Fetch customers from backend ────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.getAll();
      if (res.success) setCustomers(res.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ── Add customer ────────────────────────────────────────────────────────────
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    try {
      await customersApi.create({
        companyName: addForm.companyName,
        contactPerson: addForm.contact,
        email: addForm.email,
        phone: addForm.phone,
        industry: addForm.industry,
      });
      setAddSuccess(true);
      await fetchCustomers(); // refresh list
      setTimeout(() => {
        setAddSuccess(false);
        setIsAddModalOpen(false);
        setAddForm(emptyForm);
      }, 1500);
    } catch (err: any) {
      setAddError(err?.message || "Failed to add customer");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Filter & paginate ───────────────────────────────────────────────────────
  const itemsPerPage = 6;

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        !search ||
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [customers, search]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-slate-500 text-sm">Loading customers...</span>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={fetchCustomers}
          className="text-xs text-primary-600 font-semibold hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Customers & Contracts"
        description="Client corporate accounts, SLA contracts, linked vending locations, and billing."
        action={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Customer Account
          </button>
        }
      />

      {/* Search Bar */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name or contact..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Customer Cards Grid */}
      {paginatedCustomers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No customers found. Add your first customer!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCustomers.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ y: -3 }}
              onClick={() => setSelectedCustomer(c)}
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors">
                        {c.companyName}
                      </h3>
                      <p className="text-xs text-slate-400">{c.industry || "—"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    Active
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{c.contactPerson}</span>
                    <span className="text-[10px] text-slate-400">Primary Contact</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="hover:underline truncate">
                      {c.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                      {c.phone}
                    </a>
                  </div>
                </div>

                {/* Linked Locations */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    {c.locations?.length || 0} Linked Vending Sites
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(c.locations || []).slice(0, 3).map((l) => (
                      <span key={l.id} className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[130px]">
                        {l.name}
                      </span>
                    ))}
                    {(c.locations?.length || 0) > 3 && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                        +{c.locations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Added</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); }}
                  className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-slate-500">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.companyName}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedCustomer.industry || "—"} · ID: {selectedCustomer.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Linked Locations */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Linked Vending Locations ({selectedCustomer.locations?.length || 0})
                  </h4>
                  {(selectedCustomer.locations?.length || 0) === 0 ? (
                    <p className="text-xs text-slate-400">No locations linked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.locations.map((loc) => (
                        <div
                          key={loc.id}
                          onClick={() => { setSelectedCustomer(null); navigate(`/locations/${loc.id}`); }}
                          className="p-3 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{loc.name}</p>
                            <p className="text-[10px] text-slate-500">{loc.address}, {loc.city}</p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact & Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <h5 className="font-bold text-slate-900 uppercase text-[10px]">Contact Methods</h5>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${selectedCustomer.phone}`} className="text-primary-600 hover:underline">
                        {selectedCustomer.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${selectedCustomer.email}`} className="text-primary-600 hover:underline">
                        {selectedCustomer.email}
                      </a>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <h5 className="font-bold text-slate-900 uppercase text-[10px]">Account Info</h5>
                    <p className="text-slate-500">Industry: <strong className="text-slate-700">{selectedCustomer.industry || "—"}</strong></p>
                    <p className="text-slate-500">
                      Created: <strong className="text-slate-700">
                        {new Date(selectedCustomer.createdAt).toLocaleDateString("en-IN")}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Download Contract Button (UI only) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Master Service Agreement</span>
                    <p className="text-xs text-slate-600 mt-1">Download the service agreement PDF for this customer.</p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading contract for ${selectedCustomer.companyName}...`)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Add Customer Account
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setAddError(""); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input required placeholder="e.g. Infosys Ltd." value={addForm.companyName}
                  onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Contact *</label>
                  <input required placeholder="Contact name" value={addForm.contact}
                    onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input placeholder="e.g. Technology" value={addForm.industry}
                    onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input type="email" required placeholder="contact@company.com" value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input required placeholder="+91 98000 00000" value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>

              {addSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" /> Customer added successfully!
                </p>
              )}
              {addError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> {addError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setAddError(""); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5">
                  {addLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

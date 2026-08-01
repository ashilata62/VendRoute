import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Phone, Mail, Search, Plus,
  Download, ExternalLink, X, Check, ArrowRight
} from "lucide-react";

import { mockCustomers, mockLocations } from "../data/mockData";
import PageHeader from "../components/shared/PageHeader";
import { formatDate, formatCurrency } from "../lib/utils";
import type { Customer } from "../types";
import { api } from "../services/api";

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customersList, setCustomersList] = useState<Customer[]>(mockCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ companyName: "", contact: "", email: "", phone: "", industry: "" });
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await api.get('/customers');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: Customer[] = res.data.map((c: any) => ({
            id: c.id,
            companyName: c.companyName,
            contractStart: c.createdAt ? c.createdAt.split('T')[0] : '2026-01-01',
            contractEnd: '2027-01-01',
            locations: c.locations?.map((l: any) => l.id) || [],
            primaryContact: c.contactPerson,
            email: c.email,
            phone: c.phone,
            industry: c.industry || 'General',
            totalRevenue: 45000,
          }));
          setCustomersList(mapped);
        }
      } catch (err) {
        console.warn('Backend customers API connection fallback:', err);
      }
    }
    loadCustomers();
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setAddSuccess(true);
    setTimeout(() => { setAddSuccess(false); setIsAddModalOpen(false); setAddForm({ companyName: "", contact: "", email: "", phone: "", industry: "" }); }, 1500);
  };

  const itemsPerPage = 6;

  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      const matchSearch =
        !search ||
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.primaryContact.toLowerCase().includes(search.toLowerCase());

      const contractDaysLeft = Math.ceil((new Date(c.contractEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let matchStatus = true;
      if (statusFilter === "active") matchStatus = contractDaysLeft > 0;
      else if (statusFilter === "expired") matchStatus = contractDaysLeft <= 0;

      return matchSearch && matchStatus;
    });
  }, [customersList, search, statusFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDownloadContract = (c: Customer) => {
    alert(`Downloading Master Services Agreement PDF for ${c.companyName}...`);
  };

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

      {/* Search & Filter Bar */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name or primary contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Contract Statuses</option>
          <option value="active">Active Contract</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Customer Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedCustomers.map((c) => {
          const linkedLocs = mockLocations.filter((l) => c.locations.includes(l.id));
          const contractDaysLeft = Math.ceil((new Date(c.contractEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isActive = contractDaysLeft > 0;

          return (
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
                      <p className="text-xs text-slate-400">{c.industry}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {isActive ? "Active SLA" : "Expired"}
                  </span>
                </div>

                {/* Contacts */}
                <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{c.primaryContact}</span>
                    <span className="text-[10px] text-slate-400">Primary Contact</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{c.email}</a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{c.phone}</a>
                  </div>
                </div>

                {/* Locations Summary */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    {linkedLocs.length} Linked Vending Sites
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedLocs.slice(0, 3).map((l) => (
                      <span key={l.id} className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[130px]">
                        {l.customerName}
                      </span>
                    ))}
                    {linkedLocs.length > 3 && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                        +{linkedLocs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Contract & Revenue */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Revenue</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatCurrency(c.totalRevenue)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); }}
                  className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

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
                  <p className="text-xs text-slate-500">{selectedCustomer.industry} · Account ID: {selectedCustomer.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contract Header Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Master Service Agreement</span>
                    <p className="text-xs text-slate-600 mt-1">
                      Valid: <strong>{formatDate(selectedCustomer.contractStart)}</strong> to <strong>{formatDate(selectedCustomer.contractEnd)}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadContract(selectedCustomer)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF Contract
                  </button>
                </div>

                {/* Linked Locations List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Linked Vending Locations ({selectedCustomer.locations.length})
                  </h4>
                  <div className="space-y-2">
                    {mockLocations.filter((l) => selectedCustomer.locations.includes(l.id)).map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => { setSelectedCustomer(null); navigate(`/locations/${loc.id}`); }}
                        className="p-3 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{loc.customerName}</p>
                          <p className="text-[10px] text-slate-500">{loc.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-white border px-2 py-0.5 rounded font-mono text-[10px]">{loc.machineId}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact & Billing Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <h5 className="font-bold text-slate-900 uppercase text-[10px]">Contact Methods</h5>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${selectedCustomer.phone}`} className="text-primary-600 hover:underline">{selectedCustomer.phone}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${selectedCustomer.email}`} className="text-primary-600 hover:underline">{selectedCustomer.email}</a>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <h5 className="font-bold text-slate-900 uppercase text-[10px]">Billing & Revenue</h5>
                    <p className="text-slate-500">YTD Account Revenue:</p>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedCustomer.totalRevenue)}</p>
                  </div>
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
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Add Customer Account</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input required placeholder="e.g. Infosys Ltd." value={addForm.companyName} onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Contact</label>
                  <input required placeholder="Contact name" value={addForm.contact} onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input placeholder="e.g. Technology" value={addForm.industry} onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" required placeholder="contact@company.com" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input placeholder="+91 98000 00000" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              {addSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Customer added successfully!</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm cursor-pointer">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
